const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    contact: {type: String, required: false},

    resetPasswordOtp: { type: Number },
    resetPasswordOtpExpires: { type: Date }

});

module.exports = mongoose.model("user", userSchema);