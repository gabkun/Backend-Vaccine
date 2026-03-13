import db from "../utils/db.js";

// CREATE VACCINE
export const createVaccine = async (req, res) => {
  const { vaccine_name, description, status } = req.body;

  if (!vaccine_name) {
    return res.status(400).json({ message: "Vaccine name is required" });
  }

  try {
    // Check if vaccine already exists
    db.query(
      "SELECT * FROM tbl_vaccine WHERE vaccine_name = ?",
      [vaccine_name],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
          return res.status(400).json({ message: "Vaccine already exists" });
        }

        // Insert vaccine
        const sql = `
          INSERT INTO tbl_vaccine (vaccine_name, description, status)
          VALUES (?, ?, ?)
        `;

        db.query(
          sql,
          [
            vaccine_name,
            description || null,
            status !== undefined ? status : 1, // default active
          ],
          (err, insertResult) => {
            if (err) return res.status(500).json({ error: err });

            res.status(201).json({
              message: "Vaccine created successfully",
              vaccineId: insertResult.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// GET ALL VACCINES
export const getVaccines = async (req, res) => {
  try {
    db.query("SELECT * FROM tbl_vaccine ORDER BY id DESC", (err, result) => {
      if (err) return res.status(500).json({ error: err });

      res.status(200).json(result);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getTotalVaccines = async (req, res) => {
  try {
    const sql = "SELECT COUNT(*) AS totalVaccines FROM tbl_vaccine";

    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err });

      res.status(200).json({
        totalVaccines: result[0].totalVaccines
      });
    });

  } catch (error) {
    res.status(500).json({ error });
  }
};

// GET VACCINE BY ID
export const getVaccineById = async (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM tbl_vaccine WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.length === 0) {
      return res.status(404).json({ message: "Vaccine not found" });
    }

    res.status(200).json(result[0]);
  });
};

// UPDATE VACCINE
export const updateVaccine = async (req, res) => {
  const { id } = req.params;
  const { vaccine_name, description, status } = req.body;

  db.query("SELECT * FROM tbl_vaccine WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.length === 0) {
      return res.status(404).json({ message: "Vaccine not found" });
    }

    const sql = `
      UPDATE tbl_vaccine 
      SET vaccine_name = ?, description = ?, status = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        vaccine_name || result[0].vaccine_name,
        description !== undefined ? description : result[0].description,
        status !== undefined ? status : result[0].status,
        id,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err });

        res.status(200).json({ message: "Vaccine updated successfully" });
      }
    );
  });
};

// DELETE VACCINE
// ✅ Delete vaccine by ID (also deletes related scheduling records)
export const deleteVaccine = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Vaccine ID is required" });

  // Check if vaccine exists first (keep your logic)
  db.query("SELECT * FROM tbl_vaccine WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.length === 0) {
      return res.status(404).json({ message: "Vaccine not found" });
    }

    // 1) delete child rows first
    db.query("DELETE FROM tbl_scheduling WHERE vaccine_id = ?", [id], (schedErr, schedRes) => {
      if (schedErr) return res.status(500).json({ error: schedErr });

      // 2) delete the parent vaccine
      db.query("DELETE FROM tbl_vaccine WHERE id = ?", [id], (delErr, delRes) => {
        if (delErr) return res.status(500).json({ error: delErr });

        return res.status(200).json({
          message: "Vaccine deleted successfully",
          deletedSchedulingRows: schedRes.affectedRows
        });
      });
    });
  });
};