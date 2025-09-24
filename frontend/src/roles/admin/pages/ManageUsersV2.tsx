import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Download, Upload, Filter, 
  UserCheck, UserX, Eye, Lock, RotateCcw, FileText, 
  AlertTriangle, Check, Users, GraduationCap, Shield 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';
import { User, UserFormData, getDefaultFormData, transformUserToFormData } from '../../../types/user';
import UserForm from '../../../components/forms/UserForm';
import { exportUsers, generateImportTemplate } from '../../../utils/userImportExport';

interface School {
  _id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

const ManageUsersV2: React.FC = () => {
  const { user, token } = useAuth();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>(getDefaultFormData('student'));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0
  });

  // Get auth token
  const getAuthToken = () => token || localStorage.getItem('token') || '';

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const schoolCode = user?.schoolCode || 'SB';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      
      // Handle different response formats
      let userList: any[] = [];
      if (Array.isArray(data)) {
        userList = data;
      } else if (data.data && Array.isArray(data.data)) {
        userList = data.data;
      } else if (typeof data === 'object') {
        // Handle grouped response
        const roles = ['admin', 'teacher', 'student', 'parent'];
        for (const role of roles) {
          if (data[role] && Array.isArray(data[role])) {
            userList.push(...data[role].map((u: any) => ({ ...u, role })));
          }
        }
      }
      
      // Normalize user data to match our User interface
      const normalizedUsers: User[] = userList.map((userData: any) => ({
        _id: userData._id || userData.id,
        userId: userData.userId || userData._id,
        schoolCode: userData.schoolCode || schoolCode,
        name: {
          firstName: userData.name?.firstName || userData.firstName || 'Unknown',
          middleName: userData.name?.middleName || userData.middleName || '',
          lastName: userData.name?.lastName || userData.lastName || 'User',
          displayName: userData.name?.displayName || 
                      `${userData.name?.firstName || userData.firstName || ''} ${userData.name?.lastName || userData.lastName || ''}`.trim()
        },
        email: userData.email || 'no-email@example.com',
        role: userData.role || 'student',
        contact: {
          primaryPhone: userData.contact?.primaryPhone || userData.phone || '0000000000',
          secondaryPhone: userData.contact?.secondaryPhone || '',
          whatsappNumber: userData.contact?.whatsappNumber || '',
          emergencyContact: userData.contact?.emergencyContact || undefined
        },
        address: {
          permanent: {
            street: userData.address?.permanent?.street || userData.address?.street || '',
            area: userData.address?.permanent?.area || userData.address?.area || '',
            city: userData.address?.permanent?.city || userData.address?.city || '',
            state: userData.address?.permanent?.state || userData.address?.state || '',
            country: userData.address?.permanent?.country || userData.address?.country || 'India',
            pincode: userData.address?.permanent?.pincode || userData.address?.pincode || '',
            landmark: userData.address?.permanent?.landmark || userData.address?.landmark || ''
          },
          current: userData.address?.current || undefined,
          sameAsPermanent: userData.address?.sameAsPermanent || true
        },
        identity: userData.identity || undefined,
        isActive: userData.isActive !== false,
        passwordChangeRequired: userData.passwordChangeRequired || false,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || userData.createdAt || new Date().toISOString(),
        schoolAccess: userData.schoolAccess || undefined,
        // Role-specific details
        ...(userData.role === 'student' && userData.studentDetails ? { studentDetails: userData.studentDetails } : {}),
        ...(userData.role === 'teacher' && userData.teacherDetails ? { teacherDetails: userData.teacherDetails } : {}),
        ...(userData.role === 'admin' && userData.adminDetails ? { adminDetails: userData.adminDetails } : {})
      }));
      
      setUsers(normalizedUsers);
      
      // Update stats
      const newStats = {
        total: normalizedUsers.length,
        students: normalizedUsers.filter(u => u.role === 'student').length,
        teachers: normalizedUsers.filter(u => u.role === 'teacher').length,
        admins: normalizedUsers.filter(u => u.role === 'admin').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch school details
  const fetchSchoolDetails = async () => {
    try {
      const schoolCode = user?.schoolCode || 'SB';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/schools/${schoolCode}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const schoolData = await response.json();
        setSchool(schoolData);
      }
    } catch (error) {
      console.error('Error fetching school details:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchUsers();
    fetchSchoolDetails();
  }, [user]);

  // Filter users based on search and filters
  const filteredUsers = users.filter(userData => {
    const searchMatch = searchTerm === '' || 
      userData.name.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.contact.primaryPhone.includes(searchTerm);
    
    const roleMatch = selectedRole === 'all' || userData.role === selectedRole;
    
    let classMatch = true;
    if (selectedClass !== 'all' && userData.role === 'student' && userData.studentDetails) {
      classMatch = userData.studentDetails.currentClass === selectedClass;
    }
    
    return searchMatch && roleMatch && classMatch;
  });

  // Get unique classes for filter
  const availableClasses = Array.from(new Set(
    users
      .filter(u => u.role === 'student' && u.studentDetails?.currentClass)
      .map(u => u.studentDetails!.currentClass)
  )).sort();

  // Validate form data
  const validateForm = (data: UserFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.firstName.trim()) errors.firstName = 'First name is required';
    if (!data.lastName.trim()) errors.lastName = 'Last name is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Invalid email format';
    if (!data.primaryPhone.trim()) errors.primaryPhone = 'Phone number is required';
    if (!/^\d{10}$/.test(data.primaryPhone.replace(/\D/g, ''))) errors.primaryPhone = 'Invalid phone number';

    // Role-specific validation
    if (data.role === 'student') {
      if (!data.currentClass.trim()) errors.currentClass = 'Class is required';
      if (!data.currentSection.trim()) errors.currentSection = 'Section is required';
      if (!data.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!data.fatherName.trim()) errors.fatherName = 'Father name is required';
      if (!data.motherName.trim()) errors.motherName = 'Mother name is required';
    } else if (data.role === 'teacher') {
      if (!data.qualification.trim()) errors.qualification = 'Qualification is required';
      if (!data.subjects.length) errors.subjects = 'At least one subject is required';
      if (!data.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    } else if (data.role === 'admin') {
      if (!data.designation.trim()) errors.designation = 'Designation is required';
      if (!data.qualification.trim()) errors.qualification = 'Qualification is required';
      if (!data.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    }

    return errors;
  };

  // Handle form submission for add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    try {
      const schoolCode = user?.schoolCode || 'SB';
      const authToken = getAuthToken();
      
      // Prepare user data for backend
      const userData = {
        // Basic information
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || '',
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        
        // Contact information
        primaryPhone: formData.primaryPhone.trim(),
        secondaryPhone: formData.secondaryPhone?.trim() || '',
        whatsappNumber: formData.whatsappNumber?.trim() || '',
        emergencyContactName: formData.emergencyContactName?.trim() || '',
        emergencyContactRelation: formData.emergencyContactRelation?.trim() || '',
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || '',
        
        // Address information
        permanentStreet: formData.permanentStreet.trim(),
        permanentArea: formData.permanentArea?.trim() || '',
        permanentCity: formData.permanentCity.trim(),
        permanentState: formData.permanentState.trim(),
        permanentCountry: formData.permanentCountry || 'India',
        permanentPincode: formData.permanentPincode.trim(),
        permanentLandmark: formData.permanentLandmark?.trim() || '',
        sameAsPermanent: formData.sameAsPermanent,
        
        // Identity information
        aadharNumber: formData.aadharNumber?.trim() || '',
        panNumber: formData.panNumber?.trim() || '',
        
        // Password
        useGeneratedPassword: formData.useGeneratedPassword,
        customPassword: formData.customPassword?.trim() || '',
        
        // Role-specific data
        ...(formData.role === 'student' && {
          currentClass: (formData as any).currentClass,
          currentSection: (formData as any).currentSection,
          dateOfBirth: (formData as any).dateOfBirth,
          gender: (formData as any).gender,
          fatherName: (formData as any).fatherName,
          motherName: (formData as any).motherName,
          // Add other student fields as needed
        }),
        ...(formData.role === 'teacher' && {
          qualification: (formData as any).qualification,
          subjects: (formData as any).subjects,
          experience: (formData as any).experience,
          dateOfBirth: (formData as any).dateOfBirth,
          gender: (formData as any).gender,
          // Add other teacher fields as needed
        }),
        ...(formData.role === 'admin' && {
          designation: (formData as any).designation,
          qualification: (formData as any).qualification,
          experience: (formData as any).experience,
          dateOfBirth: (formData as any).dateOfBirth,
          gender: (formData as any).gender,
          // Add other admin fields as needed
        })
      };

      let response;
      if (editingUser) {
        // Update existing user
        response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users/${editingUser.userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
      } else {
        // Create new user
        response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user');
      }

      const result = await response.json();
      
      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      
      // Reset form and close modal
      setFormData(getDefaultFormData('student'));
      setFormErrors({});
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingUser(null);
      
      // Refresh users list
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit user
  const handleEditUser = (userData: User) => {
    const formData = transformUserToFormData(userData);
    setFormData(formData);
    setEditingUser(userData);
    setShowEditModal(true);
  };

  // Handle delete user
  const handleDeleteUser = async (userData: User) => {
    if (!confirm(`Are you sure you want to delete ${userData.name.displayName}?`)) {
      return;
    }

    try {
      const schoolCode = user?.schoolCode || 'SB';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users/${userData.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  // Handle password reset
  const handlePasswordReset = async (userData: User) => {
    if (userData.role === 'student') {
      toast.error('Password reset is not available for students');
      return;
    }

    try {
      const schoolCode = user?.schoolCode || 'SB';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users/${userData.userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const result = await response.json();
      toast.success('Password reset successfully');
      
      // Show new password to admin
      alert(`New password for ${userData.name.displayName}: ${result.newPassword}`);
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    }
  };

  // Handle export users
  const handleExportUsers = () => {
    try {
      const schoolCode = user?.schoolCode || school?.code || 'SCHOOL';
      exportUsers(filteredUsers, schoolCode);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  // Handle download import template
  const handleDownloadTemplate = () => {
    try {
      const schoolCode = user?.schoolCode || school?.code || 'SCHOOL';
      generateImportTemplate(schoolCode);
      toast.success('Import template downloaded successfully');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    }
  };

  // Handle role change in form
  const handleRoleChange = (newRole: 'student' | 'teacher' | 'admin') => {
    setFormData(getDefaultFormData(newRole));
    setFormErrors({});
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manage Users
          </h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage system users</p>
          {school && (
            <p className="text-sm text-blue-600 mt-1">
              <strong>{school.name}</strong> - School Code: {school.code}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
          <button
            onClick={handleExportUsers}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Template
          </button>
          <button
            onClick={() => {/* TODO: Implement import functionality */}}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Total Users', value: stats.total, icon: Users, color: 'blue' },
          { title: 'Students', value: stats.students, icon: GraduationCap, color: 'green' },
          { title: 'Teachers', value: stats.teachers, icon: UserCheck, color: 'purple' },
          { title: 'Admins', value: stats.admins, icon: Shield, color: 'red' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full"
              />
            </div>
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
          
          {selectedRole === 'student' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first user</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add User
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {userData.name.firstName.charAt(0)}{userData.name.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userData.name.displayName}</div>
                          <div className="text-sm text-gray-500">{userData.userId}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.contact.primaryPhone}</div>
                      {userData.contact.emergencyContact && (
                        <div className="text-sm text-gray-500">
                          Emergency: {userData.contact.emergencyContact.name} ({userData.contact.emergencyContact.phone})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userData.role === 'student' && <GraduationCap className="h-4 w-4 text-green-600 mr-1" />}
                        {userData.role === 'teacher' && <UserCheck className="h-4 w-4 text-purple-600 mr-1" />}
                        {userData.role === 'admin' && <Shield className="h-4 w-4 text-red-600 mr-1" />}
                        <span className="text-sm font-medium capitalize">{userData.role}</span>
                      </div>
                      {userData.role === 'student' && userData.studentDetails && (
                        <div className="text-sm text-gray-500">
                          Class {userData.studentDetails.currentClass}-{userData.studentDetails.currentSection}
                          {userData.studentDetails.rollNumber && ` • Roll: ${userData.studentDetails.rollNumber}`}
                        </div>
                      )}
                      {userData.role === 'teacher' && userData.teacherDetails && (
                        <div className="text-sm text-gray-500">
                          {userData.teacherDetails.subjects.slice(0, 2).join(', ')}
                          {userData.teacherDetails.subjects.length > 2 && ` +${userData.teacherDetails.subjects.length - 2} more`}
                        </div>
                      )}
                      {userData.role === 'admin' && userData.adminDetails && (
                        <div className="text-sm text-gray-500">
                          {userData.adminDetails.designation}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {userData.passwordChangeRequired && (
                        <div className="text-xs text-orange-600 mt-1">Password change required</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(userData)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userData.role !== 'student' && (
                          <button
                            onClick={() => handlePasswordReset(userData)}
                            className="text-green-600 hover:text-green-900"
                            title="Reset password"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(userData)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <UserForm
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                isEditing={!!editingUser}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData(getDefaultFormData('student'));
                    setFormErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingUser ? 'Update' : 'Create')} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersV2;
