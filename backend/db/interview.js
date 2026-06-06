const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  question_index: { type: Number },
  question: { type: String },
  analysis: { type: Object },
  transcript_raw: { type: String },
  report: { type: Object },
  created_at: { type: Date, default: Date.now },
});

const interviewSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  candidate_name: { type: String },
  candidate_email: { type: String, required: true },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  job_title: { type: String },
  company_name: { type: String },
  business_email: { type: String },
  interview_type: { type: String },
  difficulty: { type: String },
  candidate_resume: { type: Object },
  ats_score: { type: Number, default: 0 },
  ats_report: { type: Object },
  questions: { type: Array, default: [] },
  responses: { type: [responseSchema], default: [] },
  response_mode: { type: String, default: 'per_question' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Interview', interviewSchema);
