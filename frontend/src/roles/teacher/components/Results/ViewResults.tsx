import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Filter, Download, Medal } from 'lucide-react';
import { mockStudents, currentUser } from '../../utils/mockData';

const ViewResults: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState(currentUser.classes[0]);
  const [selectedSubject, setSelectedSubject] = useState(currentUser.subjects[0]);
  const [selectedExam, setSelectedExam] = useState('mid-term');

  // Mock results data
  const mockResults = mockStudents.map(student => ({
    ...student,
    results: currentUser.subjects.map(subject => ({
      subject,
      midTerm: {
        maxMarks: 100,
        obtainedMarks: Math.floor(Math.random() * 30) + 70,
        grade: '',
        percentage: 0
      },
      finalTerm: {
        maxMarks: 100,
        obtainedMarks: Math.floor(Math.random() * 25) + 75,
        grade: '',
        percentage: 0
      }
    })).map(result => ({
      ...result,
      midTerm: {
        ...result.midTerm,
        percentage: Math.round((result.midTerm.obtainedMarks / result.midTerm.maxMarks) * 100),
        grade: getGrade((result.midTerm.obtainedMarks / result.midTerm.maxMarks) * 100)
      },
      finalTerm: {
        ...result.finalTerm,
        percentage: Math.round((result.finalTerm.obtainedMarks / result.finalTerm.maxMarks) * 100),
        grade: getGrade((result.finalTerm.obtainedMarks / result.finalTerm.maxMarks) * 100)
      }
    }))
  }));

  function getGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-green-100 text-green-700';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-blue-100 text-blue-700';
      case 'C+': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getCurrentResults = () => {
    return mockResults.map(student => ({
      ...student,
      subjectResult: student.results.find(r => r.subject === selectedSubject)
    })).filter(student => student.subjectResult);
  };

  const currentResults = getCurrentResults();
  const examType = selectedExam === 'mid-term' ? 'midTerm' : 'finalTerm';

  const classStats = {
    totalStudents: currentResults.length,
    averageMarks: Math.round(
      currentResults.reduce((sum, student) => 
        sum + (student.subjectResult?.[examType]?.obtainedMarks || 0), 0
      ) / currentResults.length
    ),
    averagePercentage: Math.round(
      currentResults.reduce((sum, student) => 
        sum + (student.subjectResult?.[examType]?.percentage || 0), 0
      ) / currentResults.length
    ),
    highestScore: Math.max(...currentResults.map(student => 
      student.subjectResult?.[examType]?.obtainedMarks || 0
    )),
    lowestScore: Math.min(...currentResults.map(student => 
      student.subjectResult?.[examType]?.obtainedMarks || 0
    ))
  };

  const gradeDistribution = currentResults.reduce((acc, student) => {
    const grade = student.subjectResult?.[examType]?.grade || 'F';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">View Results</h1>
          <p className="text-gray-600">Student performance reports for your subjects</p>
        </div>
        
        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="mid-term">Mid Term</option>
              <option value="final-term">Final Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{classStats.totalStudents}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Class Average</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{classStats.averagePercentage}%</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Highest Score</h3>
            <Medal className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{classStats.highestScore}/100</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Lowest Score</h3>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{classStats.lowestScore}/100</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Pass Rate</h3>
            <BarChart3 className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((currentResults.filter(s => 
              (s.subjectResult?.[examType]?.percentage || 0) >= 40
            ).length / currentResults.length) * 100)}%
          </p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {['A+', 'A', 'B+', 'B', 'C+', 'C', 'F'].map(grade => (
            <div key={grade} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${getGradeColor(grade)} mb-2`}>
                {grade}
              </div>
              <p className="text-sm text-gray-600">{gradeDistribution[grade] || 0} students</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedSubject} - {selectedExam.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')} Results
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marks Obtained
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentResults
                .sort((a, b) => 
                  (b.subjectResult?.[examType]?.obtainedMarks || 0) - 
                  (a.subjectResult?.[examType]?.obtainedMarks || 0)
                )
                .map((student, index) => {
                  const result = student.subjectResult?.[examType];
                  if (!result) return null;
                  
                  const isTopPerformer = index < 3;
                  const performance = result.percentage >= 80 ? 'excellent' : 
                                    result.percentage >= 60 ? 'good' : 
                                    result.percentage >= 40 ? 'average' : 'needs-improvement';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </span>
                          {isTopPerformer && (
                            <Medal className={`h-4 w-4 ml-2 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-500' :
                              'text-orange-500'
                            }`} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-blue-700">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.class}-{student.section}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.obtainedMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.maxMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${
                          performance === 'excellent' ? 'text-green-600' :
                          performance === 'good' ? 'text-blue-600' :
                          performance === 'average' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {performance === 'excellent' || performance === 'good' ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {performance.replace('-', ' ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewResults;