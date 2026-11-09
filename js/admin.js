
import { ADMIN_SESSION_KEY } from "./config.js";
import { getAdminCreds, saveAdminCreds } from "./storage.js";
import { hashPassword } from "./auth.js";
import { applyBusiness } from "./business.js";
import { initBusiness, renderBusiness } from "./admin-business.js";
import { initDelivery, renderDelivery } from "./admin-delivery.js";
import { initItems, renderItems } from "./admin-items.js";
import { initOrders, renderOrders } from "./admin-orders.js";
import { $, toast } from "./utils.js";

const loginSection = $("adminLoginSection");
const dashSection = $("adminDashboardSection");
const isLogged = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";

function showError(msg) {
  $("adminLoginError").textContent = msg;
  $("adminLoginError").hidden = !msg;
}

function setupLoginMode() {
  const firstTime = !getAdminCreds();
  $("adminLoginTitle").textContent = firstTime ? "Primeiro acesso" : "Área da Dona";
  $("adminLoginText").textContent = firstTime
    ? "Crie o usuário e a senha que você vai usar para gerenciar o site."
    : "Informe suas credenciais para gerenciar o site.";
  $("adminPassConfirmWrap").hidden = !firstTime;
  $("adminPassConfirm").required = firstTime;
  $("adminLoginBtn").textContent = firstTime ? "Criar acesso" : "Entrar no painel";
  $("adminPass").autocomplete = firstTime ? "new-password" : "current-password";
}

async function handleLogin(e) {
  e.preventDefault();
  showError("");
  const user = $("adminUser").value.trim();
  const pass = $("adminPass").value;
  const creds = getAdminCreds();

  if (!creds) {
    if (user.length < 3) return showError("O usuário precisa ter pelo menos 3 caracteres.");
    if (pass.length < 6) return showError("A senha precisa ter pelo menos 6 caracteres.");
    if (pass !== $("adminPassConfirm").value) return showError("As senhas não conferem.");
    saveAdminCreds({ user, passHash: await hashPassword(pass) });
    toast("Acesso criado!");
  } else if (user !== creds.user || (await hashPassword(pass)) !== creds.passHash) {
    return showError("Usuário ou senha incorretos.");
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  $("adminPass").value = "";
  $("adminPassConfirm").value = "";
  showDashboard();
}

function showDashboard() {
  loginSection.hidden = true;
  dashSection.hidden = false;
  renderBusiness();
  renderDelivery();
  renderItems();
  renderOrders();
}

function logout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  dashSection.hidden = true;
  loginSection.hidden = false;
  setupLoginMode();
}

function initTabs() {
  const tabs = document.querySelectorAll("[data-admin-tab]");
  const panels = document.querySelectorAll(".admin-panel");
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => p.classList.toggle("active", p.id === `admin-${tab.dataset.adminTab}`));
      if (tab.dataset.adminTab === "orders") renderOrders();
    })
  );
}



applyBusiness();
setupLoginMode();
initTabs();
initBusiness();
initDelivery();
initItems();
initOrders();
$("adminLoginForm").addEventListener("submit", handleLogin);
$("logoutBtn").addEventListener("click", logout);
if (isLogged()) showDashboard();
