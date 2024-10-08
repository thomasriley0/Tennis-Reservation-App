const express = require("express");
const app = express();
const pgp = require("pg-promise")();
const session = require("express-session");
const bcrypt = require("bcrypt");
const axios = require("axios");
const bodyParser = require("body-parser");

// database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST,
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
  db.task("home-page", (task) => {
    var location;

    const getParks = "SELECT facilities.name, facilities.facilityID, facilities.img, facilities.city, COUNT(facilities.name) as numres FROM facilities INNER JOIN reservation ON facilities.facilityID = reservation.facilityID GROUP BY facilities.name, facilities.facilityID, facilities.img, facilities.city ORDER BY COUNT(facilities.name) DESC LIMIT 8; ";

    if (user.location != undefined) {
      //query for no location found
      location = false;
      var findPartners = `select reservations.reservationID, reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
    facilities.name as parkName, facilities.img, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
    court_times.start_time, court_times.end_time, users.username
    from (select * from reservation where lfg = TRUE) reservations
    INNER JOIN facilities on reservations.facilityID = facilities.facilityID
    INNER JOIN courts on reservations.courtID = courts.courtID
    INNER JOIN court_times on reservations.timeID = court_times.timeID
    INNER JOIN users on reservations.userID = users.userID;`;
      return task.batch([task.any(findPartners, []), task.any(getParks, [])]);
    } else {
      location = true;
      var findPartners = `select reservations.reservationID, reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
     facilities.name as parkName, facilities.img, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
     court_times.start_time, court_times.end_time, users.username
     from (select * from reservation where lfg = TRUE) reservations
     INNER JOIN facilities on reservations.facilityID = facilities.facilityID
     INNER JOIN courts on reservations.courtID = courts.courtID
     INNER JOIN court_times on reservations.timeID = court_times.timeID
     INNER JOIN users on reservations.userID = users.userID;`;
      return task.batch([task.any(findPartners, []), task.any(getParks, [])]);
    }
  })
    .then((data) => {
      res.status(200);
      res.render("pages/home", {
        user_id: user.user_id,
        parks: data[1],
        partnerInfo: data[0],
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("pages/home", {
        user_id: user.user_id,
        parks: [],
        partnerInfo: [],
      });
      res.status(400);
    });
});
//Login API Routes
app.get("/login", (req, res) => {
  res.render("pages/login", { user_id: user.user_id });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  user = {};
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const password = req.body.password;
    const query = `select * from users where LOWER(username)='${username}';`;
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

  var error;

  const query1 = `select * from users where LOWER(username) = '${req.body.username.toLowerCase()}';`;

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

app.get("/park", (req, res) => {
  const park_id = req.query.id;

  const query = `SELECT * from courts where facilityID = '${park_id}';`;

  const park = `SELECT * FROM facilities WHERE facilityID = ${park_id};`;

  // db.any(query).then((data)=>{

  //   res.status(201)
  //   res.render("pages/park",{data:data, user_id: user.user_id});  /*sends court id, start_time, end_time, court_name for the park */
  //   console.log(data)

  // }).catch((err)=>{

  //     console.log(err);
  //     res.status(400)
  //     res.render("pages/park",{data: [], user_id: user.user_id})
  // })
  // });
  //

  db.task((task) => {
    return task.batch([task.any(query), task.any(park)]);
  })
    .then((data) => {
      res.status(201);
      res.render("pages/park", {
        courts: data[0],
        park: data[1][0],
        user_id: user.user_id,
      });
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
    });
});

app.get("/court", (req, res) => {
  const court_id = req.query.courtid;

  const query = `SELECT courts.facilityID as facilityID, courts.name AS name, courts.courtid as courtId, court_times.timeid AS timeID, court_times.court_date AS date, court_times.start_time AS start_time, court_times.end_time AS end_time
  FROM court_times
  INNER JOIN court_to_times
  ON court_times.timeID = court_to_times.timeID 
  INNER JOIN courts
  ON court_to_times.courtID = courts.courtID
  AND courts.courtID = '${court_id}';`;

  db.any(query)
    .then((data) => {
      res.status(201);
      res.render("pages/court", { data: data, user_id: user.user_id });
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
      res.render("pages/court", { data: [], user_id: user.user_id });
    });
});

app.get("/reservations", (req, res) => {
  var query = `SELECT courts.name AS court, facilities.name AS park, 
  facilities.address, court_times.court_date,
  court_times.start_time, court_times.end_time, reservation.lfg,
  reservation.reservationID, reservation.userID, reservation.joinedUserID, users.username
  FROM reservation
  INNER JOIN courts
  ON reservation.courtID = courts.courtID
  INNER JOIN court_times
  ON reservation.timeID = court_times.timeID
  INNER JOIN facilities
  ON reservation.facilityID = facilities.facilityID
  AND (reservation.userID = ${req.session.user.user_id} OR reservation.joinedUserID = ${req.session.user.user_id})
  INNER JOIN users
  on reservation.userID = users.userID`;

  db.any(query)
    .then((data) => {
      res.status(201);
      res.render("pages/reservations", {
        data: data,
        user_id: user.user_id,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
    });
});

app.post("/reservations", (req, res) => {
  const query = `DELETE FROM reservation WHERE reservationID = '${req.body.reservationID}';`;

  db.any(query)
    .then((data) => {
      res.status(201);
      res.redirect("/reservations");
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
    });
});

app.post("/reserve", (req, res) => {
  const courtId = req.body.courtid;
  const timeId = req.body.timeid;
  const lfg = req.body.lfg;
  const facilityId = req.body.facilityid;

  if (lfg) {
    query = `INSERT INTO reservation (userID,courtID,timeID,facilityID,lfg) VALUES ('${req.session.user.user_id}','${courtId}','${timeId}','${facilityId}',true);`;
  } else {
    query = `INSERT INTO reservation (userID,courtID,timeID,facilityID,lfg) VALUES ('${req.session.user.user_id}','${courtId}','${timeId}','${facilityId}',false);`;
  }

  query2 = `DELETE FROM court_to_times WHERE timeID = '${timeId}';`;

  db.task("post-everything", (task) => {
    return task.batch([task.any(query), task.any(query2)]);
  })

    .then((data) => {
      console.log("reservation has been added");
      res.status(201);
      res.redirect("/reservations");
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
    });

  //console.log(
  // `Start time: ${start}, End time: ${end}, Date: ${court_date}, CourtId: ${courtId}`
  //);

  // DELETE from court_times WHERE court_date = court_date, start = start, end = end, id = courtId

  // const delete_q =
  // `DELETE
  // FROM court_times
  // INNER JOIN court_to_times
  // ON court_times.timeID = court_to_times.timeID
  // INNER JOIN courts
  // ON court_to_times.courtID = courts.courtID
  // AND courts.courtID = '${courtId}' WHERE court_date = '${court_date}' AND start_date = '${start}' AND end_time = '${end}' AND courts.courtID = '${courtId}' ;`;

  //Insert time-id user-id court-id  lfg=true

  //const reserve_q = `INSERT INTO reservation (userid, courtid, timeid, lfg) VALUES (${req.session.user.user_id}, ${courtId}, ${timeId}, TRUE) returning *;`;

  //db.task((task) => {
  // return task.batch([task.any(reserve_q), task.any(delete_q)]);
  // }).then((data) => {
  // res.status(200);
  //console.log("help");
  //});
});

app.get("/profile", (req, res) => {
  const query = `SELECT username, userID, rating, gender, image, description, age, location FROM users WHERE userID = '${req.session.user.user_id}';`;

  db.any(query)

    .then(function (data) {
      res.render("pages/profile", {
        data: data,
        user_id: user.user_id,
      });
      res.status(201);
    })
    .catch((err) => {
      res.status(400);
      console.log(err);
    });
});

app.get("/user", (req, res) => {
  const query = `SELECT username, userID, rating, gender, image, description, age, location FROM users WHERE userID = '${req.query.userID}';`;

  db.any(query)

    .then(function (data) {
      console.log(data)
      res.render("pages/user", {
        data: data,
        user_id: user.user_id,
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
  if (!req.query.zip) {
    const query = "SELECT * FROM facilities;";
    db.any(query)
      .then((data) => {
        const parkCount = Object.keys(data).length;
        res.status(201);
        res.render("pages/park-search", {
          parks: data,
          zip: "",
          user_id: user.user_id,
          parkCount: parkCount,
        });
      })
      .catch((err) => {
        res.status(400);
        res.render("pages/park-search", {
          parks: [],
          zip: "",
          user_id: user.user_id,
          parkCount: 0,
        });
      });
  } else {
    const options = {
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.zip}&key=${process.env.GOOGLE_API_KEY}`,
      method: "GET",
    };

    axios(options)
      .then((response) => {
        const results = response.data["results"][0];

        var radius = 30;
        var zip = req.query.zip;
        var radius_lat = radius / 68.707;
        var radius_long = radius / (69.171 * Math.cos(radius_lat));

        var latPlus = results.geometry.location["lat"] + radius_lat;
        var latMinus = results.geometry.location["lat"] - radius_lat;
        var longPlus = results.geometry.location["lng"] + radius_long;
        var longMinus = results.geometry.location["lng"] - radius_long;

        const query = `SELECT * FROM facilities WHERE (latitude < '${latPlus}' AND latitude > '${latMinus}')
         AND (longitude > '${longMinus}' AND longitude < '${longPlus}');`;

        db.any(query)
          .then((data) => {
            const parkCount = Object.keys(data).length;
            res.status(201);
            res.render("pages/park-search", {
              parks: data,
              zip: req.query.zip,
              user_id: user.user_id,
              parkCount: parkCount,
            });
          })
          .catch((err) => {
            res.status(400);
            console.log(err);
            res.render("pages/park-search", {
              parks: [],
              zip: req.query.zip,
              user_id: user.user_id,
              parkCount: 0,
            });
          });
      })
      .catch((err) => {
        res.status(400);
        res.render("pages/park-search", {
          parks: [],
          zip: req.query.zip,
          user_id: user.user_id,
          parkCount: 0,
        });
      });
  }
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
      res.status(201);
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/profile");
      res.status(400);
    });
});

app.get("/find-partners", async (req, res) => {
  //location variable that will allow us to alter display on the frontend if we want to.
  var location;
  var singleView = false;
  if (req.query.id) {
    singleView = true;
    var reservationId = req.query.id;
    var getReservation = `select reservations.reservationID, reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
    facilities.name as parkName, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
    court_times.start_time, court_times.end_time, users.username
    from (select * from reservation where (reservationID = ${reservationId} AND userID <> ${req.session.user.user_id})) reservations
    INNER JOIN facilities on reservations.facilityID = facilities.facilityID
    INNER JOIN courts on reservations.courtID = courts.courtID
    INNER JOIN court_times on reservations.timeID = court_times.timeID
    INNER JOIN users on (reservations.userID = users.userID AND users.userID <> ${req.session.user.user_id});`;

    db.any(getReservation)
      .then((data) => {
        res.render("pages/find-partners", {
          data: data,
          location: location,
          user_id: user.user_id,
          singleView: singleView,
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/find-partners");
        res.status(400);
      });
  } else {
    //get reservations that are looking for group

    //Need to send username, location, facilityname, courtname, time
    // need to send facilityID, courtID, court to time id?

    if (req.session.user.location != undefined) {
      //query for no location found
      location = false;
      var query = `select reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
    facilities.name as parkName, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
    court_times.start_time, court_times.end_time, users.username
    from (select * from reservation where lfg = TRUE) reservations
    INNER JOIN facilities on reservations.facilityID = facilities.facilityID
    INNER JOIN courts on reservations.courtID = courts.courtID
    INNER JOIN court_times on reservations.timeID = court_times.timeID
    INNER JOIN users on reservations.userID = users.userID;`;
      db.any(query)
        .then((data) => {
          res.render("pages/find-partners", {
            data: data,
            location: location,
            user_id: user.user_id,
            singleView: singleView,
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/");
          res.status(400);
        });
    } else {
      location = true;
      var query = `select reservations.reservationID, reservations.facilityID, reservations.timeID, reservations.courtID, reservations.userID,
     facilities.name as parkName, facilities.location, facilities.city, courts.name as courtName, court_times.court_date, 
     court_times.start_time, court_times.end_time, users.username
     from (select * from reservation where lfg = TRUE) reservations
     INNER JOIN facilities on reservations.facilityID = facilities.facilityID
     INNER JOIN courts on reservations.courtID = courts.courtID
     INNER JOIN court_times on reservations.timeID = court_times.timeID
     INNER JOIN users on reservations.userID = users.userID;`;
      db.any(query)
        .then((data) => {
          res.render("pages/find-partners", {
            data: data,
            location: location,
            user_id: user.user_id,
            singleView: singleView,
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/");
          res.status(400);
        });
    }
  }
});

app.post("/join-reservation", (req, res) => {
  var query = `update reservation set joinedUserID = '${req.session.user.user_id}' where reservationID = '${req.body.reservationID}' returning *;`;

  db.any(query)
    .then((data) => {
      var query2 = `update reservation set lfg = 'FALSE' where reservationID = '${req.body.reservationID}' returning *;`;
      db.any(query2)
        .then((data2) => {
          console.log("joined reservation");
          res.redirect("/reservations");
        })
        .catch((error) => {
          res.status(400);
          console.log(error);
          res.redirect("/find-partners");
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
      res.redirect("/");
    });
});

app.get("/featured-parks", (req, res) => {
  //returns error, needs work
  //possibly because there are currently no resverations in table?
  const query =

    "SELECT facilities.name, facilities.facilityID, facilities.img, facilities.city, COUNT(facilities.name) as numres FROM facilities INNER JOIN reservation ON facilities.facilityID = reservation.facilityID GROUP BY facilities.name, facilities.facilityID, facilities.img, facilities.city ORDER BY COUNT(facilities.name) DESC; "


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
