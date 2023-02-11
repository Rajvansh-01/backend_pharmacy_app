const mongoose = require("mongoose");
const {Schema} = mongoose;

//Defining Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true},
  email: { type: String, required: true },
  number: {type:String},
  otp: {
    type: String,
    required: true
  }
});

const UserModel = mongoose.model("OTPuser", userSchema);

module.exports = UserModel

