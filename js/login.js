console.log("LOGIN.JS CARREGADO");
import { mountShell } from "./layout.js";
import { loginUser } from "./auth.js";
import { $, toast } from "./utils.js";

mountShell();

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = $("doLogin");
  btn.disabled = true;

  $("loginError").hidden = true;

  try {
    const user = await loginUser(
      $("loginEmail").value,
      $("loginPassword").value
    );

    toast(`Bem-vindo, ${user.name.split(" ")[0]}!`);

    setTimeout(() => {
      location.assign("cardapio.html");
    }, 600);

  } catch (err) {
    $("loginError").textContent = err.message;
    $("loginError").hidden = false;
    btn.disabled = false;
  }
});