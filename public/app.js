const API = '/api';

let products = [];
let cart = [];

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => el.querySelectorAll(sel);

function formatPrice(amount) {
  return 'ZAR ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

function showPage(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const page = $(`#page-${pageId}`);
  const link = $(`.nav-link[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (link) link.classList.add('active');
  if (pageId === 'shop') renderProducts();
  if (pageId === 'cart') renderCart();
  if (pageId === 'checkout') renderCheckout();
  if (pageId === 'feedback') initFeedbackStars();
}

function renderProducts() {
  const grid = $('#productGrid');
  const category = $('#categoryFilter')?.value || '';
  if (!grid) return;
  const filtered = category
    ? products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase())
    : products;
  grid.innerHTML = filtered.map((p, i) => {
    const orig = p.originalPrice ? `<span class="product-original">${formatPrice(p.originalPrice)}</span>` : '';
    const sizes = p.sizes && p.sizes.length ? p.sizes : [];
    const sizeOptions = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
    const sizeSelect = sizes.length ? `
      <div class="product-size-wrap">
        <label for="size-${p.id}">Size</label>
        <select id="size-${p.id}" class="product-size" data-id="${p.id}" aria-label="Size">${sizeOptions}</select>
      </div>` : '';
    return `
      <li class="product-card" data-id="${p.id}" style="animation-delay: ${i * 0.06}s">
        <div class="product-image-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="product-price-wrap">
            <span class="product-price">${formatPrice(p.price)}</span>
            ${orig}
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
}

function getSelectedSize(productId) {
  const sel = $(`.product-size[data-id="${productId}"]`);
  return sel ? String(sel.value) : null;
}

function handleProductGridClick(e) {
  const grid = $('#productGrid');
  const btn = e.target.closest('[data-action][data-id]');
  if (!btn || !grid) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const product = products.find(p => p.id === id);
  if (!product) return;
  const size = getSelectedSize(id);
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
      next = cart.map(i => i.id === product.id && String(i.size || '') === sizeStr ? { ...i, quantity: qty } : i);
    }
  } else {
    if (delta <= 0) return;
    next = [...cart, { ...product, quantity: 1, size: sizeStr || undefined }];
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

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cart][data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    const size = btn.dataset.size != null ? String(btn.dataset.size) : null;
    const action = btn.dataset.cart;
    const product = products.find(p => p.id === id) || cart.find(i => i.id === id && String(i.size || '') === String(size || ''));
    if (!product) return;
    const cartKey = (i) => i.id === id && String(i.size || '') === String(size || '');
    if (action === 'remove') setCart(cart.filter(i => !cartKey(i)));
    else if (action === 'dec') addToCart(product, -1, size);
    else if (action === 'inc') addToCart(product, 1, size);
    renderCart();
  });
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
  try {
    const res = await fetch(`${API}/products`);
    products = await res.json();
  } catch (err) {
    console.error('Failed to load products', err);
    products = [];
  }
}

function init() {
  cart = getCart();
  updateCartCount();

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (link) {
      e.preventDefault();
      showPage(link.dataset.page);
    }
  });

  $('#categoryFilter')?.addEventListener('change', () => renderProducts());
  $('#productGrid')?.addEventListener('click', handleProductGridClick);

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
      form.hidden = true;
      $('#orderSuccess').hidden = false;
      setCart([]);
    } catch (err) {
      alert(err.message || 'Could not generate quotation. Please try again.');
    }
    if (submitBtn) submitBtn.disabled = false;
  });

  loadProducts().then(() => {
    renderProducts();
  });

  // Feedback: star rating
  function initFeedbackStars() {
    const container = $('.rating-stars');
    const input = $('#feedbackRating');
    if (!container || !input) return;
    const updateStars = (rating) => {
      const r = Math.min(5, Math.max(1, Number(rating) || 5));
      input.value = r;
      $$('.star-btn', container).forEach((btn, i) => {
        btn.classList.toggle('filled', i < r);
      });
    };
    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => updateStars(btn.dataset.rating));
    });
    updateStars(input.value);
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
    const rating = parseInt(form.rating?.value, 10) || 5;
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
      if (msgEl) {
        msgEl.hidden = false;
        msgEl.className = 'feedback-message success';
        msgEl.textContent = 'Thank you! Your feedback has been sent. We appreciate it.';
      }
      form.reset();
      $('#feedbackRating').value = '5';
      initFeedbackStars();
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
    if (has('testimonial', 'reviews', 'feedback', 'leave feedback', 'terms', 'conditions')) {
      if (has('testimonial', 'reviews')) return "You can read customer testimonials by clicking “Testimonials” in the top menu.";
      if (has('feedback', 'leave feedback')) return "Click “Feedback” in the menu to send us your feedback or suggestions.";
      if (has('terms', 'conditions')) return "Click “Terms & Conditions” at the bottom of the page to read our terms.";
    }
    if (has('shop', 'products', 'browse', 'where to buy', 'navigate', 'menu')) {
      return "Use the menu at the top: Shop shows all shoes, Testimonials has customer reviews, Feedback lets you send us a message, and Cart is where you see your items and get a quotation.";
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

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      const isHidden = chatPanel.hidden;
      chatPanel.hidden = !isHidden;
      if (isHidden) showChatWelcome();
    });
  }
  if (chatClose && chatPanel) {
    chatClose.addEventListener('click', () => { chatPanel.hidden = true; });
  }
  if (chatSend && chatInput) {
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
    });
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    document.addEventListener('DOMContentLoaded', () => window.speechSynthesis.getVoices());
  }
}

init();
