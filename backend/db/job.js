const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  // overview: { type: String, required: true},
  basicDetails: { type: Object, required: true },
  mcqTest: { type: Object, required: true },
  technicalInterview: { type: Object, required: true },
  hrInterview: { type: Object, required: true },
});

module.exports = mongoose.model("Job", jobSchema);
