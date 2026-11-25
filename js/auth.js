import { API_BASE_URL } from "./config.js";

const API_URL = API_BASE_URL;

let csrfToken = null;

async function getCsrfToken() {
  const response = await fetch(`${API_URL}/session`, {
    credentials: "same-origin",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao iniciar sessão.");
  }

  csrfToken = data.csrf;
  return csrfToken;
}

export async function registerUser({ name, email, phone, password }) {
  name = name.trim();
  email = email.trim().toLowerCase();

  if (name.length < 2) {
    throw new Error("Digite seu nome.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Digite um e-mail válido.");
  }

  if (password.length < 12) {
    throw new Error("A senha precisa ter pelo menos 12 caracteres.");
  }

  if (password.length > 256) {
    throw new Error("A senha deve ter no máximo 256 caracteres.");
  }

  await getCsrfToken();

  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      name,
      email,
      phone: phone || "",
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível criar a conta.");
  }

  csrfToken = data.csrf || csrfToken;

  return data.user;
}

export async function loginUser(email, password) {
  await getCsrfToken();

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível entrar.");
  }

  csrfToken = data.csrf || csrfToken;

  return data.user;
}
export async function currentUser() {
  const response = await fetch(`${API_URL}/session`, {
    credentials: "same-origin",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao verificar sessão.");
  }

  csrfToken = data.csrf || csrfToken;

  return data.user || null;
}
export async function logoutUser() {
  await getCsrfToken();

  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível sair da conta.");
  }

  csrfToken = data.csrf || null;

  return true;
}

export async function createOrder(order) {
  await getCsrfToken();

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(order),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível registrar o pedido.");
  }

  return data;
}
export async function fetchOrders() {
  const response = await fetch(`${API_URL}/orders`, {
    credentials: "same-origin",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao consultar pedidos.");
  }

  return data.orders;
}

export async function updateOrderStatus(id, status) {
  await getCsrfToken();

  const response = await fetch(
    `${API_URL}/orders/${id}/status`,
    {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao atualizar status.");
  }

  return data;
}
export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products/manage`, {
    credentials: "same-origin",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao consultar produtos.");
  }

  return data.products;
}

export async function createProduct(product) {
  await getCsrfToken();

  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(product),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao cadastrar produto.");
  }

  return data;
}

export async function updateProduct(id, product) {
  await getCsrfToken();

  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(product),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao atualizar produto.");
  }

  return data;
}