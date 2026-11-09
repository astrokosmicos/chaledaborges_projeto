import { overlayHTML, cartDrawerHTML, checkoutModalHTML, mobileMenuHTML } from "./templates.js";
import { initCart, closeCart } from "./cart.js";
import { initCheckout } from "./checkout.js";
import { applyBusiness } from "./business.js";
import { currentUser, logoutUser } from "./auth.js";
import { $ } from "./utils.js";

function updateAuthLinks() {
  const user = currentUser();
  for (const id of ["loginBtn", "mobileLogin"]) {
    const el = $(id);
    if (!el) continue;
    if (user) {
      el.textContent = `Sair (${user.name.split(" ")[0]})`;
      el.removeAttribute("href");
      el.onclick = (e) => {
        e.preventDefault();
        logoutUser();
        location.reload();
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
  initCart();
  initCheckout();
  initMobileMenu();
  updateAuthLinks();

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCart();
    const modal = $("checkoutModal");
    if (modal) modal.hidden = true;
  });
}

