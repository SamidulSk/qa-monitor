// server/models/Result.js
const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  step:          { type: String, required: true, trim: true },
  status_code:   { type: String, required: true },
  response_time: { type: Number, default: 0 },
  is_success:    { type: Boolean, default: true },
  timestamp:     { type: Date, default: Date.now },
}, { _id: false }); // no separate _id per step — they live inside the run

const ResultSchema = new mongoose.Schema(
  {
    project:        { type: String, required: true, trim: true },
    cluster:        { type: String, trim: true, default: 'default' },
    script_type:    { type: String, enum: ['5min', '30min', 'other'], default: 'other' },
    timestamp:      { type: Date, default: Date.now },
    total_duration: { type: Number, default: 0 },

    steps: { type: [StepSchema], required: true },

    // Derived fields — computed before save, stored for fast querying
    total_steps:   { type: Number, default: 0 },
    failed_steps:  { type: Number, default: 0 },
    passed_steps:  { type: Number, default: 0 },
    has_failure:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-compute derived fields before every save
ResultSchema.pre('save', function (next) {
  this.total_steps  = this.steps.length;
  this.failed_steps = this.steps.filter(s => !s.is_success).length;
  this.passed_steps = this.steps.filter(s =>  s.is_success).length;
  this.has_failure  = this.failed_steps > 0;
  next();
});

// Indexes for fast dashboard queries
ResultSchema.index({ project: 1, timestamp: -1 });
ResultSchema.index({ has_failure: 1, timestamp: -1 });
ResultSchema.index({ 'steps.step': 1 });
ResultSchema.index({ cluster: 1, script_type: 1 });

module.exports = mongoose.model('Result', ResultSchema);