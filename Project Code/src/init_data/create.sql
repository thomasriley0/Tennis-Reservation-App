DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(

    userID  SERIAL PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(30),
    rating DECIMAL(3,1), /* max is 99.9 but should be 1 - 10*/
    location INT, /* zip code */
    age INT,
    gender VARCHAR(10),
    description VARCHAR(200)  /*optional description max 200 characters*/

);

DROP TABLE IF EXISTS facilities CASCADE;
CREATE TABLE facilities(

    facilityID SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location INT


);

DROP TABLE IF EXISTS courts CASCADE;
CREATE TABLE courts(

    courtID SERIAL PRIMARY KEY,
    facilityID INT NOT NULL,
    name VARCHAR(40),

    FOREIGN KEY (facilityID) REFERENCES facilities(facilityID)

);

DROP TABLE IF EXISTS court_times CASCADE;
CREATE TABLE court_times(

    timeID SERIAL PRIMARY KEY,
    court_date DATE,
    start_time VARCHAR(10),
    end_time VARCHAR(10)

);

DROP TABLE IF EXISTS courts_to_times CASCADE;
CREATE TABLE court_to_times(

    courtID INT NOT NULL,
    timeID INT NOT NULL,

    FOREIGN KEY (courtID) REFERENCES courts(courtID),
    FOREIGN KEY (timeID) REFERENCES court_times(timeID)


);

DROP TABLE IF EXISTS reservation CASCADE;
CREATE TABLE reservation(

    reservationID SERIAL PRIMARY KEY,
    userID INT NOT NULL,
    courtID INT NOT NULL,
    timeID INT NOT NULL,
    lfg BOOLEAN NOT NULL /*looking for group */

    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (courtID) REFERENCES courts(courtID),
    FOREIGN KEY (timeID) REFERENCES court_times(timeID)

);



