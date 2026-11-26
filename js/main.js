import { mountShell } from "./layout.js";
import { syncProducts } from "./storage.js";
import { renderCart } from "./cart.js";
import { getCategories, itemCardHTML } from "./menu.js";
import { $, escapeHTML } from "./utils.js";

mountShell();

try {
  const items = await syncProducts();

  const featured = items.filter(
    i => i.featured && i.available !== false
  );

  const grid = $("featuredGrid");

  if (grid) {
    if (featured.length) {
      grid.innerHTML = featured.map(itemCardHTML).join("");
    } else {
      $("featuredSection")?.setAttribute("hidden", "");
    }
  }

  const chips = $("categoryShortcuts");

  if (chips) {
    chips.innerHTML = getCategories(items)
      .map(c => `
        <a href="cardapio.html?cat=${encodeURIComponent(c)}">
          ${escapeHTML(c)}
        </a>
      `)
      .join("");
  }

  renderCart();

} catch (error) {
  console.error("Erro ao carregar produtos:", error);
  $("featuredSection")?.setAttribute("hidden", "");

  const chips = $("categoryShortcuts");

  if (chips) {
    chips.textContent = "Não foi possível carregar as categorias.";
  }
}