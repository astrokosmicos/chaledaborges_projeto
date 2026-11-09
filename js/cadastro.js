import { mountShell } from "./layout.js";
import { registerUser } from "./auth.js";
import { $, toast, bindPhoneMask } from "./utils.js";

mountShell();
bindPhoneMask($("registerPhone"));

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("doRegister");
  btn.disabled = true;
  try {
    const user = await registerUser({
      name: $("registerName").value,
      email: $("registerEmail").value,
      phone: $("registerPhone").value,
      password: $("registerPassword").value,
    });
    toast(`Conta criada! Bem-vindo, ${user.name.split(" ")[0]}.`);
    setTimeout(() => location.assign("cardapio.html"), 700);
  } catch (err) {
    $("registerError").textContent = err.message;
    $("registerError").hidden = false;
    btn.disabled = false;
  }
});
