app.init = function () {
  app.cart.init();
  app.user.init();
  app.fb.statusChangeCallback = app.initProfile;
  document.getElementById("darkbgc").style.display = "none";
  document.getElementById("rateBoard").style.display = "none";
  document.getElementById("headline").style.display = "none";
  document.getElementById("profile").style.display = "none";
  document.getElementById("myFavorites").style.display = "none";
  addListenerToBtn();
  showHistories("all");
};
app.initProfile = function () {
  if (app.state.auth === null) {
    window.location = "./";
  }
  app.fb
    .getProfile()
    .then(function (data) {
      app.showProfile(data);
    })
    .catch(function (error) {
      console.log("Facebook Error", error);
    });
};
app.showProfile = function (data) {
  app.get("#profile-picture").src =
    "https://graph.facebook.com/" + data.id + "/picture/?width=200";
  let details = app.get("#profile-details");
  app.createElement(
    "div",
    {
      atrs: {
        className: "name",
        textContent: data.name,
      },
    },
    details
  );
  app.createElement(
    "div",
    {
      atrs: {
        className: "email",
        textContent: data.email,
      },
    },
    details
  );
};
window.addEventListener("DOMContentLoaded", app.init);

function getUserProfile() {
  hideOrderHistories();
  hideFav();
  hideMyReview();
  document.getElementById("headline").style.display = "block";
  document.getElementById("profile").style.display = "flex";
  let profileXhr = new XMLHttpRequest();
  profileXhr.open(
    "GET",
    "https://stylish-api.yenchenkuo.com/api/1.0//user/profile"
  );
  profileXhr.setRequestHeader(
    "Authorization",
    `Bearer ${app.user.getAccessToken()}`
  );
  profileXhr.send();
  profileXhr.onload = () => {
    if (profileXhr.readyState == 4) {
      document.getElementById("profile-details").innerHTML = "";
      let profileData = JSON.parse(profileXhr.response);
      console.log(profileData);
      app.get("#profile-picture").src = `${profileData.data.picture}`;
      let details = app.get("#profile-details");
      app.createElement(
        "div",
        {
          atrs: {
            className: "name",
            textContent: profileData.data.name,
          },
        },
        details
      );
      app.createElement(
        "div",
        {
          atrs: {
            className: "email",
            textContent: profileData.data.email,
          },
        },
        details
      );
    }
  };
}
function cancelRate() {
  document.getElementById("darkbgc").style.display = "none";
  document.getElementById("rateBoard").style.display = "none";
}
function hideMemberData() {
  document.getElementById("headline").style.display = "none";
  document.getElementById("profile").style.display = "none";
}
function showOrderHistories() {
  document.getElementById("orderStateNav").style.display = "flex";
  document.getElementById("histories").style.display = "block";
  hideMemberData();
  hideFav();
  hideMyReview();
  showHistories("all");
}
function hideOrderHistories() {
  document.getElementById("orderStateNav").style.display = "none";
  document.getElementById("histories").style.display = "none";
}
function hideMyReview() {
  document.getElementById("myReviews").style.display = "none";
}
function showFav() {
  document.getElementById("myFavorites").style.display = "flex";
  hideMemberData();
  hideOrderHistories();
  hideMyReview();
  let favXhr = new XMLHttpRequest();
  // console.log(app.state.auth.accessToken);
  favXhr.open(
    "GET",
    "https://stylish-api.yenchenkuo.com/api/1.0/user/profile/favorites"
  );
  favXhr.setRequestHeader("Content-Type", "application/json");
  favXhr.setRequestHeader(
    "Authorization",
    `Bearer ${app.user.getAccessToken()}`
  );
  favXhr.send();
  favXhr.onload = () => {
    if (favXhr.readyState == 4) {
      let favData = JSON.parse(favXhr.response);
      console.log(`fav${app.user.getAccessToken()}`);
      console.log(favData);
      let myFavoritesDiv = document.getElementById("myFavorites");
      myFavoritesDiv.innerHTML = "";
      for (let i = 0; i < favData.data.length; i++) {
        let fav_div = app.createElement(
          "div",
          { atrs: { className: "fav" } },
          myFavoritesDiv
        );
        let favImg_div = app.createElement(
          "div",
          { atrs: { className: "favImg" } },
          fav_div
        );
        let product_a = app.createElement(
          "a",
          { atrs: { href: `product.html?id=${favData.data[i].id}` } },
          favImg_div
        );
        let favImg = app.createElement(
          "img",
          { atrs: { src: `${favData.data[i].main_image}` } },
          product_a
        );
        let favTitle_div = app.createElement(
          "div",
          { atrs: { className: "favTitle" } },
          fav_div
        );
        favTitle_div.innerHTML = `${favData.data[i].title}`;
        let favcolors_div = app.createElement(
          "div",
          { atrs: { className: "favcolors" } },
          fav_div
        );

        for (let j = 0; j < favData.data[i].colors.length; j++) {
          let favcolor_div = app.createElement(
            "div",
            { atrs: { className: "favColor" } },
            favcolors_div
          );
          favcolor_div.style = `background-color: #${favData.data[i].colors[j].code}`;
        }
        console.log(favData.data[i]);
        let favBottom_div = app.createElement(
          "div",
          { atrs: { className: "favBottom" } },
          fav_div
        );
        let favPrice_span = app.createElement(
          "span",
          { atrs: { className: "favPrice" } },
          favBottom_div
        );
        favPrice_span.innerHTML = `TWD.${favData.data[i].price}`;
        let fav_i = app.createElement(
          "i",
          { atrs: { className: "fas fa-heart fa-1x" } },
          favBottom_div
        );
        fav_i.id = `favIcon-${i}`;
        fav_i.onclick = function profileAddFavOrCancel() {
          let targetClass = document.getElementById(`favIcon-${i}`).classList;
          targetClass.toggle("fas");
          targetClass.toggle("far");
          if (targetClass.contains("fas")) {
            addFavToAPI(favData.data[i].id);
            alert("收藏成功：" + favData.data[i].title);
          }
          if (targetClass.contains("far")) {
            removeFavFromAPI(favData.data[i].id);
            alert("取消收藏：" + favData.data[i].title);
          }
        };
      }
    }
  };
}
function addFavToAPI(product_id) {
  let addFavXhr = new XMLHttpRequest();
  addFavXhr.open(
    "POST",
    "https://stylish-api.yenchenkuo.com/api/1.0/user/favorite"
  );
  addFavXhr.setRequestHeader("Content-Type", "application/json");
  addFavXhr.setRequestHeader(
    "Authorization",
    `Bearer ${app.user.getAccessToken()}`
  );
  let jsonRequestBody = JSON.stringify({
    product_id: product_id,
  });
  addFavXhr.send(jsonRequestBody);
  addFavXhr.onload = () => {
    if (addFavXhr.readyState == 4) {
    }
  };
}
function removeFavFromAPI(product_id) {
  let removeFavXhr = new XMLHttpRequest();
  removeFavXhr.open(
    "DELETE",
    "https://stylish-api.yenchenkuo.com/api/1.0/user/favorite"
  );
  removeFavXhr.setRequestHeader("Content-Type", "application/json");
  removeFavXhr.setRequestHeader(
    "Authorization",
    `Bearer ${app.user.getAccessToken()}`
  );
  let jsonRequestBody = JSON.stringify({
    product_id: product_id,
  });
  removeFavXhr.send(jsonRequestBody);
  removeFavXhr.onload = () => {
    if (removeFavXhr.readyState == 4) {
    }
  };
}

function hideFav() {
  document.getElementById("myFavorites").style.display = "none";
}

function logout() {
  FB.logout(function (response) {
    window.location = "./";
  });
}
let rateId;
// app.showHistories = function(state){
function showHistories(state) {
  // console.log(app.state.auth.accessToken);
  let xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    `https://stylish-api.yenchenkuo.com/api/1.0/user/profile/orders/${state}`
  );
  xhr.setRequestHeader("Authorization", `Bearer ${app.user.getAccessToken()}`);
  // console.log(`歷史紀錄token${app.user.getAccessToken()}`);
  xhr.send();
  xhr.onload = () => {
    if (xhr.readyState == 4) {
      // data:各筆訂單資料
      let data = JSON.parse(xhr.response).data;
      let histories_Div = document.getElementById("histories");
      histories_Div.innerHTML = "";
      for (let i = 0; i < data.length; i++) {
        console.log(data[i].products);
        let history_Div = app.createElement(
          "div",
          { atrs: { className: "history" } },
          histories_Div
        );
        for (let j = 0; j < data[i].products.length; j++) {
          let order_item_Div = app.createElement(
            "div",
            { atrs: { className: "order_item" } },
            history_Div
          );
          let order_item_detail_Div = app.createElement(
            "div",
            { atrs: { className: "order_item_detail" } },
            order_item_Div
          );
          let picture_Div = app.createElement(
            "div",
            { atrs: { className: "picture" } },
            order_item_detail_Div
          );
          let img_Div = app.createElement(
            "img",
            { atrs: { src: `${data[i].products[j].main_image}` } },
            picture_Div
          );
          let details_Div = app.createElement(
            "div",
            { atrs: { className: "details" } },
            order_item_detail_Div
          );
          details_Div.innerHTML = `${data[i].products[j].title}`;

          let text_Div = app.createElement(
            "div",
            { atrs: { className: "detailText" } },
            details_Div
          );
          text_Div.innerHTML = `${data[i].products[j].product_id}`;
          let br = app.createElement("br", {}, details_Div);
          let text2_Div = app.createElement(
            "div",
            { atrs: { className: "detailText" } },
            details_Div
          );
          text2_Div.innerHTML = `${data[i].products[j].variant.color_name} / ${data[i].products[j].variant.size_}`;
          let text3_Div = app.createElement(
            "div",
            { atrs: { className: "detailText" } },
            details_Div
          );
          text3_Div.innerHTML = `x${data[i].products[j].quantity}`;
          let order_price_Div = app.createElement(
            "div",
            { atrs: { className: "order_price" } },
            order_item_Div
          );
          order_price_Div.innerHTML = `$${data[i].products[j].price}`;

          if (state === "shipped") {
            let order_review_Div = app.createElement(
              "div",
              { atrs: { className: "order_review" } },
              order_item_Div
            );
            let reviewBtn_Div = app.createElement(
              "span",
              { atrs: { className: "reviewBtn" } },
              order_review_Div
            );
            if (data[i].products[j].comment == null) {
              reviewBtn_Div.innerHTML = "評價";
            } else {
              reviewBtn_Div.style.display = "none";
            }
            console.log(data[i].products[j].comment);
            reviewBtn_Div.onclick = function showRate() {
              document.getElementById("darkbgc").style.display = "block";
              document.getElementById("rateBoard").style.display = "block";
              let rateInfo = document.getElementById("rateInfo");
              rateInfo.innerHTML = "";
              let rate_picture_Div = app.createElement(
                "div",
                { atrs: { className: "rate_picture" } },
                rateInfo
              );
              let rateImg = app.createElement(
                "img",
                { atrs: { src: `${data[i].products[j].main_image}` } },
                rate_picture_Div
              );
              let rate_product_Div = app.createElement(
                "div",
                { atrs: { className: "rate_product" } },
                rateInfo
              );
              rate_product_Div.innerHTML = `${data[i].products[j].title}`;

              let detailText_Div = app.createElement(
                "div",
                { atrs: { className: "detailText" } },
                rate_product_Div
              );
              detailText_Div.innerHTML = `${data[i].products[j].variant.color_name} / ${data[i].products[j].variant.size_}`;
              let rateBtn = document.getElementById("rateBtn");
              //在此綁定商品id
              rateId = data[i].products[j].id;
              // rateBtn.rateId=rateId;
              console.log(rateId);
            };
          }
        }
        // 訂單詳情
        let seeMoreDiv = app.createElement(
          "div",
          { atrs: { className: "seeMore" } },
          history_Div
        );
        let seeMoreBtnDiv = app.createElement(
          "div",
          { atrs: { className: "seeMoreBtn" } },
          seeMoreDiv
        );
        seeMoreBtnDiv.innerHTML = "訂單詳情";
        seeMoreBtnDiv.onclick = function seeMore() {
          if (document.getElementById(`moreDiv${i}`).style.display == "block") {
            document.getElementById(`moreDiv${i}`).style.display = "none";
            seeMoreBtnDiv.innerHTML = "訂單詳情";
          } else {
            document.getElementById(`moreDiv${i}`).style.display = "block";
            seeMoreBtnDiv.innerHTML = "收起";
          }
        };
        let moreDiv = app.createElement(
          "div",
          { atrs: { className: "moreDiv" } },
          seeMoreDiv
        );
        moreDiv.id = `moreDiv${i}`;
        let more1 = app.createElement("div", { atrs: {} }, moreDiv);
        more1.innerHTML = `收件人&ensp;&ensp;：${data[i].recipient.name}`;
        let more2 = app.createElement("div", { atrs: {} }, moreDiv);
        more2.innerHTML = `付款方式：信用卡`;
        let more3 = app.createElement("div", { atrs: {} }, moreDiv);
        more3.innerHTML = `電話號碼：${data[i].recipient.phone}`;
        let more4 = app.createElement("div", { atrs: {} }, moreDiv);
        more4.innerHTML = `收件地址：${data[i].recipient.address}`;
        let more5 = app.createElement("div", { atrs: {} }, moreDiv);
        more5.innerHTML = `運費：$ ${data[i].freight}`;
        // enf of 訂單詳情
        let order_total_price_Div = app.createElement(
          "div",
          { atrs: { className: "order_total_price" } },
          history_Div
        );
        order_total_price_Div.innerHTML = "訂單金額： $ NT.";
        let priceNum_Span = app.createElement(
          "span",
          { atrs: { className: "priceNum" } },
          order_total_price_Div
        );
        priceNum_Span.innerHTML = `${data[i].total}`;
      }
    }
  };
}

function showMyReview() {
  hideMemberData();
  document.getElementById("myReviews").style.display = "block";
  hideFav();
  hideOrderHistories();
  // console.log(app.state.auth.accessToken);
  let myReviewXhr = new XMLHttpRequest();
  myReviewXhr.open(
    "GET",
    `https://stylish-api.yenchenkuo.com/api/1.0/user/profile/orders/shipped`
  );
  myReviewXhr.setRequestHeader(
    "Authorization",
    `Bearer ${app.user.getAccessToken()}`
  );
  myReviewXhr.send();
  myReviewXhr.onload = () => {
    if (myReviewXhr.readyState == 4) {
      // data:各筆訂單資料
      let data = JSON.parse(myReviewXhr.response).data;
      let histories_Div = document.getElementById("myReviews");
      histories_Div.innerHTML = "";
      for (let i = 0; i < data.length; i++) {
        console.log(data[i].products);
        let history_Div = app.createElement(
          "div",
          { atrs: { className: "history" } },
          histories_Div
        );
        for (let j = 0; j < data[i].products.length; j++) {
          // console.log(data[i].products[j].comment);
          if (data[i].products[j].comment !== null) {
            let order_item_Div = app.createElement(
              "div",
              { atrs: { className: "order_item2" } },
              history_Div
            );
            let order_item_detail_Div = app.createElement(
              "div",
              { atrs: { className: "order_item_detail" } },
              order_item_Div
            );
            let picture_Div = app.createElement(
              "div",
              { atrs: { className: "picture" } },
              order_item_detail_Div
            );
            let img_Div = app.createElement(
              "img",
              { atrs: { src: `${data[i].products[j].main_image}` } },
              picture_Div
            );
            let details_Div = app.createElement(
              "div",
              { atrs: { className: "details" } },
              order_item_detail_Div
            );
            details_Div.innerHTML = `${data[i].products[j].title}`;

            let text_Div = app.createElement(
              "div",
              { atrs: { className: "detailText" } },
              details_Div
            );
            text_Div.innerHTML = `${data[i].products[j].product_id}`;
            let text2_Div = app.createElement(
              "div",
              { atrs: { className: "detailText" } },
              details_Div
            );
            text2_Div.innerHTML = `${data[i].products[j].variant.color_name} / ${data[i].products[j].variant.size_}`;

            let text3_Div = app.createElement(
              "div",
              { atrs: { className: "myReviewText" } },
              details_Div
            );
            text3_Div.innerHTML = `${data[i].products[j].comment}`;
          }
        }
      }
    }
  };
}

function addListenerToBtn() {
  // 不能將這個 function 寫在 showHistories function 裡面，會變成每次 GET API 都新增一個EventListener
  // 請給星星的 Alert 就會跳很多次
  let rateBtn = document.getElementById("rateBtn");
  rateBtn.addEventListener("click", () => {
    console.log("111");
    // console.log(document.getElementById("rateTextInput").value);
    console.log(`商品評價回傳id: ${rateId}`);
    if (rateStar === undefined) {
      console.log(rateStar);
      alert("請給我們五顆星吧！");
    } else {
      console.log(rateStar);
      let reviewData = {
        id: `${rateId}`,
        rating: rateStar,
        comment: `${document.getElementById("rateTextInput").value}`,
      };
      console.log(reviewData);
      let jsonReview = JSON.stringify(reviewData);
      let postReviewXhr = new XMLHttpRequest();
      postReviewXhr.open(
        "POST",
        "https://stylish-api.yenchenkuo.com/api/1.0/user/profile/orders/comment"
      );
      postReviewXhr.setRequestHeader("Content-Type", "application/json");
      postReviewXhr.setRequestHeader(
        "Authorization",
        `Bearer ${app.user.getAccessToken()}`
      );
      postReviewXhr.send(jsonReview);
      postReviewXhr.onload = () => {
        if (postReviewXhr.readyState == 4) {
          console.log(JSON.parse(postReviewXhr.response));
        }
      };
    }
  });
}

let rateStar;
function rate(e) {
  rateStar = e;
}
function stateChangeCss(n) {
  for (let i = 0; i < document.querySelectorAll(".state").length; i++) {
    document.querySelectorAll(".state")[i].classList.remove("stateCurrent");
  }
  document.querySelectorAll(".state")[n].classList.add("stateCurrent");
}

// function profileAddFavOrCancel(i){
// 	let targetClass = document.getElementById(`favIcon-${i}`).classList;
// 	targetClass.toggle("fas");
// 	targetClass.toggle("far");
// 	if (targetClass.contains('fas')){
// 		console.log('收藏成功');
// 		alert('收藏成功');
// 	};
// 	if (targetClass.contains('far')){
// 		console.log('取消收藏');
// 		alert('取消收藏');
// 	};
// }
