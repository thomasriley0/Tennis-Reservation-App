const express = require("express");
const app = express();
const pgp = require("pg-promise")();
const session = require("express-session");
const bcrypt = require("bcrypt");
const axios = require("axios");
const bodyParser = require("body-parser");

// database configuration
const dbConfig = {
  host: "db",
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

var user = {

  user_id: undefined,
  username: undefined,
  rating: undefined,
  location: undefined,
  age: undefined,
  gender: undefined,
  description: undefined,
  latitude: undefined,
  longitude: undefined,
  image: undefined

};

const db = pgp(dbConfig);

db.connect()
  .then((obj) => {
    console.log("Database connection successful");
    obj.done();
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

app.set("view engine", "ejs"); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(express.static(__dirname + "/resources"));

app.get("/", (req, res) => {
  res.render("pages/home");
  // res.render("pages/home");
});
//Login API Routes
app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const query = `select * from users where username='${username}';`;
    let user = await db.one(query);
    //console.log(user);

    if (user.length != 0) {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, user.password);
      //console.log(match);
      if (match == false) {
        //console.log("here0");
        //res.status(400);
        throw new Error("Incorrect username or password");
      } else {
        //save user details in session like in lab 8
        //console.log("here1");
        //res.sendStatus(200);
        res.json({ username: username });
        req.session.user = user;
        req.session.save();
        //res.redirect("/facilities");
      }
    } else {
      //console.log("here2");
      res.redirect("/register");
    }
  } catch (error) {
    //console.log("here3");
    res.status(400);
    res.render("pages/login", { message: error });
  }
});

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.post("/register", async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);

  //var error = false;

  // const query1 = `select * from users where username = '${req.body.username}';`;
  // console.log(req.body.username);

  // var test = await db.one(query1);
  // console.log(test);

  // if (test != null) {
  //   console.log("ERROR");
  //   res.status(400);
  //   throw new Error("Username already exists!");
  // }

  const query = `insert into users (username, password) values ('${req.body.username}', '${hash}') returning *;`;
  db.one(query)
    .then((data) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
      res.render("pages/register.ejs", {
        message: "Username already found!",
        error: 1,
      });
    });
});

app.get("/facilities", (req, res) => {
  res.render("pages/facilities");
});

app.get("/facility_courts", (req, res) => {
  res.render("pages/facility_courts");
});

app.get("/specific_court_times", (req, res) => {
  res.render("pages/specific_court_times");
});

app.get("/reservations", (req, res) => {
  res.render("pages/reservations");
});

app.get("/profile", (req, res) => {
  res.render("pages/profile");
});

app.get("/reservations_lfg", (req, res) => {
  res.render("pages/reservations_lfg");
});

app.get("/featured_facilities", (req, res) => {
  res.render("pages/featured_facilities");
});

//Start server
module.exports = app.listen(3000);
