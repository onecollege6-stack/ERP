// This file will contain role-based access logic and helpers
const accessMatrix = {
  superadmin: {
    manageUsers: true,
    manageSchoolSettings: true,
    createTimetable: true,
    viewTimetable: true,
    markAttendance: true,
    viewAttendance: true,
    addAssignments: false,
    submitAssignments: false,
    viewResults: true,
    updateResults: false,
    message: true
  },
  admin: {
    manageUsers: true,
    manageSchoolSettings: true,
    createTimetable: true,
    viewTimetable: true,
    markAttendance: true,
    viewAttendance: true,
    addAssignments: true,
    submitAssignments: false,
    viewResults: true,
    updateResults: false,
    message: true
  },
  teacher: {
    manageUsers: false,
    manageSchoolSettings: 'limited',
    createTimetable: true,
    viewTimetable: true,
    markAttendance: true,
    viewAttendance: true,
    addAssignments: true,
    submitAssignments: false,
    viewResults: 'own',
    updateResults: true,
    message: true
  },
  student: {
    manageUsers: false,
    manageSchoolSettings: false,
    createTimetable: false,
    viewTimetable: true,
    markAttendance: false,
    viewAttendance: 'self',
    addAssignments: false,
    submitAssignments: true,
    viewResults: true,
    updateResults: false,
    message: false
  },
  parent: {
    manageUsers: false,
    manageSchoolSettings: false,
    createTimetable: false,
    viewTimetable: false,
    markAttendance: false,
    viewAttendance: false,
    addAssignments: false,
    submitAssignments: false,
    viewResults: false,
    updateResults: false,
    message: false
  }
};

module.exports = accessMatrix;
