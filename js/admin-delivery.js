import { getState, saveState } from "./storage.js";
import { slugify } from "./delivery.js";
import { $, escapeHTML, toast } from "./utils.js";

export function renderDelivery() {
  $("adminBairrosList").innerHTML = getState()
    .bairros.map(
      (b) => `
    <div class="admin-bairro-row" data-id="${escapeHTML(b.id)}">
      <input data-f="name" value="${escapeHTML(b.name)}" aria-label="Bairro">
      <input data-f="fee" type="number" min="0" step="0.5" value="${b.fee}" aria-label="Taxa (R$)">
      <input data-f="min" type="number" min="1" value="${b.min}" aria-label="Tempo mínimo">
      <input data-f="max" type="number" min="1" value="${b.max}" aria-label="Tempo máximo">
      <button class="danger-btn" type="button" data-act="delete">Excluir</button>
    </div>`
    )
    .join("");
}

export function initDelivery() {
  const list = $("adminBairrosList");

  list.addEventListener("change", (e) => {
    const row = e.target.closest(".admin-bairro-row");
    const field = e.target.dataset.f;
    if (!row || !field) return;
    const bairro = getState().bairros.find((b) => b.id === row.dataset.id);
    if (!bairro) return;
    bairro[field] = field === "name" ? e.target.value.trim() || bairro.name : Math.max(0, Number(e.target.value) || 0);
    saveState();
    toast("Bairro atualizado");
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-act="delete"]');
    if (!btn) return;
    const id = btn.closest(".admin-bairro-row").dataset.id;
    const state = getState();
    if (state.bairros.length <= 1) return toast("Mantenha ao menos um bairro.");
    state.bairros = state.bairros.filter((b) => b.id !== id);
    saveState();
    renderDelivery();
    toast("Bairro removido");
  });

  $("addBairro").addEventListener("click", () => {
    const name = $("newBairroName").value.trim();
    if (!name) return toast("Informe o nome do bairro.");
    const state = getState();
    let id = slugify(name);
    if (state.bairros.some((b) => b.id === id)) id += `_${Date.now().toString(36)}`;
    state.bairros.push({
      id,
      name,
      fee: Number($("newBairroFee").value) || 0,
      min: Number($("newBairroMin").value) || 30,
      max: Number($("newBairroMax").value) || 50,
    });
    saveState();
    for (const f of ["newBairroName", "newBairroFee", "newBairroMin", "newBairroMax"]) $(f).value = "";
    renderDelivery();
    toast("Bairro adicionado");
  });
}
