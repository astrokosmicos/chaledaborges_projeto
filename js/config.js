export const STORAGE_KEYS = {
  state: "chaleDaBorges:state:v3",
  cart: "chaleDaBorges:cart:v1",
  users: "chaleDaBorges:users:v1",
  session: "chaleDaBorges:session:v1",
  orders: "chaleDaBorges:orders:v1",
  admin: "chaleDaBorges:admin:v1",
  bairro: "chaleDaBorges:bairro:v1",
};

export const ADMIN_SESSION_KEY = "chaleDaBorges:adminSession";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const DEFAULT_BUSINESS = {
  name: "Chalé da Borges",
  tagline: "bar • café • delivery",
  about:
    "Um espaço acolhedor para café, comida artesanal e encontros. Aqui, cada pedido é preparado com atenção aos detalhes.",
  eta: "35–55 min",
  whatsapp: "",
  schedule: { days: [3, 4, 5, 6], open: "15:00", close: "22:00" },
};
export const DEFAULT_BAIRROS = [
  { id: "centro", name: "Centro", fee: 6, min: 30, max: 45 },
  { id: "imocasa", name: "Imocasa", fee: 8, min: 35, max: 50 },
  { id: "grassmann", name: "Grassmann", fee: 8, min: 35, max: 50 },
  { id: "contestado", name: "Contestado", fee: 10, min: 40, max: 55 },
  { id: "areia", name: "Areia", fee: 10, min: 40, max: 55 },
  { id: "picadilly", name: "Picadilly", fee: 12, min: 40, max: 60 },
  { id: "rolantinho", name: "Rolantinho", fee: 12, min: 45, max: 60 },
  { id: "alto_rolantinho", name: "Alto Rolantinho", fee: 15, min: 50, max: 70 },
];

export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão (na entrega)"];

export const ORDER_STATUS = ["novo", "em preparo", "saiu para entrega", "entregue", "cancelado"];
