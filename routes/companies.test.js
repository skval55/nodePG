process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeAll(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

beforeEach(async () => {
  const compResult = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('testcode', 'testname', 'this is a test company' ) RETURNING  code, name, description`
  );
  testCompany = compResult.rows[0];
  const invoiceResult = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('testcode', 100, false, null ) RETURNING id, comp_code, amt, paid, paid_date`
  );
  testInvoice = invoiceResult.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/code", () => {
  test("Get single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: [testInvoice.id],
      },
    });
  });
  test("Get 404 when wrong code", async () => {
    const res = await request(app).get(`/companies/wrongcode`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app).post("/companies").send({
      code: "test2",
      name: "test2",
      description: "test 2 description",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "test2",
        name: "test2",
        description: "test 2 description",
      },
    });
  });
});

describe("PATCH /companies/code", () => {
  test("update a single company", async () => {
    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({
        name: "updated",
        description: "test company updated ",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: "updated",
        description: "test company updated ",
      },
    });
  });
});

describe("DELETE /companies/code", () => {
  test("DELETE a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: "DELETED!" });
  });
});
