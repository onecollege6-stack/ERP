import React from 'react';
import { Eye, CreditCard, Edit, Trash2, School, Users, Clock, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { schools, stats, setCurrentView, setSelectedSchoolId, deleteSchool } = useApp();

  const handleViewAccess = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCurrentView('view-access');
  };

  const handleAccountDetails = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCurrentView('account-details');
  };

  const handleSchoolDetails = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCurrentView('school-details');
  };
  const handleEdit = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCurrentView('edit-school');
  };
  const handleDelete = async (schoolId: string, name: string) => {
    // First confirmation dialog
    const confirmMessage = `⚠️  PERMANENT DELETION WARNING  ⚠️\n\nYou are about to delete school: "${name}"\n\nThis action will PERMANENTLY DELETE:\n✗ School record and all settings\n✗ All users (admins, teachers, students, parents)\n✗ All classes, sections, and subjects\n✗ All test records and results\n✗ All attendance data\n✗ School database and all data\n\n❌ THIS ACTION CANNOT BE UNDONE ❌\n\nAre you sure you want to proceed?`;

    if (!window.confirm(confirmMessage)) {
      console.log(`User cancelled deletion of school: ${name}`);
      return;
    }

    // Second confirmation dialog
    const secondConfirmMessage = `🚨 FINAL CONFIRMATION 🚨\n\nType the school name "${name}" to confirm deletion:\n\nNote: This will delete ALL data permanently.`;

    const userInput = window.prompt(secondConfirmMessage);

    if (userInput !== name) {
      if (userInput !== null) { // null means user clicked cancel
        alert(`❌ School name does not match. Deletion cancelled.\n\nYou entered: "${userInput}"\nRequired: "${name}"`);
      }
      console.log(`User provided incorrect school name or cancelled: entered "${userInput}", required "${name}"`);
      return;
    }

    // Proceed with deletion
    try {
      console.log(`User confirmed deletion of school: ${name} (${schoolId})`);

      // Show loading state
      if (window.confirm(`🔄 Processing deletion of "${name}"...\n\nThis may take a few moments. Click OK to proceed.`)) {
        await deleteSchool(schoolId);
        console.log(`Successfully deleted school: ${name}`);
        alert(`✅ School "${name}" and all associated data have been permanently deleted.`);
      }
    } catch (error: any) {
      console.error('Failed to delete school:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      alert(`❌ Failed to delete school "${name}".\n\nError: ${errorMessage}\n\nPlease try again or contact support.`);
    }
  };
  const statCards = [
    { title: 'Total Schools', value: stats.totalSchools, icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Last Login', value: stats.lastLogin, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">School Management Dashboard</h1>
        <button
          onClick={() => setCurrentView('add-school')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <School className="h-5 w-5" />
          <span>Add New School</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schools Grid */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Registered Schools</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {schools.map((school) => (
              <div key={school.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start space-x-4">
                  <img
                    src={school.logo}
                    alt={`${school.logo} logo`}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{school.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {school.code || 'No Code'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{school.area}, {school.district}</p>
                    <p className="text-sm text-gray-600">PIN: {school.pinCode}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Principal:</span>
                    <span className="text-sm text-gray-600">{school.principalName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Contact:</span>
                    <span className="text-sm text-gray-600">{school.mobile}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="text-sm text-gray-600 truncate">{school.principalEmail}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewAccess(school.id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Access</span>
                  </button>
                  <button
                    onClick={() => handleAccountDetails(school.id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200 text-sm font-medium"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Account Details</span>
                  </button>
                  <button
                    onClick={() => handleSchoolDetails(school.id)}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Details</span>
                  </button>
                  <button onClick={() => handleEdit(school.id)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(school.id, school.name)} className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm font-medium">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}