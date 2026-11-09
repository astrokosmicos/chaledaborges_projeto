import { ORDER_STATUS } from "./config.js";
import { getOrders, saveOrders } from "./storage.js";
import { whatsappLink } from "./checkout.js";
import { $, escapeHTML, money, formatDateTime, toast } from "./utils.js";

export function renderOrders() {
  const orders = [...getOrders()].reverse();
  $("ordersCount").textContent = orders.length;

  $("adminOrdersList").innerHTML = orders.length
    ? orders
        .map(
          (o) => `
    <article class="order-card" data-id="${o.id}">
      <header>
        <div><strong>#${escapeHTML(o.id)}</strong> <small>${formatDateTime(o.createdAt)}</small></div>
        <select data-act="status" aria-label="Status do pedido">
          ${ORDER_STATUS.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </header>
      <p><b>${escapeHTML(o.customer.name)}</b> · ${escapeHTML(o.customer.phone)}<br>${escapeHTML(o.address)}</p>
      <ul>${o.items.map((i) => `<li>${i.qty}× ${escapeHTML(i.name)}</li>`).join("")}</ul>
      ${o.notes ? `<p class="order-notes">Obs.: ${escapeHTML(o.notes)}</p>` : ""}
      <footer>
        <span>${escapeHTML(o.payment)}${o.change ? ` (troco p/ ${money(o.change)})` : ""} · entrega ${money(o.fee)}</span>
        <strong>${money(o.total)}</strong>
        <a class="ghost-btn" target="_blank" rel="noopener"
           href="${whatsappLink(o.customer.phone, `Olá, ${o.customer.name}! Sobre o seu pedido #${o.id}…`)}">Chamar cliente</a>
      </footer>
    </article>`
        )
        .join("")
    : `<div class="empty-state">Nenhum pedido registrado neste navegador ainda.</div>`;
}

export function initOrders() {
  $("adminOrdersList").addEventListener("change", (e) => {
    if (e.target.dataset.act !== "status") return;
    const id = e.target.closest(".order-card").dataset.id;
    const orders = getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    order.status = e.target.value;
    saveOrders(orders);
    toast("Status atualizado");
  });
  $("refreshOrders").addEventListener("click", renderOrders);
}
