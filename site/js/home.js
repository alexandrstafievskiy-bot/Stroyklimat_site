async function loadJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error("HTTP "+r.status+" for "+path);
  return await r.json();
}
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
function fmtUAH(n){
  const v = Number(n||0);
  return v.toLocaleString("uk-UA") + " ₴";
}
function getPrimaryImage(images){
  if(!Array.isArray(images)) return "";
  const clean = images
    .filter(Boolean)
    .filter(u => !String(u).includes("2382346564_w350_h100_tov-bis-7")); // убрать картинку-логотип
  return clean[0] || images[0] || "";
}
function stockLabel(v){
  if(v==="in_stock") return "В наявності";
  if(v==="on_order") return "Під замовлення";
  return "Немає";
}
function readLS(key, def){
  try{ return JSON.parse(localStorage.getItem(key)||"") ?? def; }catch{ return def; }
}
function writeLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function getCart(){ return readLS("cart", []); }
function setCart(v){ writeLS("cart", v); }
function getFav(){ return readLS("fav", []); }
function setFav(v){ writeLS("fav", v); }
function cartCount(){ return getCart().reduce((s,x)=>s+(x.qty||0),0); }
function favCount(){ return getFav().length; }
function mountHeader(){
  qsa("[data-cart-count]").forEach(el=>el.textContent=String(cartCount()));
  qsa("[data-fav-count]").forEach(el=>el.textContent=String(favCount()));
}
function addToCart(product, qty){
  const cart = getCart();
  const i = cart.findIndex(x=>x.id===product.id);
  if(i>=0) cart[i].qty = (cart[i].qty||0) + qty;
  else cart.push({id: product.id, qty, title: product.title, price_uah: product.price_uah, image: getPrimaryImage(product.images)});
  setCart(cart);
}
function toggleFav(id){
  const fav = getFav();
  const i = fav.indexOf(id);
  if(i>=0) fav.splice(i,1); else fav.push(id);
  setFav(fav);
  return fav.includes(id);
}
function inFav(id){ return getFav().includes(id); }

function buildCategoryTree(items){
  // Build hierarchical categories from breadcrumbs
  const mainCats = new Map();
  
  items.forEach(p=>{
    const breadcrumbs = p.breadcrumbs || [];
    if(!breadcrumbs.length) return;
    
    const main = breadcrumbs[0];
    const sub = breadcrumbs[1] || null;
    
    if(!mainCats.has(main)){
      mainCats.set(main, {name: main, count: 0, subcats: new Map()});
    }
    
    const cat = mainCats.get(main);
    cat.count++;
    
    if(sub){
      if(!cat.subcats.has(sub)){
        cat.subcats.set(sub, {name: sub, count: 0});
      }
      cat.subcats.get(sub).count++;
    }
  });
  
  // Convert to array and sort
  return Array.from(mainCats.values())
    .sort((a,b)=>b.count-a.count)
    .map(cat=>({
      name: cat.name,
      count: cat.count,
      subcats: Array.from(cat.subcats.values()).sort((a,b)=>b.count-a.count)
    }));
}

function cardHTML(p){
  const img = getPrimaryImage(p.images);
  const fav = inFav(p.id);
  const href = "./product.html?id=" + encodeURIComponent(p.id);
  return `
  <article class="card prod-card">
    <a class="img" href="${href}">
      ${img ? `<img src="${img}" alt="${escapeHtml(p.title)}">` : ``}
    </a>
    <div class="body">
      <div class="title"><a href="${href}">${escapeHtml(p.title)}</a></div>
      <div class="meta">
        <div class="price">${fmtUAH(p.price_uah)}</div>
        <div class="stock">${stockLabel(p.stock)}</div>
      </div>
      <div class="row">
        <button class="btn" data-add="${escapeHtml(p.id)}">В кошик</button>
        <button class="btn ghost" data-fav="${escapeHtml(p.id)}">Обране</button>
      </div>
    </div>
  </article>`;
}

async function main(){
  try {
    mountHeader();

    const catalog = await (window.Store?.loadCatalog ? window.Store.loadCatalog() : loadJSON("./site_data/catalog.json"));
    const categories = buildCategoryTree(catalog);

    const index = await loadJSON("./site_data/index.json");
    const featuredIds = index.featured_product_ids || [];
    let featured = featuredIds.map(id => catalog.find(p=>p.id===id)).filter(Boolean).slice(0, 12);
    
    // Fallback: if no featured products, use first 12 from catalog
    if(featured.length === 0){
      featured = catalog.slice(0, 12);
    }

    // === Update metrics ===
    const mCountEl = qs("#mCount");
    if(mCountEl) mCountEl.textContent = catalog.length + "+";

    // === Category tiles with subcategories ===
    const tilesEl = qs("#catTiles");
    if(tilesEl){
      if(categories.length > 0){
        tilesEl.innerHTML = categories.slice(0, 8).map(cat => {
          const subText = cat.subcats.length > 0 
            ? cat.subcats.slice(0, 3).map(s => s.name).join(" • ")
            : "Перегляньте товари";
          
          return `
            <div class="tile" data-cat="${escapeHtml(cat.name)}" role="button" tabindex="0">
              <div>
                <div class="tname">${escapeHtml(cat.name)}</div>
                <div class="tcount">${cat.count} ${cat.count === 1 ? 'позиція' : 'позицій'}</div>
                <div class="tsub">${escapeHtml(subText)}</div>
              </div>
              <div class="tarrow">→</div>
            </div>
          `;
        }).join("");
        
        tilesEl.addEventListener("click", (e)=>{
          const tile = e.target.closest("[data-cat]");
          if(!tile) return;
          const cat = tile.getAttribute("data-cat");
          location.href = `./catalog.html?cat=${encodeURIComponent(cat)}`;
        });
      }
    }

    // === Featured grid (Популярне) ===
    const grid = qs("#featured");
    if(grid){
      grid.innerHTML = featured.map(cardHTML).join("");
      grid.addEventListener("click",(e)=>{
        const add = e.target.closest("[data-add]");
        const fav = e.target.closest("[data-fav]");
        if(add){
          const id = add.getAttribute("data-add");
          const p = catalog.find(x=>x.id===id);
          if(!p) return;
          addToCart(p, 1);
          mountHeader();
          add.textContent = "Додано ✓";
          setTimeout(()=>add.textContent="В кошик", 800);
        }
        if(fav){
          const id = fav.getAttribute("data-fav");
          const on = toggleFav(id);
          fav.textContent = "Обране";
          mountHeader();
        }
      });
    }

    // === New arrivals (Нове надходження) ===
    const newGrid = qs("#newGrid");
    if(newGrid){
      const newest = catalog.slice(0, 8);
      newGrid.innerHTML = newest.map(cardHTML).join("");
      newGrid.addEventListener("click",(e)=>{
        const add = e.target.closest("[data-add]");
        const fav = e.target.closest("[data-fav]");
        if(add){
          const id = add.getAttribute("data-add");
          const p = catalog.find(x=>x.id===id);
          if(!p) return;
          addToCart(p, 1);
          mountHeader();
          add.textContent = "Додано ✓";
          setTimeout(()=>add.textContent="В кошик", 800);
        }
        if(fav){
          const id = fav.getAttribute("data-fav");
          const on = toggleFav(id);
          fav.textContent = "Обране";
          mountHeader();
        }
      });
    }

    // === Services (Послуги) ===
    const servicesGrid = qs("#servicesGrid");
    if(servicesGrid){
      const services = catalog.filter(p => {
        const title = (p.title || "").toLowerCase();
        return title.includes("монтаж") || title.includes("проект") || title.includes("сервіс") || title.includes("обслуговування");
      }).slice(0, 8);
      
      // Fallback if no services found
      const servicesToShow = services.length > 0 ? services : catalog.slice(0, 8);
      
      servicesGrid.innerHTML = servicesToShow.map(cardHTML).join("");
      servicesGrid.addEventListener("click",(e)=>{
        const add = e.target.closest("[data-add]");
        const fav = e.target.closest("[data-fav]");
        if(add){
          const id = add.getAttribute("data-add");
          const p = catalog.find(x=>x.id===id);
          if(!p) return;
          addToCart(p, 1);
          mountHeader();
          add.textContent = "Додано ✓";
          setTimeout(()=>add.textContent="В кошик", 800);
        }
        if(fav){
          const id = fav.getAttribute("data-fav");
          const on = toggleFav(id);
          fav.textContent = "Обране";
          mountHeader();
        }
      });
    }

    // === Update year in footer ===
    const yEl = qs("#y");
    if(yEl) yEl.textContent = new Date().getFullYear();
    
  } catch(err) {
    console.error("Помилка завантаження:", err);
    alert("Помилка на головній. Перевір консоль браузера для деталей.");
  }
}

main();

// Слушаем обновления от админ панели
window.addEventListener('catalog:updated', main);

// ===== TESTIMONIALS CAROUSEL =====
function initTestimonials() {
  const container = qs('.testimonials-container');
  if (!container) return;

  const slides = qsa('.testimonial-slide');
  const dotsContainer = qs('.testimonials-dots');
  
  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayInterval;

  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'testimonial-dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = qsa('.testimonial-dot');

  function goToSlide(index) {
    // Remove active class from all
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Add active to current
    currentIndex = index;
    slides[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');

    // Reset autoplay
    resetAutoplay();
  }

  function nextSlide() {
    const next = (currentIndex + 1) % slides.length;
    goToSlide(next);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000); // Change every 5 seconds
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  // Start autoplay
  startAutoplay();

  // Pause on hover
  container.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  container.addEventListener('mouseleave', startAutoplay);
}

// Initialize testimonials when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonials);
} else {
  initTestimonials();
}
