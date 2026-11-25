import { fetchOrders, updateOrderStatus } from "./auth.js";
import { whatsappLink } from "./checkout.js";
import { $, escapeHTML, money, formatDateTime, toast } from "./utils.js";

const STATUS_LABELS = {
  received: "Recebido",
  preparing: "Em preparação",
  ready: "Pronto",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const ALLOWED_STATUS = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function renderOrders() {
  try {
    const orders = await fetchOrders();

    $("ordersCount").textContent = orders.length;

    $("adminOrdersList").innerHTML = orders.length
      ? orders.map((o) => `
        <article class="order-card" data-id="${o.id}">
          <header>
            <div>
              <strong>#${escapeHTML(String(o.id))}</strong>
              <small>${formatDateTime(o.created_at)}</small>
            </div>

            <select data-act="status" aria-label="Status do pedido"
              ${ALLOWED_STATUS[o.status].length === 0 ? "disabled" : ""}>

              <option value="${o.status}" selected>
                ${STATUS_LABELS[o.status]}
              </option>

              ${ALLOWED_STATUS[o.status].map((s) => `
                <option value="${s}">
                  ${STATUS_LABELS[s]}
                </option>
              `).join("")}

            </select>
          </header>

          <p>
            <b>${escapeHTML(o.customer_name)}</b>
            · ${escapeHTML(o.customer_phone)}
            <br>
            ${escapeHTML(o.address || "Retirada no local")}
          </p>

          <ul>
            ${o.items.map((i) => `
              <li>
                ${i.quantity}× ${escapeHTML(i.product_name)}
              </li>
            `).join("")}
          </ul>

          ${o.notes ? `
            <p class="order-notes">
              Obs.: ${escapeHTML(o.notes)}
            </p>
          ` : ""}

          <footer>
            <span>
              ${o.payment === "pix" ? "Pix" : "Dinheiro"}
              ${o.change_for_cents
                ? ` (troco p/ ${money(o.change_for_cents / 100)})`
                : ""}
              · entrega ${money(o.fee_cents / 100)}
            </span>

            <strong>${money(o.total_cents / 100)}</strong>

            <a class="ghost-btn"
               target="_blank"
               rel="noopener"
               href="${whatsappLink(
                 o.customer_phone,
                 `Olá, ${o.customer_name}! Sobre o seu pedido #${o.id}...`
               )}">
              Chamar cliente
            </a>
          </footer>
        </article>
      `).join("")
      : `<div class="empty-state">
           Nenhum pedido registrado.
         </div>`;

  } catch (error) {
    $("ordersCount").textContent = "—";
    $("adminOrdersList").innerHTML = `
      <div class="empty-state">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

export function initOrders() {
  $("adminOrdersList").addEventListener("change", async (e) => {
    if (e.target.dataset.act !== "status") return;

    const id = e.target.closest(".order-card").dataset.id;
    const status = e.target.value;

    e.target.disabled = true;

    try {
      await updateOrderStatus(id, status);
      toast("Status atualizado");
    } catch (error) {
      toast(error.message);
    } finally {
      await renderOrders();
    }
  });

  $("refreshOrders").addEventListener("click", renderOrders);
}