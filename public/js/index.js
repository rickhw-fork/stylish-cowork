app.state.tag = null;
app.state.sortBy = null;
app.state.orderBy = null;
app.state.product = null;
app.state.keyvisual = null;
app.init = function () {
  window.addEventListener("scroll", app.evts.scroll);
  app.state.tag =
    app.getParameter("tag") === null ? "all" : app.getParameter("tag");
  app.state.sortBy =
    app.getParameter("sortBy") === null ? "rating" : app.getParameter("sortBy");
  app.state.orderBy =
    app.getParameter("orderBy") === null ? "desc" : app.getParameter("orderBy");
  // update menu item
  app.updateMenuItems(app.state.tag);
  // init index.html
  app.cart.init();
  app.user.init();
  app.getKeyvisuals();
  app.getProducts(app.state.tag, 0, app.state.sortBy, app.state.orderBy);
  // update sort selection button
  app.updateSortSelection(app.state.sortBy, app.state.orderBy);
  app.sortingProducts();
  app.getWebDiscount();
};
app.evts.scroll = function (e) {
  if (app.state.product === null) {
    // waiting for next page
    return;
  }
  let rect = document.body.getBoundingClientRect();
  let x = rect.bottom - window.innerHeight;
  if (x < 100) {
    if (app.state.product.next_paging !== undefined) {
      app.getProducts(
        app.state.tag,
        app.state.product.next_paging,
        app.state.sortBy,
        app.state.orderBy
      );
    }
  }
};
// Discount

app.getWebDiscount = ()=>{
  let webDiscountXhr = new XMLHttpRequest();
  webDiscountXhr.open("GET","https://stylish-api.yenchenkuo.com/api/1.0/order/discount/getdaily")
  webDiscountXhr.send();
  webDiscountXhr.onload = ()=>{
		if(webDiscountXhr.readyState == 4){
			let webDiscountData = JSON.parse(webDiscountXhr.response);
      console.log(webDiscountData);
      let webDiscountDiv = document.getElementById("discountInfo");
			webDiscountDiv.innerHTML =`限時24小時～${webDiscountData.discount*100}折！您的專屬優惠碼：${webDiscountData.token}`;
      let x_div = app.createElement("span",{atrs:{onclick:"closeDiscount()"}},webDiscountDiv);
      x_div.innerHTML = 'X';
      x_div.onclick =()=>{
        document.getElementById("discountInfo").style.display="none";
      };
    }
	}
}

// Sorting
app.sortingProducts = function () {
  app
    .get("#filter-rating")
    .addEventListener("click", () =>
      app.directToSortedProducts(app.state.tag, "rating", "desc")
    );
  app
    .get("#filter-popularity")
    .addEventListener("click", () =>
      app.directToSortedProducts(app.state.tag, "popularity", "desc")
    );
  app
    .get("#filter-date")
    .addEventListener("click", () =>
      app.directToSortedProducts(app.state.tag, "create_at", "desc")
    );
  app.get("#filter-price").addEventListener("click", () => {
    if (app.state.sortBy !== "price") {
      app.directToSortedProducts(app.state.tag, "price", "desc");
    } else {
      switch (app.state.orderBy) {
        case "asc":
          app.directToSortedProducts(app.state.tag, "price", "desc");
          break;
        case "desc":
          app.directToSortedProducts(app.state.tag, "price", "asc");
          break;
        default:
          app.directToSortedProducts(app.state.tag, "price", "desc");
          break;
      }
    }
  });
};
app.directToSortedProducts = function (tag, sortBy, orderBy) {
  window.location = `/?tag=${tag}&sortBy=${sortBy}&orderBy=${orderBy}`;
};
app.updateSortSelection = function (sort, order) {
  let sortSelections = app.getAll("main .filter>.filter-option");
  if (sort === "rating") {
    sortSelections[0].classList.add("filter-selected");
  } else if (sort === "popularity") {
    sortSelections[1].classList.add("filter-selected");
  } else if (sort === "create_at") {
    sortSelections[2].classList.add("filter-selected");
  } else if (sort === "price") {
    sortSelections[3].classList.add("filter-selected");
    if (order === "desc") {
      sortSelections[3].textContent = "價格 ↓";
    } else if (order === "asc") {
      sortSelections[3].textContent = "價格 ↑";
    }
  }
};
// keyvisuals
app.getKeyvisuals = function () {
  app.ajax(
    "get",
    app.cst.API_ENDPOINT + "/marketing/campaigns",
    "",
    {},
    function (req) {
      app.state.keyvisual = JSON.parse(req.responseText);
      app.state.keyvisual.step = 0;
      app.state.keyvisual.total = app.state.keyvisual.data.length;
      app.state.keyvisual.animeId;
      app.showKeyvisual(app.state.keyvisual);
    }
  );
};
app.showKeyvisual = function (keyvisual) {
  let container = app.get("#keyvisual");
  let step = app.get("#keyvisual>.step");
  // create key visuals and circle
  keyvisual.data.forEach(function (item, index) {
    // create circle
    let circle = app.createElement(
      "a",
      {
        atrs: {
          className: "circle" + (index === 0 ? " current" : ""),
          index: index,
        },
        evts: {
          click: app.evts.clickKeyvisual,
        },
      },
      step
    );
    // create visual
    let visual = app.createElement("a", {
      atrs: {
        className: "visual" + (index === 0 ? " current" : ""),
        href: "./product.html?id=" + item.product_id,
      },
      stys: {
        backgroundImage: "url(" + item.picture + ")",
      },
    });
    app.createElement(
      "div",
      {
        atrs: {
          className: "story",
          innerHTML: item.story.replace(/\r\n/g, "<br/>"),
        },
      },
      visual
    );
    container.insertBefore(visual, step);
  });
  app.state.keyvisual.animeId = window.setInterval(
    app.evts.nextKeyvisual,
    5000
  );
};
app.evts.clickKeyvisual = function (e) {
  let step = e.currentTarget.index;
  let keyvisual = app.state.keyvisual;
  app
    .get("#keyvisual>.visual:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.remove("current");
  app
    .get("#keyvisual>.step>.circle:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.remove("current");
  keyvisual.step = step;
  app
    .get("#keyvisual>.visual:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.add("current");
  app
    .get("#keyvisual>.step>.circle:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.add("current");
  // reset interval
  window.clearInterval(app.state.keyvisual.animeId);
  app.state.keyvisual.animeId = window.setInterval(
    app.evts.nextKeyvisual,
    5000
  );
};
app.evts.nextKeyvisual = function () {
  let keyvisual = app.state.keyvisual;
  app
    .get("#keyvisual>.visual:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.remove("current");
  app
    .get("#keyvisual>.step>.circle:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.remove("current");
  keyvisual.step = (keyvisual.step + 1) % keyvisual.total;
  app
    .get("#keyvisual>.visual:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.add("current");
  app
    .get("#keyvisual>.step>.circle:nth-child(" + (keyvisual.step + 1) + ")")
    .classList.add("current");
};
// products
app.getProducts = function (tag, paging, sort, order) {
  let path;
  let keyword;
  if (tag === "all") {
    path = "/all";
  } else if (tag === "women") {
    path = "/women";
  } else if (tag === "men") {
    path = "/men";
  } else if (tag === "accessories") {
    path = "/accessories";
  } else {
    path = "/search";
    keyword = tag;
  }
  app.state.product = null;
  app.ajax(
    "get",
    app.cst.API_ENDPOINT + "/products" + path,
    "paging=" +
      paging +
      (keyword ? "&keyword=" + encodeURIComponent(tag) : "") +
      "&" +
      "sort=" +
      sort +
      "&" +
      "order=" +
      order,
    {},
    function (req) {
      app.state.product = JSON.parse(req.responseText);
      app.showProducts(app.state.product.data);
    }
  );
};
app.showProducts = function (data) {
  let container = app.get("#products");
  if (data.length === 0) {
    app.createElement(
      "h2",
      {
        atrs: {
          className: "no-result",
          textContent: "沒有搜尋到任何產品哦",
        },
      },
      container
    );
  } else {
    for (let i = 0; i < data.length; i++) {
      let product = data[i];
      let productContainer = app.createElement(
        "a",
        {
          atrs: {
            className: "product",
            href: "product.html?id=" + product.id,
          },
        },
        container
      );
      app.showProduct(product, productContainer);
    }
  }
};
app.showProduct = function (product, container) {
  // main Image
  app.createElement(
    "img",
    {
      atrs: {
        src: product.main_image,
      },
    },
    container
  );
  // colors
  let colorsContainer = app.createElement(
    "div",
    {
      atrs: {
        className: "colors",
      },
    },
    container
  );
  for (let key in product.colors) {
    let color = product.colors[key];
    app.createElement(
      "div",
      {
        atrs: {
          className: "color",
        },
        stys: {
          backgroundColor: "#" + color.code,
        },
      },
      colorsContainer
    );
  }
  // name and price
  app.createElement(
    "div",
    {
      atrs: {
        className: "name",
        textContent: product.title,
      },
    },
    container
  );
  app.createElement(
    "div",
    {
      atrs: {
        className: "price",
        textContent: "TWD." + product.price,
      },
    },
    container
  );
};
window.addEventListener("DOMContentLoaded", app.init);
