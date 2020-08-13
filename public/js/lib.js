// initialize app structure
let app = {
  fb: {},
  state: {
    cart: null,
    auth: null,
    isLogin: null,
  },
  user: {},
  evts: {},
  cart: {},
  cst: {
    API_HOST: "https://stylish-cowork.yenchenkuo.com", // official: "https://api.appworks-school.tw",
    API_ENDPOINT: "https://stylish-cowork.yenchenkuo.com/api/1.0", // official: "https://api.appworks-school.tw/api/1.0",
    //API_HOST: "http://localhost:3000",
    //API_ENDPOINT: "http://localhost:3000/api/1.0"
  },
};
// core operations
app.get = function (selector) {
  return document.querySelector(selector);
};
app.getAll = function (selector) {
  return document.querySelectorAll(selector);
};
app.createElement = function (tagName, settings, parentElement) {
  let obj = document.createElement(tagName);
  if (settings.atrs) {
    app.setAttributes(obj, settings.atrs);
  }
  if (settings.stys) {
    app.setStyles(obj, settings.stys);
  }
  if (settings.evts) {
    app.setEventHandlers(obj, settings.evts);
  }
  if (parentElement instanceof Element) {
    parentElement.appendChild(obj);
  }
  return obj;
};
app.modifyElement = function (obj, settings, parentElement) {
  if (settings.atrs) {
    app.setAttributes(obj, settings.atrs);
  }
  if (settings.stys) {
    app.setStyles(obj, settings.stys);
  }
  if (settings.evts) {
    app.setEventHandlers(obj, settings.evts);
  }
  if (parentElement instanceof Element && parentElement !== obj.parentNode) {
    parentElement.appendChild(obj);
  }
  return obj;
};
app.setStyles = function (obj, styles) {
  for (let name in styles) {
    obj.style[name] = styles[name];
  }
  return obj;
};
app.setAttributes = function (obj, attributes) {
  for (let name in attributes) {
    obj[name] = attributes[name];
  }
  return obj;
};
app.setEventHandlers = function (obj, eventHandlers, useCapture) {
  for (let name in eventHandlers) {
    if (eventHandlers[name] instanceof Array) {
      for (let i = 0; i < eventHandlers[name].length; i++) {
        obj.addEventListener(name, eventHandlers[name][i], useCapture);
      }
    } else {
      obj.addEventListener(name, eventHandlers[name], useCapture);
    }
  }
  return obj;
};
app.ajax = function (method, src, args, headers, callback) {
  let req = new XMLHttpRequest();
  if (method.toLowerCase() === "post" || method.toLowerCase() === "delete") {
    // post or delete through json args
    req.open(method, src);
    req.setRequestHeader("Content-Type", "application/json");
    app.setRequestHeaders(req, headers);
    req.onload = function () {
      callback(this);
    };
    req.send(JSON.stringify(args));
  } else {
    // get through http args
    req.open(method, src + "?" + args);
    app.setRequestHeaders(req, headers);
    req.onload = function () {
      callback(this);
    };
    req.send();
  }
};
app.setRequestHeaders = function (req, headers) {
  for (let key in headers) {
    req.setRequestHeader(key, headers[key]);
  }
};
app.getParameter = function (name) {
  let result = null,
    tmp = [];
  window.location.search
    .substring(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === name) {
        result = decodeURIComponent(tmp[1]);
      }
    });
  return result;
};
// menu items
app.updateMenuItems = function (tag) {
  let desktopItems = app.getAll("header>nav>.item");
  let mobileItems = app.getAll("nav.mobile>.item");
  if (tag === "women") {
    desktopItems[0].classList.add("current");
    mobileItems[0].classList.add("current");
  } else if (tag === "men") {
    desktopItems[1].classList.add("current");
    mobileItems[1].classList.add("current");
  } else if (tag === "accessories") {
    desktopItems[2].classList.add("current");
    mobileItems[2].classList.add("current");
  }
};
// loading
app.showLoading = function () {
  app.get("#loading").style.display = "block";
};
app.closeLoading = function () {
  app.get("#loading").style.display = "none";
};
// facebook login
app.fb.load = function () {
  // Load the SDK asynchronously
  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/zh_TW/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};
app.fb.init = function () {
  FB.init({
    appId: "364148884542547", // PengPeng: 1999890763414585
    cookie: true,
    xfbml: true,
    version: "v7.0",
  });
  // comment out
  // FB.getLoginStatus(function (response) {
  //   app.fb.loginStatusChange(response);
  //   // set member click handlers
  //   let memberIcons = app.getAll(".member");
  //   for (let i = 0; i < memberIcons.length; i++) {
  //     app.setEventHandlers(memberIcons[i], {
  //       click: app.fb.clickProfile,
  //     });
  //   }
  // });
};
app.fb.login = function () {
  FB.login(
    function (response) {
      app.fb.loginStatusChange(response);
    },
    { scope: "public_profile,email" }
  );
};
app.fb.loginStatusChange = function (response) {
  if (response.status === "connected") {
    app.state.auth = response.authResponse;
    app.fb.updateLoginToServer();
  } else {
    app.state.auth = null;
  }
};
app.fb.updateLoginToServer = function () {
  let data = {
    provider: "facebook",
    access_token: app.state.auth.accessToken,
  };
  //每次檢查登入狀態時會向FB索取新token並POST到後端
  app.ajax("post", app.cst.API_ENDPOINT + "/user/signin", data, {}, function (
    req
  ) {
    const result = JSON.parse(req.responseText);
    const { access_token, user } = result.data;
    app.user.updateLoginLocalData(access_token, user);
    if (typeof app.fb.statusChangeCallback === "function") {
      app.fb.statusChangeCallback();
    }
  });
};
app.fb.clickProfile = function () {
  if (app.state.auth === null) {
    app.fb.login();
  } else {
    window.location = "./profile.html";
  }
};
app.fb.getProfile = function () {
  return new Promise((resolve, reject) => {
    FB.api("/me?fields=id,name,email", function (response) {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};
// facebook init
window.fbAsyncInit = app.fb.init;
window.addEventListener("DOMContentLoaded", app.fb.load);
// shopping cart
app.cart.init = function () {
  let storage = window.localStorage;
  let cart = storage.getItem("cart");
  if (cart === null) {
    cart = {
      discount_token: null,
      shipping: "delivery",
      payment: "credit_card",
      recipient: {
        name: "",
        phone: "",
        email: "",
        address: "",
        time: "anytime",
      },
      list: [],
      subtotal: 0,
      discount: 0,
      freight: 60,
      total: 0,
    };
  } else {
    try {
      cart = JSON.parse(cart);
      cart.discount_token = null;
      cart.discount = 0;
    } catch (e) {
      storage.removeItem("cart");
      app.cart.init();
      return;
    }
  }
  app.state.cart = cart;
  // refresh UIs
  app.cart.initFloatingCart();
  app.cart.show();
};
app.cart.update = function () {
  let storage = window.localStorage;
  let cart = app.state.cart;
  let subtotal = 0;
  for (let i = 0; i < cart.list.length; i++) {
    subtotal += cart.list[i].price * cart.list[i].qty;
  }
  cart.subtotal = subtotal;
  cart.total = cart.subtotal + cart.discount + cart.freight;
  // save to storage
  storage.setItem("cart", JSON.stringify(cart));
  // refresh UIs
  app.cart.show();
};
app.cart.show = function () {
  let cart = app.state.cart;
  app.get("#cart-qty-mobile").textContent = app.get("#cart-qty").textContent =
    cart.list.length;
  app.cart.renderFloatingCart();
};
app.cart.add = function (product, variant, qty) {
  let list = app.state.cart.list;
  let color = product.colors.find((item) => {
    return item.code === variant.color_code;
  });
  let item = list.find((item) => {
    return (
      item.id === product.id &&
      item.size === variant.size &&
      item.color.code === color.code
    );
  });
  if (item) {
    item.qty = qty;
  } else {
    list.push({
      id: product.id,
      name: product.title,
      price: product.price,
      main_image: product.main_image,
      size: variant.size,
      color: color,
      qty: qty,
      stock: variant.stock,
    });
  }
  app.cart.update();
  alert("已加入購物車");
};
app.cart.remove = function (index) {
  let list = app.state.cart.list;
  list.splice(index, 1);
  app.cart.update();
  alert("已從購物車中移除");
};
app.cart.change = function (index, qty) {
  let list = app.state.cart.list;
  list[index].qty = qty;
  app.cart.update();
};
app.cart.clear = function () {
  let storage = window.localStorage;
  storage.removeItem("cart");
};
// floating cart
app.cart.initFloatingCart = function () {
  // add mouseover event to show floating cart
  let floatingCartItem = app.createElement(
    "div",
    {
      atrs: {
        className: "floating-cart",
      },
    },
    app.get("header")
  );
  let FloatingCartList = app.createElement(
    "div",
    {
      atrs: {
        id: "floating-cart-list",
        className: "list",
      },
    },
    floatingCartItem
  );
  const cartItem = app.get("header > .feature > .cart");
  [cartItem, floatingCartItem].forEach((item) =>
    app.setEventHandlers(item, {
      mouseover: app.evts.showFloatingCart,
      mouseout: app.evts.hideFloatingCart,
    })
  );
};
app.cart.renderFloatingCart = function () {
  let cart = app.state.cart;
  let list = cart.list;
  // show list
  let container = app.get("#floating-cart-list");
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<h4>購物車空空的耶</h4>";
  } else {
    for (let i = 0; i < list.length; i++) {
      let data = list[i];
      let item = app.createElement(
        "div",
        {
          atrs: {
            className: "row",
          },
        },
        container
      );
      // variant
      let variant = app.createElement(
        "div",
        {
          atrs: {
            className: "variant",
          },
        },
        item
      );
      let picture = app.createElement(
        "div",
        {
          atrs: {
            className: "picture",
          },
        },
        variant
      );
      app.createElement(
        "div",
        {
          atrs: {
            className: "details",
            innerHTML:
              data.name +
              "<br/>" +
              data.id +
              "<br/><br/>顏色：" +
              data.color.name +
              "<br/>尺寸：" +
              data.size,
          },
        },
        variant
      );
      app.createElement(
        "img",
        {
          atrs: {
            src: data.main_image,
          },
        },
        picture
      );
      // price-qty
      app.createElement(
        "div",
        {
          atrs: {
            className: "price-qty",
            textContent: "NT. " + data.price + " x " + data.qty,
          },
        },
        item
      );
      // remove
      app.createElement(
        "img",
        {
          atrs: {
            src: "imgs/cart-remove.png",
            index: i,
          },
        },
        app.createElement(
          "div",
          {
            atrs: {
              className: "remove",
              index: i,
            },
            evts: {
              click: app.evts.removeCart,
            },
          },
          item
        )
      );
    }
  }
};
app.evts.showFloatingCart = function () {
  app.get("header .floating-cart").style.display = "block";
};
app.evts.hideFloatingCart = function () {
  app.get("header .floating-cart").style.display = "none";
};
// for removing item in floating-cart
app.evts.removeCart = function (e) {
  app.cart.remove(e.currentTarget.index);
};
// native login
app.user.init = function () {
  if (app.user.getAccessToken()) {
    app.user.checkLoginStatus(
      (user) => {
        app.state.isLogin = true;
        app.user.showUserName(user.name);
        app.user.initFloatingMember();
      },
      () => (app.state.isLogin = false)
    );
  } else {
    app.state.isLogin = false;
  }
};
app.user.setAccessToken = function (access_token) {
  window.localStorage.setItem("access_token", access_token);
};
app.user.getAccessToken = function () {
  return window.localStorage.getItem("access_token");
};
app.user.removeAccessToken = function () {
  window.localStorage.removeItem("access_token");
};
app.user.checkLoginStatus = function (loginCallback, logoutCallback) {
  if (app.user.getAccessToken()) {
    app.ajax(
      "GET",
      `${app.cst.API_ENDPOINT}/user/profile`,
      "",
      {
        Authorization: `Bearer ${app.user.getAccessToken()}`,
      },
      (req) => {
        const result = JSON.parse(req.responseText);
        if (req.status !== 200) {
          console.log(`${req.status}: ${req.statusText}`);
          console.dir(result);
          // invalid access token
          if (req.status === 403) {
            app.user.removeAccessToken();
            logoutCallback();
          }
        } else {
          const user = result.data;
          loginCallback(user);
        }
      }
    );
  } else {
    logoutCallback();
  }
};
app.user.updateLoginLocalData = function (access_token, user) {
  app.user.setAccessToken(access_token);
  app.state.profile = user;
  if (typeof app.user.statusChangeCallback === "function") {
    app.user.statusChangeCallback();
  }
};
app.user.logout = function (logoutCallback) {
  app.user.removeAccessToken();
  if (logoutCallback) {
    logoutCallback();
  }
};
app.evts.userLogout = function () {
  app.user.logout(() => window.location.reload());
};
// get user login status and show user name
app.user.showUserName = function (userName) {
  const userNameContainer = app.get("#user-name");
  userNameContainer.innerHTML = "";
  app.createElement(
    "a",
    {
      atrs: {
        href: "./profile.html",
        textContent: userName,
      },
    },
    userNameContainer
  );
  const mobileUserNameContainer = app.get("#mobile-user-name");
  mobileUserNameContainer.innerHTML = "";
  app.createElement(
    "a",
    {
      atrs: {
        href: "./profile.html",
        textContent: userName,
      },
    },
    mobileUserNameContainer
  );
};
// floating member
app.user.initFloatingMember = function () {
  // add mouseover event to show floating member
  let floatingMemberItem = app.createElement(
    "div",
    {
      atrs: {
        className: "floating-member",
      },
    },
    app.get("header")
  );
  app.createElement(
    "a",
    {
      atrs: {
        href: "./profile.html",
        textContent: "我的帳戶",
      },
    },
    app.createElement(
      "div",
      {
        atrs: {
          className: "item",
        },
      },
      floatingMemberItem
    )
  );
  app.createElement(
    "div",
    {
      atrs: {
        className: "item",
        textContent: "登出",
      },
      evts: {
        click: app.evts.userLogout,
      },
    },
    floatingMemberItem
  );
  const memberItem = app.get("header > .feature > .member");
  [memberItem, floatingMemberItem].forEach((item) =>
    app.setEventHandlers(item, {
      mouseover: app.evts.showFloatingMember,
      mouseout: app.evts.hideFloatingMember,
    })
  );
};
app.evts.showFloatingMember = function () {
  app.get("header .floating-member").style.display = "block";
};
app.evts.hideFloatingMember = function () {
  app.get("header .floating-member").style.display = "none";
};
