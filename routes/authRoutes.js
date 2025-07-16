const express = require("express");
const { body } = require("express-validator");
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

router.get("/refresh-token", refreshToken);
router.post("/logout", logoutUser);

module.exports = router;
