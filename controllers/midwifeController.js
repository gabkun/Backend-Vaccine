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

export const getTotalMidwives = async (req, res) => {
  try {
    const sql = "SELECT COUNT(*) AS totalMidwives FROM tbl_midwife";

    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err });

      res.status(200).json({
        totalMidwives: result[0].totalMidwives
      });
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
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Midwife ID is required" });
  }

  try {
    // 1. Set related schedules midwife_id to NULL
    db.query(
      "UPDATE tbl_scheduling SET midwife_id = NULL WHERE midwife_id = ?",
      [id],
      (err1, updateResult) => {
        if (err1) {
          return res.status(500).json({
            step: "update tbl_scheduling",
            message: err1.message,
            code: err1.code,
            sqlMessage: err1.sqlMessage,
          });
        }

        // 2. Delete related user account
        db.query(
          "DELETE FROM tbl_users WHERE info_id = ? AND role = 2",
          [id],
          (err2, userResult) => {
            if (err2) {
              return res.status(500).json({
                step: "delete tbl_users",
                message: err2.message,
                code: err2.code,
                sqlMessage: err2.sqlMessage,
              });
            }

            // 3. Delete midwife record
            db.query(
              "DELETE FROM tbl_midwife WHERE id = ?",
              [id],
              (err3, result) => {
                if (err3) {
                  return res.status(500).json({
                    step: "delete tbl_midwife",
                    message: err3.message,
                    code: err3.code,
                    sqlMessage: err3.sqlMessage,
                  });
                }

                if (result.affectedRows === 0) {
                  return res.status(404).json({
                    message: "Midwife not found",
                  });
                }

                return res.status(200).json({
                  message: "Midwife deleted successfully",
                  schedulingUpdated: updateResult.affectedRows,
                  usersDeleted: userResult.affectedRows,
                  midwivesDeleted: result.affectedRows,
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};