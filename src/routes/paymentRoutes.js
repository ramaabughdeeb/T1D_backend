const express = require("express");
const router = express.Router();

const DoctorAppointment = require("../models/DoctorAppointment");
const NutritionistAppointment = require("../models/NutritionistAppointment");

// Pay doctor online appointment
router.post("/doctor/:appointmentId/pay", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { paymentMethod } = req.body;

    const appointment = await DoctorAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.visitType !== "online") {
      return res.status(400).json({
        message: "Payment is only required for online appointments",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Appointment is already paid",
        appointment,
      });
    }

    appointment.paymentStatus = "paid";
    appointment.paymentMethod = paymentMethod || "demo_card";
    appointment.paidAt = new Date();
    appointment.status = "booked";

    await appointment.save();

    return res.status(200).json({
      message: "Payment completed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Doctor payment error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Pay nutritionist online appointment
router.post("/nutritionist/:appointmentId/pay", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { paymentMethod } = req.body;

    const appointment = await NutritionistAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.visitType !== "online") {
      return res.status(400).json({
        message: "Payment is only required for online appointments",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Appointment is already paid",
        appointment,
      });
    }

    appointment.paymentStatus = "paid";
    appointment.paymentMethod = paymentMethod || "demo_card";
    appointment.paidAt = new Date();
    appointment.status = "booked";

    await appointment.save();

    return res.status(200).json({
      message: "Payment completed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Nutritionist payment error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;