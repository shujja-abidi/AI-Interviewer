const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  // overview: { type: String, required: true},
  basicDetails: { type: Object, required: true },
  mcqTest: { type: Object, required: true },
  technicalInterview: { type: Object, required: true },
  hrInterview: { type: Object, required: true },
  // new fields for approval workflow and ownership
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'pending' },
  created_by: { type: String },
});

module.exports = mongoose.model("Job", jobSchema);
