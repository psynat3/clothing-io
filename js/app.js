/* clothing.io, progress 1
   One shared script for every page.
   Products are hard-coded for now. The cart and wishlist are saved in
   localStorage so they carry over when you move between pages. */

const CART_KEY = "clothingio.cart";
const WISH_KEY = "clothingio.wishlist";
const MAX_QTY = 10;

const PRODUCTS = [
  { id: "classic-tee", name: "Classic Tee", type: "Tee", price: 24, color: "#d9d4c7", ink: "#26251f" },
  { id: "everyday-hoodie", name: "Everyday Hoodie", type: "Hoodie", price: 58, color: "#3a3f4a", ink: "#ffffff" },
  { id: "straight-jeans", name: "Straight Jeans", type: "Jeans", price: 64, color: "#2f4a8a", ink: "#ffffff" },
  { id: "denim-jacket", name: "Denim Jacket", type: "Jacket", price: 89, color: "#6f8fbf", ink: "#10182b" },
  { id: "canvas-sneakers", name: "Canvas Sneakers", type: "Shoes", price: 52, color: "#b8442f", ink: "#ffffff" },
  { id: "dad-cap", name: "Dad Cap", type: "Cap", price: 22, color: "#4b6b57", ink: "#ffffff" },
  { id: "wool-scarf", name: "Wool Scarf", type: "Scarf", price: 28, color: "#c9a24b", ink: "#2a2110" },
  { id: "summer-dress", name: "Summer Dress", type: "Dress", price: 46, color: "#e3b7b0", ink: "#3b1f1b" },
];

/* ---------- small helpers ---------- */

const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const money = (n) => `$${n.toFixed(2)}`;
const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function readStore(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* storage is blocked, the page still works until you leave it */
  }
}

/* ---------- state ---------- */

function loadCart() {
  return readStore(CART_KEY)
    .filter((item) => item && findProduct(item.id) && Number.isInteger(item.qty) && item.qty > 0)
    .map((item) => ({ id: item.id, qty: Math.min(item.qty, MAX_QTY) }));
}

function loadWishlist() {
  const ids = readStore(WISH_KEY).filter((id) => findProduct(id));
  return [...new Set(ids)];
}

let cart = loadCart();
let wishlist = loadWishlist();

const saveCart = () => writeStore(CART_KEY, cart);
const saveWishlist = () => writeStore(WISH_KEY, wishlist);
const isSaved = (id) => wishlist.includes(id);
const cartCount = () => cart.reduce((sum, item) => sum + item.qty, 0);
const cartTotal = () => cart.reduce((sum, item) => sum + item.qty * findProduct(item.id).price, 0);

/* ---------- actions ---------- */

function addToCart(id) {
  const line = cart.find((item) => item.id === id);
  if (line) {
    if (line.qty >= MAX_QTY) {
      return false;
    }
    line.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  return true;
}

function changeQty(id, delta) {
  const line = cart.find((item) => item.id === id);
  if (!line) {
    return;
  }
  line.qty = Math.max(1, Math.min(line.qty + delta, MAX_QTY));
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter((savedId) => savedId !== id);
  saveWishlist();
}

function toggleWishlist(id) {
  if (isSaved(id)) {
    removeFromWishlist(id);
    return false;
  }
  wishlist.push(id);
  saveWishlist();
  return true;
}

/* ---------- html builders ---------- */

const swatchHtml = (p, small = false) =>
  `<div class="swatch${small ? " sm" : ""}" style="background:${p.color};color:${p.ink}" aria-hidden="true"><span>${esc(p.type)}</span></div>`;

function cardHtml(p, level) {
  const saved = isSaved(p.id);
  return `
    <article class="card">
      ${swatchHtml(p)}
      <h${level}>${esc(p.name)}</h${level}>
      <p class="price">${money(p.price)}</p>
      <div class="actions">
        <button type="button" class="btn" data-action="add-cart" data-id="${p.id}">Add to cart</button>
        <button type="button" class="btn btn-ghost" data-action="toggle-wish" data-id="${p.id}">${saved ? "&#9829; Saved" : "&#9825; Save"}</button>
      </div>
    </article>`;
}

function wishRowHtml(p) {
  return `
    <li class="row">
      ${swatchHtml(p, true)}
      <div class="row-info">
        <h2>${esc(p.name)}</h2>
        <p class="price">${money(p.price)}</p>
      </div>
      <div class="row-actions">
        <button type="button" class="btn" data-action="move-to-cart" data-id="${p.id}">Move to cart</button>
        <button type="button" class="btn btn-ghost" data-action="remove-wish" data-id="${p.id}">Remove</button>
      </div>
    </li>`;
}

function cartRowHtml(line) {
  const p = findProduct(line.id);
  const name = esc(p.name);
  return `
    <li class="row">
      ${swatchHtml(p, true)}
      <div class="row-info">
        <h2>${name}</h2>
        <p class="price">${money(p.price)} each</p>
      </div>
      <div class="row-actions">
        <div class="qty" role="group" aria-label="Quantity for ${name}">
          <button type="button" data-action="qty-down" data-id="${p.id}" aria-label="Decrease quantity of ${name}" ${line.qty <= 1 ? "disabled" : ""}>&minus;</button>
          <span class="qty-num">${line.qty}</span>
          <button type="button" data-action="qty-up" data-id="${p.id}" aria-label="Increase quantity of ${name}" ${line.qty >= MAX_QTY ? "disabled" : ""}>+</button>
        </div>
        <p class="line-total">${money(line.qty * p.price)}</p>
        <button type="button" class="btn btn-ghost" data-action="remove-cart" data-id="${p.id}">Remove</button>
      </div>
    </li>`;
}

/* ---------- page renderers ---------- */

function renderHome() {
  const grid = document.getElementById("featured-grid");
  grid.innerHTML = PRODUCTS.slice(0, 4).map((p) => cardHtml(p, 3)).join("");
}

function renderShop() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = PRODUCTS.map((p) => cardHtml(p, 2)).join("");
}

function renderWishlist() {
  const box = document.getElementById("wishlist-content");
  if (wishlist.length === 0) {
    box.innerHTML = `<p class="empty">Nothing saved yet. Select Save on any item in the <a href="shop.html" title="Go to the shop">shop</a> and it will show up here.</p>`;
    return;
  }
  box.innerHTML = `<ul class="rows">${wishlist.map((id) => wishRowHtml(findProduct(id))).join("")}</ul>`;
}

function renderCart() {
  const box = document.getElementById("cart-content");
  if (cart.length === 0) {
    box.innerHTML = `<p class="empty">Your cart is empty. Find something you like in the <a href="shop.html" title="Go to the shop">shop</a>.</p>`;
    return;
  }
  const items = cartCount();
  box.innerHTML = `
    <div class="cart-layout">
      <ul class="rows">${cart.map(cartRowHtml).join("")}</ul>
      <section class="summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Order summary</h2>
        <p class="summary-line"><span>Items</span><span>${items}</span></p>
        <p class="summary-line total"><span>Subtotal</span><span>${money(cartTotal())}</span></p>
        <p class="note">Shipping and tax are calculated at checkout.</p>
        <div class="summary-actions">
          <button type="button" class="btn" data-action="checkout">Check out</button>
          <button type="button" class="btn btn-ghost" data-action="clear-cart">Clear cart</button>
        </div>
      </section>
    </div>`;
}

function updateBadges() {
  const cartBadge = document.getElementById("cart-count");
  const wishBadge = document.getElementById("wishlist-count");
  if (cartBadge) {
    cartBadge.textContent = cartCount();
    cartBadge.hidden = cartCount() === 0;
  }
  if (wishBadge) {
    wishBadge.textContent = wishlist.length;
    wishBadge.hidden = wishlist.length === 0;
  }
}

function render() {
  updateBadges();
  const page = document.body.dataset.page;
  if (page === "home") {
    renderHome();
  } else if (page === "shop") {
    renderShop();
  } else if (page === "wishlist") {
    renderWishlist();
  } else if (page === "cart") {
    renderCart();
  }
}

/* ---------- status message (read out by screen readers too) ---------- */

let statusTimer;

function say(message) {
  const box = document.getElementById("status");
  if (!box) {
    return;
  }
  box.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    box.textContent = "";
  }, 2500);
}

/* ---------- clicks ---------- */

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;
  const product = id ? findProduct(id) : null;

  if (action === "add-cart" && product) {
    if (addToCart(id)) {
      say(`${product.name} added to cart.`);
    } else {
      say(`You can order up to ${MAX_QTY} of each item.`);
    }
  } else if (action === "toggle-wish" && product) {
    say(toggleWishlist(id) ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`);
  } else if (action === "move-to-cart" && product) {
    if (addToCart(id)) {
      removeFromWishlist(id);
      say(`${product.name} moved to your cart.`);
    } else {
      say(`You can order up to ${MAX_QTY} of each item.`);
    }
  } else if (action === "remove-wish" && product) {
    removeFromWishlist(id);
    say(`${product.name} removed from your wishlist.`);
  } else if (action === "qty-up" && product) {
    changeQty(id, 1);
  } else if (action === "qty-down" && product) {
    changeQty(id, -1);
  } else if (action === "remove-cart" && product) {
    removeFromCart(id);
    say(`${product.name} removed from your cart.`);
  } else if (action === "clear-cart") {
    cart = [];
    saveCart();
    say("Your cart is empty.");
  } else if (action === "checkout") {
    say("Checkout is not built yet. It is coming in a later update.");
    return;
  } else {
    return;
  }

  render();

  /* keep keyboard focus on the same button after the page redraws */
  const selector = id ? `[data-action="${action}"][data-id="${id}"]` : `[data-action="${action}"]`;
  const same = document.querySelector(selector);
  if (same) {
    same.focus();
  }
});

/* if the cart or wishlist changes in another tab, catch up */
window.addEventListener("storage", () => {
  cart = loadCart();
  wishlist = loadWishlist();
  render();
});

render();
