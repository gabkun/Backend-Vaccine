import db from "../utils/db.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const formatPhoneNumber = (number) => {
  if (!number) return null;

  let cleaned = String(number).trim().replace(/\D/g, "");

  if (cleaned.startsWith("09")) {
    cleaned = "63" + cleaned.substring(1); // 09171234567 -> 639171234567
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "63" + cleaned; // 9171234567 -> 639171234567
  } else if (cleaned.startsWith("63")) {
    // already okay
  } else {
    return null;
  }

  return cleaned;
};

const sendSmsToRecipients = async (numbers, message) => {
  try {
    if (!numbers || numbers.length === 0 || !message) {
      return {
        success: false,
        error: "Numbers and message are required.",
      };
    }

    if (message.trim().toUpperCase().startsWith("TEST")) {
      return {
        success: false,
        error: 'Message must not start with the word "TEST".',
      };
    }

    const payload = new URLSearchParams();
    payload.append("apikey", process.env.SEMAPHORE_API_KEY);
    payload.append("number", numbers.join(",")); // send to multiple recipients in one POST
    payload.append("message", message);
    payload.append("sendername", "BrgyVaccine");

    const response = await axios.post(
      "https://api.semaphore.co/api/v4/messages",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      success: true,
      recipients: numbers,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "SMS FAILED:",
      error.response?.data || error.message
    );

    return {
      success: false,
      recipients: numbers,
      error: error.response?.data || error.message,
    };
  }
};

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
    const insertSql = `
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
      insertSql,
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
      (insertErr, insertResult) => {
        if (insertErr) {
          return res.status(500).json({ error: insertErr });
        }

        const fetchSql = `
          SELECT
            i.firstname,
            i.middlename,
            i.lastname,
            i.suffix,
            i.f_contact,
            i.m_contact,
            v.vaccine_name
          FROM tbl_infant i
          LEFT JOIN tbl_vaccine v ON v.id = ?
          WHERE i.id = ?
          LIMIT 1
        `;

        db.query(fetchSql, [vaccine_id, infant_id], async (fetchErr, fetchResult) => {
          if (fetchErr) {
            return res.status(500).json({ error: fetchErr });
          }

          if (!fetchResult || fetchResult.length === 0) {
            return res.status(201).json({
              message: "Vaccination record created successfully, but infant not found for SMS sending",
              vaccinationId: insertResult.insertId,
            });
          }

          const infant = fetchResult[0];

          const fullName = [
            infant.firstname,
            infant.middlename,
            infant.lastname,
            infant.suffix,
          ]
            .filter(Boolean)
            .join(" ");

          const vaccineName = infant.vaccine_name || "vaccination";

          const smsMessage = `Hi Mr/Ms. Your child ${fullName} is scheduled for ${vaccineName} on ${scheduled_on}. Please visit Barangay Canlandog Health Center.`;

          const motherContact = formatPhoneNumber(infant.m_contact);
          const fatherContact = formatPhoneNumber(infant.f_contact);

          const recipients = [...new Set([motherContact, fatherContact].filter(Boolean))];

          let smsResult = {
            success: false,
            error: "No valid recipient numbers found.",
          };

          if (recipients.length > 0) {
            smsResult = await sendSmsToRecipients(recipients, smsMessage);
          }

          return res.status(201).json({
            message: "Vaccination record created successfully",
            vaccinationId: insertResult.insertId,
            smsResult,
          });
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message || error });
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

export const getScheduledInfantsAllMonths = async (req, res) => {
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

      ORDER BY s.scheduled_on ASC, s.id ASC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err });
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