import { STORAGE_KEYS, DEFAULT_BUSINESS, DEFAULT_BAIRROS } from "./config.js";
import { MENU_ITEMS } from "./menu-data.js";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
let state = null;

function defaults() {
  return structuredClone({ business: DEFAULT_BUSINESS, bairros: DEFAULT_BAIRROS, items: MENU_ITEMS });
}

function mergeWithDefaults(stored) {
  const d = defaults();
  if (!stored) return d;
  return {
    business: {
      ...d.business,
      ...stored.business,
      schedule: { ...d.business.schedule, ...(stored.business?.schedule || {}) },
    },
    bairros: Array.isArray(stored.bairros) && stored.bairros.length ? stored.bairros : d.bairros,
    items: Array.isArray(stored.items) ? stored.items : d.items,
  };
}

export function getState() {
  if (!state) state = mergeWithDefaults(read(STORAGE_KEYS.state, null));
  return state;
}

export function saveState() {
  return write(STORAGE_KEYS.state, getState());
}

export function resetMenuToDefault() {
  getState().items = structuredClone(MENU_ITEMS);
  saveState();
}
export const getCart = () => read(STORAGE_KEYS.cart, []);
export const saveCart = (cart) => write(STORAGE_KEYS.cart, cart);

export const getUsers = () => read(STORAGE_KEYS.users, []);
export const saveUsers = (users) => write(STORAGE_KEYS.users, users);
export const getSession = () => read(STORAGE_KEYS.session, null);
export const saveSession = (session) => write(STORAGE_KEYS.session, session);
export const clearSession = () => localStorage.removeItem(STORAGE_KEYS.session);

export const getOrders = () => read(STORAGE_KEYS.orders, []);
export const saveOrders = (orders) => write(STORAGE_KEYS.orders, orders);

export const getAdminCreds = () => read(STORAGE_KEYS.admin, null);
export const saveAdminCreds = (creds) => write(STORAGE_KEYS.admin, creds);

export const getSavedBairro = () => read(STORAGE_KEYS.bairro, "");
export const saveBairro = (id) => write(STORAGE_KEYS.bairro, id);
