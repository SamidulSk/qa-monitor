// server/models/Result.js
const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  step:          { type: String, required: true, trim: true },
  status_code:   { type: String, required: true },
  response_time: { type: Number, default: 0 },
  is_success:    { type: Boolean, default: true },
  timestamp:     { type: Date, default: Date.now },
}, { _id: false });

const ResultSchema = new mongoose.Schema(
  {
    project:        { type: String, required: true, trim: true },
    cluster:        { type: String, trim: true, default: 'default' },
    script_type:    { type: String, enum: ['5min', '30min', 'other'], default: 'other' },
    timestamp:      { type: Date, default: Date.now },
    total_duration: { type: Number, default: 0 },
    build_number:   { type: String, trim: true, default: '' },  //new line
    steps:          { type: [StepSchema], required: true },

    total_steps:  { type: Number, default: 0 },
    failed_steps: { type: Number, default: 0 },
    passed_steps: { type: Number, default: 0 },
    has_failure:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ async pre-save — works on Mongoose 6, 7, and 8
ResultSchema.pre('save', async function () {
  this.total_steps  = this.steps.length;
  this.failed_steps = this.steps.filter(s => !s.is_success).length;
  this.passed_steps = this.steps.filter(s =>  s.is_success).length;
  this.has_failure  = this.failed_steps > 0;
});

ResultSchema.index({ project: 1, timestamp: -1 });
ResultSchema.index({ has_failure: 1, timestamp: -1 });
ResultSchema.index({ 'steps.step': 1 });
ResultSchema.index({ cluster: 1, script_type: 1 });
ResultSchema.index({ build_number: 1 });

module.exports = mongoose.model('Result', ResultSchema);