import { mountShell } from "./layout.js";
import { getBairros, findBairro, bairroOptionsHTML } from "./delivery.js";
import { getSavedBairro, saveBairro } from "./storage.js";
import { $, money, escapeHTML } from "./utils.js";

mountShell();

const select = $("bairroSelect");
select.innerHTML = bairroOptionsHTML(getSavedBairro());

function showResult() {
  const bairro = findBairro(select.value);
  if (!bairro) {
    $("deliveryResult").innerHTML = `<span>⌖</span><div><strong>Selecione seu bairro</strong><small>Vamos estimar prazo e taxa de entrega.</small></div>`;
    return;
  }
  saveBairro(bairro.id);
  $("deliveryResult").innerHTML = `
    <span>⌖</span>
    <div>
      <strong>Entrega estimada: ${bairro.min}–${bairro.max} min</strong>
      <small>Taxa de entrega: ${bairro.fee === 0 ? "grátis" : money(bairro.fee)} · ${escapeHTML(bairro.name)}</small>
    </div>`;
}

$("calcDeliveryBtn").addEventListener("click", showResult);
select.addEventListener("change", showResult);

$("bairroList").innerHTML = getBairros()
  .map(
    (b) => `<li><span>${escapeHTML(b.name)}</span><span>${b.min}–${b.max} min</span><b>${money(b.fee)}</b></li>`
  )
  .join("");

if (select.value) showResult();
