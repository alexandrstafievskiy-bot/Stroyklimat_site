/* Global App helpers: header counters + global search */
(function () {
  function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  function mountHeader() {
    const cart = (window.Store && window.Store.cartCount) ? window.Store.cartCount() : 0;
    const fav  = (window.Store && window.Store.favCount) ? window.Store.favCount() : 0;

    qsa("[data-cart-count]").forEach(el => el.textContent = String(cart));
    qsa("[data-fav-count]").forEach(el => el.textContent = String(fav));
  }

  // по submit — переносим на каталог с параметром q
  function wireSearch() {
    const forms = qsa("[data-search-form], #searchForm");
    forms.forEach(form => {
      if (form.__wired) return;
      form.__wired = true;

      const input = form.querySelector("[data-search-input], #searchInput");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (input ? input.value : "").trim();
        const url = new URL("./catalog.html", location.href);
        if (q) url.searchParams.set("q", q);
        location.href = url.toString();
      });
    });
  }

  // если на странице есть input поиска — подставим q из URL
  function setSearchValueFromURL() {
    const url = new URL(location.href);
    const q = url.searchParams.get("q") || "";
    const input = document.querySelector("[data-search-input], #searchInput");
    if (input && !input.value) input.value = q;
  }

  // Theme management
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    setupThemeButton();
    // Retry setup after a short delay to ensure DOM is ready
    setTimeout(setupThemeButton, 100);
  }

  function setupThemeButton() {
    document.querySelectorAll('#themeToggle').forEach(themeBtn => {
      if (!themeBtn) return;
      
      // Remove existing listeners to avoid duplicates
      const clone = themeBtn.cloneNode(true);
      themeBtn.parentNode.replaceChild(clone, themeBtn);
      
      const btn = document.getElementById('themeToggle');
      if (btn) {
        // Direct click handler
        btn.addEventListener('click', handleThemeToggle, false);
        // Make button tabbable
        btn.setAttribute('tabindex', '0');
        // Add keyboard support (Enter and Space)
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleThemeToggle(e);
          }
        });
      }
    });
  }
  
  function handleThemeToggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleTheme();
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    // Apply theme to html element
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
      html.classList.add('light-theme');
      html.classList.remove('dark-theme');
    } else {
      html.removeAttribute('data-theme');
      html.classList.add('dark-theme');
      html.classList.remove('light-theme');
    }
    
    // Update all theme toggle buttons
    document.querySelectorAll('#themeToggle').forEach(btn => {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.setAttribute('title', theme === 'light' ? 'Темна тема' : 'Світла тема');
    });
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    console.log('Theme applied:', theme);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  }

  // expose
  window.App = { mountHeader, wireSearch, setSearchValueFromURL, initTheme, applyTheme, toggleTheme };
  window.mountHeader = mountHeader;
  window.wireSearch = wireSearch;
  window.setSearchValueFromURL = setSearchValueFromURL;
  window.initTheme = initTheme;

  // run
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    mountHeader();
    wireSearch();
    setSearchValueFromURL();
  });

  // Initialize theme immediately if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  window.addEventListener("store:change", mountHeader);
  window.addEventListener("storage", mountHeader);
})();
