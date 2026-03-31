require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());


const patientRoutes = require("./src/routes/patient");
app.use("/api/patient", patientRoutes);

const familyRoutes = require("./src/routes/family");
app.use("/api/family", familyRoutes);

const doctorRoutes = require("./src/routes/doctor");
const nutritionistRoutes = require("./src/routes/nutritionist");

app.use("/api/doctor", doctorRoutes);
app.use("/api/nutritionist", nutritionistRoutes);
app.use("/api/auth", require("./src/routes/auth"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("Mongo Error ❌", err));

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});