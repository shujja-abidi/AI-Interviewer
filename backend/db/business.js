const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
    
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: {type: String, required: false, unique: true},
    address: {type :String, required: true},
    resetPasswordOtp: { type: Number },
    resetPasswordOtpExpires: { type: Date }
});

module.exports = mongoose.model("business", BusinessSchema);