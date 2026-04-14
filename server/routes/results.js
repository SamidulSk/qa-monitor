// server/routes/results.js
const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────
// POST /api/results
// JMeter scripts push each step result here
// ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    // Support both { ...fields } and { data: { ...fields } }
    // so it works with your existing curl reference format
    const payload = req.body.data || req.body;

    const {
      project,
      cluster,
      script_type,
      step,
      status_code,
      response_time,
      is_success,
      timestamp,
    } = payload;

    if (!project || !step || !status_code) {
      return res.status(400).json({
        error: 'Missing required fields: project, step, status_code',
      });
    }

    const result = new Result({
      project,
      cluster,
      script_type,
      step,
      status_code,
      response_time: parseFloat(response_time) || 0,
      // If is_success not provided, derive it from status_code
      is_success:
        is_success !== undefined
          ? is_success
          : String(status_code).startsWith('2'),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    const saved = await result.save();
    res.status(201).json({ success: true, id: saved._id });
  } catch (err) {
    console.error('POST /api/results error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/results
// Dashboard fetches raw results with filters
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      project,
      cluster,
      script_type,
      status,       // "failed" | "passed" | undefined (all)
      from,         // ISO date string
      to,           // ISO date string
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (project)     filter.project     = project;
    if (cluster)     filter.cluster     = cluster;
    if (script_type) filter.script_type = script_type;

    if (status === 'failed') filter.is_success = false;
    if (status === 'passed') filter.is_success = true;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      Result.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
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

// ─────────────────────────────────────────
// GET /api/results/summary
// Aggregated failure counts per step
// Powers the bar chart and KPI cards
// ─────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { project, cluster, from, to } = req.query;

    const matchStage = {};
    if (project) matchStage.project = project;
    if (cluster) matchStage.cluster = cluster;
    if (from || to) {
      matchStage.timestamp = {};
      if (from) matchStage.timestamp.$gte = new Date(from);
      if (to)   matchStage.timestamp.$lte = new Date(to);
    }

    const summary = await Result.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$step',
          total:      { $sum: 1 },
          failures:   { $sum: { $cond: [{ $eq: ['$is_success', false] }, 1, 0] } },
          passes:     { $sum: { $cond: [{ $eq: ['$is_success', true]  }, 1, 0] } },
          avg_response_time: { $avg: '$response_time' },
          last_run:   { $max: '$timestamp' },
          last_status:{ $last: '$is_success' },
        },
      },
      {
        $addFields: {
          failure_rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$failures', '$total'] }, 100] },
            ],
          },
        },
      },
      { $sort: { failures: -1 } },
    ]);

    // Top-level KPI numbers
    const totals = summary.reduce(
      (acc, s) => {
        acc.total_runs    += s.total;
        acc.total_failures += s.failures;
        return acc;
      },
      { total_runs: 0, total_failures: 0 }
    );

    res.json({
      kpi: {
        ...totals,
        overall_failure_rate:
          totals.total_runs > 0
            ? ((totals.total_failures / totals.total_runs) * 100).toFixed(1)
            : 0,
      },
      by_step: summary,
    });
  } catch (err) {
    console.error('GET /api/results/summary error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/results/projects
// Distinct project names — for filter dropdowns
// ─────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const projects = await Result.distinct('project');
    const clusters = await Result.distinct('cluster');
    res.json({ projects, clusters });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;