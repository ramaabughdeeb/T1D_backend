const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 587,
  secure: false,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, birthDate } = req.body;

    if (!firstName || !lastName || !email || !password || !role || !birthDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      birthDate,
    });

    return res.status(201).json({
      message: "User created",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
router.post('/check-google-user', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.json({
        exists: true,
        user,
      });
    }

    return res.json({
      exists: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
     from: process.env.EMAIL_FROM,
     to: cleanEmail,
     subject: "Password Reset Code",
     text: `Your password reset code is: ${resetCode}`,
});

    return res.status(200).json({
      message: "Reset code sent to email",
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: "No reset code found" });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (user.resetCodeExpires < new Date()) {
      return res.status(400).json({ message: "Code expired" });
    }

    return res.status(200).json({ message: "Code verified" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: "Email, code and new password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: "No reset code found" });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (user.resetCodeExpires < new Date()) {
      return res.status(400).json({ message: "Code expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
module.exports = router;