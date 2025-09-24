import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus, Search, Filter, Download, Upload, FileText, Edit2, Trash2, Key, Eye, EyeOff } from 'lucide-react';

// Simplified but comprehensive user interface
interface User {
  _id: string;
  userId: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Additional Information
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  
  // Role-specific Information
  class?: string;
  section?: string;
  rollNumber?: string;
  employeeId?: string;
  subjects?: string[];
  qualification?: string;
  
  // Family Information (for students)
  fatherName?: string;
  motherName?: string;
  guardianPhone?: string;
  
  // System Information
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  generatedPassword?: string;
}

// Form data interface
interface UserFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  
  // Personal Information
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  pinCode: string;
  
  // Academic Information (for students)
  class: string;
  section: string;
  rollNumber: string;
  admissionDate: string;
  
  // Professional Information (for teachers/admins)
  employeeId: string;
  subjects: string[];
  qualification: string;
  experience: string;
  joiningDate: string;
  
  // Family Information (for students)
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  fatherOccupation: string;
  motherOccupation: string;
  
  // Documents
  aadharNumber: string;
  
  // Banking Information (for staff)
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  
  // Password Options
  useGeneratedPassword: boolean;
  customPassword: string;
}

const defaultFormData: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'student',
  dateOfBirth: '',
  gender: 'male',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  class: '',
  section: '',
  rollNumber: '',
  admissionDate: '',
  employeeId: '',
  subjects: [],
  qualification: '',
  experience: '',
  joiningDate: '',
  fatherName: '',
  motherName: '',
  guardianPhone: '',
  fatherOccupation: '',
  motherOccupation: '',
  aadharNumber: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  useGeneratedPassword: true,
  customPassword: ''
};

const ManageUsersNew: React.FC = () => {
  const { user, token } = useAuth();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    active: 0
  });

  // Get auth token
  const getAuthToken = () => token || localStorage.getItem('token') || '';

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const schoolCode = user?.schoolCode || 'P';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/school-users/${schoolCode}/users`, {
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
      let userList: User[] = [];
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
      
      // Normalize user data
      const normalizedUsers = userList.map(u => ({
        ...u,
        firstName: u.name?.firstName || u.firstName || '',
        lastName: u.name?.lastName || u.lastName || '',
        phone: u.contact?.primaryPhone || u.phone || '',
        address: u.address?.permanent?.street || u.address || '',
        city: u.address?.permanent?.city || u.city || '',
        state: u.address?.permanent?.state || u.state || '',
        pinCode: u.address?.permanent?.pincode || u.pinCode || '',
        class: u.studentDetails?.class || u.class || '',
        section: u.studentDetails?.section || u.section || '',
        rollNumber: u.studentDetails?.rollNumber || u.rollNumber || '',
        employeeId: u.teacherDetails?.employeeId || u.adminDetails?.employeeId || u.employeeId || '',
        subjects: u.teacherDetails?.subjects || u.subjects || [],
        qualification: u.teacherDetails?.qualification || u.qualification || '',
        fatherName: u.studentDetails?.fatherName || u.fatherName || '',
        motherName: u.studentDetails?.motherName || u.motherName || '',
        guardianPhone: u.studentDetails?.guardianPhone || u.guardianPhone || ''
      }));
      
      setUsers(normalizedUsers);
      
      // Calculate stats
      const newStats = {
        total: normalizedUsers.length,
        students: normalizedUsers.filter(u => u.role === 'student').length,
        teachers: normalizedUsers.filter(u => u.role === 'teacher').length,
        admins: normalizedUsers.filter(u => u.role === 'admin').length,
        active: normalizedUsers.filter(u => u.isActive).length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesClass = selectedClass === 'all' || user.class === selectedClass;
    
    return matchesSearch && matchesRole && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = [...new Set(users.filter(u => u.class).map(u => u.class))].sort();

  // Handle form input changes
  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Valid 10-digit phone number is required';
    
    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.class.trim()) errors.class = 'Class is required for students';
      if (!formData.section.trim()) errors.section = 'Section is required for students';
    }
    
    if (formData.role === 'teacher' || formData.role === 'admin') {
      if (!formData.qualification.trim()) errors.qualification = 'Qualification is required for staff';
    }
    
    // Password validation
    if (!formData.useGeneratedPassword && !formData.customPassword.trim()) {
      errors.customPassword = 'Custom password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate password
  const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Submit form (create or update user)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const schoolCode = user?.schoolCode || 'P';
      const authToken = getAuthToken();
      
      // Prepare user data
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pinCode: formData.pinCode.trim(),
        class: formData.class.trim(),
        section: formData.section.trim(),
        rollNumber: formData.rollNumber.trim(),
        employeeId: formData.employeeId.trim(),
        subjects: formData.subjects,
        qualification: formData.qualification.trim(),
        experience: formData.experience.trim(),
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        aadharNumber: formData.aadharNumber.trim(),
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim(),
        password: formData.useGeneratedPassword ? generatePassword() : formData.customPassword,
        passwordChangeRequired: true
      };
      
      const url = editingUser 
        ? `http://localhost:5050/api/school-users/${schoolCode}/users/${editingUser._id}`
        : `http://localhost:5050/api/school-users/${schoolCode}/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user');
      }
      
      const result = await response.json();
      console.log('User saved:', result);
      
      // Show generated password if applicable
      if (!editingUser && formData.useGeneratedPassword) {
        setSelectedUser({ ...result.user, generatedPassword: userData.password });
        setShowPasswordModal(true);
      }
      
      // Reset form and close modal
      setFormData(defaultFormData);
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingUser(null);
      
      // Refresh users list
      await fetchUsers();
      
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || 'male',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pinCode: user.pinCode || '',
      class: user.class || '',
      section: user.section || '',
      rollNumber: user.rollNumber || '',
      admissionDate: '',
      employeeId: user.employeeId || '',
      subjects: user.subjects || [],
      qualification: user.qualification || '',
      experience: '',
      joiningDate: '',
      fatherName: user.fatherName || '',
      motherName: user.motherName || '',
      guardianPhone: user.guardianPhone || '',
      fatherOccupation: '',
      motherOccupation: '',
      aadharNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      useGeneratedPassword: true,
      customPassword: ''
    });
    setShowEditModal(true);
  };

  // Delete user
  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }
    
    try {
      const schoolCode = user?.schoolCode || 'P';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/school-users/${schoolCode}/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Reset password
  const handleResetPassword = async (user: User) => {
    try {
      const newPassword = generatePassword();
      const schoolCode = user?.schoolCode || 'P';
      const authToken = getAuthToken();
      
      const response = await fetch(`http://localhost:5050/api/school-users/${schoolCode}/users/${user._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      
      setSelectedUser({ ...user, generatedPassword: newPassword });
      setShowPasswordModal(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">Add, edit, and manage system users</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.students}</div>
          <div className="text-sm text-gray-600">Students</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{stats.teachers}</div>
          <div className="text-sm text-gray-600">Teachers</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{stats.admins}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="parent">Parents</option>
            </select>

            {uniqueClasses.length > 0 && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              Card View
            </button>
          </div>

          {/* Export/Import */}
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center space-x-1">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table/Cards */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.userId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'student' ? `${user.class} ${user.section}` : user.employeeId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Card View
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div key={user._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-gray-500">{user.userId}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'student' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>{user.email}</p>
                  <p>{user.phone}</p>
                  {user.role === 'student' && user.class && (
                    <p>Class: {user.class} {user.section}</p>
                  )}
                  {(user.role === 'teacher' || user.role === 'admin') && user.employeeId && (
                    <p>ID: {user.employeeId}</p>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit User"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData(defaultFormData);
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter first name"
                      />
                      {formErrors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter last name"
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!!editingUser} // Can't change role when editing
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Enter full address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={formData.pinCode}
                        onChange={(e) => handleInputChange('pinCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter PIN code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Number
                      </label>
                      <input
                        type="text"
                        value={formData.aadharNumber}
                        onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                  </div>
                </div>

                {/* Role-specific Information */}
                {formData.role === 'student' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class *
                        </label>
                        <select
                          value={formData.class}
                          onChange={(e) => handleInputChange('class', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            formErrors.class ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Class</option>
                          <option value="1">Class 1</option>
                          <option value="2">Class 2</option>
                          <option value="3">Class 3</option>
                          <option value="4">Class 4</option>
                          <option value="5">Class 5</option>
                          <option value="6">Class 6</option>
                          <option value="7">Class 7</option>
                          <option value="8">Class 8</option>
                          <option value="9">Class 9</option>
                          <option value="10">Class 10</option>
                          <option value="11">Class 11</option>
                          <option value="12">Class 12</option>
                        </select>
                        {formErrors.class && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.class}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section *
                        </label>
                        <select
                          value={formData.section}
                          onChange={(e) => handleInputChange('section', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            formErrors.section ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                        </select>
                        {formErrors.section && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.section}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roll Number
                        </label>
                        <input
                          type="text"
                          value={formData.rollNumber}
                          onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter roll number"
                        />
                      </div>
                    </div>

                    {/* Family Information for Students */}
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">Family Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Father's Name
                          </label>
                          <input
                            type="text"
                            value={formData.fatherName}
                            onChange={(e) => handleInputChange('fatherName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter father's name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mother's Name
                          </label>
                          <input
                            type="text"
                            value={formData.motherName}
                            onChange={(e) => handleInputChange('motherName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter mother's name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guardian Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.guardianPhone}
                            onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter guardian phone"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(formData.role === 'teacher' || formData.role === 'admin') && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => handleInputChange('employeeId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter employee ID"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qualification *
                        </label>
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            formErrors.qualification ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter highest qualification"
                        />
                        {formErrors.qualification && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.qualification}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter years of experience"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {formData.role === 'teacher' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subjects (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formData.subjects.join(', ')}
                          onChange={(e) => handleInputChange('subjects', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Mathematics, Physics, Chemistry"
                        />
                      </div>
                    )}

                    {/* Banking Information for Staff */}
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">Banking Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter bank name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter account number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter IFSC code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Options */}
                {!editingUser && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Password Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="generatePassword"
                          name="passwordOption"
                          checked={formData.useGeneratedPassword}
                          onChange={() => handleInputChange('useGeneratedPassword', true)}
                          className="text-blue-600"
                        />
                        <label htmlFor="generatePassword" className="text-sm text-gray-700">
                          Generate secure password automatically
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="customPassword"
                          name="passwordOption"
                          checked={!formData.useGeneratedPassword}
                          onChange={() => handleInputChange('useGeneratedPassword', false)}
                          className="text-blue-600"
                        />
                        <label htmlFor="customPassword" className="text-sm text-gray-700">
                          Set custom password
                        </label>
                      </div>

                      {!formData.useGeneratedPassword && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.customPassword}
                              onChange={(e) => handleInputChange('customPassword', e.target.value)}
                              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                formErrors.customPassword ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter custom password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {formErrors.customPassword && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.customPassword}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingUser(null);
                      setFormData(defaultFormData);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">User Credentials</h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Name
                  </label>
                  <div className="p-3 bg-gray-50 border rounded">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 border rounded">
                    {selectedUser.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temporary Password
                  </label>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded font-mono">
                    {selectedUser.generatedPassword}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    User will be prompted to change this password on first login.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersNew;
