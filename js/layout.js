import { overlayHTML, cartDrawerHTML, checkoutModalHTML, mobileMenuHTML } from "./templates.js";
import { initCart, closeCart, renderCart } from "./cart.js";
import { syncProducts, getState } from "./storage.js";
import { initCheckout } from "./checkout.js";
import { applyBusiness } from "./business.js";
import { currentUser, logoutUser } from "./auth.js";
import { $ } from "./utils.js";

async function updateAuthLinks() {
  let user = null;

  try {
    user = await currentUser();
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
  }

  for (const id of ["loginBtn", "mobileLogin"]) {
    const el = $(id);
    if (!el) continue;

    if (user) {
      el.textContent = `Sair (${user.name.split(" ")[0]})`;
      el.removeAttribute("href");

      el.onclick = async (e) => {
        e.preventDefault();

        try {
          await logoutUser();
          location.reload();
        } catch (error) {
          alert(error.message);
        }
      };
    } else {
      el.textContent = "Entrar";
      el.setAttribute("href", "login.html");
      el.onclick = null;
    }
  }
}

function initMobileMenu() {
  const btn = $("menuBtn");
  const menu = $("mobileMenu");
  if (!btn || !menu) return;
  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
}

export function mountShell() {
  if (!$("cartDrawer")) {
    document.body.insertAdjacentHTML("beforeend", overlayHTML + cartDrawerHTML + checkoutModalHTML + mobileMenuHTML);
  }
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a, .mobile-menu a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

 applyBusiness();

getState().items = [];

initCart();
initCheckout();
initMobileMenu();
void updateAuthLinks();

syncProducts()
  .then(() => {
    renderCart();
  })
  .catch(error => {
    console.error("Erro ao sincronizar produtos:", error);
    getState().items = [];
    renderCart();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCart();
    const modal = $("checkoutModal");
    if (modal) modal.hidden = true;
  });
}

