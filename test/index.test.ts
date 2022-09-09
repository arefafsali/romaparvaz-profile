const request = require('supertest')
const server = require('../src/index')
describe('Get Endpoints', () => {
  it('Get', async (done) => {
    const res = await request(server)
      .get('/')
      .send({
        userId: 1,
        title: 'test is cool',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('nome');
    done();
  })
})
afterAll(async done => {
  server.close();
  done();
});
// let chaiSas = require("chai");
// let chaiHttp = require("chai-http");
// let server = require("../src/index");
// let should = chaiSas.should();

// chaiSas.use(chaiHttp);

// describe("/GET users", () => {
//   it("it should GET all the users", done => {
//     chaiSas
//       .request(server)
//       .get("/users")
//       .end((err, res) => {
//         res.should.have.status(200);
//         res.body.should.be.a("array");
//         // res.body.length.should.be.eql(3);
//         done();
//       });
//   });
// });
