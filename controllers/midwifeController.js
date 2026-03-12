import bcrypt from "bcrypt";
import db from "../utils/db.js"

export const createMidwife = async (req, res) => {
  const {
    username,
    password,
    firstname,
    middlename,
    lastname,
    dob,
    age,
    gender,
    address,
    email,
    phone,
    valid_document,
    photo,
  } = req.body;

  if (!username || !password || !firstname || !lastname || !dob || !gender) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
 
    db.query("SELECT * FROM tbl_users WHERE username = ?", [username], async (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

  
      const midwifeSql = `
        INSERT INTO tbl_midwife 
        (firstname, middlename, lastname, dob, age, gender, address, email, phone, valid_document, photo, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        midwifeSql,
        [
          firstname,
          middlename || null,
          lastname,
          dob,
          age,
          gender,
          address || null,
          email || null,
          phone || null,
          valid_document || null,
          photo || null,
        ],
        (err, midwifeResult) => {
          if (err) return res.status(500).json({ error: err });

          const midwifeId = midwifeResult.insertId;

 
          const userSql = `
            INSERT INTO tbl_users (username, password, role, info_id, status) 
            VALUES (?, ?, 2, ?, 1)
          `;
          db.query(userSql, [username, hashedPassword, midwifeId], (err, userResult) => {
            if (err) return res.status(500).json({ error: err });

            res.status(201).json({
              message: "Midwife created successfully",
              midwifeId,
              userId: userResult.insertId,
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getAllMidwives = async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.*, 
        u.username, 
        u.status 
      FROM tbl_midwife m
      LEFT JOIN tbl_users u ON u.info_id = m.id AND u.role = 2
      ORDER BY m.id DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.status(200).json(results);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};


export const getMidwifeById = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "ID is required" });

  try {
    const sql = `
      SELECT 
        m.*, 
        u.username, 
        u.status 
      FROM tbl_midwife m
      LEFT JOIN tbl_users u ON u.info_id = m.id AND u.role = 2
      WHERE m.id = ?
      LIMIT 1
    `;

    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });

      if (results.length === 0) {
        return res.status(404).json({ message: "Midwife not found" });
      }

      res.status(200).json(results[0]);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Update midwife by ID
export const updateMidwife = async (req, res) => {
  const { id } = req.params; // midwife id

  const {
    username,
    password,
    firstname,
    middlename,
    lastname,
    dob,
    age,
    gender,
    address,
    email,
    phone,
    valid_document,
    photo,
  } = req.body;

  if (!id || !username || !firstname || !lastname || !dob || !gender) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    // ✅ Check if username is taken by another user
    db.query(
      "SELECT id FROM tbl_users WHERE username = ? AND info_id != ? AND role = 2",
      [username, id],
      async (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
          return res.status(400).json({ message: "Username already exists" });
        }

        // ✅ Update midwife info
        const midwifeSql = `
          UPDATE tbl_midwife SET
            firstname = ?,
            middlename = ?,
            lastname = ?,
            dob = ?,
            age = ?,
            gender = ?,
            address = ?,
            email = ?,
            phone = ?,
            valid_document = ?,
            photo = ?
          WHERE id = ?
        `;

        db.query(
          midwifeSql,
          [
            firstname,
            middlename || null,
            lastname,
            dob,
            age || null,
            gender,
            address || null,
            email || null,
            phone || null,
            valid_document || null,
            photo || null,
            id,
          ],
          async (err, midwifeResult) => {
            if (err) return res.status(500).json({ error: err });

            if (midwifeResult.affectedRows === 0) {
              return res.status(404).json({ message: "Midwife not found" });
            }

            // ✅ Update user credentials
            let userSql = `UPDATE tbl_users SET username = ?`;
            const params = [username];

            if (password) {
              const hashedPassword = await bcrypt.hash(password, 10);
              userSql += `, password = ?`;
              params.push(hashedPassword);
            }

            userSql += ` WHERE info_id = ? AND role = 2`;
            params.push(id);

            db.query(userSql, params, (err) => {
              if (err) return res.status(500).json({ error: err });

              res.status(200).json({
                message: "Midwife updated successfully",
              });
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};

// ✅ Delete midwife by ID
export const deleteMidwife = async (req, res) => {
  const { id } = req.params; // midwife id

  if (!id) {
    return res.status(400).json({ message: "Midwife ID is required" });
  }

  try {
    // ✅ Delete user account first
    db.query(
      "DELETE FROM tbl_users WHERE info_id = ? AND role = 2",
      [id],
      (err) => {
        if (err) return res.status(500).json({ error: err });

        // ✅ Delete midwife
        db.query(
          "DELETE FROM tbl_midwife WHERE id = ?",
          [id],
          (err, result) => {
            if (err) return res.status(500).json({ error: err });

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: "Midwife not found" });
            }

            res.status(200).json({
              message: "Midwife deleted successfully",
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
};
