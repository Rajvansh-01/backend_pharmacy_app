const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const otpSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true
  }
  // createdAt: {
  //   type: Date,
  //   default: Date.now,
  //   index: {expires: 300}
  // }
}, {timestamps: true});

const OtpModel = mongoose.model('Otp', otpSchema);
module.exports = OtpModel
