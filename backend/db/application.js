const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  job_title: { type: String },
  business_email: { type: String, required: true },
  candidate_email: { type: String, required: true },
  candidate_name: { type: String },
  resume: { type: Object },          // Structured JSON parsed from PDF
  ats_score: { type: Number, default: 0 },
  ats_report: { type: Object, default: {} }, // Full ATS report object for employer viewing
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'shortlisted', 'approved', 'rejected'],
    default: 'pending',
  },
  session_id: { type: String },
  history: { type: Array, default: [] },
  scheduled_interview: { type: Object },
  applied_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Application', applicationSchema);

