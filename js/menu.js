import { MENU_CATEGORIES } from "./menu-data.js";
import { escapeHTML, money, normalize } from "./utils.js";

export function getCategories(items) {
  const present = new Set(items.map((i) => i.cat));
  const ordered = MENU_CATEGORIES.filter((c) => present.has(c));
  const extras = [...present].filter((c) => !MENU_CATEGORIES.includes(c));
  return [...ordered, ...extras];
}

export function filterItems(items, { cat = "Todos", query = "" } = {}) {
  const q = normalize(query.trim());
  return items.filter(
    (i) =>
      (cat === "Todos" || i.cat === cat) &&
      (!q || normalize(`${i.name} ${i.desc} ${i.cat}`).includes(q))
  );
}

export function itemCardHTML(item) {
  const available = item.available !== false;
  const tags = (item.tags || []).map((t) => `<span class="tag-label">${escapeHTML(t)}</span>`).join("");
  return `
    <article class="menu-card ${available ? "" : "sold-out"}">
      <div class="menu-card-content">
        <div class="menu-card-top">
          <span class="category-label">${escapeHTML(item.cat)}</span>
          <span class="labels">
            ${tags}
            ${item.featured ? '<span class="featured-label">mais vendida</span>' : ""}
          </span>
        </div>
        <h3>${escapeHTML(item.name)}</h3>
        ${item.desc ? `<p>${escapeHTML(item.desc)}</p>` : ""}
      </div>
      <div class="menu-card-bottom">
        <strong class="price">${money(item.price)}</strong>
        ${
          available
            ? `<button class="add-btn" type="button" data-add="${item.id}">+ Adicionar</button>`
            : `<button class="add-btn" type="button" disabled>Esgotado</button>`
        }
      </div>
    </article>`;
}
