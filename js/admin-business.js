import { WEEKDAYS } from "./config.js";
import { getState, saveState } from "./storage.js";
import { $, toast, digits } from "./utils.js";

export function renderBusiness() {
  const { business } = getState();
  $("adminName").value = business.name;
  $("adminTagline").value = business.tagline;
  $("adminAbout").value = business.about;
  $("adminEta").value = business.eta;
  $("adminWhatsapp").value = business.whatsapp;
  $("adminOpen").value = business.schedule.open;
  $("adminClose").value = business.schedule.close;

  $("adminDays").innerHTML = WEEKDAYS.map(
    (name, day) => `
    <label class="check">
      <input type="checkbox" value="${day}" ${business.schedule.days.includes(day) ? "checked" : ""}>
      ${name.slice(0, 3)}
    </label>`
  ).join("");
}

export function initBusiness() {
  $("saveBusiness").addEventListener("click", () => {
    const days = [...document.querySelectorAll("#adminDays input:checked")].map((i) => Number(i.value));
    const open = $("adminOpen").value;
    const close = $("adminClose").value;
    if (open && close && open >= close) return toast("O horário de abertura deve ser antes do fechamento.");

    const state = getState();
    state.business = {
      ...state.business,
      name: $("adminName").value.trim() || "Chalé da Borges",
      tagline: $("adminTagline").value.trim(),
      about: $("adminAbout").value.trim(),
      eta: $("adminEta").value.trim(),
      whatsapp: digits($("adminWhatsapp").value),
      schedule: { days, open: open || "15:00", close: close || "22:00" },
    };
    saveState();
    toast("Informações salvas");
  });
}
