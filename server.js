require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
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
const glucoseRoutes = require('./src/routes/glucose');
const aiReportRoutes = require('./src/routes/aiReportRoutes');
const aiActivityRoutes = require("./src/routes/aiActivityRoutes");
const waterRoutes = require('./src/routes/waterRoutes');
const nutritionistAppointmentRoutes = require('./src/routes/nutritionistAppointments');
const googleRoutes = require('./src/routes/googleRoutes');
const doctorAppointmentRoutes = require('./src/routes/doctorAppointmentRoutes');
const messageRoutes = require('./src/routes/messages');
app.use('/api/messages', messageRoutes);
app.use('/api/doctor-appointments', doctorAppointmentRoutes);
app.use('/api/nutritionist-appointments', nutritionistAppointmentRoutes);
app.use('/api/water', waterRoutes);
app.use("/api/ai-activity", aiActivityRoutes);
app.use('/api/ai-report', aiReportRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/google', googleRoutes);
const profileRoutes = require('./src/routes/profileRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const mealRoutes = require("./src/routes/meals");
const mealReportRoutes = require("./src/routes/mealReports");
app.use("/api/meal-reports", mealReportRoutes);
app.use("/api/meals", mealRoutes);
app.use('/api/profile', profileRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/doctor", doctorRoutes);
app.use("/api/nutritionist", nutritionistRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/ai', aiRoutes);
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