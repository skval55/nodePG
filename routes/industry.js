const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results =
      await db.query(`SELECT i.code, i.industry_name, c.name FROM industries AS i 
    LEFT JOIN company_industries AS ci ON ci.industry_code = i.code
    LEFT JOIN companies As c ON ci.comp_code = c.code`);

    let result = {};
    let industry = results.rows.map((r) => {
      if (result[r.industry_name]) {
        result[r.industry_name].push(r.name);
      } else result[r.industry_name] = [r.name];
    });
    return res.json({ industries: result });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry_name) 
             VALUES ($1, $2)
             RETURNING code, industry_name`,
      [code, name]
    );
    return res.status(201).json({ indiustry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/:code", async (req, res, next) => {
  try {
    const { industry_code } = req.body;
    const comp_code = req.params.code;
    const result = await db.query(
      `INSERT INTO company_industries (comp_code, industry_code) 
             VALUES ($1, $2)
             RETURNING comp_code, industry_code`,
      [comp_code, industry_code]
    );
    return res.status(201).json({ company_industry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
