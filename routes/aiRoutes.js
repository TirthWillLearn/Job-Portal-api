const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { generateJobDescription } = require("../controllers/aiController");

const router = express.Router();

router.post("/job-summary", authMiddleware, generateJobDescription);

module.exports = router;
