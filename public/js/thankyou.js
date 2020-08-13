app.init = function () {
  let number = app.getParameter("number");
  console.log(number);
  if (!number) {
    window.location = "./";
  }
  app.get("#number").textContent = `您的訂單編號：${number}`;
  app.cart.init();
  app.user.init();
};
window.addEventListener("DOMContentLoaded", app.init);
