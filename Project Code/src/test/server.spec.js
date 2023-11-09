// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/')
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res).to.have.status(200);

        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

describe('Login',()=>{
  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'johndoe', password: 'pass'})
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res).to.have.status(200);
        expect(res.body.username).to.equals('johndoe');
        done();
      });
  });

  it('negative : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'johndoe', password: 'pass2'})
      .end((err, res) => {
        expect(err).not.equal(null)
        expect(res).to.have.status(400);
        done();
      });
  });
});

describe('Register',()=>{

  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'johndoe', password: 'pass'})
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res).to.have.status(200);
        done();
      });
  });

  it('negative : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'johndoe', password: 'pass'})
      .end((err, res) => {
        expect(err).not.equal(null)
        expect(res).to.have.status(400);
        done();
      });
  });
});

  // ===========================================================================
  
});