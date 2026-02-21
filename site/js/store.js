/* store.js — global store helpers */
(function(){
  function read(key, def){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }catch(e){ return def; }
  }
  function write(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  function getCart(){ return read("cart", []); }
  function setCart(v){ write("cart", v); }
  function getFav(){ return read("fav", []); }
  function setFav(v){ write("fav", v); }

  function cartCount(){ return getCart().reduce((s,x)=> s + (Number(x.qty)||0), 0); }
  function favCount(){ return getFav().length; }

  function toggleFav(id){
    const fav = getFav();
    const i = fav.indexOf(id);
    if(i >= 0) fav.splice(i,1); else fav.push(id);
    setFav(fav);
    return fav.includes(id);
  }

  function inFav(id){ return getFav().includes(id); }

  // addToCart accepts either a product object or a product id string.
  function addToCart(product, qty){
    const n = Number(qty) || 1;
    const cart = getCart();
    if(typeof product === 'object' && product && product.id){
      const i = cart.findIndex(x=>x.id===product.id);
      if(i>=0) cart[i].qty = (Number(cart[i].qty)||0) + n;
      else cart.push({ id: product.id, qty: n, title: product.title || "", price_uah: Number(product.price_uah)||0, image: (product.images && product.images[0]) ? product.images[0] : "" });
    }else{
      // product is id
      const id = String(product || "");
      const i = cart.findIndex(x=>x.id===id);
      if(i>=0) cart[i].qty = (Number(cart[i].qty)||0) + n;
      else cart.push({ id: id, qty: n, title: "", price_uah: 0, image: "" });
    }
    setCart(cart);
  }
  // Helpers for pages that expect small utility functions
  async function loadCatalog(){
    if(window.Store.catalog && Array.isArray(window.Store.catalog) && window.Store.catalog.length) return window.Store.catalog;
    try{
      const r = await fetch('./site_data/catalog.json', { cache: 'no-store' });
      if(!r.ok) return [];
      const data = await r.json();
      window.Store.catalog = data;
      return data;
    }catch(e){ return [] }
  }

  function getById(id){
    const cat = window.Store.catalog || [];
    return cat.find(x=>String(x.id) === String(id));
  }

  function formatUAH(n){ const v = Number(n||0); return v ? v.toLocaleString('uk-UA') + ' ₴' : 'Ціну уточнюйте'; }
  function escapeHTML(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
  function getPrimaryImage(images){ if(!Array.isArray(images)) return ''; const clean = images.filter(Boolean).map(String).filter(u => !u.includes('tov-bis-7') && !u.includes('w350_h100')); return clean[0] || images[0] || ''; }

  // alias for compatibility
  const isFav = inFav;

  window.Store = {
    getCart, setCart, getFav, setFav,
    cartCount, favCount, toggleFav, inFav, isFav, addToCart,
    loadCatalog, getById, formatUAH, escapeHTML, getPrimaryImage
  };

  // Expose common helpers to global scope for legacy inline scripts
  try{
    window.getById = getById;
    window.formatUAH = formatUAH;
    window.escapeHTML = escapeHTML;
    window.getPrimaryImage = getPrimaryImage;
    window.addToCart = addToCart;
    window.toggleFav = toggleFav;
    window.getFav = getFav;
    window.getCart = getCart;
    window.setCart = setCart;
    window.inFav = inFav;
    window.isFav = isFav;
  }catch(e){}
})();
