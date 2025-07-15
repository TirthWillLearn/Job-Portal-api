const db = require("../config/db");

// ✅ Create a Job
exports.createJob = async (req, res, next) => {
  const { title, description, company, location, salary } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      "INSERT INTO jobs (title, description, company, location, salary, posted_by) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, company, location, salary, userId]
    );

    res
      .status(201)
      .json({ message: "Job posted successfully", jobId: result.insertId });
  } catch (err) {
    next(err);
  }
};

// ✅ Get All Jobs
exports.getAllJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const location = req.query.location || "";
    const company = req.query.company || "";

    const [jobs] = await db.query(
      `
      SELECT j.*, u.name AS posted_by_name
      FROM jobs j
      JOIN users u ON j.posted_by = u.id
      WHERE j.location LIKE ? AND j.company LIKE ?
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [`%${location}%`, `%${company}%`, limit, offset]
    );

    res.json({ jobs, page, limit });
  } catch (err) {
    next(err);
  }
};

// ✅ Get Job by ID
exports.getJobById = async (req, res, next) => {
  const jobId = req.params.id;

  try {
    const [rows] = await db.query(
      `
      SELECT j.*, u.name AS posted_by_name
      FROM jobs j
      JOIN users u ON j.posted_by = u.id
      WHERE j.id = ?
    `,
      [jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ job: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ✅ Delete Job (admin only)
exports.deleteJob = async (req, res, next) => {
  const jobId = req.params.id;

  try {
    const [result] = await db.query("DELETE FROM jobs WHERE id = ?", [jobId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    next(err);
  }
};
