const mongoose = require("mongoose");
const {Schema} = mongoose;

//Defining Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true},
  email: { type: String, required: true },
  password: { type: String, required: true },
  password_confirmation: { type: String},
}, {timestamps: true});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel

