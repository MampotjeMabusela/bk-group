const API = '/api';
const BUSINESS_WHATSAPP_NUMBER = '27782376257';

let products = [];
let cart = [];

let productsLoading = true;
let productsLoadError = false;
let lastQuotationContext = null;
let lightboxReturnFocus = null;

const DEFAULT_DOCUMENT_TITLE = "B & K Group – PHUSHA S'MOKOLO";
const PAGE_META = {
  shop: {
    title: 'Shop — B & K Group',
    desc: 'Browse genuine leather shoes, vellies, boots, and sandals. PHUSHA S\'MOKOLO — Made in South Africa.',
  },
  cart: {
    title: 'Your cart — B & K Group',
    desc: 'Review your items and request a free PDF quotation.',
  },
  checkout: {
    title: 'Checkout — B & K Group',
    desc: 'Enter your details to download a quotation for your cart.',
  },
  testimonials: {
    title: 'Testimonials — B & K Group',
    desc: 'What customers say about B & K Group footwear and service.',
  },
  feedback: {
    title: 'Feedback — B & K Group',
    desc: 'Send us your feedback, suggestions, or questions.',
  },
  terms: {
    title: 'Terms — B & K Group',
    desc: 'Terms and conditions for using the B & K Group website and orders.',
  },
  privacy: {
    title: 'Privacy — B & K Group',
    desc: 'How B & K Group handles your personal information.',
  },
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => el.querySelectorAll(sel);

function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function getProductImages(p) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images;
  return p.image ? [p.image] : [];
}

let lightboxImages = [];
let lightboxIndex = 0;
let lightboxProductName = '';

function updateLightboxImage() {
  const img = $('#imageLightboxImg');
  const prev = $('#imageLightboxPrev');
  const next = $('#imageLightboxNext');
  if (!img) return;
  const src = lightboxImages[lightboxIndex];
  if (src) {
    img.src = src;
    const n = lightboxImages.length;
    img.alt = lightboxProductName
      ? `${lightboxProductName} — photo ${lightboxIndex + 1} of ${n}`
      : '';
  }
  const multi = lightboxImages.length > 1;
  if (prev) prev.hidden = !multi;
  if (next) next.hidden = !multi;
}

function getLightboxFocusableElements() {
  const root = $('#imageLightbox');
  if (!root || root.hidden) return [];
  const sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll(sel)).filter((node) => node.offsetParent !== null || node === root.querySelector('.image-lightbox-close'));
}

function lightboxTrapKeydown(e) {
  const box = $('#imageLightbox');
  if (!box || box.hidden) return;
  if (e.key !== 'Tab') return;
  const nodes = getLightboxFocusableElements();
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openImageLightbox(images, index, productName) {
  lightboxImages = images.slice();
  lightboxIndex = Math.max(0, Math.min(index, Math.max(0, lightboxImages.length - 1)));
  lightboxProductName = productName || '';
  const el = $('#imageLightbox');
  if (!el || lightboxImages.length === 0) return;
  lightboxReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  el.hidden = false;
  document.body.classList.add('lightbox-open');
  updateLightboxImage();
  document.addEventListener('keydown', lightboxTrapKeydown, true);
  $('#imageLightboxClose')?.focus();
}

function closeImageLightbox() {
  const el = $('#imageLightbox');
  if (el) el.hidden = true;
  document.body.classList.remove('lightbox-open');
  document.removeEventListener('keydown', lightboxTrapKeydown, true);
  lightboxImages = [];
  if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
    lightboxReturnFocus.focus();
  }
  lightboxReturnFocus = null;
}

function stepLightbox(delta) {
  if (lightboxImages.length <= 1) return;
  lightboxIndex = (lightboxIndex + delta + lightboxImages.length * 10) % lightboxImages.length;
  updateLightboxImage();
}

function stepProductGallery(productId, delta) {
  const wrap = document.querySelector(`[data-product-gallery="${String(productId)}"]`);
  if (!wrap) return;
  let images;
  try {
    images = JSON.parse(wrap.getAttribute('data-images') || '[]');
  } catch {
    return;
  }
  if (!images.length) return;
  let idx = parseInt(wrap.getAttribute('data-index') || '0', 10) || 0;
  idx = (idx + delta + images.length * 10) % images.length;
  wrap.setAttribute('data-index', String(idx));
  const img = wrap.querySelector('.product-gallery-img');
  if (img) img.src = images[idx];
}

function handleProductGalleryInteraction(e) {
  const nav = e.target.closest('[data-gallery-nav]');
  if (nav) {
    e.preventDefault();
    e.stopPropagation();
    stepProductGallery(nav.getAttribute('data-gallery-nav'), parseInt(nav.dataset.dir, 10) || 0);
    return true;
  }
  const zoom = e.target.closest('[data-gallery-open]');
  if (zoom) {
    e.preventDefault();
    e.stopPropagation();
    const id = zoom.getAttribute('data-gallery-open');
    const wrap = document.querySelector(`[data-product-gallery="${String(id)}"]`);
    if (!wrap) return true;
    let images;
    try {
      images = JSON.parse(wrap.getAttribute('data-images') || '[]');
    } catch {
      return true;
    }
    const idx = parseInt(wrap.getAttribute('data-index') || '0', 10) || 0;
    const name = wrap.getAttribute('data-product-name') || '';
    openImageLightbox(images, idx, name);
    return true;
  }
  return false;
}

function formatPrice(amount) {
  return 'ZAR ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getSizeStockStatus(product, size) {
  const map = product.stockBySize;
  if (!map || typeof map !== 'object') return 'in';
  const k = String(size);
  const v = map[k] ?? map[String(Number(k))];
  if (v === 'out' || v === 'low') return v;
  return 'in';
}

function productImgAttrs(src) {
  const s = escapeAttr(src);
  return (
    ` src="${s}" srcset="${s} 320w, ${s} 640w, ${s} 960w" sizes="(max-width: 520px) 92vw, (max-width: 1100px) 45vw, 320px" width="640" height="640" loading="lazy" decoding="async"`
  );
}

function getPageIdFromUrl() {
  const p = new URLSearchParams(window.location.search).get('page');
  if (p && $(`#page-${p}`)) return p;
  return 'shop';
}

function getProductIdFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return q.get('product') || q.get('id');
}

function setBrowserUrl(pageId, extra) {
  const u = new URL(window.location.href);
  u.searchParams.set('page', pageId);
  if (pageId === 'shop' && extra && extra.productId) {
    u.searchParams.set('product', String(extra.productId));
  } else {
    u.searchParams.delete('product');
    u.searchParams.delete('id');
  }
  if (pageId === 'shop' && extra) {
    if (extra.category) u.searchParams.set('category', extra.category);
    else u.searchParams.delete('category');
    if (extra.q) u.searchParams.set('q', extra.q);
    else u.searchParams.delete('q');
    if (extra.sort && extra.sort !== 'default') u.searchParams.set('sort', extra.sort);
    else u.searchParams.delete('sort');
  } else {
    u.searchParams.delete('category');
    u.searchParams.delete('q');
    u.searchParams.delete('sort');
  }
  history.replaceState({}, '', u.pathname + u.search);
}

function readShopFiltersFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return {
    category: q.get('category') || '',
    q: q.get('q') || '',
    sort: q.get('sort') || 'default',
    productId: q.get('product') || q.get('id') || '',
  };
}

function applyPageMeta(pageId) {
  const m = PAGE_META[pageId];
  document.title = m ? m.title : DEFAULT_DOCUMENT_TITLE;
  const meta = $('#metaDescription');
  if (meta) meta.setAttribute('content', m ? m.desc : PAGE_META.shop.desc);
}

function getShareableProductUrl(productId) {
  const u = new URL(window.location.origin + window.location.pathname);
  u.searchParams.set('page', 'shop');
  u.searchParams.set('product', String(productId));
  return u.toString();
}

function scrollToProductCard(productId) {
  requestAnimationFrame(() => {
    const id = String(productId).replace(/[^a-zA-Z0-9_-]/g, '');
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('product-card--highlight');
      setTimeout(() => card.classList.remove('product-card--highlight'), 2400);
    }
  });
}

function buildCartShareText() {
  if (!cart.length) return '';
  const lines = cart.map((i) => {
    const line = `${i.name}${i.size ? ` — size ${i.size}` : ''} × ${i.quantity || 1} — ${formatPrice((i.price || 0) * (i.quantity || 1))}`;
    return line;
  });
  const total = cart.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);
  return `My B & K Group cart:\n${lines.join('\n')}\nTotal: ${formatPrice(total)}`;
}

function getCartShareWhatsAppUrl() {
  const text = encodeURIComponent(buildCartShareText());
  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${text}`;
}

function getCartShareMailtoUrl() {
  const body = encodeURIComponent(buildCartShareText());
  const subject = encodeURIComponent('My cart — B & K Group');
  return `mailto:bandkgroupptyltd@outlook.com?subject=${subject}&body=${body}`;
}

function buildQuotationPlainSummary(ctx) {
  if (!ctx || !ctx.items || !ctx.items.length) return '';
  const lines = ctx.items.map(
    (i) => `${i.name}${i.size ? ` size ${i.size}` : ''} × ${i.quantity || 1} — ${formatPrice((i.price || 0) * (i.quantity || 1))}`,
  );
  return `Quotation enquiry (PDF downloaded)\n${lines.join('\n')}\nTotal: ${formatPrice(ctx.total)}\nName: ${ctx.customer.name || ''}\nEmail: ${ctx.customer.email || ''}\nPhone: ${ctx.customer.phone || ''}`;
}

function getQuotationWhatsAppUrl(ctx) {
  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildQuotationPlainSummary(ctx))}`;
}

function syncCartPricesFromCatalog() {
  if (!products.length) return;
  cart = cart.map((item) => {
    const p = products.find((x) => String(x.id) === String(item.id));
    if (!p) return item;
    return { ...item, price: Number(p.price) || 0 };
  });
  localStorage.setItem('bk-cart', JSON.stringify(cart));
  updateCartCount();
}

function getCart() {
  try {
    const raw = localStorage.getItem('bk-cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCart(next) {
  cart = next;
  localStorage.setItem('bk-cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const total = cart.reduce((n, i) => n + (i.quantity || 1), 0);
  const el = $('#cartCount');
  if (el) el.textContent = total;
}

let shopUrlDebounceTimer;

function scheduleShopUrlSync() {
  clearTimeout(shopUrlDebounceTimer);
  shopUrlDebounceTimer = setTimeout(() => {
    if (!$('#page-shop')?.classList.contains('active')) return;
    const extra = {
      category: $('#categoryFilter')?.value || '',
      q: ($('#productSearch')?.value || '').trim(),
      sort: $('#productSort')?.value || 'default',
      productId: getProductIdFromUrl() || undefined,
    };
    setBrowserUrl('shop', extra);
  }, 320);
}

function applyUrlToShopControls() {
  const f = readShopFiltersFromUrl();
  const cat = $('#categoryFilter');
  const search = $('#productSearch');
  const sort = $('#productSort');
  if (cat) cat.value = (f.category || '').toLowerCase();
  if (search) search.value = f.q || '';
  const allowed = new Set(['default', 'price-asc', 'price-desc', 'name-asc', 'name-desc']);
  if (sort) sort.value = allowed.has(f.sort) ? f.sort : 'default';
}

function showPage(pageId, opts) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const page = $(`#page-${pageId}`);
  const link = $(`.nav-link[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (link) link.classList.add('active');
  applyPageMeta(pageId);
  if (!opts?.skipUrlSync) {
    if (pageId === 'shop') {
      const extra = {
        category: $('#categoryFilter')?.value || '',
        q: ($('#productSearch')?.value || '').trim(),
        sort: $('#productSort')?.value || 'default',
        productId: getProductIdFromUrl() || undefined,
      };
      setBrowserUrl('shop', extra);
    } else {
      setBrowserUrl(pageId, {});
    }
  }
  if (pageId === 'shop') renderProducts();
  if (pageId === 'cart') renderCart();
  if (pageId === 'checkout') renderCheckout();
}

function renderProducts() {
  const grid = $('#productGrid');
  if (!grid) return;

  if (productsLoading) {
    grid.innerHTML = Array.from({ length: 8 }, () => '<li class="product-skeleton" aria-hidden="true"><div class="product-skeleton-img"></div><div class="product-skeleton-line"></div><div class="product-skeleton-line product-skeleton-line--short"></div></li>').join('');
    return;
  }

  if (productsLoadError) {
    grid.innerHTML =
      '<li class="product-grid-error" role="alert">' +
      '<p class="product-grid-error-title">We couldn’t load the catalogue</p>' +
      '<p class="product-grid-error-text">Check your connection and try again.</p>' +
      '<button type="button" class="btn btn-primary" id="productGridRetry">Retry</button>' +
      '</li>';
    return;
  }

  const category = ($('#categoryFilter')?.value || '').toLowerCase();
  const qRaw = ($('#productSearch')?.value || '').trim().toLowerCase();
  const sort = $('#productSort')?.value || 'default';

  let filtered = category
    ? products.filter((p) => (p.category || '').toLowerCase() === category)
    : products.slice();

  if (qRaw) {
    filtered = filtered.filter((p) => {
      const hay = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
      return hay.includes(qRaw);
    });
  }

  const byPrice = (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0);
  const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
  if (sort === 'price-asc') filtered.sort(byPrice);
  else if (sort === 'price-desc') filtered.sort((a, b) => -byPrice(a, b));
  else if (sort === 'name-asc') filtered.sort(byName);
  else if (sort === 'name-desc') filtered.sort((a, b) => -byName(a, b));

  if (filtered.length === 0) {
    grid.innerHTML =
      '<li class="product-grid-empty" role="status">' +
      '<p class="product-grid-empty-title">No shoes match your filters</p>' +
      '<p class="product-grid-empty-text">Try another search or choose “All” categories.</p>' +
      '</li>';
    return;
  }

  const deepId = getProductIdFromUrl();

  grid.innerHTML = filtered.map((p, i) => {
    const orig = p.originalPrice ? `<span class="product-original">${formatPrice(p.originalPrice)}</span>` : '';
    const sizes = p.sizes && p.sizes.length ? p.sizes : [];
    let defaultSize = null;
    sizes.forEach((s) => {
      if (defaultSize == null && getSizeStockStatus(p, s) !== 'out') defaultSize = s;
    });
    const sizeOptions = sizes
      .map((s) => {
        const st = getSizeStockStatus(p, s);
        const disabled = st === 'out';
        const suffix = st === 'out' ? ' — out of stock' : st === 'low' ? ' — low stock' : '';
        const sel = defaultSize != null && String(s) === String(defaultSize) ? ' selected' : '';
        return `<option value="${s}"${disabled ? ' disabled' : ''}${sel}>${s}${suffix}</option>`;
      })
      .join('');
    const sizeSelect = sizes.length
      ? `
      <div class="product-size-wrap">
        <label for="size-${p.id}">Size</label>
        <select id="size-${p.id}" class="product-size" data-id="${p.id}" aria-label="Size for ${escapeAttr(p.name)}">${sizeOptions}</select>
      </div>`
      : '';
    const imgs = getProductImages(p);
    const imagesAttr = escapeAttr(JSON.stringify(imgs));
    const navHtml =
      imgs.length > 1
        ? `
      <button type="button" class="gallery-nav gallery-prev" data-gallery-nav="${escapeAttr(p.id)}" data-dir="-1" aria-label="Previous image">‹</button>
      <button type="button" class="gallery-nav gallery-next" data-gallery-nav="${escapeAttr(p.id)}" data-dir="1" aria-label="Next image">›</button>`
        : '';
    const fitContain =
      String(p.id) === '1' ||
      String(p.id) === '2' ||
      String(p.id) === '3' ||
      String(p.id) === '4' ||
      String(p.id) === '5' ||
      String(p.id) === '6' ||
      String(p.id) === '7' ||
      String(p.id) === '8' ||
      String(p.id) === '9' ||
      String(p.id) === '10' ||
      String(p.id) === '11' ||
      String(p.id) === '12' ||
      String(p.id) === '13' ||
      String(p.id) === '14' ||
      String(p.id) === '15' ||
      String(p.id) === '16' ||
      String(p.id) === '17' ||
      String(p.id) === '18' ||
      String(p.id) === '19' ||
      String(p.id) === '20' ||
      String(p.id) === '21' ||
      String(p.id) === '22';
    const img0 = imgs[0] || '';
    const imageBlock = `
        <div class="product-image-wrap${imgs.length > 1 ? ' product-image-wrap--gallery' : ''}${fitContain ? ' product-image-wrap--contain' : ''}" data-product-gallery="${escapeAttr(p.id)}" data-images="${imagesAttr}" data-index="0" data-product-name="${escapeAttr(p.name)}">
          ${navHtml}
          <button type="button" class="gallery-zoom" data-gallery-open="${escapeAttr(p.id)}" aria-label="View larger: ${escapeAttr(p.name)}" title="Click to see full size">
            <img class="product-gallery-img" alt="${escapeAttr(p.name)}"${productImgAttrs(img0)} />
          </button>
        </div>`;
    return `
      <li class="product-card" data-id="${p.id}" style="animation-delay: ${i * 0.05}s">
        ${imageBlock}
        <div class="product-info">
          <div class="product-card-top">
            <h3 class="product-name">${p.name}</h3>
            <button type="button" class="btn btn-ghost btn-copy-link" data-copy-product-link="${escapeAttr(p.id)}" title="Copy link to this product" aria-label="Copy link to ${escapeAttr(p.name)}">Copy link</button>
          </div>
          <p class="product-desc">${p.description}</p>
          <div class="product-price-wrap">
            <span class="product-price">${formatPrice(p.price)}</span>${orig}
          </div>
          ${sizeSelect}
          <div class="product-actions">
            <div class="qty-control">
              <button type="button" aria-label="Decrease" data-action="dec" data-id="${p.id}">−</button>
              <span data-qty="${p.id}">${getCartQty(p.id)}</span>
              <button type="button" aria-label="Increase" data-action="inc" data-id="${p.id}">+</button>
            </div>
            <button type="button" class="btn btn-primary btn-add" data-action="add" data-id="${p.id}">Add</button>
          </div>
        </div>
      </li>`;
  }).join('');

  if (deepId && filtered.some((p) => String(p.id) === String(deepId))) {
    scrollToProductCard(deepId);
  }
}

function getSelectedSize(productId) {
  const sel = $(`.product-size[data-id="${productId}"]`);
  return sel ? String(sel.value) : null;
}

function handleProductGridClick(e) {
  if (handleProductGalleryInteraction(e)) return;
  const grid = $('#productGrid');
  const copyBtn = e.target.closest('[data-copy-product-link]');
  if (copyBtn && grid?.contains(copyBtn)) {
    const pid = copyBtn.getAttribute('data-copy-product-link');
    const url = getShareableProductUrl(pid);
    const done = () => {
      const t = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = t; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        window.prompt('Copy this link:', url);
      });
    } else {
      window.prompt('Copy this link:', url);
    }
    return;
  }
  const btn = e.target.closest('[data-action][data-id]');
  if (!btn || !grid) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const product = products.find((p) => p.id === id);
  if (!product) return;
  const size = getSelectedSize(id);
  if (size && getSizeStockStatus(product, size) === 'out') {
    alert('That size is out of stock. Please pick another size.');
    return;
  }
  if (action === 'add' || action === 'inc') {
    addToCart(product, 1, size);
    const span = $(`[data-qty="${id}"]`, grid);
    if (span) span.textContent = getCartQty(id);
  } else if (action === 'dec') {
    addToCart(product, -1, size);
    const span = $(`[data-qty="${id}"]`, grid);
    if (span) span.textContent = getCartQty(id);
  }
}

function getCartQty(id, size) {
  const items = size != null && size !== ''
    ? cart.filter(i => i.id === id && String(i.size || '') === String(size))
    : cart.filter(i => i.id === id);
  return items.reduce((n, i) => n + (i.quantity || 1), 0);
}

function addToCart(product, delta = 1, size = null) {
  const sizeStr = size != null ? String(size) : '';
  const existing = cart.find(i => i.id === product.id && String(i.size || '') === sizeStr);
  let next;
  if (existing) {
    const qty = Math.max(0, (existing.quantity || 1) + delta);
    if (qty === 0) {
      next = cart.filter(i => !(i.id === product.id && String(i.size || '') === sizeStr));
    } else {
      next = cart.map(i => i.id === product.id && String(i.size || '') === sizeStr ? { ...i, quantity: qty, price: Number(product.price) || 0 } : i);
    }
  } else {
    if (delta <= 0) return;
    if (sizeStr && getSizeStockStatus(product, sizeStr) === 'out') return;
    next = [...cart, { ...product, price: Number(product.price) || 0, quantity: 1, size: sizeStr || undefined }];
  }
  setCart(next);
}

function renderCart() {
  const list = $('#cartList');
  const empty = $('#cartEmpty');
  const footer = $('#cartFooter');
  if (!list || !empty || !footer) return;
  if (cart.length === 0) {
    list.innerHTML = '';
    empty.hidden = false;
    footer.hidden = true;
    return;
  }
  empty.hidden = true;
  footer.hidden = false;
  list.innerHTML = cart.map(item => `
    <li class="cart-item" data-id="${item.id}" data-size="${item.size || ''}">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <div class="cart-item-name">${item.name}${item.size ? ` (Size ${item.size})` : ''}</div>
        <p class="cart-item-desc">${item.description}</p>
        <div class="cart-item-qty">
          <button type="button" data-cart="dec" data-id="${item.id}" data-size="${item.size || ''}">−</button>
          <span>${item.quantity || 1}</span>
          <button type="button" data-cart="inc" data-id="${item.id}" data-size="${item.size || ''}">+</button>
        </div>
      </div>
      <div class="cart-item-price">${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
      <button type="button" class="cart-item-remove" data-cart="remove" data-id="${item.id}" data-size="${item.size || ''}">Remove</button>
    </li>`).join('');

  const total = cart.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);
  $('#cartTotal').textContent = formatPrice(total);
  const wa = $('#cartShareWa');
  const mail = $('#cartShareMail');
  if (wa) wa.href = getCartShareWhatsAppUrl();
  if (mail) mail.href = getCartShareMailtoUrl();
}

function renderCheckout() {
  const form = $('#checkoutForm');
  const success = $('#orderSuccess');
  if (!form || !success) return;
  form.hidden = false;
  success.hidden = true;
  const summary = $('#checkoutSummary');
  if (!summary) return;
  if (cart.length === 0) {
    summary.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  const total = cart.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);
  summary.innerHTML = `
    <ul>
      ${cart.map(i => `<li>${i.name}${i.size ? ` (Size ${i.size})` : ''} × ${i.quantity || 1} – ${formatPrice((i.price || 0) * (i.quantity || 1))}</li>`).join('')}
    </ul>
    <div class="total">Total: ${formatPrice(total)}</div>`;
}

async function loadProducts() {
  productsLoading = true;
  productsLoadError = false;
  if ($('#page-shop')?.classList.contains('active')) renderProducts();
  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    productsLoadError = false;
  } catch (err) {
    console.error('Failed to load products', err);
    products = [];
    productsLoadError = true;
  } finally {
    productsLoading = false;
  }
}

function handleCartPageClick(e) {
  const btn = e.target.closest('[data-cart][data-id]');
  if (!btn || !$('#cartList')?.contains(btn)) return;
  const id = btn.dataset.id;
  const size = btn.dataset.size != null ? String(btn.dataset.size) : null;
  const action = btn.dataset.cart;
  const product =
    products.find((p) => p.id === id) ||
    cart.find((i) => i.id === id && String(i.size || '') === String(size || ''));
  if (!product) return;
  if (action === 'inc' && size && getSizeStockStatus(product, size) === 'out') {
    alert('That size is out of stock. Remove it or choose another product.');
    return;
  }
  const cartKey = (i) => i.id === id && String(i.size || '') === String(size || '');
  if (action === 'remove') setCart(cart.filter((i) => !cartKey(i)));
  else if (action === 'dec') addToCart(product, -1, size);
  else if (action === 'inc') addToCart(product, 1, size);
  renderCart();
}

function init() {
  applyUrlToShopControls();
  showPage(getPageIdFromUrl(), { skipUrlSync: true });

  window.addEventListener('popstate', () => {
    applyUrlToShopControls();
    showPage(getPageIdFromUrl(), { skipUrlSync: true });
  });

  cart = getCart();
  updateCartCount();

  $('.skip-link')?.addEventListener('click', () => {
    $('#main-content')?.focus({ preventScroll: true });
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (link) {
      e.preventDefault();
      showPage(link.dataset.page);
    }
  });

  $('#page-cart')?.addEventListener('click', handleCartPageClick);

  $('#categoryFilter')?.addEventListener('change', () => {
    renderProducts();
    scheduleShopUrlSync();
  });
  $('#productSearch')?.addEventListener('input', () => {
    renderProducts();
    scheduleShopUrlSync();
  });
  $('#productSort')?.addEventListener('change', () => {
    renderProducts();
    scheduleShopUrlSync();
  });
  $('#productGrid')?.addEventListener('click', (e) => {
    if (e.target.id === 'productGridRetry' || e.target.closest('#productGridRetry')) {
      e.preventDefault();
      loadProducts().then(() => {
        syncCartPricesFromCatalog();
        renderProducts();
      });
      return;
    }
    handleProductGridClick(e);
  });

  $('#imageLightboxClose')?.addEventListener('click', () => closeImageLightbox());
  $$('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', () => closeImageLightbox());
  });
  $('#imageLightboxPrev')?.addEventListener('click', () => stepLightbox(-1));
  $('#imageLightboxNext')?.addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', (e) => {
    if ($('#imageLightbox')?.hidden) return;
    if (e.key === 'Escape') closeImageLightbox();
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
    else if (e.key === 'ArrowRight') stepLightbox(1);
  });

  $('#checkoutBtn')?.addEventListener('click', () => showPage('checkout'));
  $('#backToCart')?.addEventListener('click', () => showPage('cart'));

  $('#checkoutForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = $('#submitQuotation');
    const customer = {
      name: form.name?.value?.trim(),
      email: form.email?.value?.trim(),
      phone: form.phone?.value?.trim(),
      address: form.address?.value?.trim(),
    };
    const items = cart.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity || 1,
      size: i.size || null,
    }));
    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await fetch(`${API}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customer }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not generate quotation');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `B-K-Group-Quotation-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      const total = cart.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);
      lastQuotationContext = {
        items: cart.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity || 1,
          size: i.size || null,
        })),
        customer,
        total,
      };
      const qw = $('#quotationWhatsAppPrefill');
      if (qw) qw.href = getQuotationWhatsAppUrl(lastQuotationContext);
      form.hidden = true;
      $('#orderSuccess').hidden = false;
      $('#quotationWhatsAppPrefill')?.focus();
      setCart([]);
    } catch (err) {
      alert(err.message || 'Could not generate quotation. Please try again.');
    }
    if (submitBtn) submitBtn.disabled = false;
  });

  loadProducts().then(() => {
    syncCartPricesFromCatalog();
    renderProducts();
  });

  function parseFeedbackRating(form) {
    const el = form.querySelector('input[name="rating"]:checked');
    const v = el ? parseInt(el.value, 10) : NaN;
    if (Number.isFinite(v)) return Math.min(10, Math.max(0, v));
    return 5;
  }

  $('#feedbackForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name?.value?.trim();
    const email = form.email?.value?.trim();
    const message = form.message?.value?.trim();
    const msgEl = $('#feedbackMessageEl');
    if (!name || !email || !message) {
      if (msgEl) {
        msgEl.hidden = false;
        msgEl.className = 'feedback-message error';
        msgEl.textContent = 'Please fill in name, email, and message.';
      }
      return;
    }
    const rating = parseFeedbackRating(form);
    const subject = form.subject?.value || 'general';
    const submitBtn = $('#feedbackSubmit');
    if (submitBtn) submitBtn.disabled = true;
    if (msgEl) msgEl.hidden = true;
    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send feedback');
      }

      const subjectLabel =
        (form.subject?.selectedOptions && form.subject.selectedOptions[0]?.textContent) ||
        subject ||
        'General feedback';
      const whatsappText =
        `Hello B & K Group, I would like to send feedback.%0A%0A` +
        `Name: ${encodeURIComponent(name)}%0A` +
        `Email: ${encodeURIComponent(email)}%0A` +
        `Rating: ${encodeURIComponent(String(rating))}/10%0A` +
        `Subject: ${encodeURIComponent(subjectLabel)}%0A` +
        `Message: ${encodeURIComponent(message)}`;
      const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${whatsappText}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      if (msgEl) {
        msgEl.hidden = false;
        msgEl.className = 'feedback-message success';
        msgEl.textContent = 'Thank you! Feedback saved and WhatsApp opened. Please tap send in WhatsApp as well.';
      }
      form.reset();
    } catch (err) {
      if (msgEl) {
        msgEl.hidden = false;
        msgEl.className = 'feedback-message error';
        msgEl.textContent = err.message || 'Could not send feedback. Please try again.';
      }
    }
    if (submitBtn) submitBtn.disabled = false;
  });

  // Back to top
  const backToTop = $('#backToTop');
  if (backToTop) {
    const toggleVisibility = () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Chatbot (local: uses website data only, no external API; voice via browser TTS)
  const chatPanel = $('#chatPanel');
  const chatToggle = $('#chatToggle');
  const chatClose = $('#chatClose');
  const chatMessages = $('#chatMessages');
  const chatInput = $('#chatInput');
  const chatSend = $('#chatSend');
  const chatVoiceToggle = $('#chatVoiceToggle');
  let chatHistory = [];
  let chatWelcomeShown = false;

  function appendChatMessage(content, role, isError = false) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'user' : isError ? 'error' : 'bot');
    div.textContent = content;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function speakText(text) {
    if (!chatVoiceToggle?.checked || !text) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1;
      u.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find(v => v.lang.startsWith('en'));
      if (en) u.voice = en;
      window.speechSynthesis.speak(u);
    }
  }

  function showChatWelcome() {
    if (chatWelcomeShown) return;
    chatWelcomeShown = true;
    const welcome = "Hi! I'm your B & K Group assistant. I can help you find shoes, explain how to order, or guide you around the site. What would you like to know?";
    appendChatMessage(welcome, 'bot');
  }

  function setChatLoading(loading) {
    if (chatSend) chatSend.disabled = loading;
    if (chatInput) chatInput.disabled = loading;
  }

  // Local chatbot: uses only website data (products, navigation, contact). No external API.
  function getLocalChatReply(userText) {
    const t = userText.toLowerCase().trim();
    const has = (...words) => words.some(w => t.includes(w));

    // Greeting
    if (has('hi', 'hello', 'hey', 'good morning', 'good afternoon')) {
      return "Hi! I'm your B & K Group assistant. I can help you find shoes, explain how to order, or point you around the site. What would you like to know?";
    }

    // How to order / quotation
    if (has('order', 'buy', 'purchase', 'how to get', 'quotation', 'quote', 'pay', 'checkout', 'cart')) {
      return "Here’s how to order: 1) Go to Shop and add items to your cart (choose size). 2) Open Cart and click “Get quotation” to download a PDF. 3) Email the PDF to bandkgroupptyltd@outlook.com or WhatsApp it to +27 78 237 6257. We’ll confirm stock and payment. You can also call +27 78 237 6257 or visit us at Moreleta Corner, Pretoria.";
    }

    // Contact
    if (has('contact', 'email', 'phone', 'address', 'where are you', 'location', 'call', 'whatsapp')) {
      return "Contact B & K Group: Email bandkgroupptyltd@outlook.com, Phone/WhatsApp +27 78 237 6257. Address: Moreleta Corner, Cnr Garsfontein Rd & Rubenstain Dr, Moreleta Park, Pretoria.";
    }

    // Navigation
    if (has('testimonial', 'reviews', 'feedback', 'leave feedback', 'terms', 'conditions', 'privacy', 'personal data', 'popia')) {
      if (has('testimonial', 'reviews')) return "You can read customer testimonials by clicking “Testimonials” in the top menu.";
      if (has('feedback', 'leave feedback')) return "Click “Feedback” in the menu to send us your feedback or suggestions.";
      if (has('privacy', 'personal data', 'popia', 'gdpr', 'cookie')) return "Click “Privacy” at the bottom of the page to read our Privacy Policy.";
      if (has('terms', 'conditions')) return "Click “Terms & Conditions” at the bottom of the page to read our terms.";
    }
    if (has('shop', 'products', 'browse', 'where to buy', 'navigate', 'menu')) {
      return "Use the menu at the top: Shop lists all shoes with search, sort, and category filters. Testimonials has reviews, Feedback sends us a message, and Cart is where you get your PDF quotation.";
    }

    // Product suggestions by category
    const categoryMap = [
      { keys: ['boot', 'boots'], category: 'boots' },
      { keys: ['sandal', 'sandals'], category: 'sandals' },
      { keys: ['vellie', 'vellies', 'veldschoen'], category: 'vellies' },
      { keys: ['slip', 'slip-on', 'slip on'], category: 'slip-on' },
    ];
    for (const { keys, category } of categoryMap) {
      if (keys.some(k => t.includes(k))) {
        const list = products.filter(p => (p.category || '').toLowerCase() === category);
        if (list.length === 0) {
          return `We don’t have any ${category} in the list right now. Check the Shop for the full range, or ask about another category (e.g. boots, sandals, vellies).`;
        }
        const maxShow = 5;
        const slice = list.slice(0, maxShow);
        const lines = slice.map(p => `• ${p.name} – ${formatPrice(p.price)}`);
        const more = list.length > maxShow ? ` Plus ${list.length - maxShow} more in Shop.` : '';
        return `Here are some ${category} we have: ${lines.join('. ')}${more} Go to Shop to add any to your cart.`;
      }
    }

    // Price / cheap / affordable
    if (has('cheap', 'affordable', 'price', 'cost', 'expensive')) {
      const byPrice = [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
      const low = byPrice.slice(0, 3);
      const lines = low.map(p => `${p.name} – ${formatPrice(p.price)}`);
      return `Some of our more affordable options: ${lines.join('. ')}. Browse Shop and use the category filter to see more.`;
    }

    // Thanks
    if (has('thank', 'thanks')) {
      return "You're welcome! If you need anything else, just ask.";
    }

    // Bye
    if (has('bye', 'goodbye', 'see you')) {
      return "Thanks for visiting B & K Group. Have a great day!";
    }

    // Default: use product list to try to help
    const words = t.split(/\s+/).filter(w => w.length > 2);
    const matches = products.filter(p => {
      const search = [p.name, p.description, p.category].join(' ').toLowerCase();
      return words.some(w => search.includes(w));
    });
    if (matches.length > 0) {
      const slice = matches.slice(0, 4);
      const lines = slice.map(p => `• ${p.name} – ${formatPrice(p.price)}`);
      return `You might like these: ${lines.join('. ')}. Check the Shop for more.`;
    }

    return "I can help with: finding boots, sandals, vellies or slip-ons; how to order and get a quotation; contact details; or where to find Testimonials and Feedback. What do you need?";
  }

  function sendChatMessage() {
    const text = chatInput?.value?.trim();
    if (!text) return;
    chatInput.value = '';
    appendChatMessage(text, 'user');
    chatHistory.push({ role: 'user', content: text });
    setChatLoading(true);
    const reply = getLocalChatReply(text);
    appendChatMessage(reply, 'bot', false);
    chatHistory.push({ role: 'assistant', content: reply });
    speakText(reply);
    setChatLoading(false);
  }

  const ldEl = $('#storeJsonLd');
  if (ldEl && ldEl.textContent) {
    try {
      const data = JSON.parse(ldEl.textContent);
      data.url = `${window.location.origin}${window.location.pathname}`;
      ldEl.textContent = JSON.stringify(data);
    } catch {
      /* ignore */
    }
  }

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      const isHidden = chatPanel.hidden;
      chatPanel.hidden = !isHidden;
      chatToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden) {
        showChatWelcome();
        $('#chatInput')?.focus();
      } else {
        chatToggle.focus();
      }
    });
  }
  if (chatClose && chatPanel) {
    chatClose.addEventListener('click', () => {
      chatPanel.hidden = true;
      chatToggle?.setAttribute('aria-expanded', 'false');
      chatToggle?.focus();
    });
  }
  if (chatSend && chatInput) {
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !chatPanel || chatPanel.hidden) return;
    const lb = $('#imageLightbox');
    if (lb && !lb.hidden) return;
    chatPanel.hidden = true;
    chatToggle?.setAttribute('aria-expanded', 'false');
    chatToggle?.focus();
  });
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    document.addEventListener('DOMContentLoaded', () => window.speechSynthesis.getVoices());
  }
}

init();
