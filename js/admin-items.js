import { MENU_CATEGORIES } from "./menu-data.js";
import {
  fetchProducts,
  createProduct,
  updateProduct
} from "./auth.js";

import { $, escapeHTML, toast } from "./utils.js";

let initialized = false;

function categoryOptions(selected = "") {
  const categories = [...new Set([
    ...MENU_CATEGORIES,
    ...(selected ? [selected] : [])
  ])];

  return categories.map(category => `
    <option value="${escapeHTML(category)}"
      ${category === selected ? "selected" : ""}>
      ${escapeHTML(category)}
    </option>
  `).join("");
}

function readPrice(value) {
  const price = Math.round(Number(value) * 100);

  if (
    value.trim() === "" ||
    !Number.isInteger(price) ||
    price < 0 ||
    price > 10000000
  ) {
    throw new Error("Informe um preço válido.");
  }

  return price;
}

export async function renderItems() {
  const list = $("adminItemsList");

  try {
    const products = await fetchProducts();

    const categories = [...new Set([
      ...MENU_CATEGORIES,
      ...products.map(product => product.category)
    ])];

    list.innerHTML = categories.map(category => {
      const items = products.filter(
        product => product.category === category
      );

      if (items.length === 0) return "";

      return `
        <section class="admin-category">

          <h3 class="admin-category-title">
            ${escapeHTML(category)}
          </h3>

          ${items.map(product => `
            <div class="admin-item-row"
              data-id="${Number(product.id)}">

              <label>Nome
                <input data-field="name"
                  value="${escapeHTML(product.name)}">
              </label>

              <label>Categoria
                <select data-field="category">
                  ${categoryOptions(product.category)}
                </select>
              </label>

              <label>Preço (R$)
                <input data-field="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${(Number(product.price_cents) / 100).toFixed(2)}">
              </label>

              <label>Descrição
                <textarea data-field="description">${escapeHTML(product.description || "")}</textarea>
              </label>

              <label>
                <input data-field="active"
                  type="checkbox"
                  ${Number(product.active) === 1 ? "checked" : ""}>
                Produto disponível
              </label>

              <button type="button"
                class="primary-btn"
                data-action="save">
                Salvar alterações
              </button>

            </div>
          `).join("")}

        </section>
      `;
    }).join("");

  } catch (error) {
    list.textContent = error.message;
  }
}
export function initItems() {
  if (initialized) return;
  initialized = true;

  const list = $("adminItemsList");
  const category = $("newItemCategory");
  const addButton = $("addItem");

  category.innerHTML = categoryOptions();

  addButton.addEventListener("click", async () => {
    addButton.disabled = true;

    try {
      const name = $("newItemName").value.trim();

      if (!name) {
        throw new Error("Informe o nome do produto.");
      }

      const description = $("newItemDescription");

      await createProduct({
        name,
        category: category.value,
        description: description
          ? description.value.trim()
          : "",
        price_cents: readPrice(
          $("newItemPrice").value
        )
      });

      $("newItemName").value = "";
      $("newItemPrice").value = "";

      if (description) {
        description.value = "";
      }

      toast("Produto cadastrado com sucesso!");
      await renderItems();

    } catch (error) {
      toast(error.message);
    } finally {
      addButton.disabled = false;
    }
  });

  list.addEventListener("click", async event => {
    const button = event.target.closest(
      '[data-action="save"]'
    );

    if (!button) return;

    const row = button.closest("[data-id]");

    button.disabled = true;

    try {
      const name = row.querySelector(
        '[data-field="name"]'
      ).value.trim();

      if (!name) {
        throw new Error("Informe o nome do produto.");
      }

      await updateProduct(Number(row.dataset.id), {
        name,

        category: row.querySelector(
          '[data-field="category"]'
        ).value,

        description: row.querySelector(
          '[data-field="description"]'
        ).value.trim(),

        price_cents: readPrice(
          row.querySelector(
            '[data-field="price"]'
          ).value
        ),

        active: row.querySelector(
          '[data-field="active"]'
        ).checked
      });

      toast("Produto atualizado com sucesso!");
      await renderItems();

    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
}