const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const newCode = slugify(code, {
      lower: true,
      strict: true,
    });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
      [newCode, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    let code = req.params.code;

    const compResult = await db.query(
      `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
      [code]
    );

    const invResult = await db.query(
      `SELECT id
           FROM invoices
           WHERE comp_code = $1`,
      [code]
    );

    const indResult = await db.query(
      `SELECT ci.industry_code, i.industry_name
           FROM company_industries AS ci 
           LEFT JOIN industries AS i ON ci.industry_code = i.code
           WHERE comp_code = $1`,
      [code]
    );

    if (compResult.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }
    const company = compResult.rows[0];
    const invoices = invResult.rows;
    const industries = indResult.rows;

    company.invoices = invoices.map((inv) => inv.id);
    company.industries = industries.map((industry) => industry.industry_name);

    return res.json({ company: company });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
               WHERE code = $3
               RETURNING code, name, description`,
      [name, description, req.params.id]
    );

    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const results = db.query("DELETE FROM companies WHERE code = $1", [
      req.params.id,
    ]);
    return res.send({ msg: "DELETED!" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
