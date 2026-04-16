// server/routes/results.js
const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// POST /api/results
// One call per script run — contains all steps inside
// ─────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const payload = req.body.data || req.body;

    const { project, cluster, script_type, timestamp, total_duration, build_number, steps } = payload;

    // Validate required fields
    if (!project) {
      return res.status(400).json({ error: 'Missing required field: project' });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'steps must be a non-empty array' });
    }

    // Validate each step has minimum required fields
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.step || !s.status_code) {
        return res.status(400).json({
          error: `Step at index ${i} is missing required fields: step, status_code`,
        });
      }
      // Auto-derive is_success from status_code if not provided
      if (s.is_success === undefined || s.is_success === null) {
        s.is_success = String(s.status_code).startsWith('2');
      }
      s.response_time = parseFloat(s.response_time) || 0;
    }

    const result = new Result({
      project,
      cluster: cluster || 'default',
      script_type: script_type || 'other',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      total_duration: parseFloat(total_duration) || 0,
      build_number: String(build_number || ''),          // ← new line

      steps,
    });

    const saved = await result.save();

    res.status(201).json({
      success: true,
      id: saved._id,
      total_steps: saved.total_steps,
      failed_steps: saved.failed_steps,
      has_failure: saved.has_failure,
    });
  } catch (err) {
    console.error('POST /api/results error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/results
// Returns all script runs with their steps, paginated
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      project,
      cluster,
      script_type,
      status,       // "failed" | "passed"
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (project) filter.project = project;
    if (cluster) filter.cluster = cluster;
    if (script_type) filter.script_type = script_type;
    if (status === 'failed') filter.has_failure = true;
    if (status === 'passed') filter.has_failure = false;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    //  after the script_type filter line:
    if (req.query.build_number) filter.build_number = req.query.build_number;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Result.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      Result.countDocuments(filter),
    ]);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      results,
    });
  } catch (err) {
    console.error('GET /api/results error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/results/summary
// Aggregates failure counts broken down by step name
// Powers bar chart and KPI cards
// ─────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { project, cluster, script_type, from, to } = req.query;

    const matchStage = {};
    if (project) matchStage.project = project;
    if (cluster) matchStage.cluster = cluster;
    if (script_type) matchStage.script_type = script_type;
    if (from || to) {
      matchStage.timestamp = {};
      if (from) matchStage.timestamp.$gte = new Date(from);
      if (to) matchStage.timestamp.$lte = new Date(to);
    }

    const [stepSummary, runSummary] = await Promise.all([

      // Break down failures by individual step name (unwind steps array)
      Result.aggregate([
        { $match: matchStage },
        { $unwind: '$steps' },
        {
          $group: {
            _id: '$steps.step',
            total: { $sum: 1 },
            failures: { $sum: { $cond: [{ $eq: ['$steps.is_success', false] }, 1, 0] } },
            passes: { $sum: { $cond: [{ $eq: ['$steps.is_success', true] }, 1, 0] } },
            avg_response_time: { $avg: '$steps.response_time' },
            last_run: { $max: '$timestamp' },
          },
        },
        {
          $addFields: {
            failure_rate: {
              $cond: [
                { $eq: ['$total', 0] }, 0,
                { $multiply: [{ $divide: ['$failures', '$total'] }, 100] },
              ],
            },
          },
        },
        { $sort: { failures: -1 } },
      ]),

      // Run-level summary (how many full script runs had at least one failure)
      Result.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total_runs: { $sum: 1 },
            failed_runs: { $sum: { $cond: ['$has_failure', 1, 0] } },
            total_steps_run: { $sum: '$total_steps' },
            total_failures: { $sum: '$failed_steps' },
            avg_duration: { $avg: '$total_duration' },
          },
        },
      ]),
    ]);

    const kpi = runSummary[0] || {
      total_runs: 0, failed_runs: 0,
      total_steps_run: 0, total_failures: 0, avg_duration: 0,
    };

    kpi.overall_failure_rate = kpi.total_steps_run > 0
      ? ((kpi.total_failures / kpi.total_steps_run) * 100).toFixed(1)
      : '0.0';

    res.json({ kpi, by_step: stepSummary });
  } catch (err) {
    console.error('GET /api/results/summary error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/results/projects
// Distinct project + cluster names for filter dropdowns
// ─────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const [projects, clusters] = await Promise.all([
      Result.distinct('project'),
      Result.distinct('cluster'),
    ]);
    res.json({ projects, clusters });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;