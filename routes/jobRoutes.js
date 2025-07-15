const express = require("express");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const {
  createJob,
  getAllJobs,
  getJobById,
  deleteJob,
} = require("../controllers/jobController");

const router = express.Router();

router.post("/", authMiddleware, createJob); // Create job (auth only)
router.get("/", getAllJobs); // Public
router.get("/:id", getJobById); // Public
router.delete("/:id", authMiddleware, checkRole("admin"), deleteJob); // Admin only

module.exports = router;
