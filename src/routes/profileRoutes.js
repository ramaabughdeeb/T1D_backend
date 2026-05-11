const express = require('express');
const router = express.Router();

const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const ParentProfile = require('../models/ParentProfile');

function calculateAge(birthDate) {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = null;
    let doctorName = '';
    let doctorSpecialty = '';

    if (user.role === 'patient') {
      profileData = await PatientProfile.findOne({ userId });
      doctorName = profileData?.doctorName || '';
      doctorSpecialty = profileData?.doctorSpecialty || '';
    } else if (user.role === 'doctor') {
      profileData = await DoctorProfile.findOne({ userId });
    } else if (user.role === 'nutritionist') {
      profileData = await NutritionistProfile.findOne({ userId });
    } else if (user.role === 'family') {
      profileData = await ParentProfile.findOne({ userId });
    }

  res.json({
  fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  email: user.email || '',
  role: user.role || '',
  age: calculateAge(user.birthDate),

  weight: profileData?.weight || null,
  height: profileData?.height || null,

  doctorName,
  doctorSpecialty,

  carbRatio: profileData?.carbRatio || '',
  correctionFactor: profileData?.correctionFactor || '',
  lantusDose: profileData?.lantusDose || null,
  lantusTime: profileData?.lantusTime || '',
  hasFoodAllergy: profileData?.hasFoodAllergy || false,
  allergyDetails: profileData?.allergyDetails || '',
});
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { height, weight } = req.body;

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId },
      {
        height,
        weight,
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      height: updatedProfile.height,
      weight: updatedProfile.weight,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;