const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.id, 
                i.comp_code, 
                i.amt, 
                i.paid, 
                i.add_date, 
                i.paid_date, 
                c.name, 
                c.description 
         FROM invoices AS i
           INNER JOIN companies AS c ON (i.comp_code = c.code)  
         WHERE id = $1`,
      [req.params.id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No such invoice`, 404);
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };

    return res.json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    let id = req.params.id;
    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid
         FROM invoices
         WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }
    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const results = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
    WHERE id = $4
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const results = db.query("DELETE FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    return res.send({ msg: "DELETED!" });
  } catch (e) {
    return next(e);
  }
});
module.exports = router;
