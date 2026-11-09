import { mountShell } from "./layout.js";
import { getState } from "./storage.js";
import { getCategories, filterItems, itemCardHTML } from "./menu.js";
import { MENU_FOOTNOTE } from "./menu-data.js";
import { $, escapeHTML } from "./utils.js";

mountShell();

const params = new URLSearchParams(location.search);
const { items } = getState();
const categories = ["Todos", ...getCategories(items)];

let activeCat = categories.includes(params.get("cat")) ? params.get("cat") : "Todos";
$("searchInput").value = params.get("q") || "";

function renderTabs() {
  $("categoryTabs").innerHTML = categories
    .map(
      (c) =>
        `<button type="button" class="${c === activeCat ? "active" : ""}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`
    )
    .join("");
}

function renderMenu() {
  const result = filterItems(items, { cat: activeCat, query: $("searchInput").value });
  $("menuGrid").innerHTML = result.map(itemCardHTML).join("");
  $("emptyState").hidden = result.length > 0;
  $("menuFootnote").hidden = !result.some((i) => i.desc.includes("*"));
}

$("menuFootnote").textContent = MENU_FOOTNOTE;

$("categoryTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cat]");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderTabs();
  renderMenu();
});

$("searchInput").addEventListener("input", renderMenu);

renderTabs();
renderMenu();
