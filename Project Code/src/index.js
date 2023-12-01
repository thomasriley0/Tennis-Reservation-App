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

  //temporary partner data
  const reservations = [
    {
      parkName: "Cu Rec Courts",
      start_time: "8:00 AM",
      end_time: "10:00 AM",
      image: "https://www.colorado.edu/recreation/sites/default/files/styles/hero/public/page/cureccenter-r-tennis-02-low_res_0.jpg?itok=p6vRutfF"
    },
    {
      parkName: "Cu Rec Courts",
      start_time: "10:00 AM",
      end_time: "12:00 PM"
    },
    {
      parkName: "Cu Rec Courts",
      start_time: "12:00 PM",
      end_time: "2:00 PM"
    },
    {
      parkName: "Cu Rec Courts",
      start_time: "2:00 PM",
      end_time: "4:00 PM"
    },
    {
      parkName: "Cu Rec Courts",
      start_time: "4:00 PM",
      end_time: "6:00 PM"
    },
    {
      parkName: "Cu Rec Courts",
      start_time: "8:00 PM",
      end_time: "9:00 PM"
    }
  ]

  //temporary park query
  const query =
    "SELECT * FROM facilities LIMIT 8;";
  db.any(query).then((data) => {
    res.status(200);
    res.render("pages/home", { user_id: user.user_id, data: data, partnerInfo: reservations });
  }).catch((err) => {
    res.render("pages/home", { user_id: user.user_id, data: [], parterInfo: reservations });
    res.status(400);
  });


  // res.render("pages/home");
});
//Login API Routes
app.get("/login", (req, res) => {
  res.render("pages/login", { user_id: user.user_id });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  user = {};
  res.render("pages/home", { user_id: user.user_id, data: [], partnerInfo: [] });
});


app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const query = `select * from users where username='${username}';`;
    let user_temp = await db.one(query);

    if (user_temp.length != 0) {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, user_temp.password);
      if (match == false) {
        throw new Error("Incorrect username or password");
      } else {
        //save user details in session like in lab 8
        user.username = username;
        user.password = password;
        user.user_id = user_temp.userid;
        req.session.user = user;
        req.session.save();
        res.redirect("/");
      }
    } else {
      // I dont think this will ever hit?
      res.redirect("/register");
    }
  } catch (error) {
    //will happen most likely when the db encounters an error (does not find anything in db or username/password is wrong)
    console.log(error);
    res.status(400);
    res.render("pages/login", { message: error, user_id: user.user_id });
  }
});

app.get("/register", (req, res) => {
  res.render("pages/register", { user_id: user.user_id });
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
    return res.redirect("/login");
  }
  next();
};

// Authentication Required
app.use(auth);

app.get("/parks", (req, res) => {
  const query = "SELECT * FROM facilities;";
  db.any(query)

    .then((data) => {
      res.status(201);
      res.render("pages/parks", { data: data, user_id: user.user_id });
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
    });
});

app.get("/park", (req, res) => {
  res.render("pages/park", { user_id: user.user_id })
});

app.get("/court", (req, res) => {
  res.render("pages/court");
});

app.get("/reservations", (req, res) => {

  var query =
    `SELECT courts.name AS court, facilities.name AS park, 
  facilities.address, court_times.court_date,
  court_times.start_time, court_times.end_time, reservation.lfg,
  reservation.reservationID
  FROM reservation
  INNER JOIN courts
  ON reservation.courtID = courts.courtID
  INNER JOIN court_times
  ON reservation.timeID = court_times.timeID
  INNER JOIN facilities
  ON reservation.facilityID = facilities.facilityID
  AND (reservation.userID = ${req.session.user.user_id} OR reservation.joinedUserID = ${req.session.user.user_id});`

  db.any(query)
    .then((data) => {
      res.status(201);
      res.render("pages/reservations", {
        data: data,
        user_id: user.user_id
      });

    })
    .catch((err) => {
      console.log(err)
      res.status(400);
    })
});

app.post("/reservations", (req, res) => {
  const query = `DELETE FROM reservation WHERE reservationID = '${req.body.reservationID}';`;
  db.any(query)
    .then((data) => {
      res.status(201);
      res.redirect("/reservations");
    })
    .catch((err) => {
      console.log(err)
      res.status(400);
    });
});

app.get("/profile", (req, res) => {
  const query = `SELECT * FROM users WHERE userID = '${req.session.user.user_id}';`;

  db.any(query)

    .then(function (data) {
      res.render("pages/profile", {
        data: data,
        user_id: user.user_id
      });
      res.status(201);
    })
    .catch((err) => {
      res.status(400);
      console.log(err);
      console.log(data);
    });
});

app.get("/user", (req, res) => {
  const query = `SELECT * FROM users WHERE userID = '${req.query.userID}';`;

  db.any(query)

    .then(function (data) {
      res.render("pages/user", {
        data: data,
        user_id: user.user_id
      });
      res.status(201);
    })
    .catch((err) => {
      res.status(400);
      console.log(err);
      console.log(data);
    });
});

app.get("/park-search", (req, res) => {
  //get reservations that are looking for group

  res.render("pages/park-search");
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

app.get("/find-partners", async (req, res) => {
  //get reservations that are looking for group

  //location variable that will allow us to alter display on the frontend if we want to.
  var location;

  //Need to send username, location, facilityname, courtname, time
  // need to send facilityID, courtID, court to time id?

  if (req.session.user.location != undefined) {
    //query for no location found
    location = false;
    //var query = `select facilities.name, facilities.location, facilities.facilityID, lfg_reservations.reservationID,courts.name from facilities INNER JOIN ( select * from reservation where lfg = TRUE) lfg_reservations on facilities.facilityID = lfg_reservations.facilityID INNER JOIN courts on lfg_reservations.courtID = courts.courtID LIMIT 8;`;
    var query = `select reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
    facilities.name as parkName, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
    court_times.start_time, court_times.end_time, users.username
    from (select * from reservation where lfg = TRUE) reservations
    INNER JOIN facilities on reservations.facilityID = facilities.facilityID
    INNER JOIN courts on reservations.courtID = courts.courtID
    INNER JOIN court_times on reservations.timeID = court_times.timeID
    INNER JOIN users on reservations.userID = users.userID;`;
    console.log("here");
    db.any(query)
      .then((data) => {
        res.render("pages/find-partners", {
          data: data,
          location: location,
          user_id: user.user_id
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
        res.status(400);
      });
  }
  else {
    location = true;
    var query = `select reservations.reservationID, reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
     facilities.name as parkName, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
     court_times.start_time, court_times.end_time, users.username
     from (select * from reservation where lfg = TRUE) reservations
     INNER JOIN facilities on reservations.facilityID = facilities.facilityID
     INNER JOIN courts on reservations.courtID = courts.courtID
     INNER JOIN court_times on reservations.timeID = court_times.timeID
     INNER JOIN users on reservations.userID = users.userID;`;
    console.log("here1");
    console.log(req.session.user.location);
    db.any(query)
      .then((data) => {
        res.render("pages/find-partners", {
          data: data,
          location: location,
          user_id: user.user_id
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
        res.status(400);
      });
  }

});

app.post("/join-reservation", (req, res) => {
  var query = `update reservation set joinedUserID = '${req.session.user.user_id}' where reservationID = '${req.body.reservationID}' returning *;`;

  db.any(query)
    .then((data) => {
      var query2 = `update reservation set lfg = 'FALSE' where reservationID = '${req.body.reservationID}' returning *;`;
      db.any(query2)
        .then((data2) => {
          res.redirect("/find-partners");
        })
        .catch((error) => {
          console.log(error);
          res.redirect("/find-partners")
        })
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
      res.status(400);
    });
});

app.get("/featured-parks", (req, res) => {

  //returns error, needs work
  //possibly because there are currently no resverations in table?
  //facilities.name, COUNT(facilities.name), facilities.location
  const query =
    "SELECT facilities.name, COUNT(facilities.name) FROM facilities INNER JOIN reservation ON facilities.facilityID = reservation.facilityID GROUP BY facilities.name ORDER BY COUNT(facilities.name) DESC LIMIT 8; ";


  //placeholder query for testing
  //const query = "select * from facilities LIMIT 8;";

  db.any(query)

    .then((data) => {
      res.status(200);
      res.render("pages/featured-parks", { data: data, user_id: user.user_id });
    })
    .catch((err) => {
      res.status(400);
      console.log(err);
    });
});

//Start server
module.exports = app.listen(3000);
