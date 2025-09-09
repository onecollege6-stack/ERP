import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, GraduationCap, UserCheck, Settings, BarChart3, Calendar, BookOpen, Award, TrendingUp, Edit, Save, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../../../api/axios';

// Define proper types for the component
type TabType = 'overview' | 'users' | 'academics' | 'settings';
type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar?: string;
  joinDate: string;
  subjects?: string[];
  classes?: string[];
  class?: string;
  rollNumber?: string;
  phone?: string;
}

interface Result {
  id: string;
  studentId: string;
  term: string;
  totalMarks: number;
  totalPossible: number;
  percentage: number;
  grade: string;
  rank: number;
}

interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

interface Mark {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  examType: string;
  marks: number;
  totalMarks: number;
  date: string;
}

interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  attendanceThreshold: number;
  schoolHours: {
    start: string;
    end: string;
  };
  subjects: string[];
  classes: string[];
}

interface SchoolData {
  users: User[];
  results: Result[];
  attendance: Attendance[];
  marks: Mark[];
  settings: SchoolSettings;
}

interface School {
  id: string;
  name: string;
}

// Main component with error boundary wrapper
function SchoolDetails() {
  try {
    return (
      <SchoolDetailsContent />
    );
  } catch (err: any) {
    console.error('FATAL ERROR IN SCHOOL DETAILS:', err);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Rendering School Details</h2>
          <p className="text-red-700 mb-2">An unexpected error occurred while rendering this page.</p>
          <p className="text-sm text-red-700 mb-4">Error: {err?.toString()}</p>
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

// The actual component content
function SchoolDetailsContent() {
  // Safely get context values with fallbacks to prevent undefined errors
  const appContext = useApp();
  const schools = appContext?.schools || [];
  const selectedSchoolId = appContext?.selectedSchoolId || '';
  const setCurrentView = appContext?.setCurrentView || (() => {});
  const getSchoolData = appContext?.getSchoolData;
  const updateUserRole = appContext?.updateUserRole;
  const updateSchoolSettings = appContext?.updateSchoolSettings;
  
  // Local fetch state for detailed data
  const [fetchedData, setFetchedData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<SchoolSettings>>({});
  const [userEditForm, setUserEditForm] = useState<Partial<User>>({});
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(null);
  
  // New state for user management
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    role: 'admin' as UserRole,
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  // Standard load/error toggle to prevent blank screen
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // DEBUG: Add comprehensive logging to understand what's happening
  useEffect(() => {
    console.log('🔍 SchoolDetails Debug Info:');
    console.log('- Component mounted/updated');
    console.log('- selectedSchoolId:', selectedSchoolId);
    console.log('- schools array:', schools);
    console.log('- schools length:', schools?.length);
    console.log('- fetchedData:', fetchedData);
    console.log('- loading:', loading);
    console.log('- error:', error);
    console.log('- activeTab:', activeTab);
    console.log('- reloadKey:', reloadKey);
  }, [selectedSchoolId, schools, fetchedData, loading, error, activeTab, reloadKey]);
  
  // Generate random password function
  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };
  
  const handleGenerateNewPassword = () => {
    const newPassword = generateRandomPassword();
    setAddUserForm({
      ...addUserForm,
      password: newPassword,
      confirmPassword: newPassword
    });
  };
  
  const school = schools?.find((s: School) => s.id === selectedSchoolId);

  // DEBUG: Log school finding logic
  useEffect(() => {
    console.log('🏫 School Finding Debug:');
    console.log('- Looking for school with ID:', selectedSchoolId);
    console.log('- Available school IDs:', schools?.map(s => s.id));
    console.log('- Found school:', school);
    console.log('- School name:', school?.name);
  }, [selectedSchoolId, schools, school]);

  // Fetch detailed school data with timeout fallback
  useEffect(() => {
    let cancelled = false;
    let timeoutId: any; // Changed from NodeJS.Timeout to any to avoid type errors
    
    async function load() {
      if (!selectedSchoolId) {
        console.log('❌ No selectedSchoolId provided, skipping data fetch');
        return;
      }
      
      console.log('🚀 Starting school data fetch for ID:', selectedSchoolId);
      setLoading(true);
      setError(null);
      
      // Timeout fallback: after 5 seconds, show error if still loading
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.error('⏰ Timeout: School details API did not respond in 5 seconds.');
          setLoading(false);
          setError('Request timed out. The server did not respond in 5 seconds.');
          setFetchedData(null);
        }
      }, 5000);
      
      try {
        console.log('📡 Making API calls...');
        const [schoolRes, usersRes] = await Promise.all([
          api.get(`/schools/${selectedSchoolId}`),
          api.get(`/schools/${selectedSchoolId}/users`)
        ]);
        
        clearTimeout(timeoutId);
        
        if (cancelled) {
          console.log('⏹️ Request cancelled, not updating state');
          return;
        }

        console.log('✅ API responses received:');
        console.log('- School response:', schoolRes?.data);
        console.log('- Users response:', usersRes?.data);

        const schoolInfo = schoolRes?.data || {};
        const users = Array.isArray(usersRes?.data) ? usersRes.data : [];

        // Process the data safely
        try {
          const assembled: SchoolData = {
            users: users.map((user: any) => ({
              id: user?._id || user?.id || 'unknown-id',
              name: user?.name || 'Unknown User',
              email: user?.email || '',
              role: user?.role || 'student',
              status: user?.status || 'active',
              joinDate: user?.createdAt || new Date().toISOString(),
              subjects: user?.teacherDetails?.subjects || [],
              classes: user?.teacherDetails?.classes || [],
              class: user?.studentDetails?.class || '',
              rollNumber: user?.studentDetails?.rollNumber || '',
              phone: user?.phone || ''
            })),
            results: [],
            attendance: [],
            marks: [],
            settings: {
              schoolName: schoolInfo?.name || school?.name || 'School',
              academicYear: schoolInfo?.settings?.academicYear?.currentYear || '2024-2025',
              attendanceThreshold: Number(schoolInfo?.settings?.attendanceThreshold) || 75,
              schoolHours: {
                start: schoolInfo?.settings?.workingHours?.start || '08:00',
                end: schoolInfo?.settings?.workingHours?.end || '15:00'
              },
              subjects: Array.isArray(schoolInfo?.settings?.subjects) ? schoolInfo.settings.subjects : [],
              classes: Array.isArray(schoolInfo?.settings?.classes) ? schoolInfo.settings.classes : []
            }
          };
          
          console.log('🔧 Assembled school data:', assembled);
          setFetchedData(assembled);
          console.log('✅ School data successfully loaded and set');
        } catch (innerError) {
          console.error('💢 Error processing API data:', innerError);
          setError('Failed to process school data. Please try again.');
          setFetchedData(null);
        }
      } catch (e: any) {
        clearTimeout(timeoutId);
        console.error('❌ Failed to load school details:', e);
        console.error('- Error response:', e?.response);
        console.error('- Error message:', e?.message);
        console.error('- Error stack:', e?.stack);
        
        setError(e?.response?.data?.message || e?.message || 'Failed to load school details');
        setFetchedData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          console.log('🏁 Loading state cleared');
        }
      }
    }
    
    load();
    return () => { 
      cancelled = true; 
      clearTimeout(timeoutId);
      console.log('🚫 useEffect cleanup - requests cancelled');
    };
  }, [selectedSchoolId, reloadKey, school?.name]);

  // Prefer locally fetched data only to reduce complexity
  const schoolData: SchoolData | undefined = fetchedData || undefined;
  
  // DEBUG: Log final render decision
  console.log('🎨 Render Decision Debug:');
  console.log('- school object:', school);
  console.log('- loading:', loading);
  console.log('- error:', error);
  console.log('- schoolData:', schoolData);
  console.log('- Will render:', school ? (loading ? 'loading' : error ? 'error' : 'content') : 'not found');

  // GUARANTEED UI - Handle all cases explicitly to prevent blank screens
  // Case 1: No selectedSchoolId
  if (!selectedSchoolId) {
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
          <h1 className="text-2xl font-bold text-gray-900 ml-4">School Details</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <p>No school selected. Please go back to the dashboard and select a school.</p>
        </div>
      </div>
    );
  }
  
  // Case 2: No school found
  if (!school) {
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
          <h1 className="text-2xl font-bold text-gray-900 ml-4">School Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>School not found. The school ID may be invalid.</p>
          <div className="text-sm mt-2">
            <p>School ID: {selectedSchoolId}</p>
            <p>Available schools: {schools?.length || 0}</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Schools List
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
        <p className="text-sm text-gray-500 mt-2">This may take a few moments.</p>
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
          onClick={() => setReloadKey(k => k + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Case 5: No school data
  if (!schoolData || !schoolData.users) {
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
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-4">
          <h3 className="font-medium">No school data available</h3>
          <p className="mt-1">The data for this school could not be loaded. This might be due to missing or incomplete data.</p>
        </div>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Case 6: All good - show the normal UI
  // We now know: selectedSchoolId exists, school exists, schoolData exists, not loading, no error
  const teachers = schoolData.users.filter((user: User) => user.role === 'teacher');
  const students = schoolData.users.filter((user: User) => user.role === 'student');
  const parents = schoolData.users.filter((user: User) => user.role === 'parent');
  const admins = schoolData.users.filter((user: User) => user.role === 'admin');
  
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users & Roles', icon: Users },
    { id: 'academics' as const, label: 'Academic Data', icon: GraduationCap },
    { id: 'settings' as const, label: 'School Settings', icon: Settings },
  ];
  
  // Event handlers and rendering functions (all the rest of your component logic)
  // ...

  // Simple placeholder content for simplicity
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
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Display content based on active tab */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">
          {activeTab === 'overview' && 'School Overview'}
          {activeTab === 'users' && 'Users & Roles'}
          {activeTab === 'academics' && 'Academic Data'}
          {activeTab === 'settings' && 'School Settings'}
        </h2>
        
        {/* Show basic summary data for demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">Total Teachers</p>
            <p className="text-2xl font-bold text-blue-900">{teachers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">Total Students</p>
            <p className="text-2xl font-bold text-green-900">{students.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-800">Total Parents</p>
            <p className="text-2xl font-bold text-purple-900">{parents.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">Total Admins</p>
            <p className="text-2xl font-bold text-yellow-900">{admins.length}</p>
          </div>
        </div>
        
        {/* Some basic school info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">School Information</h3>
          <p>Name: {schoolData.settings.schoolName}</p>
          <p>Academic Year: {schoolData.settings.academicYear}</p>
          <p>School Hours: {schoolData.settings.schoolHours.start} - {schoolData.settings.schoolHours.end}</p>
          <p>Users: {schoolData.users.length}</p>
        </div>
        
        {/* Add a retry button for safety */}
        <div className="mt-4">
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default SchoolDetails;

  if (!school) {
    console.log('🚨 BLANK SCREEN CAUSE: School not found in schools array');
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">School Details</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>School not found</p>
          <div className="text-sm mt-2 space-y-1">
            <p>Debug Info:</p>
            <p>- Looking for ID: {selectedSchoolId}</p>
            <p>- Available schools: {schools?.length || 0}</p>
            <p>- Available IDs: {schools?.map(s => s.id).join(', ') || 'none'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('🚨 RENDERING: Loading state');
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">School Details - {school?.name || 'School'}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p>Loading school details...</p>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          <p>Debug: Loading data for school ID {selectedSchoolId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🚨 RENDERING: Error state');
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">School Details - {school?.name || 'School'}</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <h3 className="font-medium">Error loading school details</h3>
          <p className="mt-1">{error}</p>
          <div className="text-sm mt-2">
            <p>Debug Info:</p>
            <p>- School ID: {selectedSchoolId}</p>
            <p>- School Name: {school?.name || 'N/A'}</p>
          </div>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // HARD GUARD: If schoolData is missing, show a visible fallback and prevent any further rendering
  if (!schoolData || !schoolData.users) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">School Details - {school?.name || 'School'}</h1>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-4">
          <strong>School data is missing or failed to load.</strong>
          <div className="text-xs mt-2">This is a hard guard to prevent blank screens. If you see this, check your API/network and browser console for errors.</div>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  const teachers = schoolData.users.filter((user: User) => user.role === 'teacher');
  const students = schoolData.users.filter((user: User) => user.role === 'student');
  const parents = schoolData.users.filter((user: User) => user.role === 'parent');
  const admins = schoolData.users.filter((user: User) => user.role === 'admin');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (selectedSchoolId) {
      updateUserRole(selectedSchoolId, userId, newRole);
      setEditingUser(null);
    }
  };

  const handleUserEdit = (user: User) => {
    setEditingUserData(user.id);
    setUserEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      subjects: user.subjects || [],
      classes: user.classes || [],
      class: user.class || '',
      rollNumber: user.rollNumber || ''
    });
  };

  const handleUserSave = async (userId: string) => {
    if (selectedSchoolId && userEditForm) {
      try {
        await api.put(`/schools/${selectedSchoolId}/users/${userId}`, userEditForm);
        
        // Update local state
        setFetchedData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map(user => 
              user.id === userId ? { ...user, ...userEditForm } : user
            )
          };
        });
        
        setEditingUserData(null);
        setUserEditForm({});
      } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user. Please try again.');
      }
    }
  };

  const handleUserCancel = () => {
    setEditingUserData(null);
    setUserEditForm({});
  };

  // Generate and set new password for a user, then track and allow reveal
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const handleGeneratePassword = async (userId: string) => {
    if (!selectedSchoolId) return;
    setGeneratingPassword(userId);
    // create random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    try {
      // Call backend to update password
      await api.patch(`/schools/${selectedSchoolId}/users/${userId}/password`, { password: newPassword });
      // store generated password
      setGeneratedPasswords(prev => ({ ...prev, [userId]: newPassword }));
      alert(`Password reset successful. New password: ${newPassword}`);
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`Error: ${msg}`);
    } finally {
      setGeneratingPassword(null);
    }
  };

  const handleAddUser = async () => {
    if (!selectedSchoolId) return;
    
    // Validate form
    if (!addUserForm.name || !addUserForm.email || !addUserForm.password) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (addUserForm.password !== addUserForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setAddingUser(true);
    try {
      console.log('Adding user with data:', {
        name: addUserForm.name,
        email: addUserForm.email,
        role: addUserForm.role,
        phone: addUserForm.phone
      });
      
      const response = await api.post(`/schools/${selectedSchoolId}/users`, {
        name: addUserForm.name,
        email: addUserForm.email,
        role: addUserForm.role,
        phone: addUserForm.phone,
        password: addUserForm.password
      });
      
      console.log('User created successfully:', response.data);
      const newUser = response.data.user;
      
      // Update local state
      setFetchedData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: [...prev.users, {
            id: newUser.id || newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: 'active',
            joinDate: new Date().toISOString(),
            phone: newUser.phone || ''
          }]
        };
      });
      
      // Reset form and close modal
      setAddUserForm({
        name: '',
        email: '',
        role: 'admin',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setShowAddUserModal(false);
      
      alert(`User ${newUser.name} added successfully!\nLogin Email: ${newUser.email}\nPassword: ${addUserForm.password}\n\nPlease save these credentials securely.`);
    } catch (error: any) {
      console.error('Failed to add user:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add user. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!selectedSchoolId) return;
    
    if (!confirm(`Are you sure you want to delete ${userName}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    setDeletingUser(userId);
    try {
      await api.delete(`/schools/${selectedSchoolId}/users/${userId}`);
      
      // Update local state
      setFetchedData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.filter(user => user.id !== userId)
        };
      });
      
      alert(`${userName} has been deleted successfully.`);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleSettingsEdit = () => {
    setEditingSettings(true);
    setSettingsForm(schoolData.settings);
  };

  const handleSettingsSave = () => {
    if (selectedSchoolId) {
      updateSchoolSettings(selectedSchoolId, settingsForm as SchoolSettings);
      setEditingSettings(false);
    }
  };

  const handleSettingsCancel = () => {
    setEditingSettings(false);
    setSettingsForm({});
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users & Roles', icon: Users },
    { id: 'academics' as const, label: 'Academic Data', icon: GraduationCap },
    { id: 'settings' as const, label: 'School Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <GraduationCap className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Parents</p>
              <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.5%</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Academic Performance</h3>
        <div className="space-y-4">
          {schoolData.results.slice(0, 3).map((result: Result) => {
            const student = students.find((s: User) => s.id === result.studentId);
            return (
              <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student?.name}</p>
                    <p className="text-sm text-gray-600">{result.term}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{result.percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Grade {result.grade}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderUserSection = (users: User[], title: string, count: number) => (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title} ({count})</h3>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {users.map((user: User) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              {/* User Info Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={user.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    {editingUserData === user.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={userEditForm.name || ''}
                          onChange={(e) => setUserEditForm({...userEditForm, name: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                          placeholder="Name"
                        />
                        <input
                          type="email"
                          value={userEditForm.email || ''}
                          onChange={(e) => setUserEditForm({...userEditForm, email: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={userEditForm.phone || ''}
                          onChange={(e) => setUserEditForm({...userEditForm, phone: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Phone"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                      </>
                    )}
                    
                    {/* Role-specific fields */}
                    {user.role === 'teacher' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {editingUserData === user.id ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={userEditForm.subjects?.join(', ') || ''}
                              onChange={(e) => setUserEditForm({
                                ...userEditForm, 
                                subjects: e.target.value.split(', ').filter(s => s.trim())
                              })}
                              className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                              placeholder="Subjects (comma-separated)"
                            />
                            <input
                              type="text"
                              value={userEditForm.classes?.join(', ') || ''}
                              onChange={(e) => setUserEditForm({
                                ...userEditForm, 
                                classes: e.target.value.split(', ').filter(c => c.trim())
                              })}
                              className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                              placeholder="Classes (comma-separated)"
                            />
                          </div>
                        ) : (
                          <>Subjects: {user.subjects?.join(', ') || 'N/A'} | Classes: {user.classes?.join(', ') || 'N/A'}</>
                        )}
                      </div>
                    )}
                    
                    {user.role === 'student' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {editingUserData === user.id ? (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={userEditForm.class || ''}
                              onChange={(e) => setUserEditForm({...userEditForm, class: e.target.value})}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Class"
                            />
                            <input
                              type="text"
                              value={userEditForm.rollNumber || ''}
                              onChange={(e) => setUserEditForm({...userEditForm, rollNumber: e.target.value})}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Roll Number"
                            />
                          </div>
                        ) : (
                          <>Class: {user.class || 'N/A'} | Roll: {user.rollNumber || 'N/A'}</>
                        )}
                      </div>
                    )}
                    
                    {(user.role === 'admin' || user.role === 'parent') && !editingUserData && (
                      <p className="text-xs text-gray-500 mt-1">Joined: {new Date(user.joinDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                  
                  {/* Edit User Data Button */}
                  {editingUserData === user.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUserSave(user.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm font-medium"
                      >
                        <Save className="h-3 w-3 inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={handleUserCancel}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
                      >
                        <X className="h-3 w-3 inline mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUserEdit(user)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm font-medium"
                    >
                      <Edit className="h-3 w-3 inline mr-1" />
                      Edit
                    </button>
                  )}
                  
                  {/* Change Role Button */}
                  {editingUser === user.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingUser(user.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                    >
                      Change Role
                    </button>
                  )}
                  
                  {/* Delete User Button */}
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    disabled={deletingUser === user.id}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      deletingUser === user.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {deletingUser === user.id ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-2"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 inline mr-1" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Section */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Password:</span>
                    <span
                      className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer"
                      onClick={() => {
                        if (generatedPasswords[user.id]) {
                          setRevealedPasswords(prev => ({
                            ...prev,
                            [user.id]: !prev[user.id]
                          }));
                        }
                      }}
                    >
                      {generatedPasswords[user.id]
                        ? (revealedPasswords[user.id]
                            ? generatedPasswords[user.id]
                            : '••••••••')
                        : '••••••••'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleGeneratePassword(user.id)}
                    disabled={generatingPassword === user.id}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      generatingPassword === user.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {generatingPassword === user.id ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-orange-700 mr-2"></span>
                        Generating...
                      </>
                    ) : (
                      <>Generate New Password</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {renderUserSection(admins, 'Administrators', admins.length)}
      {renderUserSection(teachers, 'Teachers', teachers.length)}
      {renderUserSection(students, 'Students', students.length)}
    </div>
  );

  const renderAcademics = () => (
    <div className="space-y-6">
      {/* Student Results */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Results</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Term</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Marks</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schoolData.results.map((result: Result) => {
                  const student = students.find((s: User) => s.id === result.studentId);
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'}
                            alt={student?.name || 'Student'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-900">{student?.name || 'Unknown Student'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{result.term}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.totalMarks}/{result.totalPossible}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.percentage.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.grade === 'A' ? 'bg-green-100 text-green-800' :
                          result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">#{result.rank}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Present Today</p>
                  <p className="text-2xl font-bold text-green-900">
                    {schoolData.attendance.filter((a: Attendance) => a.status === 'present').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Absent Today</p>
                  <p className="text-2xl font-bold text-red-900">
                    {schoolData.attendance.filter((a: Attendance) => a.status === 'absent').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Late Today</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {schoolData.attendance.filter((a: Attendance) => a.status === 'late').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Marks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Marks</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Exam Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Marks</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schoolData.marks.map((mark: Mark) => {
                  const student = students.find((s: User) => s.id === mark.studentId);
                  const teacher = teachers.find((t: User) => t.id === mark.teacherId);
                  return (
                    <tr key={mark.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100'}
                            alt={student?.name || 'Student'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-900">{student?.name || 'Unknown Student'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mark.subject}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{mark.examType}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{mark.marks}/{mark.totalMarks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(mark.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{teacher?.name || 'Unknown Teacher'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">School Management Settings</h3>
          {!editingSettings ? (
            <button
              onClick={handleSettingsEdit}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Settings</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSettingsCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSettingsSave}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
              {editingSettings ? (
                <input
                  type="text"
                  value={settingsForm.schoolName || ''}
                  onChange={(e) => setSettingsForm({...settingsForm, schoolName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{schoolData.settings.schoolName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              {editingSettings ? (
                <input
                  type="text"
                  value={settingsForm.academicYear || ''}
                  onChange={(e) => setSettingsForm({...settingsForm, academicYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{schoolData.settings.academicYear}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Threshold (%)</label>
              {editingSettings ? (
                <input
                  type="number"
                  value={settingsForm.attendanceThreshold || ''}
                  onChange={(e) => setSettingsForm({...settingsForm, attendanceThreshold: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{schoolData.settings.attendanceThreshold}%</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Hours</label>
              {editingSettings ? (
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={settingsForm.schoolHours?.start || ''}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm, 
                      schoolHours: {
                        ...(settingsForm.schoolHours || { start: '', end: '' }),
                        start: e.target.value
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="px-2 py-2 text-gray-500">to</span>
                  <input
                    type="time"
                    value={settingsForm.schoolHours?.end || ''}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      schoolHours: {
                        ...(settingsForm.schoolHours || { start: '', end: '' }),
                        end: e.target.value
                      }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {schoolData.settings.schoolHours.start} - {schoolData.settings.schoolHours.end}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
            {editingSettings ? (
              <textarea
                value={settingsForm.subjects?.join(', ') || ''}
                onChange={(e) => setSettingsForm({
                  ...settingsForm, 
                  subjects: e.target.value.split(', ').filter((s: string) => s.trim())
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter subjects separated by commas"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {schoolData.settings.subjects.map((subject: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
            {editingSettings ? (
              <textarea
                value={settingsForm.classes?.join(', ') || ''}
                onChange={(e) => setSettingsForm({
                  ...settingsForm, 
                  classes: e.target.value.split(', ').filter((c: string) => c.trim())
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Enter classes separated by commas"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {schoolData.settings.classes.map((className: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                      {className}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// This is the main SchoolDetails component that actually gets exported
function SchoolDetails() {
  try {
    return <SchoolDetailsContent />;
  } catch (error) {
    console.error('❌ FATAL RENDER ERROR IN SCHOOL DETAILS:', error);
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">School Details - Error</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">An error occurred during rendering</h2>
          <p className="mb-4">The application encountered an error while trying to display this page.</p>
          <p className="text-sm text-red-700 mb-4">Error: {error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

// Move the original component to a separate function that's wrapped in error boundary
function SchoolDetailsContent() {
  const { schools, selectedSchoolId, setCurrentView, getSchoolData, updateUserRole, updateSchoolSettings } = useApp();
  
  // Local fetch state for detailed data
  const [fetchedData, setFetchedData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<SchoolSettings>>({});
  const [userEditForm, setUserEditForm] = useState<Partial<User>>({});
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(null);
  
  // New state for user management
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    role: 'admin' as UserRole,
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  // Standard load/error toggle to prevent blank screen
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">School Details - {schools?.find((s: School) => s.id === selectedSchoolId)?.name || 'School'}</h1>
          </div>
          <button
            onClick={() => setCurrentView('school-login')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Test Login Portal</span>
          </button>
        </div>

        {/* DEBUG SECTION - Always visible to diagnose blank screen issues */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🔍 Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Selected School ID:</span> {selectedSchoolId}</p>
              <p><span className="font-medium">School Found:</span> {school ? '✅ Yes' : '❌ No'}</p>
              <p><span className="font-medium">School Name:</span> {school?.name || 'N/A'}</p>
              <p><span className="font-medium">Loading:</span> {loading ? '⏳ True' : '✅ False'}</p>
            </div>
            <div>
              <p><span className="font-medium">Error:</span> {error ? '❌ ' + error : '✅ None'}</p>
              <p><span className="font-medium">School Data:</span> {schoolData ? '✅ Loaded' : '❌ Missing'}</p>
              <p><span className="font-medium">Users Count:</span> {schoolData?.users?.length || 0}</p>
              <p><span className="font-medium">Active Tab:</span> {activeTab}</p>
            </div>
          </div>
          <button 
            onClick={() => console.log('Full Debug Data:', { selectedSchoolId, school, schoolData, loading, error, activeTab })}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Log Full Debug Data
          </button>
        </div>

        {/* Safety check - if we have no schoolData but made it this far, show basic interface */}
        {!schoolData ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ No School Data Available</h2>
            <p className="text-yellow-700 mb-4">
              The component rendered successfully but school data is missing. This should not cause a blank screen.
            </p>
            <div className="space-y-2 text-sm text-yellow-600">
              <p>• School: {school?.name} (ID: {selectedSchoolId})</p>
              <p>• Component is working, but API data failed to load</p>
              <p>• Check the browser console for API errors</p>
              <p>• Check the network tab for failed requests</p>
            </div>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Retry Loading Data
            </button>
          </div>
        ) : (
          <>
            {/* Normal tabs and content when data is available */}
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'academics' && renderAcademics()}
        {activeTab === 'settings' && renderSettings()}
          </>
        )}
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={addUserForm.name}
                  onChange={(e) => setAddUserForm({...addUserForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={addUserForm.role}
                  onChange={(e) => setAddUserForm({...addUserForm, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm({...addUserForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm({...addUserForm, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateNewPassword}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={addUserForm.confirmPassword}
                  onChange={(e) => setAddUserForm({...addUserForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                    addingUser
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {addingUser ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Adding...
                    </>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}