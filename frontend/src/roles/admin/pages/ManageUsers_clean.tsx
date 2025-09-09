import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, UserCheck, UserX, Eye, Lock, Unlock, Building } from 'lucide-react';
import { userAPI, apiUtils, schoolAPI } from '../../../services/api';
import { schoolUserAPI } from '../../../api/schoolUsers';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';

interface School {
  _id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

interface User {
  _id: string;
  name: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  contact?: {
    primaryPhone?: string;
    secondaryPhone?: string;
    emergencyContact?: string;
  };
  address?: {
    permanent?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
  };
  isActive: boolean;
  createdAt: string;
  studentDetails?: {
    studentId: string;
    class: string;
    section: string;
  };
  teacherDetails?: {
    employeeId: string;
    subjects: string[];
    qualification: string;
    experience: number;
  };
  parentDetails?: {
    parentId: string;
    relationship: string;
    occupation: string;
  };
}

interface AddUserFormData {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  
  // Personal Details
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  nationality: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  pinCode: string;
  district: string;
  
  // Family Information
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Academic Information (for students)
  class?: string;
  section?: string;
  rollNumber?: string;
  admissionDate?: string;
  previousSchool?: string;
  mediumOfInstruction?: string;
  
  // Teacher Information
  employeeId?: string;
  subjects?: string[];
  qualification?: string;
  experience?: number;
  joiningDate?: string;
  
  // Parent Information
  parentRelationship?: string;
  occupation?: string;
  
  // Documents
  aadharNumber?: string;
  panNumber?: string;
  
  // Banking Information
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  
  // Additional Information
  medicalConditions?: string;
  allergies?: string;
  specialNeeds?: string;
  transportationRequired?: boolean;
  hobbies?: string;
}

const ManageUsers: React.FC = () => {
  const { user } = useAuth();
  const authContext = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<AddUserFormData>({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    role: 'student',
    
    // Personal Details
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    nationality: 'Indian',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pinCode: '',
    district: '',
    
    // Family Information
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Academic Information
    class: '',
    section: '',
    rollNumber: '',
    admissionDate: '',
    previousSchool: '',
    mediumOfInstruction: 'English',
    
    // Teacher Information
    employeeId: '',
    subjects: [],
    qualification: '',
    experience: 0,
    joiningDate: '',
    
    // Parent Information
    parentRelationship: 'father',
    occupation: '',
    
    // Documents
    aadharNumber: '',
    panNumber: '',
    
    // Banking Information
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    
    // Additional Information
    medicalConditions: '',
    allergies: '',
    specialNeeds: '',
    transportationRequired: false,
    hobbies: ''
  });

  const resetForm = () => {
    setFormData({
      // Basic Information
      name: '',
      email: '',
      phone: '',
      role: 'student',
      
      // Personal Details
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
      nationality: 'Indian',
      
      // Address Information
      address: '',
      city: '',
      state: '',
      pinCode: '',
      district: '',
      
      // Family Information
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherOccupation: '',
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherOccupation: '',
      
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      
      // Academic Information
      class: '',
      section: '',
      rollNumber: '',
      admissionDate: '',
      previousSchool: '',
      mediumOfInstruction: 'English',
      
      // Teacher Information
      employeeId: '',
      subjects: [],
      qualification: '',
      experience: 0,
      joiningDate: '',
      
      // Parent Information
      parentRelationship: 'father',
      occupation: '',
      
      // Documents
      aadharNumber: '',
      panNumber: '',
      
      // Banking Information
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      
      // Additional Information
      medicalConditions: '',
      allergies: '',
      specialNeeds: '',
      transportationRequired: false,
      hobbies: ''
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchSchoolDetails();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { token, user } = authContext;
      
      if (!token || (!user?.schoolCode && !user?.schoolName)) {
        toast.error('Authentication required. Please login.');
        return;
      }

      // Use school name if available, otherwise fall back to school code
      const schoolIdentifier = user?.schoolName || user?.schoolCode;
      
      const response = await schoolUserAPI.getAllUsers(schoolIdentifier, token);
      
      // Handle both flat array and grouped object responses
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If response is grouped by role, flatten it
        users = Object.values(response.data).flat();
      } else {
        users = [];
      }
      
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Fallback to sample data if API fails
      const sampleUsers: User[] = [
        {
          _id: 'admin-1',
          name: { firstName: 'Test', lastName: 'Admin', displayName: 'Test Admin' },
          email: 'admin@test.com',
          role: 'admin' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          contact: { primaryPhone: '9999999999' },
          address: { permanent: { street: 'Test Street' } }
        },
        {
          _id: 'teacher-1',
          name: { firstName: 'Test', lastName: 'Teacher', displayName: 'Test Teacher' },
          email: 'teacher@test.com',
          role: 'teacher' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          contact: { primaryPhone: '8888888888' },
          address: { permanent: { street: 'Teacher Street' } }
        }
      ];
      
      setUsers(sampleUsers);
      toast.error('Failed to fetch users. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolDetails = async () => {
    try {
      const response = await schoolAPI.getSchoolProfile();
      setSchool(response.data.school);
    } catch (error) {
      console.error('Error fetching school details:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Build request data based on role
      const userData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        address: formData.address
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        userData.studentDetails = {
          class: formData.class,
          section: formData.section,
          rollNumber: formData.rollNumber,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          fatherName: formData.fatherName,
          motherName: formData.motherName
        };
      } else if (formData.role === 'teacher') {
        userData.teacherDetails = {
          qualification: formData.qualification,
          experience: formData.experience,
          subjects: formData.subjects
        };
      } else if (formData.role === 'parent') {
        userData.parentDetails = {
          relationship: formData.parentRelationship,
          occupation: formData.occupation || ''
        };
      }

      await userAPI.createUser(userData);
      toast.success('User created successfully');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name.displayName,
      firstName: user.name.firstName,
      lastName: user.name.lastName,
      email: user.email,
      phone: user.contact?.primaryPhone || '',
      address: user.address?.permanent?.street || '',
      role: user.role,
      class: user.studentDetails?.class || '',
      section: user.studentDetails?.section || '',
      subjects: user.teacherDetails?.subjects || [],
      qualification: user.teacherDetails?.qualification || '',
      experience: user.teacherDetails?.experience || 0,
      // Keep other fields from default
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
      nationality: 'Indian',
      city: '',
      state: '',
      pinCode: '',
      district: '',
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherOccupation: '',
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherOccupation: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      rollNumber: '',
      admissionDate: '',
      previousSchool: '',
      mediumOfInstruction: 'English',
      employeeId: '',
      joiningDate: '',
      parentRelationship: 'father',
      occupation: '',
      aadharNumber: '',
      panNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      medicalConditions: '',
      allergies: '',
      specialNeeds: '',
      transportationRequired: false,
      hobbies: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role
      };

      await userAPI.updateUser(editingUser._id, userData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      await userAPI.toggleUserStatus(userId);
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await userAPI.resetPassword(userId);
      toast.success(`Password reset successfully. New password: ${response.data.newPassword}`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Role,Phone,Status,Created Date\n" +
      filteredUsers.map(user => 
        `${user.name.displayName},${user.email},${user.role},${user.contact?.primaryPhone || ''},${user.isActive ? 'Active' : 'Inactive'},${new Date(user.createdAt).toLocaleDateString()}`
      ).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-gray-600">Add, edit, and manage system users</p>
            </div>
          </div>
          {school && (
            <div className="flex items-center space-x-3">
              {school.logoUrl && (
                <img src={school.logoUrl} alt={school.name} className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div className="text-right">
                <h3 className="font-semibold text-gray-900">{school.name}</h3>
                <p className="text-sm text-gray-500">School Code: {school.code}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="parent">Parents</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportUsers}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name.displayName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.contact?.primaryPhone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.isActive ? (
                          <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Reset Password"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Add New {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} - Enrollment Form
            </h3>
            <form onSubmit={handleAddUser} className="space-y-6">
              
              {/* Role Selection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Role *</label>
                <select 
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName}`.trim()})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value, name: `${formData.firstName} ${e.target.value}`.trim()})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              {formData.role === 'student' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <select
                        required
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Class</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                          <option key={num} value={num.toString()}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                      <select
                        required
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Section</option>
                        {['A','B','C','D','E'].map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter roll number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'teacher' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                      <input
                        type="text"
                        required
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter qualification"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter experience in years"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter address"
                  rows={2}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
