const School = require('../models/School');

// Get current academic year settings
exports.getAcademicYear = async (req, res) => {
  try {
    const { schoolCode } = req.params;

    const school = await School.findOne({ code: schoolCode });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const academicYear = school.settings?.academicYear || {
      currentYear: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31')
    };

    res.status(200).json({
      success: true,
      data: academicYear
    });

  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching academic year',
      error: error.message
    });
  }
};

// Update academic year settings
exports.updateAcademicYear = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const { currentYear, startDate, endDate } = req.body;

    if (!currentYear) {
      return res.status(400).json({
        success: false,
        message: 'Current year is required'
      });
    }

    const school = await School.findOne({ code: schoolCode });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Update academic year settings
    school.settings = school.settings || {};
    school.settings.academicYear = {
      currentYear,
      startDate: startDate ? new Date(startDate) : school.settings.academicYear?.startDate,
      endDate: endDate ? new Date(endDate) : school.settings.academicYear?.endDate
    };

    await school.save();

    res.status(200).json({
      success: true,
      message: 'Academic year updated successfully',
      data: school.settings.academicYear
    });

  } catch (error) {
    console.error('Error updating academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating academic year',
      error: error.message
    });
  }
};

module.exports = exports;
