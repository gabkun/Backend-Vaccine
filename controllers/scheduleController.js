import db from "../utils/db.js";

export const createVaccination = async (req, res) => {
  const {
    vaccine_id,
    infant_id,
    midwife_id,
    dose_type,
    remarks,
    scheduled_on,
    status,
    completed_at,
  } = req.body;

  // ✅ Validation for required fields
  if (
    !vaccine_id ||
    !infant_id ||
    !midwife_id ||
    !dose_type ||
    !scheduled_on ||
    status === undefined
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    // ✅ Insert vaccination record
    const sql = `
      INSERT INTO tbl_scheduling (
        vaccine_id,
        infant_id,
        midwife_id,
        dose_type,
        remarks,
        scheduled_on,
        created_at,
        status,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `;

    db.query(
      sql,
      [
        vaccine_id,
        infant_id,
        midwife_id,
        dose_type,
        remarks || null,
        scheduled_on,
        status,
        completed_at || null,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.status(201).json({
          message: "Vaccination record created successfully",
          vaccinationId: result.insertId,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const getVaccinationByInfantId = async (req, res) => {
  const { infant_id } = req.params;

  if (!infant_id) {
    return res.status(400).json({ message: "Infant ID is required" });
  }

  try {
    const sql = `
      SELECT
        s.id AS schedule_id,

        -- Dose Type Mapping
        CASE
          WHEN s.dose_type = 1 THEN '1st Dose'
          WHEN s.dose_type = 2 THEN '2nd Dose'
          WHEN s.dose_type = 3 THEN 'Booster'
          ELSE 'Unknown'
        END AS dose_type,

        -- Status Mapping (only Completed is returned anyway)
        CASE
          WHEN s.status = 0 THEN 'Cancelled'
          WHEN s.status = 1 THEN 'Scheduled'
          WHEN s.status = 2 THEN 'Completed'
        END AS status,

        s.remarks,
        s.scheduled_on,
        s.completed_at,

        v.vaccine_name,

        CONCAT(
          m.firstname, ' ',
          IFNULL(m.middlename, ''), ' ',
          m.lastname
        ) AS midwife_name

      FROM tbl_scheduling s
      LEFT JOIN tbl_vaccine v ON v.id = s.vaccine_id
      LEFT JOIN tbl_midwife m ON m.id = s.midwife_id

      WHERE s.infant_id = ?
        AND s.status = 2   -- ✅ ONLY COMPLETED

      ORDER BY s.completed_at ASC
    `;

    db.query(sql, [infant_id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.status(200).json(results);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getScheduledInfantsThisMonth = async (req, res) => {
  try {
    const sql = `
      SELECT
        s.id AS schedule_id,

        -- Infant Full Name Parts
        i.firstname,
        i.middlename,
        i.lastname,
        i.suffix,

        -- Schedule Info
        DATE_FORMAT(s.scheduled_on, '%Y-%m-%d') AS scheduled_on,
        s.status,

        -- Midwife Info
        s.midwife_id,
        m.firstname AS midwife_firstname,
        m.middlename AS midwife_middlename,
        m.lastname AS midwife_lastname,

        -- Vaccine Info
        s.vaccine_id,
        v.vaccine_name,

        -- Dose Type Mapping
        s.dose_type,
        CASE
          WHEN s.dose_type = 1 THEN '1st Dose'
          WHEN s.dose_type = 2 THEN '2nd Dose'
          WHEN s.dose_type = 3 THEN 'Booster Shot'
          ELSE 'Unknown'
        END AS dose_type_label

      FROM tbl_scheduling s
      INNER JOIN tbl_infant i 
        ON i.id = s.infant_id
      INNER JOIN tbl_vaccine v 
        ON v.id = s.vaccine_id
      INNER JOIN tbl_midwife m
        ON m.id = s.midwife_id

      WHERE s.status = 1
        AND MONTH(s.scheduled_on) = MONTH(CURDATE())
        AND YEAR(s.scheduled_on) = YEAR(CURDATE())

      ORDER BY s.scheduled_on ASC, s.id ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.status(200).json(results);
    });

  } catch (error) {
    res.status(500).json({ error });
  }
};

export const completeVaccination = async (req, res) => {
  const { schedule_id } = req.params;
  const { remarks } = req.body;

  if (!schedule_id) {
    return res.status(400).json({ message: "Schedule ID is required" });
  }

  try {
    const sql = `
      UPDATE tbl_scheduling
      SET status = 2,
          completed_at = CURDATE(),
          remarks = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [remarks || null, schedule_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Vaccination schedule not found" });
        }

        res.status(200).json({
          message: "Vaccination marked as completed",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const cancelVaccination = async (req, res) => {
  const { schedule_id } = req.params;
  const { remarks } = req.body;

  if (!schedule_id) {
    return res.status(400).json({ message: "Schedule ID is required" });
  }

  try {
    const sql = `
      UPDATE tbl_scheduling
      SET status = 0,
          completed_at = NULL,
          remarks = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [remarks || null, schedule_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Vaccination schedule not found" });
        }

        res.status(200).json({
          message: "Vaccination schedule cancelled",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const editVaccination = async (req, res) => {
  const { schedule_id } = req.params;
  const { vaccine_id, dose_type, scheduled_on, remarks } = req.body;

  if (!schedule_id) {
    return res.status(400).json({ message: "Schedule ID is required" });
  }

  if (!vaccine_id || !dose_type || !scheduled_on) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    const sql = `
      UPDATE tbl_scheduling
      SET vaccine_id = ?,
          dose_type = ?,
          scheduled_on = ?,
          remarks = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        vaccine_id,
        dose_type,
        scheduled_on,
        remarks || null,
        schedule_id,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Vaccination schedule not found" });
        }

        res.status(200).json({
          message: "Vaccination schedule updated successfully",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getTotalSuccessfulVaccinations = async (req, res) => {
  try {
    const sql = "SELECT COUNT(*) AS totalSuccessfulVaccinations FROM tbl_scheduling WHERE status = 2";

    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err });

      res.status(200).json({
        totalSuccessfulVaccinations: result[0].totalSuccessfulVaccinations
      });
    });

  } catch (error) {
    res.status(500).json({ error });
  }
};