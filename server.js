require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/auth");
const patientRoutes = require("./src/routes/patient");
const familyRoutes = require("./src/routes/family");
const doctorRoutes = require("./src/routes/doctor");
const nutritionistRoutes = require("./src/routes/nutritionist");

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/nutritionist", nutritionistRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("Mongo Error ❌", err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});