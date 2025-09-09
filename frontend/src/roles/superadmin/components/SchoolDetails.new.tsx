import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../../../api/axios';

// Minimal version of SchoolDetails that focuses on stability

function SchoolDetails() {
  // Error boundary wrapper
  try {
    return <SchoolDetailsContent />;
  } catch (err) {
    console.error('FATAL ERROR IN SCHOOL DETAILS:', err);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Rendering School Details</h2>
          <p className="text-red-700 mb-2">An unexpected error occurred while rendering this page.</p>
          <p className="text-sm text-red-700 mb-4">Error: {String(err)}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

// The actual content component
function SchoolDetailsContent() {
  // Safely access context
  const appContext = useApp();
  const schools = appContext?.schools || [];
  const selectedSchoolId = appContext?.selectedSchoolId || '';
  const setCurrentView = appContext?.setCurrentView || (() => {});
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolData, setSchoolData] = useState<any | null>(null);
  
  // Find the selected school
  const school = schools.find(s => s.id === selectedSchoolId);
  
  // Logging for debugging
  useEffect(() => {
    console.log('SchoolDetails - Debug Info:');
    console.log('- selectedSchoolId:', selectedSchoolId);
    console.log('- school found:', school ? 'yes' : 'no');
    console.log('- school name:', school?.name);
    console.log('- loading state:', loading);
    console.log('- error state:', error);
    console.log('- data loaded:', schoolData ? 'yes' : 'no');
  }, [selectedSchoolId, school, loading, error, schoolData]);
  
  // Load data when component mounts or ID changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;
    
    async function fetchData() {
      if (!selectedSchoolId) return;
      
      setLoading(true);
      setError(null);
      
      // Set a timeout in case the request takes too long
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
          setError('Request timed out after 10 seconds');
        }
      }, 10000);
      
      try {
        const [schoolRes, usersRes] = await Promise.all([
          api.get(`/schools/${selectedSchoolId}`),
          api.get(`/schools/${selectedSchoolId}/users`)
        ]);
        
        if (!isMounted) return;
        clearTimeout(timeoutId);
        
        const schoolInfo = schoolRes.data || {};
        const users = usersRes.data || [];
        
        setSchoolData({
          school: schoolInfo,
          users: users
        });
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        
        console.error('Failed to load school details:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load school details');
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedSchoolId]);
  
  // Case 1: No school ID
  if (!selectedSchoolId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">School Details</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p>No school selected. Please go back and select a school.</p>
        </div>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  // Case 2: School not found
  if (!school) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">School Details</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p>School not found. The school ID may be invalid.</p>
          <p className="text-sm mt-2">ID: {selectedSchoolId}</p>
        </div>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  // Case 3: Loading
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">School Details - {school.name}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p>Loading school details...</p>
        </div>
      </div>
    );
  }
  
  // Case 4: Error
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">School Details - {school.name}</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <h3 className="font-medium">Error loading school details</h3>
          <p className="mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Case 5: Success - basic view
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 ml-4">School Details - {school.name}</h1>
      </div>
      
      {/* DEBUG Panel - visible to help diagnose issues */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="font-bold text-blue-800 mb-2">Debug Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">School ID:</span> {selectedSchoolId}</p>
            <p><span className="font-medium">School Name:</span> {school.name}</p>
            <p><span className="font-medium">Users Count:</span> {schoolData?.users?.length || 0}</p>
          </div>
          <div>
            <p><span className="font-medium">Data Loaded:</span> {schoolData ? '✅' : '❌'}</p>
            <p><span className="font-medium">Loading State:</span> {loading ? 'Loading' : 'Complete'}</p>
            <p><span className="font-medium">Error State:</span> {error || 'None'}</p>
          </div>
        </div>
      </div>
      
      {/* Basic School Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">School Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Basic Info</h3>
            <p><span className="font-medium">Name:</span> {school.name}</p>
            <p><span className="font-medium">ID:</span> {school.id}</p>
            {schoolData?.school?.contact && (
              <p><span className="font-medium">Contact:</span> {schoolData.school.contact.phone || 'N/A'}</p>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">User Counts</h3>
            <p><span className="font-medium">Total Users:</span> {schoolData?.users?.length || 0}</p>
            <p><span className="font-medium">Admin Users:</span> {schoolData?.users?.filter((u: any) => u.role === 'admin').length || 0}</p>
            <p><span className="font-medium">Teachers:</span> {schoolData?.users?.filter((u: any) => u.role === 'teacher').length || 0}</p>
            <p><span className="font-medium">Students:</span> {schoolData?.users?.filter((u: any) => u.role === 'student').length || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Refresh Data
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default SchoolDetails;
