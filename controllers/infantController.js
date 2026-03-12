import db from "../utils/db.js";

export const createInfant = async (req, res) => {
  const {
    firstname,
    middlename,
    lastname,
    suffix,
    sex,
    dob,
    age_year,
    age_month,
    purok_id,
    home_add,
    f_firstname,
    f_middlename,
    f_lastname,
    m_firstname,
    m_middlename,
    m_lastname,
    f_contact,
    m_contact,
    birth_document,
    profile_pic,
  } = req.body;

  // ✅ Validation for required fields
  if (!firstname || !lastname || !dob || !purok_id) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    // ✅ Insert infant record
    const sql = `
      INSERT INTO tbl_infant (
        firstname,
        middlename,
        lastname,
        suffix,
        sex,
        dob,
        age_year,
        age_month,
        purok_id,
        home_add,
        f_firstname,
        f_middlename,
        f_lastname,
        m_firstname,
        m_middlename,
        m_lastname,
        f_contact,
        m_contact,
        birth_document,
        profile_pic,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [
        firstname,
        middlename || null,
        lastname,
        suffix,
        sex,
        dob,
        age_year || null,
        age_month || null,
        purok_id,
        home_add || null,
        f_firstname || null,
        f_middlename || null,
        f_lastname || null,
        m_firstname || null,
        m_middlename || null,
        m_lastname || null,
        f_contact || null,
        m_contact || null,
        birth_document || null,
        profile_pic || null,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.status(201).json({
          message: "Infant record created successfully",
          infantId: result.insertId,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Fetch all infants
export const getAllInfants = async (req, res) => {
  try {
    const sql = "SELECT * FROM tbl_infant ORDER BY id DESC";
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(200).json(result);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Fetch single infant by ID
export const getInfantById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "SELECT * FROM tbl_infant WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.length === 0) return res.status(404).json({ message: "Infant not found" });

      res.status(200).json(result[0]);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const getInfantProfileById = async (req, res) => {
  const { infant_id } = req.params;

  if (!infant_id) {
    return res.status(400).json({ message: "Infant ID is required" });
  }

  try {
    const sql = `
      SELECT
        i.id,
        i.firstname,
        i.middlename,
        i.lastname,
        i.suffix,
        i.sex,
        i.dob,
        i.age_year,
        i.age_month,
        i.home_add,
        i.birth_document,
        i.profile_pic,
        i.purok_id,

        i.f_firstname,
        i.f_middlename,
        i.f_lastname,
        i.f_contact,

        i.m_firstname,
        i.m_middlename,
        i.m_lastname,
        i.m_contact,

        p.purok_name
        

      FROM tbl_infant i
      LEFT JOIN tbl_purok p ON p.id = i.purok_id
      WHERE i.id = ?
      LIMIT 1
    `;

    db.query(sql, [infant_id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.length === 0)
        return res.status(404).json({ message: "Infant not found" });

      const infant = result[0];

      // Prepend host URL for images
      const host = `${req.protocol}://${req.get("host")}`;
      infant.profile_pic = infant.profile_pic
        ? `${host}/${infant.profile_pic}`
        : null;
      infant.birth_document = infant.birth_document
        ? `${host}/${infant.birth_document}`
        : null;

      res.status(200).json(infant);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Update infant by ID
export const updateInfant = async (req, res) => {
  const { id } = req.params;

  const {
    firstname,
    middlename,
    lastname,
    suffix,
    sex,
    dob,
    age_year,
    age_month,
    purok_id,
    home_add,
    f_firstname,
    f_middlename,
    f_lastname,
    m_firstname,
    m_middlename,
    m_lastname,
    f_contact,
    m_contact,
    birth_document,
    profile_pic,
  } = req.body;

  // ✅ Validation
  if (!id) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    const sql = `
      UPDATE tbl_infant SET
        firstname = ?,
        middlename = ?,
        lastname = ?,
        suffix = ?,
        sex = ?,
        dob = ?,
        age_year = ?,
        age_month = ?,
        purok_id = ?,
        home_add = ?,
        f_firstname = ?,
        f_middlename = ?,
        f_lastname = ?,
        m_firstname = ?,
        m_middlename = ?,
        m_lastname = ?,
        f_contact = ?,
        m_contact = ?,
        birth_document = ?,
        profile_pic = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        firstname,
        middlename || null,
        lastname,
        suffix || null,
        sex || null,
        dob,
        age_year || null,
        age_month || null,
        purok_id,
        home_add || null,
        f_firstname || null,
        f_middlename || null,
        f_lastname || null,
        m_firstname || null,
        m_middlename || null,
        m_lastname || null,
        f_contact || null,
        m_contact || null,
        birth_document || null,
        profile_pic || null,
        id,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Infant not found" });
        }

        res.status(200).json({
          message: "Infant record updated successfully",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Delete infant by ID (native db.query only)
export const deleteInfant = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Infant ID is required" });
  }

  try {
    // Step 1: Delete related scheduling records first
    const deleteSchedulingSql = "DELETE FROM tbl_scheduling WHERE infant_id = ?";
    db.query(deleteSchedulingSql, [id], (schedErr, schedResult) => {
      if (schedErr) {
        return res.status(500).json({ error: schedErr });
      }

      // Step 2: Delete infant record
      const deleteInfantSql = "DELETE FROM tbl_infant WHERE id = ?";
      db.query(deleteInfantSql, [id], (infErr, infResult) => {
        if (infErr) {
          return res.status(500).json({ error: infErr });
        }

        if (infResult.affectedRows === 0) {
          return res.status(404).json({ message: "Infant not found" });
        }

        return res.status(200).json({
          message: "Infant and related scheduling records deleted successfully",
          deletedScheduling: schedResult.affectedRows
        });
      });
    });

  } catch (error) {
    return res.status(500).json({ error });
  }
};

// ✅ Fetch infants by purok
export const getInfantsByPurok = async (req, res) => {
  const { purokId } = req.params;

  // ✅ Validation
  if (!purokId) {
    return res.status(400).json({ message: "Purok ID is required" });
  }

  try {
    const sql = `
      SELECT
        i.id,
        i.firstname,
        i.middlename,
        i.lastname,
        i.suffix,
        i.sex,
        i.dob,
        i.age_year,
        i.age_month,
        i.home_add,
        i.profile_pic,
        i.birth_document,
        i.created_at,
        p.purok_name
      FROM tbl_infant i
      LEFT JOIN tbl_purok p ON p.id = i.purok_id
      WHERE i.purok_id = ?
      ORDER BY i.id DESC
    `;

    db.query(sql, [purokId], (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.length === 0) {
        return res.status(404).json({
          message: "No infants found for this purok",
        });
      }

      // ✅ Add full URL for images
      const host = `${req.protocol}://${req.get("host")}`;
      const data = result.map((infant) => ({
        ...infant,
        profile_pic: infant.profile_pic
          ? `${host}/${infant.profile_pic}`
          : null,
        birth_document: infant.birth_document
          ? `${host}/${infant.birth_document}`
          : null,
      }));

      res.status(200).json(data);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};
