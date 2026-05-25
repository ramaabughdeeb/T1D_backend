const express = require('express');
const router = express.Router();

const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const ParentProfile = require('../models/ParentProfile');

// ===============================
// GET ADMIN STATS
// ===============================
router.get('/stats', async (req, res) => {
  try {
    const patients = await User.countDocuments({ role: 'patient' });
    const doctors = await User.countDocuments({ role: 'doctor' });
    const nutritionists = await User.countDocuments({ role: 'nutritionist' });
    const family = await User.countDocuments({ role: 'family' });

    const pendingDoctors = await DoctorProfile.countDocuments({
      verificationStatus: 'pending',
    });

    const pendingNutritionists = await NutritionistProfile.countDocuments({
      verificationStatus: 'pending',
    });

    res.status(200).json({
      patients,
      doctors,
      nutritionists,
      family,
      pendingDoctors,
      pendingNutritionists,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      message: 'Failed to get admin stats',
      error: error.message,
    });
  }
});

// ===============================
// GET ALL PATIENTS
// ===============================
router.get('/patients', async (req, res) => {
  try {
    const patients = await PatientProfile.find()
      .populate('userId', 'firstName lastName email birthDate role isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Patients fetched successfully',
      patients,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      message: 'Failed to get patients',
      error: error.message,
    });
  }
});

// ===============================
// GET ONE PATIENT DETAILS
// id هون هو userId تبع المريض
// ===============================
router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await PatientProfile.findOne({
      userId: req.params.id,
    }).populate('userId', 'firstName lastName email birthDate role isActive');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      message: 'Patient details fetched successfully',
      patient,
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({
      message: 'Failed to get patient details',
      error: error.message,
    });
  }
});

// ===============================
// GET ALL FAMILY / PARENTS
// ===============================
router.get('/family', async (req, res) => {
  try {
    const family = await ParentProfile.find()
      .populate('userId', 'firstName lastName email role isActive')
      .populate('linkedPatientId', 'firstName lastName email birthDate role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Family profiles fetched successfully',
      family,
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({
      message: 'Failed to get family profiles',
      error: error.message,
    });
  }
});

// ===============================
// GET ONE FAMILY DETAILS
// id هون هو profile _id تبع الأهل
// ===============================
router.get('/family/:id', async (req, res) => {
  try {
    const familyProfile = await ParentProfile.findById(req.params.id)
      .populate('userId', 'firstName lastName email role isActive')
      .populate('linkedPatientId', 'firstName lastName email birthDate role');

    if (!familyProfile) {
      return res.status(404).json({
        message: 'Family profile not found',
      });
    }

    res.status(200).json({
      message: 'Family profile details fetched successfully',
      familyProfile,
    });
  } catch (error) {
    console.error('Get family details error:', error);
    res.status(500).json({
      message: 'Failed to get family profile details',
      error: error.message,
    });
  }
});

// ===============================
// GET ALL DOCTORS
// ===============================
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'firstName lastName email role isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Doctors fetched successfully',
      doctors,
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      message: 'Failed to get doctors',
      error: error.message,
    });
  }
});

// ===============================
// GET ONE DOCTOR DETAILS
// id هون هو profile _id تبع الطبيب
// ===============================
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id).populate(
      'userId',
      'firstName lastName email role isActive'
    );

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      message: 'Doctor details fetched successfully',
      doctor,
    });
  } catch (error) {
    console.error('Get doctor details error:', error);
    res.status(500).json({
      message: 'Failed to get doctor details',
      error: error.message,
    });
  }
});

// ===============================
// UPDATE DOCTOR VERIFICATION STATUS
// status: pending / approved / rejected
// ===============================
router.put('/doctors/:id/verification', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use pending, approved, or rejected',
      });
    }

    const doctor = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('userId', 'firstName lastName email role isActive');

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      message: `Doctor ${status} successfully`,
      doctor,
    });
  } catch (error) {
    console.error('Update doctor verification error:', error);
    res.status(500).json({
      message: 'Failed to update doctor verification status',
      error: error.message,
    });
  }
});

// ===============================
// GET ALL NUTRITIONISTS
// ===============================
router.get('/nutritionists', async (req, res) => {
  try {
    const nutritionists = await NutritionistProfile.find()
      .populate('userId', 'firstName lastName email role isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Nutritionists fetched successfully',
      nutritionists,
    });
  } catch (error) {
    console.error('Get nutritionists error:', error);
    res.status(500).json({
      message: 'Failed to get nutritionists',
      error: error.message,
    });
  }
});

// ===============================
// GET ONE NUTRITIONIST DETAILS
// id هون هو profile _id تبع أخصائي التغذية
// ===============================
router.get('/nutritionists/:id', async (req, res) => {
  try {
    const nutritionist = await NutritionistProfile.findById(
      req.params.id
    ).populate('userId', 'firstName lastName email role isActive');

    if (!nutritionist) {
      return res.status(404).json({
        message: 'Nutritionist not found',
      });
    }

    res.status(200).json({
      message: 'Nutritionist details fetched successfully',
      nutritionist,
    });
  } catch (error) {
    console.error('Get nutritionist details error:', error);
    res.status(500).json({
      message: 'Failed to get nutritionist details',
      error: error.message,
    });
  }
});

// ===============================
// UPDATE NUTRITIONIST VERIFICATION STATUS
// status: pending / approved / rejected
// ===============================
router.put('/nutritionists/:id/verification', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required',
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use pending, approved, or rejected',
      });
    }

    const nutritionist = await NutritionistProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('userId', 'firstName lastName email role isActive');

    if (!nutritionist) {
      return res.status(404).json({
        message: 'Nutritionist not found',
      });
    }

    res.status(200).json({
      message: `Nutritionist ${status} successfully`,
      nutritionist,
    });
  } catch (error) {
    console.error('Update nutritionist verification error:', error);
    res.status(500).json({
      message: 'Failed to update nutritionist verification status',
      error: error.message,
    });
  }
});

module.exports = router;