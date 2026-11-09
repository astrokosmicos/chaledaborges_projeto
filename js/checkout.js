import { PAYMENT_METHODS } from "./config.js";
import { getState, getOrders, saveOrders, getSavedBairro, saveBairro } from "./storage.js";
import { getCartRows, cartSubtotal, clearCart, closeCart } from "./cart.js";
import { findBairro, bairroOptionsHTML } from "./delivery.js";
import { currentUser } from "./auth.js";
import { isOpenNow, nextOpeningText } from "./business.js";
import { $, money, escapeHTML, digits, maskPhone, bindPhoneMask, toast } from "./utils.js";

function showError(message) {
  const el = $("checkoutError");
  el.textContent = message || "";
  el.hidden = !message;
}

function updateTotals() {
  const subtotal = cartSubtotal();
  const bairro = findBairro($("checkoutBairro").value);
  const fee = bairro ? bairro.fee : null;
  $("checkoutSubtotal").textContent = money(subtotal);
  $("checkoutFee").textContent = bairro ? (fee === 0 ? "Grátis" : money(fee)) : "Escolha o bairro";
  $("checkoutEta").textContent = bairro ? `(${bairro.min}–${bairro.max} min)` : "";
  $("checkoutTotal").textContent = money(subtotal + (fee || 0));
}

function openCheckout() {
  const rows = getCartRows();
  if (!rows.length) return toast("Seu carrinho está vazio.");

  $("checkoutSummary").innerHTML = rows
    .map((r) => `<div class="summary-line"><span>${r.qty}× ${escapeHTML(r.name)}</span><b>${money(r.price * r.qty)}</b></div>`)
    .join("");
  const user = currentUser();
  if (user) {
    if (!$("checkoutName").value) $("checkoutName").value = user.name;
    if (!$("checkoutPhone").value) $("checkoutPhone").value = maskPhone(user.phone);
  }

  $("checkoutBairro").innerHTML = bairroOptionsHTML(getSavedBairro());
  $("paymentMethod").innerHTML = PAYMENT_METHODS.map((m) => `<option>${escapeHTML(m)}</option>`).join("");
  $("changeWrap").hidden = true;

  const notice = $("closedNotice");
  notice.hidden = isOpenNow();
  if (!notice.hidden) {
    notice.textContent = `Estamos fechados no momento. Você pode enviar o pedido e ele será atendido quando abrirmos (${nextOpeningText()}).`;
  }

  $("checkoutForm").hidden = false;
  $("checkoutDone").hidden = true;
  showError("");
  updateTotals();
  closeCart();
  $("checkoutModal").hidden = false;
}

function closeCheckout() {
  $("checkoutModal").hidden = true;
}

function buildWhatsAppText(order) {
  const lines = [
    `*Novo pedido #${order.id}* — ${getState().business.name}`,
    "",
    ...order.items.map((i) => `${i.qty}× ${i.name} — ${money(i.price * i.qty)}`),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Entrega (${order.bairro}): ${money(order.fee)}`,
    `*Total: ${money(order.total)}*`,
    "",
    `Cliente: ${order.customer.name} — ${order.customer.phone}`,
    `Endereço: ${order.address}`,
    `Pagamento: ${order.payment}${order.change ? ` (troco para ${money(order.change)})` : ""}`,
  ];
  if (order.notes) lines.push(`Obs.: ${order.notes}`);
  return lines.join("\n");
}

export function whatsappLink(number, text) {
  let n = digits(number);
  if (n.length === 10 || n.length === 11) n = `55${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

function placeOrder(e) {
  e.preventDefault();
  const rows = getCartRows();
  if (!rows.length) return showError("Seu carrinho está vazio.");

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const street = $("checkoutStreet").value.trim();
  const bairro = findBairro($("checkoutBairro").value);

  if (!name) return showError("Informe seu nome.");
  if (digits(phone).length < 10) return showError("Informe um telefone com DDD.");
  if (!bairro) return showError("Escolha o bairro de entrega.");
  if (!street) return showError("Informe a rua e o número.");

  const method = $("paymentMethod").value;
  const subtotal = cartSubtotal();
  const complement = $("checkoutComplement").value.trim();
  const user = currentUser();

  const order = {
    id: Date.now().toString(36).slice(-5).toUpperCase(),
    createdAt: new Date().toISOString(),
    status: "novo",
    userId: user?.id ?? null,
    customer: { name, phone },
    bairro: bairro.name,
    address: [street, complement, bairro.name].filter(Boolean).join(" — "),
    items: rows.map((r) => ({ id: r.id, name: r.name, price: r.price, qty: r.qty })),
    subtotal,
    fee: bairro.fee,
    total: subtotal + bairro.fee,
    payment: method,
    change: method === "Dinheiro" ? Number(String($("checkoutChange").value).replace(",", ".")) || 0 : 0,
    notes: $("checkoutNotes").value.trim(),
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  saveBairro(bairro.id);
  clearCart();

  const number = getState().business.whatsapp;
  $("checkoutForm").hidden = true;
  const done = $("checkoutDone");
  done.hidden = false;
  done.innerHTML = `
    <span class="eyebrow">pedido #${order.id}</span>
    <h2>Pedido registrado!</h2>
    <p>Total de <b>${money(order.total)}</b> · entrega estimada em ${bairro.min}–${bairro.max} min.</p>
    ${
      number
        ? `<p>Para a cozinha receber, envie o pedido pelo WhatsApp:</p>
           <a class="primary-btn full" target="_blank" rel="noopener" href="${whatsappLink(number, buildWhatsAppText(order))}">Enviar pelo WhatsApp</a>`
        : `<p class="mini-note">Neste protótipo ainda não há um WhatsApp configurado para receber pedidos (configure em Área da dona › Estabelecimento).</p>`
    }
    <button class="ghost-btn full" type="button" data-close="checkoutModal">Fechar</button>`;
}

export function initCheckout() {
  $("checkoutBtn").addEventListener("click", openCheckout);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("checkoutBairro").addEventListener("change", updateTotals);
  $("paymentMethod").addEventListener("change", () => {
    $("changeWrap").hidden = $("paymentMethod").value !== "Dinheiro";
  });
  bindPhoneMask($("checkoutPhone"));

  $("checkoutModal").addEventListener("click", (e) => {
    if (e.target === $("checkoutModal") || e.target.closest('[data-close="checkoutModal"]')) closeCheckout();
  });
}
