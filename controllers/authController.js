const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid"); // At the top
const cookie = require("cookie"); // Optional, if not using cookie-parser middleware

// Register User
exports.registerUser = async (req, res, next) => {
  console.log("✅ Register route hit");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Stop everything and return errors
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;
  console.log("🧾 Payload received:", { name, email, password });

  const roleToSave = role || "user";

  try {
    // Check if email already exists
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, roleToSave]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 🔐 Generate JWT Access Token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🔐 Generate Refresh Token (UUID)
    const refreshToken = uuidv4();

    // 💾 Save Refresh Token in DB
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
      [user.id, refreshToken]
    );

    // 🍪 Set Refresh Token in Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on live
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Send accessToken only
    res.json({ message: "Login successful", accessToken });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Refresh Access Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Check if refresh token exists in DB
    const [rows] = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const userId = rows[0].user_id;

    // You may optionally verify session/IP/etc here

    // Create new access token
    const newAccessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Logout User
exports.logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await db.query("DELETE FROM refresh_tokens WHERE token = ?", [
        refreshToken,
      ]);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ error: "Logout failed", details: err.message });
  }
};

// Login User
// exports.loginUser = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { email, password } = req.body;

//   try {
//     const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);

//     if (users.length === 0) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     const user = users[0];
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       { id: user.id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ message: "Login successful", token });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };
