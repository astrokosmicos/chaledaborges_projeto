import { loginUser, currentUser, logoutUser } from "./auth.js";
import { applyBusiness } from "./business.js";
import { initBusiness, renderBusiness } from "./admin-business.js";
import { initDelivery, renderDelivery } from "./admin-delivery.js";
import { initItems, renderItems } from "./admin-items.js";
import { initOrders, renderOrders } from "./admin-orders.js";
import { $, toast } from "./utils.js";

const loginSection = $("adminLoginSection");
const dashSection = $("adminDashboardSection");

function showError(msg) {
  $("adminLoginError").textContent = msg;
  $("adminLoginError").hidden = !msg;
}

function setupLoginMode() {
  $("adminLoginTitle").textContent = "Área da Dona";
  $("adminLoginText").textContent =
    "Informe seu e-mail e sua senha para gerenciar o site.";

  $("adminLoginBtn").textContent = "Entrar no painel";
  $("adminPass").autocomplete = "current-password";
}

async function handleLogin(e) {
  e.preventDefault();
  showError("");

  const email = $("adminUser").value.trim();
  const pass = $("adminPass").value;

  try {
    const user = await loginUser(email, pass);

    if (user?.role !== "admin") {
      await logoutUser();
      return showError("Acesso restrito à administradora.");
    }

    $("adminPass").value = "";
    toast("Login realizado com sucesso!");
    showDashboard();

  } catch (error) {
    showError(error.message);
  }
}

function showDashboard() {
  loginSection.hidden = true;
  dashSection.hidden = false;

  renderBusiness();
  renderDelivery();
  renderItems();
  renderOrders();
}

async function logout() {
  try {
    await logoutUser();

    dashSection.hidden = true;
    loginSection.hidden = false;

    setupLoginMode();
    toast("Você saiu da conta.");

  } catch (error) {
    toast(error.message);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll("[data-admin-tab]");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) =>
        t.classList.toggle("active", t === tab)
      );

      panels.forEach((p) =>
        p.classList.toggle(
          "active",
          p.id === `admin-${tab.dataset.adminTab}`
        )
      );

      if (tab.dataset.adminTab === "orders") {
        renderOrders();
      }
    })
  );
}

async function checkSession() {
  try {
    const user = await currentUser();

    if (user?.role === "admin") {
      showDashboard();
    } else {
      loginSection.hidden = false;
      dashSection.hidden = true;
    }

  } catch (error) {
    loginSection.hidden = false;
    dashSection.hidden = true;
    showError(error.message);
  }
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

checkSession();