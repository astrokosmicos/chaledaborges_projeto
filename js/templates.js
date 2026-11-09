export const overlayHTML = `<div class="overlay" id="overlay" hidden></div>`;

export const cartDrawerHTML = `
<aside class="drawer" id="cartDrawer" aria-hidden="true" aria-label="Carrinho">
  <div class="drawer-head">
    <div><span class="eyebrow">seu pedido</span><h2>Carrinho</h2></div>
    <button class="close-btn" type="button" data-close="cartDrawer" aria-label="Fechar carrinho">×</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-bottom">
    <div class="subtotal"><span>Subtotal</span><strong id="cartSubtotal">R$ 0,00</strong></div>
    <div class="mini-note">A taxa de entrega é calculada na próxima etapa.</div>
    <button class="primary-btn full" type="button" id="checkoutBtn">Continuar para entrega</button>
  </div>
</aside>`;

export const checkoutModalHTML = `
<div class="modal-backdrop" id="checkoutModal" hidden>
  <div class="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
    <button class="close-btn" type="button" data-close="checkoutModal" aria-label="Fechar">×</button>

    <form id="checkoutForm" novalidate>
      <span class="eyebrow">última etapa</span>
      <h2 id="checkoutTitle">Entrega &amp; pagamento</h2>

      <div class="notice" id="closedNotice" hidden></div>
      <div class="checkout-summary" id="checkoutSummary"></div>

      <div class="form-grid">
        <label>Nome<input id="checkoutName" autocomplete="name" placeholder="Nome para o pedido" required></label>
        <label>Telefone / WhatsApp<input id="checkoutPhone" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" required></label>
        <label>Bairro<select id="checkoutBairro" required></select></label>
        <label>Rua e número<input id="checkoutStreet" autocomplete="street-address" placeholder="Rua, número" required></label>
        <label class="wide">Complemento / ponto de referência<input id="checkoutComplement" placeholder="Apto, bloco, perto de…"></label>
        <label>Pagamento<select id="paymentMethod"></select></label>
        <label id="changeWrap" hidden>Troco para quanto?<input id="checkoutChange" inputmode="decimal" placeholder="Ex.: 100"></label>
        <label class="wide">Observações do pedido<textarea id="checkoutNotes" placeholder="Sabor do pastel, sem cebola, etc."></textarea></label>
      </div>

      <div class="checkout-totals">
        <div><span>Subtotal</span><b id="checkoutSubtotal">R$ 0,00</b></div>
        <div><span>Entrega <small id="checkoutEta"></small></span><b id="checkoutFee">—</b></div>
        <div class="checkout-total"><span>Total</span><strong id="checkoutTotal">R$ 0,00</strong></div>
      </div>
      <p class="form-error" id="checkoutError" role="alert" hidden></p>
      <button class="primary-btn full" type="submit" id="placeOrderBtn">Finalizar pedido</button>
    </form>

    <div class="order-done" id="checkoutDone" hidden></div>
  </div>
</div>`;

export const mobileMenuHTML = `
<div class="mobile-menu" id="mobileMenu">
  <a href="index.html">Início</a>
  <a href="cardapio.html">Cardápio</a>
  <a href="entrega.html">Entrega</a>
  <a href="index.html#sobre">Sobre</a>
  <a href="login.html" id="mobileLogin">Entrar</a>
</div>`;
