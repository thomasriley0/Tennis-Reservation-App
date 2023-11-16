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
  image: undefined,
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

    if (user.length != 0) {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, user.password);
      if (match == false) {
        throw new Error("Incorrect username or password");
      } else {
        //save user details in session like in lab 8
        req.session.user = user;
        req.session.save();
        res.redirect("/");
      }
    } else { // I dont think this will ever hit?
      res.redirect("/register");
    }
  } catch (error) { //will happen most likely when the db encounters an error (does not find anything in db or username/password is wrong)
    console.log(error);
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

  //console.log(req.body.password);
  //console.log(req.body.username);
  var error;

  const query1 = `select * from users where username = '${req.body.username}';`;

  //check to see if username already exists in db
  //If we do not get an error, then the user must exist already
  try {
    var test = await db.one(query1);
    error = true;
  } catch {
    error = false;
  }

  //will continue with inserting user into db if it does not exist already
  if (!error) {
    const query = `insert into users (username, password) values ('${req.body.username}', '${hash}') returning *;`;
    db.one(query)
      .then((data) => {
        console.log("inserted");
        res.redirect("/login");
        res.status(201);
      })
      .catch((err) => {
        console.log(err);
        res.render("pages/register", {
          message: "Username already found!",
          error: 1,
        });
      });
  } else {
    //goes back to register page if username already exists.
    console.log("error");
    res.status(400);
    res.render("pages/register.ejs", {
      message: "Username already exists!",
    });
  }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

app.get("/parks", (req, res) => {



  const query = "SELECT * FROM facilities;";
  db.any(query)
  
  .then((data)=>{

    res.status(201);
    res.render("pages/parks",{data:data});
    

  })
  .catch((err)=>{
    console.log(err);
    res.status(400);

  })
  
});

app.get("/park", (req, res) => {
  

});

app.get("/court", (req, res) => {
  res.render("pages/court");
});

app.get("/reservations", (req, res) => {
  res.render("pages/reservations");
});

app.post("/reservations", (req,res)=>{




});

app.get("/profile", (req, res) => {
  const query = `SELECT * FROM users WHERE username = '${user.username}';`;

  db.any(query)

    .then(function (data) {
      res.render("/pages/profile", {
        data: data,
      });
      res.status(201);
    })
    .catch((err) => {
      res.status(400);
      console.log(err);
      console.log(data);
    });
});

app.post("/profile", (req, res) => {
  const query =
    "UPDATE users SET rating = $1, location = $2, age = $3, gender = $4, description = $5, image = $6 WHERE userID = $7;";

  db.any(query, [
    req.body.rating,
    req.body.location,
    req.body.age,
    req.body.gender,
    req.body.description,
    req.body.image,
    req.session.user.user_id,
  ])

    .then((data) => {
      res.redirect("/profile");
      console.log("info updated");
      res.status(201);
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/profile");
      res.status(400);
    });
});

app.get("/find_partners", (req, res) => {
  //get reservations that are looking for group

  res.render("pages/find_partners")
});

app.get("/featured_parks", (req, res) => {

  const query = "SELECT facilities.name, COUNT(facilities.name) FROM facilities INNER JOIN reservation ON facilities.facilityID = reservation.facilityID GROUP BY facilities.name ORDER BY DESC LIMIT 8;";

  db.any(query)

  .then((data)=>{

    res.status(200);
    res.render("pages/featured_parks",{data:data});


  })
  .catch((err)=>{

    res.status(400);
    console.log(err);
  })
  
});

//Start server
module.exports = app.listen(3000);
