// Imports the index.js file to be tested.
const server = require("../index"); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

describe("Login", () => {
  //testing logging in with user credentials that already exist in the db.
  it("positive : /login", (done) => {
    chai
      .request(server)
      .post("/login")
      .send({ username: "Caleb", password: "pass" })
      .end((err, res) => {
        expect(err).to.equal(null);
        expect(res).to.have.status(200);
        // expect(res.body.username).to.equals('Caleb');
        assert.strictEqual(res.body.username, "Caleb"); //making sure that we received the right information.
        done();
      });
  });

  it("negative : /login", (done) => {
    chai
      .request(server)
      .post("/login")
      .send({ username: "Caleb", password: "pass2" })
      .end((err, res) => {
        expect(err).to.equal(null); //Should not have an error, we will handle this accordingly
        expect(res).to.have.status(400); // Returns 400 status to indicate something went wrong
        done();
      });
  });
});

describe("Register", () => {
  //registering a user that does not exist in the database yet
  it("positive : /register", (done) => {
    chai
      .request(server)
      .post("/register")
      .send({ username: "johndoe", password: "pass" })
      .end((err, res) => {
        expect(err).to.equal(null);
        expect(res).to.have.status(200);
        done();
      });
  });
  //trying to insert into db when username already exists
  it("negative : /register", (done) => {
    chai
      .request(server)
      .post("/register")
      .send({ username: "johndoe", password: "pass" })
      .end((err, res) => {
        expect(err).to.equal(null); // We shouldn't have an error, but we will handle it otherwise.
        expect(res).to.have.status(400); //400 status to indicate that something did go wrong.
        done();
      });
  });
});
