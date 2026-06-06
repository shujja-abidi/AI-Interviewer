const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  job_title: { type: String },
  business_email: { type: String, required: true },
  candidate_email: { type: String, required: true },
  candidate_name: { type: String },
  resume: { type: Object },
  ats_score: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'shortlisted', 'interview_scheduled', 'approved', 'rejected'],
    default: 'pending',
  },
  history: { type: Array, default: [] },
  applied_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Application', applicationSchema);
