/**
 * STROYKLIMAT Admin Panel
 * Управління каталогом przez JSON, IndexedDB + localStorage
 */

window.Admin = (function() {
  const PIN_HASH = "81dc9bdb52d04dc20036dbd8313ed055"; // MD5("1234")
  const DB_NAME = 'stroyklimat-admin';
  const STORE_NAME = 'catalog-versions';
  const PUBLISHED_STORE = 'published';
  
  let db = null;
  let currentDraft = [];
  let originalCatalog = [];
  let currentEditId = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 50;

  // ===== INIT & AUTH =====
  async function init() {
    await initIndexedDB();
    await migrateLegacyData(); // Переносим старые данные из localStorage
    checkAuth();
    if (isAuthenticated()) {
      setupUI();
      await loadCatalog();
      renderProducts();
    }
  }

  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2); // Версия 2 для добавления published store
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        const oldVersion = e.oldVersion;
        
        // Версия 1: черновики
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        }
        
        // Версия 2: опубликованный каталог
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(PUBLISHED_STORE)) {
            db.createObjectStore(PUBLISHED_STORE, { keyPath: 'id' });
          }
        }
      };
    });
  }

  // Миграция данных из localStorage в IndexedDB
  async function migrateLegacyData() {
    try {
      const legacyData = localStorage.getItem('publishedCatalog');
      if (legacyData) {
        console.log('Migrating legacy catalog from localStorage to IndexedDB...');
        const catalog = JSON.parse(legacyData);
        await savePublishedCatalog(catalog);
        localStorage.removeItem('publishedCatalog');
        console.log('Migration completed, removed from localStorage');
      }
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }

  function hashPassword(pin) {
    // Simple hash - не безопасный, но для демо подойдёт
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  function checkAuth() {
    const stored = localStorage.getItem('adminAuth');
    if (stored) {
      document.querySelector('.admin-wrapper').style.display = 'grid';
      document.getElementById('loginModal').style.display = 'none';
    } else {
      document.querySelector('.admin-wrapper').style.display = 'none';
      document.getElementById('loginModal').style.display = 'flex';
    }
  }

  function isAuthenticated() {
    return localStorage.getItem('adminAuth') === 'true';
  }

  function login() {
    const pin = document.getElementById('adminPin').value;
    
    if (pin === 'StroyKKlimat2026') {
      localStorage.setItem('adminAuth', 'true');
      document.querySelector('.admin-wrapper').style.display = 'grid';
      document.getElementById('loginModal').style.display = 'none';
      setupUI();
      loadCatalog().then(() => renderProducts());
    } else {
      showAlert('Невірний PIN', 'error');
    }
  }

  function logout() {
    if (confirm('Вихід з адмін панелі?')) {
      localStorage.removeItem('adminAuth');
      location.href = './index.html';
    }
  }

  // ===== CATALOG MANAGEMENT =====
  async function loadCatalog() {
    try {
      // Загружаем опубликованный каталог из IndexedDB
      const published = await getPublishedCatalog();
      if (published && Array.isArray(published) && published.length > 0) {
        originalCatalog = published;
        console.log('Loaded published catalog from IndexedDB:', published.length, 'items');
      } else {
        // Fallback: загружаем из JSON файла
        console.log('No published catalog in IndexedDB, loading from JSON file...');
        const response = await fetch('./site_data/catalog.json');
        if (!response.ok) {
          throw new Error('Failed to load catalog.json: ' + response.status);
        }
        const jsonData = await response.json();
        if (!Array.isArray(jsonData)) {
          throw new Error('catalog.json is not an array');
        }
        originalCatalog = jsonData;
        console.log('Loaded catalog from JSON:', originalCatalog.length, 'items');
      }

      // Загружаем draft из IndexedDB
      const stored = await getFromDB();
      if (stored && Array.isArray(stored) && stored.length > 0) {
        currentDraft = stored;
        console.log('Loaded draft from IndexedDB:', currentDraft.length, 'items');
      } else {
        currentDraft = JSON.parse(JSON.stringify(originalCatalog));
        console.log('No draft found, using original catalog');
      }
      
      loadCategories();
      
      if (currentDraft.length === 0) {
        showAlert('Каталог порожній. Імпортуй товари або створи нові.', 'warning');
      }
    } catch (e) {
      console.error('Помилка завантаження каталогу:', e);
      showAlert('Помилка завантаження каталогу: ' + e.message, 'error');
      // Fallback to empty catalog
      currentDraft = [];
      originalCatalog = [];
    }
  }

  function getFromDB() {
    return new Promise((resolve) => {
      if (!db) resolve(null);
      const store = db.transaction(STORE_NAME).objectStore(STORE_NAME);
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result?.data);
    });
  }

  function saveToDB(data) {
    return new Promise((resolve) => {
      if (!db) resolve();
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
      store.put({ id: 'current', data, timestamp: Date.now() });
      resolve();
    });
  }

  // ===== PUBLISHED CATALOG (IndexedDB) =====
  async function savePublishedCatalog(data) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('DB not initialized'));
        return;
      }
      try {
        const tx = db.transaction(PUBLISHED_STORE, 'readwrite');
        const store = tx.objectStore(PUBLISHED_STORE);
        const timestamp = Date.now();
        
        store.put({ 
          id: 'catalog', 
          data: data, 
          timestamp: timestamp 
        });
        
        // Обновляем timestamp в localStorage для синхронизации
        localStorage.setItem('catalogTimestamp', timestamp.toString());
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function getPublishedCatalog() {
    return new Promise((resolve, reject) => {
      if (!db) {
        resolve(null);
        return;
      }
      try {
        const tx = db.transaction(PUBLISHED_STORE, 'readonly');
        const store = tx.objectStore(PUBLISHED_STORE);
        const request = store.get('catalog');
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ===== PRODUCT MANAGEMENT =====
  function showPanel(panel) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panel + 'Panel').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');

    if (panel === 'stats') renderStats();
    if (panel === 'versions') renderVersions();
    
    // Close mobile menu when switching panels
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.querySelector('.mobile-sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  function filterProducts() {
    currentPage = 1;
    renderProducts();
  }

  function renderProducts() {
    const searchEl = document.getElementById('searchFilter');
    const categoryEl = document.getElementById('categoryFilter');
    
    if (!searchEl || !categoryEl) {
      console.error('Search elements not found');
      return;
    }
    
    const search = searchEl.value.toLowerCase();
    const category = categoryEl.value;

    let filtered = currentDraft.filter(p => {
      const matchSearch = !search || (p.title && p.title.toLowerCase().includes(search));
      const matchCategory = !category || p.category === category;
      return matchSearch && matchCategory;
    });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const page = filtered.slice(start, end);

    const html = page.map(p => {
      const shortId = p.id ? (p.id.length > 8 ? p.id.substring(0, 8) + '...' : p.id) : 'N/A';
      const stockIcon = p.stock === 'in_stock' ? '✓' : (p.stock === 'limited' ? '⚠' : '✗');
      const desc = (p.description || '').substring(0, 50);
      return `
      <div class="table-row" data-id="${p.id}">
        <div class="cell">${shortId}</div>
        <div class="cell">${p.title || 'Без назви'}</div>
        <div class="cell">${p.category || '-'}</div>
        <div class="cell">₴${p.price_uah || 0}</div>
        <div class="cell">${stockIcon}</div>
        <div class="cell">${desc}${desc.length >= 50 ? '...' : ''}</div>
        <div class="cell">
          <button class="btn" onclick="Admin.editProduct('${p.id}')" style="font-size:12px;padding:6px 10px;">✏️</button>
        </div>
      </div>
    `;
    }).join('');

    const tableEl = document.getElementById('productsTable');
    if (tableEl) {
      tableEl.innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--muted);">Товарів не знайдено</div>';
    }

    // Пагинация
    const pages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginationHtml = pages > 1 ? Array.from({length: Math.min(pages, 10)}, (_, i) => {
      const pageNum = i + 1;
      return `<button class="page-btn ${pageNum === currentPage ? 'active' : ''}" onclick="Admin.goToPage(${pageNum})">${pageNum}</button>`;
    }).join('') : '';
    
    const paginationEl = document.getElementById('pagination');
    if (paginationEl) {
      paginationEl.innerHTML = paginationHtml;
    }
    
    // Render mobile cards
    renderMobileCards(page);
  }
  
  function renderMobileCards(products) {
    const cardsEl = document.getElementById('productCards');
    if (!cardsEl) return;
    
    const html = products.map(p => {
      const stockIcon = p.stock === 'in_stock' ? '✓' : (p.stock === 'limited' ? '⚠' : '✗');
      const stockText = p.stock === 'in_stock' ? 'В наявності' : (p.stock === 'limited' ? 'Обмежено' : 'Немає');
      const desc = (p.description || 'Без опису').substring(0, 80);
      
      return `
        <div class="product-card">
          <div class="product-card-header">
            <div class="product-card-title">${p.title || 'Без назви'}</div>
            <button class="btn" onclick="Admin.editProduct('${p.id}')" style="font-size:12px;padding:6px 10px;margin-left:10px;">✏️</button>
          </div>
          <div class="product-card-body">
            <div class="product-card-row">
              <div class="product-card-label">Категорія:</div>
              <div class="product-card-value">${p.category || '-'}</div>
            </div>
            <div class="product-card-row">
              <div class="product-card-label">Ціна:</div>
              <div class="product-card-value">₴${p.price_uah || 0}</div>
            </div>
            <div class="product-card-row">
              <div class="product-card-label">Наявність:</div>
              <div class="product-card-value">${stockIcon} ${stockText}</div>
            </div>
            ${p.brand ? `
            <div class="product-card-row">
              <div class="product-card-label">Бренд:</div>
              <div class="product-card-value">${p.brand}</div>
            </div>` : ''}
            ${p.sku ? `
            <div class="product-card-row">
              <div class="product-card-label">Артикул:</div>
              <div class="product-card-value">${p.sku}</div>
            </div>` : ''}
            <div class="product-card-row">
              <div class="product-card-label">Опис:</div>
              <div class="product-card-value">${desc}${desc.length >= 80 ? '...' : ''}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    cardsEl.innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--muted);">Товарів не знайдено</div>';
  }
  
  function toggleMobileMenu() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.querySelector('.mobile-sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    }
  }

  function goToPage(page) {
    currentPage = page;
    renderProducts();
  }

  function newProduct() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Новий Товар';
    document.getElementById('deleteBtn').style.display = 'none';
    
    document.getElementById('editTitle').value = '';
    document.getElementById('editPrice').value = '';
    document.getElementById('editSku').value = '';
    document.getElementById('editBrand').value = '';
    document.getElementById('editImage').value = '';
    document.getElementById('editDescription').value = '';
    document.getElementById('editFeatured').checked = false;
    document.getElementById('editStock').value = 'in_stock';

    document.getElementById('productModal').classList.add('active');
  }

  function editProduct(id) {
    const product = currentDraft.find(p => p.id === id);
    if (!product) {
      showAlert('Товар не знайдено', 'error');
      return;
    }

    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Редагувати Товар';
    document.getElementById('deleteBtn').style.display = 'block';

    document.getElementById('editTitle').value = product.title || '';
    document.getElementById('editCategory').value = product.category || '';
    document.getElementById('editPrice').value = product.price_uah || 0;
    document.getElementById('editSku').value = product.sku || '';
    document.getElementById('editBrand').value = product.brand || '';
    document.getElementById('editImage').value = (product.images && product.images[0]) || '';
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editFeatured').checked = product.featured || false;
    document.getElementById('editStock').value = product.stock || 'in_stock';

    document.getElementById('productModal').classList.add('active');
  }

  function saveProduct() {
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const category = document.getElementById('editCategory').value;

    if (!title || !category || !price) {
      showAlert('Заповни обов\'язкові поля', 'warning');
      return;
    }

    if (currentEditId) {
      // Редаґувати
      const idx = currentDraft.findIndex(p => p.id === currentEditId);
      if (idx !== -1) {
        currentDraft[idx] = {
          ...currentDraft[idx],
          title,
          price_uah: price,
          category: document.getElementById('editCategory').value,
          sku: document.getElementById('editSku').value,
          brand: document.getElementById('editBrand').value,
          stock: document.getElementById('editStock').value,
          images: document.getElementById('editImage').value ? [document.getElementById('editImage').value] : [],
          description: document.getElementById('editDescription').value,
          featured: document.getElementById('editFeatured').checked
        };
      }
    } else {
      // Новий товар
      currentDraft.push({
        id: 'p' + Date.now(),
        title,
        price_uah: price,
        category: document.getElementById('editCategory').value,
        sku: document.getElementById('editSku').value,
        brand: document.getElementById('editBrand').value,
        stock: document.getElementById('editStock').value,
        images: document.getElementById('editImage').value ? [document.getElementById('editImage').value] : [],
        description: document.getElementById('editDescription').value,
        featured: document.getElementById('editFeatured').checked
      });
    }

    saveToDB(currentDraft);
    savePublishedCatalog(currentDraft).then(() => {
      // Trigger custom event для текущей вкладки
      window.dispatchEvent(new CustomEvent('catalog:updated', { detail: { data: currentDraft }}));
      // Broadcast для других вкладок
      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('catalog-updates');
        channel.postMessage({ type: 'catalog:updated', data: currentDraft });
        channel.close();
      }
      showAlert('Товар збережено і опубліковано', 'success');
    }).catch(e => {
      console.error('Publishing failed:', e);
      showAlert('Товар збережено, але помилка публікації', 'warning');
    });
    closeModal();
    renderProducts();
  }

  function deleteProduct() {
    if (!confirm('Видалити товар?')) return;
    
    currentDraft = currentDraft.filter(p => p.id !== currentEditId);
    saveToDB(currentDraft);
    savePublishedCatalog(currentDraft).then(() => {
      // Trigger custom event для текущей вкладки
      window.dispatchEvent(new CustomEvent('catalog:updated', { detail: { data: currentDraft }}));
      // Broadcast для других вкладок
      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('catalog-updates');
        channel.postMessage({ type: 'catalog:updated', data: currentDraft });
        channel.close();
      }
      showAlert('Товар видалено і опубліковано', 'success');
    }).catch(e => {
      console.error('Publishing failed:', e);
      showAlert('Товар видалено, але помилка публікації', 'warning');
    });
    closeModal();
    renderProducts();
  }

  function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    currentEditId = null;
  }

  // ===== CATEGORIES =====
  function loadCategories() {
    if (!currentDraft || currentDraft.length === 0) {
      console.warn('No products in catalog, skipping category load');
      const select = document.getElementById('editCategory');
      const filter = document.getElementById('categoryFilter');
      if (select) select.innerHTML = '<option value="">Без категорії</option>';
      if (filter) filter.innerHTML = '<option value="">Всі категорії</option>';
      return;
    }
    
    const categories = [...new Set(currentDraft.map(p => p.category).filter(Boolean))].sort();
    const select = document.getElementById('editCategory');
    const filter = document.getElementById('categoryFilter');
    
    if (select) {
      select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    
    if (filter) {
      filter.innerHTML = '<option value="">Всі категорії</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }

  // ===== IMPORT/EXPORT =====
  function exportCatalog() {
    const json = JSON.stringify(currentDraft, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    a.click();
    URL.revokeObjectURL(url);
    showAlert('Каталог експортовано', 'success');
  }

  function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Не масив');

        const diff = {
          added: 0,
          updated: 0,
          total: imported.length
        };

        imported.forEach(product => {
          const existing = currentDraft.findIndex(p => p.id === product.id);
          if (existing === -1) {
            diff.added++;
          } else {
            diff.updated++;
          }
        });

        currentDraft = imported;
        saveToDB(currentDraft);
        loadCategories();
        renderProducts();
        
        showAlert(`✓ Імпортовано: ${diff.added} нових, ${diff.updated} оновлено`, 'success');
      } catch (err) {
        showAlert('Помилка імпорту файлу: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // ===== STATISTICS =====
  function renderStats() {
    const stats = {
      total: currentDraft.length,
      categories: new Set(currentDraft.map(p => p.category)).size,
      brands: new Set(currentDraft.map(p => p.brand)).size,
      noImage: currentDraft.filter(p => !p.images || p.images.length === 0).length,
      noDescription: currentDraft.filter(p => !p.description || p.description.length === 0).length,
      inStock: currentDraft.filter(p => p.stock === 'in_stock').length,
      prices: currentDraft.map(p => p.price_uah).filter(p => p > 0)
    };

    stats.avgPrice = stats.prices.length > 0 ? Math.round(stats.prices.reduce((a,b) => a+b) / stats.prices.length) : 0;
    stats.minPrice = stats.prices.length > 0 ? Math.min(...stats.prices) : 0;
    stats.maxPrice = stats.prices.length > 0 ? Math.max(...stats.prices) : 0;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Всього товарів</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.categories}</div>
        <div class="stat-label">Категорій</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.brands}</div>
        <div class="stat-label">Брендів</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.inStock}</div>
        <div class="stat-label">В наявності</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">₴${stats.avgPrice}</div>
        <div class="stat-label">Середня ціна</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">₴${stats.minPrice}-${stats.maxPrice}</div>
        <div class="stat-label">Діапазон цін</div>
      </div>
    `;

    document.getElementById('statsDetails').innerHTML = `
      <ul style="list-style: none; padding: 0;">
        <li>❌ Без фото: ${stats.noImage} товарів</li>
        <li>📝 Без опису: ${stats.noDescription} товарів</li>
        <li>✅ У наявності: ${stats.inStock} товарів</li>
      </ul>
    `;
  }

  // ===== VERSIONS =====
  function renderVersions() {
    document.getElementById('versionsList').innerHTML = '<p style="color:var(--muted);">Версіонування в розробці...</p>';
  }

  // ===== SETTINGS =====
  function saveSettings() {
    const mode = document.querySelector('input[name="storeMode"]:checked').value;
    localStorage.setItem('storeMode', mode);
    showAlert('Налаштування збережено', 'success');
  }

  async function publishCatalog() {
    try {
      await savePublishedCatalog(currentDraft);
      // Trigger custom event для текущей вкладки
      window.dispatchEvent(new CustomEvent('catalog:updated', { detail: { data: currentDraft }}));
      // Broadcast для других вкладок
      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('catalog-updates');
        channel.postMessage({ type: 'catalog:updated', data: currentDraft });
        channel.close();
      }
      showAlert('Каталог опублікований! Користувачі бачитимуть нові дані', 'success');
    } catch (e) {
      console.error('Publishing failed:', e);
      showAlert('Помилка публікації каталогу', 'error');
    }
  }

  function resetCatalog() {
    if (confirm('Скинути каталог на оригіналь?')) {
      currentDraft = JSON.parse(JSON.stringify(originalCatalog));
      saveToDB(currentDraft);
      renderProducts();
      loadCategories();
      showAlert('Каталог скинуто', 'success');
    }
  }

  // ===== UI HELPERS =====
  function setupUI() {
    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      const theme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
      themeBtn.textContent = theme === 'light' ? '☀️' : '🌙';
      
      themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
        localStorage.setItem('theme', next);
        themeBtn.textContent = next === 'light' ? '☀️' : '🌙';
      });
    }
    
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('productModal');
        if (modal && modal.classList.contains('active')) {
          closeModal();
        }
      }
    });
    
    // Close modal on background click
    const modal = document.getElementById('productModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
  }

  function showAlert(message, type = 'info') {
    const box = document.getElementById('alertBox');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    box.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  // ===== PUBLIC API =====
  return {
    init,
    login,
    logout,
    showPanel,
    newProduct,
    editProduct,
    saveProduct,
    deleteProduct,
    closeModal,
    filterProducts,
    goToPage,
    exportCatalog,
    importFile,
    saveSettings,
    publishCatalog,
    resetCatalog,
    toggleMobileMenu
  };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', Admin.init);
