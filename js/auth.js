import { getUsers, saveUsers, getSession, saveSession, clearSession } from "./storage.js";

export async function hashPassword(password) {
  const data = new TextEncoder().encode(`chale-da-borges::${password}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
 
  let h = 0;
  for (const byte of data) h = (h * 31 + byte) >>> 0;
  return `weak-${h}`;
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function registerUser({ name, email, phone, password }) {
  name = name.trim();
  email = email.trim().toLowerCase();
  if (name.length < 2) throw new Error("Digite seu nome.");
  if (!isValidEmail(email)) throw new Error("Digite um e-mail válido.");
  if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");

  const users = getUsers();
  if (users.some((u) => u.email === email)) throw new Error("Este e-mail já está cadastrado.");

  const user = {
    id: Date.now(),
    name,
    email,
    phone: phone || "",
    passHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  saveSession({ userId: user.id });
  return user;
}

export async function loginUser(email, password) {
  email = email.trim().toLowerCase();
  const user = getUsers().find((u) => u.email === email);
  if (!user || user.passHash !== (await hashPassword(password))) {
    throw new Error("E-mail ou senha incorretos.");
  }
  saveSession({ userId: user.id });
  return user;
}

export function currentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((u) => u.id === session.userId) || null;
}

export function logoutUser() {
  clearSession();
}
