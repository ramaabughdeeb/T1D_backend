const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    birthDate: { type: Date, required: true },
    password: {
  type: String,
  required: true,
    },
  resetCode: {
  type: String,
  default: null,
},
resetCodeExpires: {
  type: Date,
  default: null,
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);