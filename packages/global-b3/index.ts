declare const window: any

const globalB3 = {
  'dom.registerElement': '[href^="/login.php"]',
  'dom.checkoutRegisterParentElement': '.checkout-step--customer .checkout-view-content',
  ...window.B3,
}

export default globalB3