import db from "../utils/db.js";

// CREATE PUROK
export const createPurok = async (req, res) => {
  const { purok_name, purok_status } = req.body;

  if (!purok_name) {
    return res.status(400).json({ message: "Purok name is required" });
  }

  try {
    // Check if Purok already exists
    db.query(
      "SELECT * FROM tbl_purok WHERE purok_name = ?",
      [purok_name],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
          return res.status(400).json({ message: "Purok already exists" });
        }

        // Insert Purok
        const sql = `
          INSERT INTO tbl_purok (purok_name, purok_status)
          VALUES (?, ?)
        `;

        db.query(
          sql,
          [
            purok_name,
            purok_status !== undefined ? purok_status : 1, // default active
          ],
          (err, insertResult) => {
            if (err) return res.status(500).json({ error: err });

            res.status(201).json({
              message: "Purok created successfully",
              purokId: insertResult.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// GET ALL PUROKS
export const getAllPuroks = async (req, res) => {
  try {
    const sql = "SELECT * FROM tbl_purok ORDER BY id DESC";

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err });

      res.status(200).json(results);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getPurokById = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "ID is required" });

  try {
    const sql = "SELECT * FROM tbl_purok WHERE id = ? LIMIT 1";

    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });

      if (results.length === 0) {
        return res.status(404).json({ message: "Purok not found" });
      }

      res.status(200).json(results[0]);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Update Purok by ID
export const updatePurok = async (req, res) => {
  const { id } = req.params;
  const { purok_name, purok_status } = req.body;

  if (!id || !purok_name) {
    return res.status(400).json({ message: "Purok ID and name are required" });
  }

  try {
    // ✅ Check duplicate name (exclude current record)
    db.query(
      "SELECT id FROM tbl_purok WHERE purok_name = ? AND id != ?",
      [purok_name, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
          return res.status(400).json({ message: "Purok name already exists" });
        }

        const sql = `
          UPDATE tbl_purok SET
            purok_name = ?,
            purok_status = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [
            purok_name,
            purok_status !== undefined ? purok_status : 1,
            id,
          ],
          (err, updateResult) => {
            if (err) return res.status(500).json({ error: err });

            if (updateResult.affectedRows === 0) {
              return res.status(404).json({ message: "Purok not found" });
            }

            res.status(200).json({
              message: "Purok updated successfully",
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Delete Purok by ID
export const deletePurok = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Purok ID is required" });
  }

  try {
    const sql = "DELETE FROM tbl_purok WHERE id = ?";

    db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Purok not found" });
      }

      res.status(200).json({
        message: "Purok deleted successfully",
      });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};
