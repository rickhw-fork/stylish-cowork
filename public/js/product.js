app.state.product = null;
app.state.variant = null;
app.state.qty = 0;
app.state.isFavorite = false;
app.state.classfiedComments = {};
app.init = function () {
  let id = app.getParameter("id");
  if (!id) {
    window.location = "./";
  }
  app.cart.init();
  app.user.init();
  app.getProduct(id);
  // init event handlers
  app.setEventHandlers(app.get("#product-add-cart-btn"), {
    click: function () {
      app.cart.add(app.state.product, app.state.variant, app.state.qty);
    },
  });
  app.setEventHandlers(app.get("#product-add-list-btn"), {
    click: function () {
      app.state.isFavorite
        ? app.removeFavorite(app.state.product.id)
        : app.addFavorite(app.state.product.id);
    },
  });
  app
    .getAll(".rating-selection .selection-btn")
    .forEach((selectionBtn) =>
      selectionBtn.addEventListener("click", app.evts.selectCommentsRating)
    );
};
app.getProduct = function (id) {
  app.ajax(
    "get",
    app.cst.API_ENDPOINT + "/products/details",
    "id=" + id,
    {},
    function (req) {
      let data = JSON.parse(req.responseText).data;
      let variant;
      // find first chosen variant available
      for (let key in data.variants) {
        variant = data.variants[key];
        if (variant.stock > 0) {
          app.state.variant = variant;
          break;
        }
      }
      app.state.product = data;
      app.state.qty = app.state.variant !== null ? 1 : 0;
      app.state.classfiedComments = {
        all: app.state.product.comments,
        one: app.filterComments(app.state.product.comments, 1),
        two: app.filterComments(app.state.product.comments, 2),
        three: app.filterComments(app.state.product.comments, 3),
        four: app.filterComments(app.state.product.comments, 4),
        five: app.filterComments(app.state.product.comments, 5),
      };
      // update menu item
      app.updateMenuItems(app.state.product.category);
      // show product
      app.showProduct();
    }
  );
};
app.showProduct = function () {
  let product = app.state.product;
  app.get("#product-name").textContent = product.title;
  app.get("#product-id").textContent = product.id;
  app.get("#product-price").textContent = "TWD." + product.price;
  app.get("#product-summary").innerHTML =
    product.note +
    "<br/><br/>" +
    product.texture +
    "<br/>" +
    product.description.replace(/\r\n/g, "<br/>") +
    "<br/><br/>清洗：" +
    product.wash +
    "<br/>產地：" +
    product.place;
  app.createElement(
    "img",
    {
      atrs: {
        src: product.main_image,
      },
    },
    app.get("#product-main-image")
  );
  // colors
  let colorContainer = app.get("#product-colors");
  if (app.state.variant === null) {
    app.createElement(
      "span",
      {
        atrs: {
          textContent: "本品項已售完",
        },
      },
      colorContainer
    );
  } else {
    for (let i = 0; i < product.colors.length; i++) {
      let color = product.colors[i];
      app.createElement(
        "div",
        {
          atrs: {
            className:
              "color" +
              (app.state.variant.color_code === color.code ? " current" : ""),
            value: color,
          },
          stys: {
            backgroundColor: "#" + color.code,
          },
          evts: {
            click: app.evts.clickColor,
          },
        },
        colorContainer
      );
    }
  }
  // sizes
  let sizeContainer = app.get("#product-sizes");
  if (app.state.variant === null) {
    app.createElement(
      "span",
      {
        atrs: {
          textContent: "本品項已售完",
        },
      },
      sizeContainer
    );
  } else {
    product.sizes.forEach((size) => {
      let variant = app.findVariant(app.state.variant.color_code, size);
      let outStock = variant.stock === 0;
      app.createElement(
        "div",
        {
          atrs: {
            className:
              "size" +
              (app.state.variant.size === size ? " current" : "") +
              (outStock ? " disabled" : ""),
            textContent: size,
            value: size,
          },
          evts: {
            click: app.evts.clickSize,
          },
        },
        sizeContainer
      );
      ("");
    });
  }
  // qty
  app.get("#product-qty>.value").textContent = app.state.qty;
  let ops = app.getAll("#product-qty>.op");
  if (app.state.variant !== null) {
    ops.forEach((op) => {
      op.addEventListener("click", app.evts.clickQty);
    });
  }
  // favorite
  app.checkFavorite(product.id);
  // story
  app.get("#product-story").innerHTML = product.story;
  // images
  for (let i = 0; i < 2 && i < product.images.length; i++) {
    app.createElement(
      "img",
      {
        atrs: {
          src: product.images[i],
        },
      },
      app.get("#product-images")
    );
  }

  if (product.rating !== null && product.comments.length > 0) {
    // rating
    app.get("#average-rating").textContent = product.rating;
    app.setStyles(app.get("#average-rating-star"), {
      background: `linear-gradient(to right, #8b572a 0%, #8b572a ${
        product.rating * 2 * 10
      }%, #ffffff 0%, #ffffff 100%)`,
      "-webkit-background-clip": "text",
    });
    // reviews
    app.renderComments(product.comments);
    app.get("#all-star").classList.add("selection-btn--selected");
  } else {
    app.get("#reviews").innerHTML = "目前尚無評價喔！";
  }
  // more products
  if (product.similar_products) {
    const moreProductsContainer = app.get(".more-products");
    product.similar_products.forEach((product) => {
      let productContainer = app.createElement(
        "a",
        {
          atrs: {
            className: "product",
            href: "product.html?id=" + product.id,
          },
        },
        moreProductsContainer
      );
      // main Image
      app.createElement(
        "img",
        {
          atrs: {
            src: product.main_image,
          },
        },
        productContainer
      );
      // name and price
      app.createElement(
        "div",
        {
          atrs: {
            className: "name",
            textContent: product.title,
          },
        },
        productContainer
      );
      app.createElement(
        "div",
        {
          atrs: {
            className: "price",
            textContent: "TWD." + product.price,
          },
        },
        productContainer
      );
    });
  } else {
  }
};
app.checkFavorite = function (productId) {
  if (app.state.isLogin) {
    app.ajax(
      "GET",
      `${app.cst.API_ENDPOINT}/user/profile/favorites`,
      "",
      {
        Authorization: `Bearer ${app.user.getAccessToken()}`,
      },
      (req) => {
        const result = JSON.parse(req.responseText);
        if (req.status !== 200) {
          console.log(`${req.status}: ${req.statusText}`);
          console.dir(result);
        } else {
          const favorites = result.data;
          if (favorites.find((favorite) => favorite.id === productId)) {
            app.state.isFavorite = true;
            app.get("#product-add-list-btn").textContent = "♥ 從我的最愛移除";
          } else {
            app.state.isFavorite = false;
            app.get("#product-add-list-btn").textContent = "♡ 加入我的最愛";
          }
        }
      }
    );
  }
};
app.addFavorite = function (product_id) {
  if (app.state.isLogin) {
    app.ajax(
      "POST",
      `${app.cst.API_ENDPOINT}/user/favorite`,
      {
        product_id,
      },
      {
        Authorization: `Bearer ${app.user.getAccessToken()}`,
      },
      (req) => {
        const result = JSON.parse(req.responseText);
        if (req.status !== 200) {
          console.log(`${req.status}: ${req.statusText}`);
          console.dir(result);
        } else {
          const productId = result.product_id;
          app.checkFavorite(productId);
        }
      }
    );
  } else {
    window.location = "./login.html?tag=signin";
  }
};
app.removeFavorite = function (product_id) {
  if (app.state.isLogin) {
    app.ajax(
      "DELETE",
      `${app.cst.API_ENDPOINT}/user/favorite`,
      {
        product_id,
      },
      {
        Authorization: `Bearer ${app.user.getAccessToken()}`,
      },
      (req) => {
        const result = JSON.parse(req.responseText);
        if (req.status !== 200) {
          console.log(`${req.status}: ${req.statusText}`);
          console.dir(result);
        } else {
          const productId = result.product_id;
          app.checkFavorite(productId);
        }
      }
    );
  } else {
    windlow.location = "./login.html?tag=signin";
  }
};
app.renderComments = function (comments) {
  const commentsContainer = app.get("#comments");
  commentsContainer.innerHTML = "";
  if (comments) {
    if (comments.length !== 0) {
      comments.forEach((comment) =>
        app.renderComment(comment, commentsContainer)
      );
    } else {
      commentsContainer.textContent = "暫無評價！";
    }
  }
};
app.renderComment = function (comment, container) {
  let review = app.createElement(
    "div",
    { atrs: { className: "review" } },
    container
  );
  let user = app.createElement(
    "div",
    {
      atrs: {
        className: "user",
        textContent: comment.user,
      },
    },
    review
  );
  let rating = app.createElement(
    "div",
    {
      atrs: {
        className: "rating",
      },
    },
    review
  );
  let ratingStar = app.createElement(
    "span",
    {
      atrs: {
        className: "rating-star",
        textContent: "★★★★★",
      },
      stys: {
        background: `linear-gradient(to right, #8b572a 0%, #8b572a ${
          comment.rating * 2 * 10
        }%, #ffffff 0%, #ffffff 100%)`,
        "-webkit-background-clip": "text",
      },
    },
    rating
  );
  let item = app.createElement(
    "div",
    {
      atrs: {
        className: "item",
        textContent: `顏色：${comment.variant.color_name} | 尺寸：${comment.variant.size} | 數量：${comment.quantity}`,
      },
    },
    review
  );
  let content = app.createElement(
    "div",
    {
      atrs: {
        className: "comment",
        textContent: comment.comment,
      },
    },
    review
  );
  let time = app.createElement(
    "div",
    {
      atrs: {
        className: "time",
        textContent: new Date(comment.comment_time).toLocaleString(),
      },
    },
    review
  );
};
app.filterComments = function (comments, stars) {
  return comments ? comments.filter((comment) => comment.rating === stars) : [];
};
app.evts.selectCommentsRating = function (e) {
  app
    .getAll(".rating-selection .selection-btn")
    .forEach((selectionBtn) =>
      selectionBtn.classList.remove("selection-btn--selected")
    );
  const selectedRating = e.target;
  selectedRating.classList.add("selection-btn--selected");
  switch (selectedRating.id) {
    case "five-star":
      app.renderComments(app.state.classfiedComments.five);
      break;
    case "four-star":
      app.renderComments(app.state.classfiedComments.four);
      break;
    case "three-star":
      app.renderComments(app.state.classfiedComments.three);
      break;
    case "two-star":
      app.renderComments(app.state.classfiedComments.two);
      break;
    case "one-star":
      app.renderComments(app.state.classfiedComments.one);
      break;
    case "all-star":
    default:
      app.renderComments(app.state.classfiedComments.all);
      break;
  }
};
app.findVariant = function (colorCode, size) {
  let product = app.state.product;
  return product.variants.find((item) => {
    return item.color_code === colorCode && item.size === size;
  });
};
app.refreshProductVariants = function () {
  let variants = app.state.product.variants;
  let variant = app.state.variant;
  let colors = app.getAll("#product-colors>.color");
  for (let i = 0; i < colors.length; i++) {
    if (colors[i].value.code === variant.color_code) {
      colors[i].classList.add("current");
    } else {
      colors[i].classList.remove("current");
    }
  }
  let sizes = app.getAll("#product-sizes>.size");
  let outStock;
  for (let i = 0; i < sizes.length; i++) {
    // control current
    if (sizes[i].value === variant.size) {
      sizes[i].classList.add("current");
    } else {
      sizes[i].classList.remove("current");
    }
    outStock = app.findVariant(variant.color_code, sizes[i].value).stock === 0;
    // control disabled
    if (outStock) {
      sizes[i].classList.add("disabled");
    } else {
      sizes[i].classList.remove("disabled");
    }
  }
  app.get("#product-qty>.value").textContent = app.state.qty;
};
app.evts.clickColor = function (e) {
  let color = e.currentTarget.value;
  let variants = app.state.product.variants;
  app.state.variant = app.findVariant(color.code, app.state.variant.size);
  if (app.state.variant.stock === 0) {
    // out of stock, choose another size automatically
    let sizes = app.state.product.sizes;
    let variant;
    for (let i = 0; i < sizes.length; i++) {
      variant = app.findVariant(color.code, sizes[i]);
      if (variant.stock > 0) {
        app.state.variant = variant;
        break;
      }
    }
  }
  app.state.qty = 1;
  app.refreshProductVariants();
};
app.evts.clickSize = function (e) {
  if (e.currentTarget.classList.contains("disabled")) {
    return;
  }
  let size = e.currentTarget.value;
  let variants = app.state.product.variants;
  app.state.variant = app.findVariant(app.state.variant.color_code, size);
  app.state.qty = 1;
  app.refreshProductVariants();
};
app.evts.clickQty = function (e) {
  let value = parseInt(e.currentTarget.getAttribute("data-value"));
  let qty = app.state.qty;
  qty = qty + value;
  if (qty > 0 && qty <= app.state.variant.stock) {
    app.state.qty = qty;
    app.get("#product-qty>.value").textContent = app.state.qty;
  }
};
window.addEventListener("DOMContentLoaded", app.init);
