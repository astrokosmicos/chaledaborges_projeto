import { getState } from "./storage.js";
import { escapeHTML } from "./utils.js";

export const getBairros = () => getState().bairros;
export const findBairro = (id) => getBairros().find((b) => b.id === id) || null;

export function bairroOptionsHTML(selectedId = "", placeholder = "Selecione seu bairro...") {
  return (
    `<option value="" disabled ${selectedId ? "" : "selected"}>${placeholder}</option>` +
    getBairros()
      .map((b) => `<option value="${escapeHTML(b.id)}" ${b.id === selectedId ? "selected" : ""}>${escapeHTML(b.name)}</option>`)
      .join("")
  );
}

export const slugify = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
