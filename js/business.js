

import { WEEKDAYS } from "./config.js";
import { getState } from "./storage.js";
import { $ } from "./utils.js";

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

const shortTime = (hhmm) => {
  const [h, m] = String(hhmm).split(":");
  return Number(m) ? `${Number(h)}h${m}` : `${Number(h)}h`;
};

export function isOpenNow(schedule = getState().business.schedule, now = new Date()) {
  if (!schedule.days.includes(now.getDay())) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= toMinutes(schedule.open) && minutes < toMinutes(schedule.close);
}

export function formatHours(schedule = getState().business.schedule) {
  const days = [...schedule.days].sort((a, b) => a - b);
  if (!days.length) return "Consulte nossos horários";
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const label =
    days.length >= 3 && contiguous
      ? `${WEEKDAYS[days[0]]} a ${WEEKDAYS[days.at(-1)].toLowerCase()}`
      : days.map((d) => WEEKDAYS[d]).join(", ");
  return `${label} · ${shortTime(schedule.open)}–${shortTime(schedule.close)}`;
}

export function formatClosedDays(schedule = getState().business.schedule) {
  const closed = [0, 1, 2, 3, 4, 5, 6].filter((d) => !schedule.days.includes(d));
  return closed.length ? `Fechado: ${closed.map((d) => WEEKDAYS[d]).join(", ")}` : "Abrimos todos os dias";
}

export function nextOpeningText(schedule = getState().business.schedule, now = new Date()) {
  if (!schedule.days.length) return "";
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < 8; i++) {
    const day = (now.getDay() + i) % 7;
    if (!schedule.days.includes(day)) continue;
    if (i === 0 && minutes >= toMinutes(schedule.open)) continue;
    const when = i === 0 ? "hoje" : i === 1 ? "amanhã" : WEEKDAYS[day].toLowerCase();
    return `${when} às ${shortTime(schedule.open)}`;
  }
  return "";
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

export function applyBusiness() {
  const { business } = getState();
  setText("brandName", business.name);
  setText("footerName", business.name);
  setText("brandTagline", business.tagline);
  setText("footerTagline", business.tagline);
  setText("heroEta", business.eta);
  setText("infoEta", business.eta);
  setText("aboutText", business.about);
  setText("hoursText", formatHours());
  setText("closedText", formatClosedDays());
  setText("year", new Date().getFullYear());

  const status = $("heroStatus");
  if (status) {
    const open = isOpenNow();
    status.textContent = open ? "● Aberto agora" : `● Fechado agora · abre ${nextOpeningText()}`;
    status.classList.toggle("open", open);
    status.classList.toggle("closed", !open);
  }

  const pageTitle = document.title.split("—")[0].trim();
  document.title =
    document.body.dataset.page === "home" ? `${business.name} — Delivery` : `${pageTitle} — ${business.name}`;
}
