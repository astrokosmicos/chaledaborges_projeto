import { mountShell } from "./layout.js";
import { getState } from "./storage.js";
import { getCategories, itemCardHTML } from "./menu.js";
import { $, escapeHTML } from "./utils.js";

mountShell();

const { items } = getState();

const featured = items.filter((i) => i.featured && i.available !== false);
const grid = $("featuredGrid");
if (grid) {
  if (featured.length) grid.innerHTML = featured.map(itemCardHTML).join("");
  else $("featuredSection")?.setAttribute("hidden", "");
}
const chips = $("categoryShortcuts");
if (chips) {
  chips.innerHTML = getCategories(items)
    .map((c) => `<a href="cardapio.html?cat=${encodeURIComponent(c)}">${escapeHTML(c)}</a>`)
    .join("");
}
