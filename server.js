const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const ca = require("chalk-animation");
// var router = require('./routes/router')
// app.use(router)
////////////////////////////////////////MIDDLEWARE/////////////////////////////////////////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  // goes before the csurf
  cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
  })
);
//Cross-Site Request Forgery
app.use(csurf());
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.engine("handlebars", hb());
// app.engine("handlebars", hb({
//     defaultLayout: 'main'
// }
// )); writing this, then there's no need no specify the layout in the render *
app.set("view engine", "handlebars");
app.use(express.static("public"));
app.use("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/signup", (req, res) => {
  if (req.session.userID) {
    res.redirect("/");
    return;
  }
  db.getUsers(); //ningun .then() aca

  res.render("signup", {
    layout: "main" // *
  });
});

app.post("/signup", (req, res) => {
  if (
    !req.body.firstname ||
    !req.body.lastname ||
    !req.body.email ||
    !req.body.password
  ) {
    res.render("signup", {
      layout: "main",
      error: "Some data are missing"
    });
  } else {
    db.getUsers().then(loggingin => {
      for (var i = 0; i < loggingin.length; i++) {
        if (loggingin[i].email == req.body.email) {
          var compare = true;
        }
      }
      if (compare) {
        res.render("signup", {
          layout: "main",
          errorEmail: "That email is already taken"
        });
      } else {
        db.hashPassword(req.body.password).then(hashedPassword => {
          console.log("hashed password: ", hashedPassword);
          db.signUp(
            req.body.firstname,
            req.body.lastname,
            req.body.email,
            hashedPassword
          )
            .then(signedup => {
              console.log("signedup: ", signedup);
              console.log("number of signedup.id: ", signedup.id);
              req.session.userID = signedup.id;
              res.redirect("/profile");
            })
            .catch(err => {
              console.log(err);
            });
        });
      }
    });
  }
});

app.get("/profile", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  db.getProfile(); //aca tampoco tengo un .then() y funciona

  res.render("profile", {
    layout: "main"
  });
});

app.post("/profile", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  db.insertProfile(
    req.body.age,
    req.body.city,
    req.body.url,
    req.session.userID
  )
    .then(profile => {
      console.log("profile: ", profile);
      console.log("insertProfile userID: ", req.session.userID);
      res.redirect("/");
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/");
    return;
  }
  res.render("login", {
    layout: "signed" // *
  });
});

app.post("/login", (req, res) => {
  if (!req.body.email && !req.body.password) {
    res.render("login", {
      layout: "signed", // *
      error: "Some data are missing"
    });
  } else {
    db.getUsers().then(loggingin => {
      for (var i = 0; i < loggingin.length; i++) {
        if (loggingin[i].email == req.body.email) {
          var compare = loggingin[i].hashed_password;
          var userID = loggingin[i].id;
        }
      }
      if (!compare) {
        res.render("login", {
          layout: "signed",
          error: "Invalid username or password"
        });
      } else {
        db.checkPassword(req.body.password, compare)
          .then(passwordMatch => {
            console.log("is the password correct?: ", passwordMatch);
            if (passwordMatch) {
              req.session.userID = userID;
              console.log("userID: ", userID);
              // res.redirect("/");

              db.getSignatureId(req.session.userID) //this allows me to check if when I login I already signed or not, if I did, I will be redirected to the thanks page
                .then(sigId => {
                  if (sigId) {
                    req.session.signatureId = sigId;
                    res.redirect("/thanks");
                  } else {
                    res.redirect("/");
                  }
                });
            } else {
              res.render("login", {
                layout: "signed",
                error: "Invalid username or password" //both have the same error message. This prevents attackers from enumerating valid usernames without knowing their passwords.
              });
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
    });
  }
});

//MIDDLEWARE FUNCTION
function checkForSig(req, res, next) {
  console.log("running checkForSig");
  console.log("checkForSig: ", req.session);
  if (!req.session.signatureId && req.url != "/") {
    //for example, I want to go to thanks, but I haven't signed yet
    console.log("no sigId found, redirecting");
    res.redirect("/");
  } else if (req.session.signatureId && req.url == "/") {
    // If I want to go to the home page, but I have signed already
    console.log("sigId found, moving on");
    res.redirect("/thanks");
  } else {
    next();
  }
}

app.get("/", checkForSig, (req, res) => {
  if (!req.session.userID) {
    res.redirect("/signup");
    return;
  }
  db.getSigners(); //si agrego un .then(), despues de firmar no avanza a "thanks"
  res.render("home", {
    layout: "main" // *
  });
});

app.post("/", (req, res) => {
  if (!req.body.signature) {
    res.render("home", {
      layout: "main", // *
      error: "You need to sign"
    });
  } else {
    db.insertUser(req.body.signature, req.session.userID)
      .then(newUser => {
        console.log("new User id: ", newUser.id);
        console.log("new User", newUser);
        req.session.signatureId = newUser.id;
        res.redirect("/thanks");
      })
      .catch(err => {
        console.log(err);
      });
  }
});

app.get("/thanks", checkForSig, (req, res) => {
  db.getSignature(req.session.signatureId) //con este funciona
    // .getSignatureId(req.session.signatureId) //con este no, me dice signature undefined
    // .getSignature(req.session.userID) //con este tampoco, me dice signature undefined
    .then(signature => {
      // console.log("getSignature ID: ", req.session.userID);
      res.render("thanks", {
        layout: "signed",
        id: signature
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/listOfSigners", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  db.getInfo()
    .then(signers => {
      // console.log("lista de firmadores: ", signers);
      res.render("listOfSigners", {
        layout: "signed",
        listOfSigners: signers
      });
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/logout", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  console.log("loggin out");
  req.session = null;
  res.render("logout", {
    layout: "signed"
  });
});

app.get("/listOfSigners/:city", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  db.getInfoWithCity(req.params.city)
    .then(signers => {
      res.render("listOfSignersInThatCity", {
        layout: "signed",
        listOfSigners: signers,
        city: req.params.city
      });
      // console.log("info: ", signers); I'm already loggin it in in db.js
    })
    .catch(err => {
      console.log(err);
    });
});

app.get("/profile/edit", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  db.getInfoAndEmail(req.session.userID).then(results => {
    //getInfo has to return only the information from the user in session, and the query is returning everything
    res.render("editProfile", {
      layout: "signed",
      firstname: results.firstname,
      lastname: results.lastname,
      email: results.email,
      // password: results.password,
      age: results.age,
      city: results.city,
      url: results.homepage
    });
    console.log("editprofile: ", results);
  });
});

app.post("/profile/edit", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/");
  }
  // console.log("verifying: ", req.body);
  if (!req.body.hashed_password) {
    //in case the user doesn't want to change their password

    db.updateProfile(
      req.body.age,
      req.body.city,
      req.body.homepage,
      req.session.userID
    )
      .then(update => {
        console.log("update: ", update);
        db.updateMoreStuff(
          req.session.userID,
          req.body.first_name,
          req.body.last_name,
          req.body.email
        ).then(updateMore => {
          // req.session.userID = updateMore.id
          console.log("updateMore: ", updateMore);
          res.redirect("/thanks");
        });
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    db.hashPassword(req.body.hashed_password).then(hashedPassword => {
      db.updateProfileAndPassword(
        req.session.userID,
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        hashedPassword
      ).then(updatedMore => {
        console.log("UpdateMore: ", updatedMore);
        db.updateProfile(
          req.body.age,
          req.body.city,
          req.body.homepage,
          req.session.userID
        ).then(() => {
          res.redirect("/thanks");
        });
      });
    });
  }
});

app.post("/delete-signature", (req, res) => {
  db.deleteSignature(req.session.userID).then(results => {
    req.session.signatureId = null;
    res.redirect("/");
  });
});

app.get('*', function(req, res){
  res.redirect("/");
});

app.listen(process.env.PORT || 8080, () =>
  //proces.env.PORT was added so we can upload to heroku
  ca.rainbow("listening on port 8080")
);
