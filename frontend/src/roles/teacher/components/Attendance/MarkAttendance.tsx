import React, { useState } from 'react';
import { Save, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { mockStudents, currentUser } from '../../utils/mockData';
import { AttendanceRecord } from '../../types';

const MarkAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(currentUser.classes[0]);
  const [selectedSubject, setSelectedSubject] = useState(currentUser.subjects[0]);
  const [attendance, setAttendance] = useState<Record<string, { status: 'present' | 'absent' | 'late', remarks: string }>>({});

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleSaveAttendance = () => {
    const attendanceRecords: AttendanceRecord[] = Object.entries(attendance).map(([studentId, record]) => ({
      id: Date.now().toString() + studentId,
      studentId,
      date: selectedDate,
      status: record.status || 'present',
      remarks: record.remarks || '',
      class: selectedClass,
      subject: selectedSubject
    }));
    
    // In a real app, this would save to backend
    console.log('Saving attendance:', attendanceRecords);
    alert('Attendance saved successfully!');
  };

  const getAttendanceStats = () => {
    const records = Object.values(attendance);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = mockStudents.length;
    
    return { present, absent, late, total };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
          <p className="text-gray-600">Record daily attendance for your classes</p>
        </div>
        
        <button
          onClick={handleSaveAttendance}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Attendance
        </button>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currentUser.classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currentUser.subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-gray-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Student Attendance</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mockStudents.map((student, index) => (
            <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-medium text-blue-700">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        attendance[student.id]?.status === 'present' || (!attendance[student.id] && true)
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        attendance[student.id]?.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                      }`}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Late
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        attendance[student.id]?.status === 'absent'
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Add remarks (optional)"
                    value={attendance[student.id]?.remarks || ''}
                    onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                    className="w-full sm:w-48 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;