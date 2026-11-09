import { getCart, saveCart, getState } from "./storage.js";
import { $, money, escapeHTML, toast } from "./utils.js";

export function getCartRows() {
  const items = getState().items;
  return getCart()
    .map((line) => {
      const item = items.find((i) => i.id === line.id);
      return item && item.available !== false ? { ...item, qty: line.qty } : null;
    })
    .filter(Boolean);
}

export const cartSubtotal = () => getCartRows().reduce((sum, r) => sum + r.price * r.qty, 0);
export const cartCount = () => getCartRows().reduce((sum, r) => sum + r.qty, 0);

export function addToCart(id) {
  const item = getState().items.find((i) => i.id === id);
  if (!item || item.available === false) return;
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  line ? line.qty++ : cart.push({ id, qty: 1 });
  saveCart(cart);
  renderCart();
  toast(`${item.name} adicionado ao carrinho`);
}

export function changeQty(id, delta) {
  let cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((l) => l.id !== id);
  saveCart(cart);
  renderCart();
}

export function clearCart() {
  saveCart([]);
  renderCart();
}

export function renderCart() {
  const count = $("cartCount");
  if (count) count.textContent = cartCount();

  const list = $("cartItems");
  if (!list) return;
  const rows = getCartRows();

  list.innerHTML = rows.length
    ? rows
        .map(
          (r) => `
      <div class="cart-row">
        <div>
          <h4>${escapeHTML(r.name)}</h4>
          <small>${money(r.price)} cada</small>
          <div class="qty">
            <button type="button" data-qty="${r.id}" data-delta="-1" aria-label="Diminuir">−</button>
            <b>${r.qty}</b>
            <button type="button" data-qty="${r.id}" data-delta="1" aria-label="Aumentar">+</button>
          </div>
        </div>
        <strong>${money(r.price * r.qty)}</strong>
      </div>`
        )
        .join("")
    : `<div class="empty-state">Seu carrinho está vazio.<br>Que tal escolher algo gostoso?</div>`;

  $("cartSubtotal").textContent = money(cartSubtotal());
  $("checkoutBtn").disabled = rows.length === 0;
}

export function openCart() {
  $("overlay").hidden = false;
  $("cartDrawer").classList.add("open");
  $("cartDrawer").setAttribute("aria-hidden", "false");
}

export function closeCart() {
  $("overlay").hidden = true;
  $("cartDrawer").classList.remove("open");
  $("cartDrawer").setAttribute("aria-hidden", "true");
}
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) return addToCart(Number(add.dataset.add));
    const qty = e.target.closest("[data-qty]");
    if (qty) return changeQty(Number(qty.dataset.qty), Number(qty.dataset.delta));
  });

  const cartBtn = $("cartBtn");
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  document.querySelectorAll('[data-close="cartDrawer"]').forEach((b) => b.addEventListener("click", closeCart));
  $("overlay").addEventListener("click", closeCart);
  renderCart();
}
