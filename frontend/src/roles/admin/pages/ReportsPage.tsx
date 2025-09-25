import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import ClassSectionSelect from '../components/ClassSectionSelect';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Filter state
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Real data will be fetched from API
  const [summary, setSummary] = useState(null);
  const [classSummary, setClassSummary] = useState([]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">School Reports</h1>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dues'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dues List
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Global Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ClassSectionSelect
                schoolId={user?.schoolId}
                valueClass={selectedClass}
                valueSection={selectedSection}
                onClassChange={setSelectedClass}
                onSectionChange={setSelectedSection}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary?.totalStudents || 0}</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary?.avgAttendance || 0}%</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Marks</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary?.avgMarks || 0}%</p>
                  </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary?.collectionPercentage || 0}%</p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Class Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Class Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee Collection
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classSummary.map((cls) => (
                        <tr key={cls.classId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Class {cls.className}</div>
                            <div className="text-sm text-gray-500">
                              {cls.sections.length > 0 ? cls.sections.join(', ') : 'No sections'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cls.studentCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cls.avgAttendance}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cls.avgMarks}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{formatCurrency(cls.totalFeesCollected)}</div>
                            <div className="text-xs text-gray-500">{cls.collectionPercentage}% collected</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dues Tab */}
          {activeTab === 'dues' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => alert('Export functionality will be implemented')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Outstanding Dues</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">Dues list functionality will be implemented here.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
