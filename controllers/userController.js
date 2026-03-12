import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../utils/db.js";

// Use secret from .env
const JWT_SECRET = process.env.JWT_SECRET;

// Register user
export const registerUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    db.query("SELECT * FROM tbl_users WHERE username = ?", [username], async (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = "INSERT INTO tbl_users (username, password, role, info_id) VALUES (?, ?, 1, NULL)";
      db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.status(201).json({ message: "User registered successfully", userId: result.insertId });
      });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Login user
export const loginUser = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  db.query("SELECT * FROM tbl_users WHERE username = ?", [username], async (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        info_id: user.info_id
      }
    });
  });
};
