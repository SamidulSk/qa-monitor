// server/models/Result.js
const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema(
  {
    project: {
      type: String,
      required: true,
      trim: true,
    },
    cluster: {
      type: String,
      trim: true,
      default: 'default',
    },
    script_type: {
      type: String,
      enum: ['5min', '30min', 'other'],
      default: 'other',
    },
    step: {
      type: String,
      required: true,
      trim: true,
    },
    status_code: {
      type: String,
      required: true,
    },
    response_time: {
      type: Number,
      default: 0,
    },
    is_success: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Index for fast dashboard queries — filter by project, time, success
ResultSchema.index({ project: 1, timestamp: -1 });
ResultSchema.index({ is_success: 1, timestamp: -1 });
ResultSchema.index({ step: 1, is_success: 1 });

module.exports = mongoose.model('Result', ResultSchema);