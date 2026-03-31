const express = require("express");

const router = express.Router();
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, role, birthDate } = req.body;

    if (!firstName || !lastName || !email || !role || !birthDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const user = await User.create({ firstName, lastName, email, role, birthDate });

    return res.status(201).json({ message: "User created", user });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;