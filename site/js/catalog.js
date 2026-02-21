async function loadJSON(path){
  const r = await fetch(path, { cache: "no-store" });
  if(!r.ok) throw new Error("HTTP "+r.status+" for "+path);
  return await r.json();
}

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function toInt(x){
  const n = Number(String(x ?? "").replace(/[^\d]/g,""));
  return Number.isFinite(n) ? n : 0;
}

function fmtUAH(n){
  const v = Number(n || 0);
  return v.toLocaleString("uk-UA") + " ₴";
}

function getPrimaryImage(images){
  if(!Array.isArray(images)) return "";
  const clean = images
    .filter(Boolean)
    .map(String)
    .filter(u => !u.includes("2382346564_w350_h100_tov-bis-7")); // логотип-картинка
  return clean[0] || "";
}

function stockLabel(v){
  if(v==="in_stock") return "В наявності";
  if(v==="on_order") return "Під замовлення";
  return "Немає";
}

function readLS(key, def){
  try{ const v = JSON.parse(localStorage.getItem(key)); return v ?? def; }catch{ return def; }
}
function writeLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function getCart(){ return readLS("cart", []); }
function setCart(v){ writeLS("cart", v); }
function getFav(){ return readLS("fav", []); }
function setFav(v){ writeLS("fav", v); }

function cartCount(){ return getCart().reduce((s,x)=>s+(Number(x.qty)||0),0); }
function favCount(){ return getFav().length; }

function addToCart(product, qty){
  const cart = getCart();
  const i = cart.findIndex(x=>x.id===product.id);
  const image = getPrimaryImage(product.images);
  if(i>=0) cart[i].qty = (Number(cart[i].qty)||0) + qty;
  else cart.push({ id: product.id, qty, title: product.title, price_uah: product.price_uah, image });
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

function getParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
}
function setParam(name, value){
  const u = new URL(location.href);
  if(value && String(value).trim()) u.searchParams.set(name, String(value).trim());
  else u.searchParams.delete(name);
  history.replaceState(null, "", u.toString());
}

function buildCategoryStats(items){
  const m = new Map();
  for(const p of items){
    const c = (p.breadcrumbs && p.breadcrumbs[0]) ? p.breadcrumbs[0] : (p.category || "");
    if(!c) continue;
    m.set(c, (m.get(c)||0) + 1);
  }
  return Array.from(m.entries())
    .sort((a,b)=>b[1]-a[1])
    .map(([name,count])=>({name,count}));
}

function sortItems(items, sortKey, featuredSet){
  const arr = items.slice();
  if(sortKey === "recommended"){
    arr.sort((a,b)=>{
      const af = featuredSet.has(a.id) ? 0 : 1;
      const bf = featuredSet.has(b.id) ? 0 : 1;
      if(af !== bf) return af - bf;
      return String(a.title||"").localeCompare(String(b.title||""),"uk");
    });
    return arr;
  }
  if(sortKey === "price_asc"){ arr.sort((a,b)=>Number(a.price_uah||0)-Number(b.price_uah||0)); return arr; }
  if(sortKey === "price_desc"){ arr.sort((a,b)=>Number(b.price_uah||0)-Number(a.price_uah||0)); return arr; }
  if(sortKey === "title_asc"){ arr.sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""),"uk")); return arr; }
  if(sortKey === "title_desc"){ arr.sort((a,b)=>String(b.title||"").localeCompare(String(a.title||""),"uk")); return arr; }
  if(sortKey === "newest"){ arr.sort((a,b)=>String(b.id||"").localeCompare(String(a.id||""))); return arr; }
  return arr;
}

function cardHTML(p){
  const img = getPrimaryImage(p.images);
  const fav = inFav(p.id);
  const price = Number(p.price_uah || 0);

  const priceHtml = price > 0 ? `<div class="price">${fmtUAH(price)}</div>` : `<div class="price muted">Ціну уточнюйте</div>`;

  return `
  <article class="card" data-id="${escapeHtml(p.id)}">
    <a class="card-link" href="./product.html?id=${encodeURIComponent(p.id)}" aria-label="${escapeHtml(p.title)}"></a>
    <div class="img">
      ${img ? `<img class="lazy" loading="lazy" data-src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}">` : `<div class="img-ph"></div>`}
    </div>
    <div class="body">
      <div class="title">${escapeHtml(p.title)}</div>
      ${priceHtml}
      <div class="stock">${escapeHtml(stockLabel(p.stock))}</div>
      <div class="row">
        <button class="btn btn-primary" data-add="${escapeHtml(p.id)}">В кошик</button>
        <button class="btn btn-ghost fav" data-fav="${escapeHtml(p.id)}" aria-label="В обране">${fav ? "♥" : "♡"}</button>
      </div>
    </div>
  </article>`;
}

function makeSkeleton(n=12){
  const sk = qs("#skeleton");
  const html = Array.from({length:n}).map(()=>`
    <div class="card sk-card">
      <div class="img sk"></div>
      <div class="body">
        <div class="sk-line sk"></div>
        <div class="sk-line sk"></div>
        <div class="sk-line sk short"></div>
        <div class="sk-btns">
          <div class="sk-btn sk"></div>
          <div class="sk-btn sk"></div>
        </div>
      </div>
    </div>
  `).join("");
  sk.innerHTML = html;
}

function lazyMount(){
  const imgs = qsa("img.lazy[data-src]");
  if(!imgs.length) return;

  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(!e.isIntersecting) continue;
      const img = e.target;
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
      io.unobserve(img);
    }
  }, { rootMargin: "400px 0px" });

  imgs.forEach(img=>io.observe(img));
}

let STATE = {
  catalog: [],
  categories: [],
  featuredSet: new Set(),
  activeCat: "",
  query: "",
  sort: "recommended",
  page: 1,
  pageSize: 25,
  inStockOnly: false,
  minPrice: "",
  maxPrice: "",
  hideZeroPrice: false,
  catSearch: "",
  filtered: []
};

function applyFilters(){
  const q = (STATE.query||"").trim().toLowerCase();
  const cat = (STATE.activeCat||"").trim();
  const inStockOnly = !!STATE.inStockOnly;
  const hideZero = !!STATE.hideZeroPrice;
  const minP = toInt(STATE.minPrice);
  const maxP = toInt(STATE.maxPrice);

  let items = STATE.catalog;

  if(cat){
    items = items.filter(p=>{
      const bc0 = (p.breadcrumbs && p.breadcrumbs[0]) ? p.breadcrumbs[0] : "";
      const c2 = p.category || "";
      return bc0 === cat || c2 === cat;
    });
  }

  if(q){
    items = items.filter(p=>{
      const t = String(p.title||"").toLowerCase();
      const d = String(p.description||"").toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }

  if(inStockOnly){
    items = items.filter(p=>p.stock === "in_stock");
  }

  if(minP > 0){
    items = items.filter(p=>Number(p.price_uah||0) >= minP);
  }

  if(maxP > 0){
    items = items.filter(p=>Number(p.price_uah||0) <= maxP);
  }

  if(hideZero){
    items = items.filter(p=>Number(p.price_uah||0) > 0);
  }

  items = sortItems(items, STATE.sort, STATE.featuredSet);
  STATE.filtered = items;

  const totalPages = Math.max(1, Math.ceil(items.length / STATE.pageSize));
  if(STATE.page > totalPages) STATE.page = totalPages;
  if(STATE.page < 1) STATE.page = 1;

  render();
}

function render(){
  const grid = qs("#grid");
  const pageInfo = qs("#pageInfo");
  const activeInfo = qs("#activeInfo");
  const prevBtn = qs("#prevBtn");
  const nextBtn = qs("#nextBtn");

  const total = STATE.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / STATE.pageSize));
  const start = (STATE.page - 1) * STATE.pageSize;
  const end = start + STATE.pageSize;
  const slice = STATE.filtered.slice(start, end);

  const parts = [];
  if(STATE.activeCat) parts.push("Категорія: " + STATE.activeCat);
  if(STATE.query) parts.push("Пошук: “" + STATE.query + "”");
  parts.push("Знайдено: " + total);
  activeInfo.textContent = parts.join(" · ");

  grid.innerHTML = slice.map(cardHTML).join("");
  grid.hidden = false;
  qs("#skeleton").hidden = true;

  pageInfo.textContent = `Сторінка ${STATE.page} з ${totalPages}`;
  prevBtn.disabled = STATE.page <= 1;
  nextBtn.disabled = STATE.page >= totalPages;

  lazyMount();
}

function bindGridClicks(){
  const grid = qs("#grid");
  grid.addEventListener("click", (e)=>{
    const add = e.target.closest("[data-add]");
    const fav = e.target.closest("[data-fav]");

    if(add){
      const id = add.getAttribute("data-add");
      const p = STATE.catalog.find(x=>x.id===id);
      if(!p) return;
      addToCart(p, 1);
      mountHeader();
      add.textContent = "Додано ✓";
      setTimeout(()=>add.textContent="В кошик", 700);
    }

    if(fav){
      const id = fav.getAttribute("data-fav");
      const on = toggleFav(id);
      fav.textContent = on ? "♥" : "♡";
      mountHeader();
    }
  });
}

function renderTopChips(){
  const bar = qs("#categoriesBar");
  bar.innerHTML = "";

  const mk = (label, on)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.onclick = on;
    return b;
  };

  const clear = ()=>bar.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));

  const allBtn = mk("Всі", ()=>{
    STATE.activeCat = "";
    setParam("cat", "");
    STATE.page = 1;
    clear();
    allBtn.classList.add("active");
    applyFilters();
  });
  bar.appendChild(allBtn);

  const active = getParam("cat");
  if(!active) allBtn.classList.add("active");

  STATE.categories.slice(0, 18).forEach(c=>{
    const btn = mk(c.name, ()=>{
      STATE.activeCat = c.name;
      setParam("cat", c.name);
      STATE.page = 1;
      clear();
      btn.classList.add("active");
      applyFilters();
    });
    if(active && active === c.name) btn.classList.add("active");
    bar.appendChild(btn);
  });

  if(active) STATE.activeCat = active;
}

function renderSidebarCats(){
  const list = qs("#catsList");
  const search = (STATE.catSearch||"").trim().toLowerCase();
  const active = STATE.activeCat;

  const cats = STATE.categories
    .filter(c=>!search || c.name.toLowerCase().includes(search))
    .slice(0, 200);

  list.innerHTML = cats.map(c=>{
    const on = (c.name === active);
    return `<button type="button" class="cat-item ${on ? "active" : ""}" data-cat="${escapeHtml(c.name)}">
      <span>${escapeHtml(c.name)}</span>
      <b>${c.count}</b>
    </button>`;
  }).join("");
}

function bindSidebarCats(){
  qs("#catsList").addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-cat]");
    if(!btn) return;
    const name = btn.getAttribute("data-cat");
    STATE.activeCat = name;
    setParam("cat", name);
    STATE.page = 1;
    renderSidebarCats();
    renderTopChips();
    applyFilters();
    window.scrollTo({ top: 0, behavior:"smooth" });
  });

  qs("#catSearch").addEventListener("input", ()=>{
    STATE.catSearch = qs("#catSearch").value || "";
    renderSidebarCats();
  });
}

function bindControls(){
  const searchInput = qs("#searchInput");
  const sortSelect = qs("#sortSelect");
  const psSelect = qs("#pageSizeSelect");

  qs("#prevBtn").onclick = ()=>{
    STATE.page -= 1;
    setParam("page", String(STATE.page));
    applyFilters();
    window.scrollTo({top: 0, behavior:"smooth"});
  };

  qs("#nextBtn").onclick = ()=>{
    STATE.page += 1;
    setParam("page", String(STATE.page));
    applyFilters();
    window.scrollTo({top: 0, behavior:"smooth"});
  };

  qs("[data-search-form]").addEventListener("submit",(e)=>{
    e.preventDefault();
    STATE.query = (searchInput.value||"").trim();
    setParam("q", STATE.query);
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  });

  sortSelect.addEventListener("change", ()=>{
    STATE.sort = sortSelect.value;
    setParam("sort", STATE.sort);
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  });

  psSelect.addEventListener("change", ()=>{
    STATE.pageSize = Number(psSelect.value || 25);
    setParam("ps", String(STATE.pageSize));
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  });

  qs("#inStockOnly").addEventListener("change", ()=>{
    STATE.inStockOnly = qs("#inStockOnly").checked;
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  });

  qs("#hideZeroPrice").addEventListener("change", ()=>{
    STATE.hideZeroPrice = qs("#hideZeroPrice").checked;
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  });

  const onPriceChange = ()=>{
    STATE.minPrice = qs("#minPrice").value || "";
    STATE.maxPrice = qs("#maxPrice").value || "";
    STATE.page = 1;
    setParam("page","1");
    applyFilters();
  };

  qs("#minPrice").addEventListener("input", onPriceChange);
  qs("#maxPrice").addEventListener("input", onPriceChange);

  qs("#resetFilters").addEventListener("click", ()=>{
    STATE.activeCat = "";
    STATE.inStockOnly = false;
    STATE.minPrice = "";
    STATE.maxPrice = "";
    STATE.hideZeroPrice = false;
    STATE.catSearch = "";
    setParam("cat","");
    setParam("page","1");
    qs("#inStockOnly").checked = false;
    qs("#hideZeroPrice").checked = false;
    qs("#minPrice").value = "";
    qs("#maxPrice").value = "";
    qs("#catSearch").value = "";
    renderSidebarCats();
    renderTopChips();
    applyFilters();
  });

  window.addEventListener("storage", mountHeader);
}

async function main(){
  mountHeader();
  wireGlobalSearch();
  setSearchValueFromURL();
  makeSkeleton(12);
  qs("#skeleton").hidden = false;
  qs("#grid").hidden = true;

  STATE.catalog = await loadJSON("./site_data/catalog.json");
  const index = await loadJSON("./site_data/index.json").catch(()=>({featured_product_ids:[]}));
  STATE.featuredSet = new Set(index.featured_product_ids || []);

  STATE.query = getParam("q");
  STATE.sort = getParam("sort") || "recommended";
  STATE.page = Number(getParam("page") || 1);
  STATE.pageSize = Number(getParam("ps") || 25);
  STATE.activeCat = getParam("cat") || "";

  STATE.categories = buildCategoryStats(STATE.catalog);

  qs("#searchInput").value = STATE.query;
  qs("#sortSelect").value = STATE.sort;
  qs("#pageSizeSelect").value = String(STATE.pageSize);

  renderTopChips();
  renderSidebarCats();
  bindSidebarCats();
  bindGridClicks();
  bindControls();

  applyFilters();
}

main().catch(err=>{
  console.error(err);
  alert("Помилка: перевір що сервер запущений у ~/STROYKLIMAT/site і існує папка site_data з JSON.");
});
