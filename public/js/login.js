app.state.tag = null;
app.state.prevPage = null;
app.init = function () {
  app.cart.init();
  app.user.init();
  app.state.tag = app.getParameter("tag");
  app.state.prevPage = document.referrer;
  app.showForm(app.state.tag);
  app.get("#sign-up-btn").addEventListener("click", app.user.signup);
  app.get("#sign-in-btn").addEventListener("click", app.user.signin);
  app
    .getAll(".fb-login-btn>button")
    .forEach((fbLoginBtn) =>
      fbLoginBtn.addEventListener("click", app.fb.login)
    );
};
app.showForm = function (tag) {
  switch (tag) {
    case "signup":
      app.get("#sign-up.form").style.display = "block";
      break;
    case "signin":
    default:
      app.get("#sign-in.form").style.display = "block";
      break;
  }
};
app.user.signin = function () {
  const email = app.get("#sign-in-email").value;
  const password = app.get("#sign-in-password").value;
  app.ajax(
    "POST",
    `${app.cst.API_ENDPOINT}/user/signin`,
    {
      provider: "native",
      email,
      password,
    },
    {},
    (req) => {
      const result = JSON.parse(req.responseText);
      if (req.status !== 200) {
        console.log(`${req.status}: ${req.statusText}`);
        console.dir(result);
        // Sign in failed
        if (req.status === 403) {
          console.dir(result);
        }
      } else {
        const { access_token, user } = result.data;
        app.user.updateLoginLocalData(access_token, user);
      }
    }
  );
};
app.user.signup = function () {
  const email = app.get("#sign-up-email").value;
  const password = app.get("#sign-up-password").value;
  const name = app.get("#sign-up-name").value;
  app.ajax(
    "POST",
    `${app.cst.API_ENDPOINT}/user/signup`,
    {
      name,
      email,
      password,
    },
    {},
    (req) => {
      const result = JSON.parse(req.responseText);
      if (req.status !== 200) {
        console.log(`${req.status}: ${req.statusText}`);
        console.dir(result);
        // Email already exist
        if (req.status === 403) {
          console.dir(result);
        }
      } else {
        const { access_token, user } = result.data;
        app.user.updateLoginLocalData(access_token, user);
      }
    }
  );
};
app.user.statusChangeCallback = function () {
  if (!app.state.prevPage) {
    window.location = "./profile.html";
  } else {
    if (app.state.prevPage.includes("/login.html")) {
      window.location = "./profile.html";
    } else {
      window.location = app.state.prevPage;
    }
  }
};
app.fb.statusChangeCallback = function () {
  if (app.state.auth) {
    app.user.statusChangeCallback();
  }
};
window.addEventListener("DOMContentLoaded", app.init);
