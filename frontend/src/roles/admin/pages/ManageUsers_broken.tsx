import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, UserCheck, UserX, Eye, Lock, Unlock, Building, RotateCcw } from 'lucide-react';
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
  userId?: string; // Add the userId field
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  address?: string;
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
}

interface AddUserFormData {
  // Generated Information
  userId: string;
  generatedPassword: string;
  
  // Basic Information (SATS Standard)
  enrollmentNo: string;
  tcNo: string;
  role: 'student' | 'teacher' | 'admin';
  
  // Admission Details (SATS Standard)
  class: string;
  academicYear: string;
  section: string;
  mediumOfInstruction: string;
  motherTongue: string;
  
  // Student Details (SATS Standard)
  name: string; // Student Name (English) - mandatory
  studentNameKannada: string; // Student Name (Kannada)
  firstName: string;
  lastName: string;
  dateOfBirth: string; // mandatory
  ageYears: number;
  ageMonths: number;
  gender: 'male' | 'female' | 'other'; // mandatory
  
  // Family Details (SATS Standard)
  fatherName: string; // Father Name (English) - mandatory
  fatherNameKannada: string; // Father Name (Kannada)
  fatherAadhaar: string; // Father Aadhaar No - 12 digits
  motherName: string; // Mother Name (English) - mandatory
  motherNameKannada: string; // Mother Name (Kannada)
  motherAadhaar: string; // Mother Aadhaar No - 12 digits
  
  // Identity Documents (SATS Standard)
  studentAadhaar: string; // Aadhaar/KPR No - 12 digits
  studentCasteCertNo: string; // Student Caste Certificate No
  fatherCasteCertNo: string; // Father Caste Certificate No
  motherCasteCertNo: string; // Mother Caste Certificate No
  
  // Caste and Category (SATS Standard)
  studentCaste: string; // Student Caste
  fatherCaste: string; // Father Caste
  motherCaste: string; // Mother Caste
  socialCategory: string; // General/SC/ST/OBC etc
  religion: string; // Hindu/Muslim/Christian etc
  specialCategory: string; // None/Destitute/Orphan/HIV case etc
  
  // Economic Status (SATS Standard)
  belongingToBPL: string; // Yes/No
  bplCardNo: string; // BPL Card No
  bhagyalakshmiBondNo: string; // Bhagyalakshmi Bond No
  
  // Special Needs (SATS Standard)
  disability: string; // Not Applicable or select condition
  
  // Address Information (SATS Standard)
  address: string; // mandatory
  cityVillageTown: string; // City/Village/Town - mandatory
  locality: string; // Locality
  taluka: string; // Taluka/Taluk - mandatory
  district: string; // District - mandatory
  pinCode: string; // Pin Code - 6 digits, mandatory
  state: string;
  
  // Communication Details (SATS Standard)
  studentMobile: string; // Student Mobile No - 10 digits
  studentEmail: string; // Student Email ID
  fatherMobile: string; // Father Mobile No - 10 digits
  fatherEmail: string; // Father Email ID
  motherMobile: string; // Mother Mobile No - 10 digits
  motherEmail: string; // Mother Email ID
  
  // School and Banking (SATS Standard)
  schoolAdmissionDate: string; // School Admission Date
  bankName: string; // Bank Name
  bankAccountNo: string; // Bank Account No
  bankIFSC: string; // Bank IFSC Code - 11 character format
  
  // Legacy Compatibility Fields
  email: string;
  phone: string;
  city: string;
  nationality: string;
  bloodGroup?: string;
  
  // Family Information (Legacy)
  fatherPhone: string;
  fatherOccupation: string;
  motherPhone: string;
  motherOccupation: string;
  guardianName?: string;
  guardianRelation?: string;
  fatherEducation?: string;
  motherEducation?: string;
  familyIncome?: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  alternatePhone?: string;
  parentEmail?: string;
  
  // Academic Information (Legacy)
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  admissionDate?: string;
  previousSchool?: string;
  previousClass?: string;
  tcNumber?: string;
  migrationCertificate?: string;
  
  // Legacy Identity Documents
  aadhaarNumber?: string;
  birthCertificateNumber?: string;
  rationCardNumber?: string;
  voterIdNumber?: string;
  passportNumber?: string;
  
  // Legacy Caste and Category
  caste?: string;
  category?: string;
  subCaste?: string;
  
  // Economic Status (Legacy)
  economicStatus?: string;
  bplCardNumber?: string;
  scholarshipDetails?: string;
  
  // Special Needs (Legacy) 
  specialNeeds?: string;
  disabilityType?: string;
  disabilityCertificate?: string;
  medicalConditions?: string;
  
  // Address Information (Additional)
  permanentAddress?: string;
  currentAddress?: string;
  village?: string;
  
  // Banking Information (Legacy)
  bankAccountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  
  // Teacher Information
  employeeId?: string;
  subjects?: string;
  qualification?: string;
  experience?: number;
  joiningDate?: string;
  department?: string;
  classes?: string;
  
  // Admin Information
  adminLevel?: string;
  accessLevel?: string;
}

const ManageUsers: React.FC = () => {
  const { user } = useAuth();

  // Helper function to generate sequential user ID based on role and school code
  const generateUserId = async (role: string, schoolCode: string): Promise<string> => {
    const roleCode = role.charAt(0).toUpperCase(); // A for admin, T for teacher, S for student
    const prefix = `${schoolCode.toUpperCase()}-${roleCode}-`;
    
    // Find existing users with the same role to determine next sequence number
    const existingUsers = users.filter(user => 
      user.role === role && 
      user.userId && 
      user.userId.toString().startsWith(prefix)
    );
    
    // Extract sequence numbers and find the highest
    const sequenceNumbers = existingUsers
      .map(user => {
        const match = user.userId.toString().match(new RegExp(`${prefix}(\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => !isNaN(num));
    
    // Start from 1 if no users exist, otherwise from the next sequence after the highest existing number
    let nextSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;
    
    // Keep checking if the generated ID already exists and increment if needed
    let userId: string;
    let isUnique = false;
    
    while (!isUnique) {
      const sequenceStr = nextSequence.toString().padStart(4, '0'); // 4 digits with leading zeros
      userId = `${prefix}${sequenceStr}`;
      
      // Check if this ID already exists in the current users list
      const exists = users.some(user => user.userId === userId);
      
      if (!exists) {
        isUnique = true;
      } else {
        nextSequence++;
      }
    }
    
    return userId!;
  };

  // Helper function to generate random password
  const generatePassword = (): string => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Helper function to validate and format phone numbers (max 10 digits)
  const validatePhoneNumber = (value: string): string => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 10 digits
    return digitsOnly.slice(0, 10);
  };

  // Function to handle role change and auto-generate ID and password
  const handleRoleChange = async (role: 'student' | 'teacher' | 'admin') => {
    const password = generatePassword();
    
    // Fetch the next available user ID from the backend
    await fetchNextUserId(role);
    
    setFormData(prev => ({
      ...prev,
      role,
      userId: '', // Will be set when nextUserId is fetched
      generatedPassword: password
    }));
  };
  const [users, setUsers] = useState<User[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showCredentials, setShowCredentials] = useState<{userId: string, password: string, email: string, role: string} | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'teacher' | 'student'>('student');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showResetCredentials, setShowResetCredentials] = useState<{userId: string, password: string, email: string, role: string} | null>(null);
  const [nextUserId, setNextUserId] = useState<string>('');
  const [loadingNextId, setLoadingNextId] = useState(false);
  const [formData, setFormData] = useState<AddUserFormData>({
    // Generated Information
    userId: '',
    generatedPassword: '',
    
    // Basic Information (SATS Standard)
    enrollmentNo: '',
    tcNo: '',
    role: 'student',
    
    // Admission Details (SATS Standard)
    class: '',
    academicYear: '2024-2025',
    section: '',
    mediumOfInstruction: 'English',
    motherTongue: '',
    
    // Student Details (SATS Standard)
    name: '', // Student Name (English) - mandatory
    studentNameKannada: '', // Student Name (Kannada)
    firstName: '',
    lastName: '',
    dateOfBirth: '', // mandatory
    ageYears: 0,
    ageMonths: 0,
    gender: 'male', // mandatory
    
    // Family Details (SATS Standard)
    fatherName: '', // Father Name (English) - mandatory
    fatherNameKannada: '', // Father Name (Kannada)
    fatherAadhaar: '', // Father Aadhaar No - 12 digits
    motherName: '', // Mother Name (English) - mandatory
    motherNameKannada: '', // Mother Name (Kannada)
    motherAadhaar: '', // Mother Aadhaar No - 12 digits
    
    // Identity Documents (SATS Standard)
    studentAadhaar: '', // Aadhaar/KPR No - 12 digits
    studentCasteCertNo: '', // Student Caste Certificate No
    fatherCasteCertNo: '', // Father Caste Certificate No
    motherCasteCertNo: '', // Mother Caste Certificate No
    
    // Caste and Category (SATS Standard)
    studentCaste: '', // Student Caste
    fatherCaste: '', // Father Caste
    motherCaste: '', // Mother Caste
    socialCategory: '', // General/SC/ST/OBC etc
    religion: '', // Hindu/Muslim/Christian etc
    specialCategory: '', // None/Destitute/Orphan/HIV case etc
    
    // Economic Status (SATS Standard)
    belongingToBPL: 'No', // Yes/No
    bplCardNo: '', // BPL Card No
    bhagyalakshmiBondNo: '', // Bhagyalakshmi Bond No
    
    // Special Needs (SATS Standard)
    disability: 'Not Applicable', // Not Applicable or select condition
    
    // Address Information (SATS Standard)
    address: '', // mandatory
    cityVillageTown: '', // City/Village/Town - mandatory
    locality: '', // Locality
    taluka: '', // Taluka/Taluk - mandatory
    district: '', // District - mandatory
    pinCode: '', // Pin Code - 6 digits, mandatory
    state: '',
    
    // Communication Details (SATS Standard)
    studentMobile: '', // Student Mobile No - 10 digits
    studentEmail: '', // Student Email ID
    fatherMobile: '', // Father Mobile No - 10 digits
    fatherEmail: '', // Father Email ID
    motherMobile: '', // Mother Mobile No - 10 digits
    motherEmail: '', // Mother Email ID
    
    // School and Banking (SATS Standard)
    schoolAdmissionDate: '', // School Admission Date
    bankName: '', // Bank Name
    bankAccountNo: '', // Bank Account No
    bankIFSC: '', // Bank IFSC Code - 11 character format
    
    // Legacy Compatibility Fields
    email: '',
    phone: '',
    city: '',
    nationality: 'Indian',
    bloodGroup: '',
    
    // Family Information (Legacy)
    fatherPhone: '',
    fatherOccupation: '',
    motherPhone: '',
    motherOccupation: '',
    guardianName: '',
    guardianRelation: '',
    fatherEducation: '',
    motherEducation: '',
    familyIncome: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    alternatePhone: '',
    parentEmail: '',
    
    // Academic Information (Legacy)
    rollNumber: '',
    admissionNumber: '',
    admissionDate: '',
    previousSchool: '',
    previousClass: '',
    tcNumber: '',
    migrationCertificate: '',
    
    // Legacy Identity Documents
    aadhaarNumber: '',
    birthCertificateNumber: '',
    rationCardNumber: '',
    voterIdNumber: '',
    passportNumber: '',
    
    // Legacy Caste and Category
    caste: '',
    category: '',
    
    subCaste: '',
    
    // Economic Status (Legacy)
    economicStatus: '',
    bplCardNumber: '',
    scholarshipDetails: '',
    
    // Special Needs (Legacy)
    specialNeeds: '',
    disabilityType: '',
    disabilityCertificate: '',
    medicalConditions: '',
    
    // Address Information (Additional)
    permanentAddress: '',
    currentAddress: '',
    village: '',
    
    // Banking Information (Legacy)
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    
    // Teacher Information
    employeeId: '',
    subjects: '',
    qualification: '',
    experience: 0,
    joiningDate: '',
    classes: '',
    
    // Admin Information
    adminLevel: '',
    accessLevel: ''
  });

  const resetForm = () => {
    setFormData({
      // Generated Information
      userId: '',
      generatedPassword: '',
      
      // Basic Information (SATS Standard)
      enrollmentNo: '',
      tcNo: '',
      role: 'student',
      
      // Admission Details (SATS Standard)
      class: '',
      academicYear: '2024-2025',
      section: '',
      mediumOfInstruction: 'English',
      motherTongue: '',
      
      // Student Details (SATS Standard)
      name: '',
      studentNameKannada: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ageYears: 0,
      ageMonths: 0,
      gender: 'male',
      
      // Family Details (SATS Standard)
      fatherName: '',
      fatherNameKannada: '',
      fatherAadhaar: '',
      motherName: '',
      motherNameKannada: '',
      motherAadhaar: '',
      
      // Identity Documents (SATS Standard)
      studentAadhaar: '',
      studentCasteCertNo: '',
      fatherCasteCertNo: '',
      motherCasteCertNo: '',
      
      // Caste and Category (SATS Standard)
      studentCaste: '',
      fatherCaste: '',
      motherCaste: '',
      socialCategory: '',
      religion: '',
      specialCategory: '',
      
      // Economic Status (SATS Standard)
      belongingToBPL: 'No',
      bplCardNo: '',
      bhagyalakshmiBondNo: '',
      
      // Special Needs (SATS Standard)
      disability: 'Not Applicable',
      
      // Address Information (SATS Standard)
      address: '',
      cityVillageTown: '',
      locality: '',
      taluka: '',
      district: '',
      pinCode: '',
      state: '',
      
      // Communication Details (SATS Standard)
      studentMobile: '',
      studentEmail: '',
      fatherMobile: '',
      fatherEmail: '',
      motherMobile: '',
      motherEmail: '',
      
      // School and Banking (SATS Standard)
      schoolAdmissionDate: '',
      bankName: '',
      bankAccountNo: '',
      bankIFSC: '',
      
      // Legacy Compatibility Fields
      email: '',
      phone: '',
      city: '',
      nationality: 'Indian',
      bloodGroup: '',
      
      // Family Information (Legacy)
      fatherPhone: '',
      fatherOccupation: '',
      motherPhone: '',
      motherOccupation: '',
      guardianName: '',
      guardianRelation: '',
      fatherEducation: '',
      motherEducation: '',
      familyIncome: '',
      
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      alternatePhone: '',
      parentEmail: '',
      
      // Academic Information (Legacy)
      rollNumber: '',
      admissionNumber: '',
      admissionDate: '',
      previousSchool: '',
      previousClass: '',
      tcNumber: '',
      migrationCertificate: '',
      
      // Legacy Identity Documents
      aadhaarNumber: '',
      birthCertificateNumber: '',
      rationCardNumber: '',
      voterIdNumber: '',
      passportNumber: '',
      
      // Legacy Caste and Category
      caste: '',
      category: '',
      subCaste: '',
      
      // Economic Status (Legacy)
      economicStatus: '',
      bplCardNumber: '',
      scholarshipDetails: '',
      
      // Special Needs (Legacy)
      specialNeeds: '',
      disabilityType: '',
      disabilityCertificate: '',
      medicalConditions: '',
      
      // Address Information (Additional)
      permanentAddress: '',
      currentAddress: '',
      village: '',
      
      // Banking Information (Legacy)
      bankAccountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      
      // Teacher Information
      employeeId: '',
      subjects: '',
      qualification: '',
      experience: 0,
      joiningDate: '',
      classes: '',
      
      // Admin Information
      adminLevel: '',
      accessLevel: ''
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchSchoolDetails();
  }, []);

  // Generate ID and password when add modal opens for the first time
  useEffect(() => {
    if (showAddModal && !formData.userId) {
      handleRoleChange(formData.role);
    }
  }, [showAddModal, users]); // Add users as dependency so it regenerates when users list changes

  // Update formData userId when nextUserId is fetched
  useEffect(() => {
    if (nextUserId) {
      setFormData(prev => ({
        ...prev,
        userId: nextUserId
      }));
    }
  }, [nextUserId]);

  // Update role and fetch next ID when activeTab changes
  useEffect(() => {
    if (showAddModal) {
      setFormData(prev => ({
        ...prev,
        role: activeTab
      }));
      fetchNextUserId(activeTab);
    }
  }, [activeTab, showAddModal]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the same token retrieval method as Dashboard
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || user?.schoolId; // Use dynamic school code
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('Fetching users for school:', schoolCode);
      console.log('API URL will be:', `http://localhost:5000/api/school-users/${schoolCode}/users`);
      console.log('Token being used:', token ? 'Present' : 'Missing');
      
      try {
        // Fetch all users from the school-specific collections
        const response = await schoolUserAPI.getAllUsers(schoolCode, token);
        console.log('API Response:', response);
        
        const allUsers: User[] = [];
        
        // Extract users from each role collection based on the actual response structure
        if (response.data && Array.isArray(response.data)) {
          // If response.data is a flat array of users
          response.data.forEach((userData: any) => {
            const processedUser: User = {
              _id: userData._id || userData.userId,
              userId: userData.userId, // Add the userId field
              name: userData.name?.displayName || 
                    (userData.name?.firstName && userData.name?.lastName 
                      ? `${userData.name.firstName} ${userData.name.lastName}` 
                      : userData.name?.firstName || userData.name?.lastName || userData.name || 'Unknown'),
              email: userData.email || 'No email',
              role: userData.role,
              phone: userData.contact?.primaryPhone || userData.contact?.phone || userData.phone,
              address: userData.address?.permanent?.street || userData.address?.street || userData.address,
              isActive: userData.isActive !== false,
              createdAt: userData.createdAt || new Date().toISOString()
            };

            // Add role-specific details
            if (userData.role === 'student') {
              processedUser.studentDetails = {
                studentId: userData.userId || userData._id,
                class: userData.academicInfo?.class || userData.class || 'Not assigned',
                section: userData.academicInfo?.section || userData.section || 'Not assigned'
              };
            } else if (userData.role === 'teacher') {
              processedUser.teacherDetails = {
                employeeId: userData.teachingInfo?.employeeId || userData.employeeId || userData.teacherId || 'Not assigned',
                subjects: userData.teachingInfo?.subjects || userData.subjects || [],
                qualification: userData.teachingInfo?.qualification || userData.qualification || 'Not provided',
                experience: userData.teachingInfo?.experience || userData.experience || 0
              };
            }

            allUsers.push(processedUser);
          });
        } else {
          // Handle grouped response structure - exclude parents
          ['students', 'teachers', 'admins'].forEach(roleKey => {
            if (response[roleKey] && Array.isArray(response[roleKey])) {
              response[roleKey].forEach((userData: any) => {
                const role = roleKey.slice(0, -1) as 'student' | 'teacher' | 'admin'; // Remove 's' from plural
                const processedUser: User = {
                  _id: userData._id || userData.userId,
                  userId: userData.userId, // Add the userId field
                  name: userData.name?.displayName || 
                        (userData.name?.firstName && userData.name?.lastName 
                          ? `${userData.name.firstName} ${userData.name.lastName}` 
                          : userData.name?.firstName || userData.name?.lastName || userData.name || 'Unknown'),
                  email: userData.email || 'No email',
                  role: role,
                  phone: userData.contact?.primaryPhone || userData.contact?.phone || userData.phone,
                  address: userData.address?.permanent?.street || userData.address?.street || userData.address,
                  isActive: userData.isActive !== false,
                  createdAt: userData.createdAt || new Date().toISOString()
                };

                // Add role-specific details
                if (role === 'student') {
                  processedUser.studentDetails = {
                    studentId: userData.userId || userData._id,
                    class: userData.academicInfo?.class || userData.class || 'Not assigned',
                    section: userData.academicInfo?.section || userData.section || 'Not assigned'
                  };
                } else if (role === 'teacher') {
                  processedUser.teacherDetails = {
                    employeeId: userData.teachingInfo?.employeeId || userData.employeeId || userData.teacherId || 'Not assigned',
                    subjects: userData.teachingInfo?.subjects || userData.subjects || [],
                    qualification: userData.teachingInfo?.qualification || userData.qualification || 'Not provided',
                    experience: userData.teachingInfo?.experience || userData.experience || 0
                  };
                }

                allUsers.push(processedUser);
              });
            }
          });
        }
        
        console.log('Processed users:', allUsers);
        setUsers(allUsers);
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        toast.error('Failed to fetch users from API');
        setUsers([]); // Set empty array instead of mock data
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch next available user ID for the selected role
  const fetchNextUserId = async (role: string) => {
    try {
      setLoadingNextId(true);
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      
      if (!token) {
        console.error('No token available');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/next-id/${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNextUserId(data.nextUserId);
        console.log(`Next ${role} ID:`, data.nextUserId);
      } else {
        console.error('Failed to fetch next user ID');
        setNextUserId('');
      }
    } catch (error) {
      console.error('Error fetching next user ID:', error);
      setNextUserId('');
    } finally {
      setLoadingNextId(false);
    }
  };

  const fetchSchoolDetails = async () => {
    try {
      // For now, use the user's school information
      if (user?.schoolCode) {
        setSchool({ 
          _id: '1', 
          name: user.schoolName || 'School', 
          code: user.schoolCode 
        });
      }
      console.log('School details set from user context');
    } catch (error) {
      console.error('Error fetching school details:', error);
    }
  };

  // Function to check if email already exists across all roles
  const checkEmailExists = async (email: string): Promise<{exists: boolean, role?: string, name?: string}> => {
    try {
      // Check against the current users list first (in memory check)
      const existingUser = users.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUser) {
        return {
          exists: true,
          role: existingUser.role,
          name: existingUser.name
        };
      }
      
      // If not found in current list, make API call to double-check
      // This ensures we catch any users that might not be in the current filtered list
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P';
      
      if (token) {
        try {
          const response = await schoolUserAPI.getAllUsers(schoolCode, token);
          
          // Check across all users in the response
          if (response.data && Array.isArray(response.data)) {
            const emailConflict = response.data.find((userData: any) => 
              userData.email && userData.email.toLowerCase() === email.toLowerCase()
            );
            
            if (emailConflict) {
              return {
                exists: true,
                role: emailConflict.role,
                name: emailConflict.name?.displayName || 
                      (emailConflict.name?.firstName && emailConflict.name?.lastName 
                        ? `${emailConflict.name.firstName} ${emailConflict.name.lastName}` 
                        : emailConflict.name?.firstName || emailConflict.name?.lastName || emailConflict.name || 'Unknown')
              };
            }
          }
        } catch (apiError) {
          console.warn('Could not verify email uniqueness via API, proceeding with form validation only');
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error checking email existence:', error);
      // If there's an error, don't block the user creation but log it
      return { exists: false };
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate email uniqueness across all roles before creating user
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists.exists) {
        toast.error(`Email already exists for ${emailExists.role}: ${emailExists.name}`);
        setLoading(false);
        return;
      }
      
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
          subjects: formData.subjects,
          employeeId: formData.employeeId,
          joiningDate: formData.joiningDate,
          classes: formData.classes,
          city: formData.city,
          district: formData.district,
          pinCode: formData.pinCode
        };
      } else if (formData.role === 'admin') {
        userData.adminDetails = {
          adminLevel: formData.adminLevel,
          department: formData.department,
          employeeId: formData.employeeId,
          accessLevel: formData.accessLevel
        };
      }

      // Use the same token retrieval method as Dashboard
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'NPS';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Build request data based on role
      const newUserData: any = {
        userId: formData.userId,
        password: formData.generatedPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        address: formData.address
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        // Basic Academic Information
        newUserData.class = formData.class;
        newUserData.section = formData.section;
        newUserData.rollNumber = formData.rollNumber;
        newUserData.dateOfBirth = formData.dateOfBirth;
        newUserData.gender = formData.gender;
        
        // Karnataka SATS Fields - Family Details
        newUserData.fatherName = formData.fatherName;
        newUserData.motherName = formData.motherName;
        newUserData.guardianName = formData.guardianName;
        newUserData.guardianRelation = formData.guardianRelation;
        newUserData.fatherOccupation = formData.fatherOccupation;
        newUserData.motherOccupation = formData.motherOccupation;
        newUserData.fatherEducation = formData.fatherEducation;
        newUserData.motherEducation = formData.motherEducation;
        newUserData.familyIncome = formData.familyIncome;
        
        // Admission Details
        newUserData.admissionDate = formData.admissionDate;
        newUserData.admissionNumber = formData.admissionNumber;
        newUserData.previousSchool = formData.previousSchool;
        newUserData.previousClass = formData.previousClass;
        newUserData.tcNumber = formData.tcNumber;
        newUserData.migrationCertificate = formData.migrationCertificate;
        
        // Identity Documents
        newUserData.aadhaarNumber = formData.aadhaarNumber;
        newUserData.birthCertificateNumber = formData.birthCertificateNumber;
        newUserData.rationCardNumber = formData.rationCardNumber;
        newUserData.voterIdNumber = formData.voterIdNumber;
        newUserData.passportNumber = formData.passportNumber;
        
        // Caste and Category
        newUserData.caste = formData.caste;
        newUserData.category = formData.category;
        newUserData.subCaste = formData.subCaste;
        newUserData.religion = formData.religion;
        
        // Economic Status
        newUserData.economicStatus = formData.economicStatus;
        newUserData.bplCardNumber = formData.bplCardNumber;
        newUserData.scholarshipDetails = formData.scholarshipDetails;
        
        // Special Needs
        newUserData.specialNeeds = formData.specialNeeds;
        newUserData.disabilityType = formData.disabilityType;
        newUserData.disabilityCertificate = formData.disabilityCertificate;
        newUserData.medicalConditions = formData.medicalConditions;
        
        // Address Information
        newUserData.permanentAddress = formData.permanentAddress;
        newUserData.currentAddress = formData.currentAddress;
        newUserData.pinCode = formData.pinCode;
        newUserData.district = formData.district;
        newUserData.state = formData.state;
        newUserData.taluka = formData.taluka;
        newUserData.village = formData.village;
        
        // Communication
        newUserData.emergencyContactPhone = formData.emergencyContactPhone;
        newUserData.alternatePhone = formData.alternatePhone;
        newUserData.parentEmail = formData.parentEmail;
        
        // Banking Information
        newUserData.bankAccountNumber = formData.bankAccountNumber;
        newUserData.bankName = formData.bankName;
        newUserData.ifscCode = formData.ifscCode;
        newUserData.accountHolderName = formData.accountHolderName;
      } else if (formData.role === 'teacher') {
        newUserData.qualification = formData.qualification;
        newUserData.experience = formData.experience;
        newUserData.subjects = formData.subjects;
        newUserData.employeeId = formData.employeeId;
      } else if (formData.role === 'admin') {
        newUserData.adminLevel = formData.adminLevel;
        newUserData.department = formData.department;
        newUserData.employeeId = formData.employeeId;
        newUserData.accessLevel = formData.accessLevel;
      }

      console.log('Creating user with data:', newUserData);
      
      await schoolUserAPI.addUser(schoolCode, newUserData, token);
      
      // Show credentials modal
      setShowCredentials({
        userId: formData.userId,
        password: formData.generatedPassword,
        email: formData.email,
        role: formData.role
      });
      
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
    console.log('Editing user:', user); // Debug log to see the user structure
    setEditingUser(user);
    
    // Extract user data based on the actual backend structure
    const userData = user as any;
    
    setFormData({
      // Generated Information - show existing user ID
      userId: userData.userId || userData._id || '',
      generatedPassword: '', // Never show password
      
      // Basic Information (SATS Standard)
      enrollmentNo: userData.enrollmentNo || '',
      tcNo: userData.tcNo || '',
      role: userData.role || 'student',
      
      // Admission Details (SATS Standard)
      class: userData.academicInfo?.class || userData.studentDetails?.class || '',
      academicYear: userData.academicYear || '2024-2025',
      section: userData.section || '',
      mediumOfInstruction: userData.mediumOfInstruction || 'English',
      motherTongue: userData.motherTongue || '',
      
      // Student Details (SATS Standard)
      name: userData.name?.displayName || userData.name?.firstName + ' ' + userData.name?.lastName || userData.name || '',
      studentNameKannada: userData.studentNameKannada || '',
      firstName: userData.name?.firstName || '',
      lastName: userData.name?.lastName || '',
      dateOfBirth: userData.dateOfBirth ? 
        new Date(userData.dateOfBirth).toISOString().split('T')[0] : 
        userData.personalInfo?.dateOfBirth ? 
        new Date(userData.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      ageYears: userData.ageYears || 0,
      ageMonths: userData.ageMonths || 0,
      gender: userData.gender || userData.personalInfo?.gender || 'male',
      
      // Family Details (SATS Standard)
      fatherName: userData.fatherName || '',
      fatherNameKannada: userData.fatherNameKannada || '',
      fatherAadhaar: userData.fatherAadhaar || '',
      motherName: userData.motherName || '',
      motherNameKannada: userData.motherNameKannada || '',
      motherAadhaar: userData.motherAadhaar || '',
      
      // Identity Documents (SATS Standard)
      studentAadhaar: userData.studentAadhaar || userData.aadhaarNumber || '',
      studentCasteCertNo: userData.studentCasteCertNo || '',
      fatherCasteCertNo: userData.fatherCasteCertNo || '',
      motherCasteCertNo: userData.motherCasteCertNo || '',
      
      // Caste and Category (SATS Standard)
      studentCaste: userData.studentCaste || userData.caste || '',
      fatherCaste: userData.fatherCaste || '',
      motherCaste: userData.motherCaste || '',
      socialCategory: userData.socialCategory || userData.category || '',
      religion: userData.religion || '',
      specialCategory: userData.specialCategory || '',
      
      // Economic Status (SATS Standard)
      belongingToBPL: userData.belongingToBPL || 'No',
      bplCardNo: userData.bplCardNo || userData.bplCardNumber || '',
      bhagyalakshmiBondNo: userData.bhagyalakshmiBondNo || '',
      
      // Special Needs (SATS Standard)
      disability: userData.disability || userData.specialNeeds || 'Not Applicable',
      
      // Address Information (SATS Standard)
      address: userData.address?.permanent?.street || userData.address?.street || userData.address || '',
      cityVillageTown: userData.cityVillageTown || userData.address?.permanent?.city || userData.city || '',
      locality: userData.locality || '',
      taluka: userData.taluka || userData.taluk || '',
      district: userData.teachingInfo?.district || userData.teacherDetails?.district || userData.address?.permanent?.district || userData.district || '',
      pinCode: userData.teachingInfo?.pinCode || userData.teacherDetails?.pinCode || userData.address?.permanent?.pincode || userData.pinCode || '',
      state: userData.address?.permanent?.state || userData.state || '',
      
      // Communication Details (SATS Standard)
      studentMobile: userData.studentMobile || userData.contact?.primaryPhone || userData.phone || '',
      studentEmail: userData.studentEmail || userData.email || '',
      fatherMobile: userData.fatherMobile || userData.fatherPhone || '',
      fatherEmail: userData.fatherEmail || '',
      motherMobile: userData.motherMobile || userData.motherPhone || '',
      motherEmail: userData.motherEmail || '',
      
      // School and Banking (SATS Standard)
      schoolAdmissionDate: userData.schoolAdmissionDate || userData.admissionDate || '',
      bankName: userData.bankName || '',
      bankAccountNo: userData.bankAccountNo || userData.bankAccountNumber || '',
      bankIFSC: userData.bankIFSC || userData.ifscCode || '',
      
      // Legacy Compatibility Fields
      email: userData.email || '',
      phone: userData.contact?.primaryPhone || userData.phone || '',
      city: userData.teachingInfo?.city || userData.teacherDetails?.city || userData.address?.permanent?.city || userData.city || '',
      nationality: userData.nationality || 'Indian',
      bloodGroup: userData.bloodGroup || '',
      
      // Family Information (Legacy)
      fatherPhone: userData.fatherPhone || '',
      fatherOccupation: userData.fatherOccupation || '',
      motherPhone: userData.motherPhone || '',
      motherOccupation: userData.motherOccupation || '',
      guardianName: userData.guardianName || '',
      guardianRelation: userData.guardianRelation || '',
      fatherEducation: userData.fatherEducation || '',
      motherEducation: userData.motherEducation || '',
      familyIncome: userData.familyIncome || '',
      
      // Emergency Contact
      emergencyContactName: userData.emergencyContactName || '',
      emergencyContactPhone: userData.contact?.emergencyContact || '',
      emergencyContactRelation: userData.emergencyContactRelation || '',
      alternatePhone: userData.contact?.secondaryPhone || '',
      parentEmail: userData.parentEmail || '',
      
      // Academic Information (Legacy)
      rollNumber: userData.academicInfo?.rollNumber || userData.rollNumber || '',
      admissionNumber: userData.academicInfo?.admissionNumber || userData.admissionNumber || '',
      admissionDate: userData.academicInfo?.admissionDate ? 
        new Date(userData.academicInfo.admissionDate).toISOString().split('T')[0] : 
        userData.admissionDate || '',
      previousSchool: userData.previousSchool || '',
      previousClass: userData.previousClass || '',
      tcNumber: userData.tcNumber || '',
      migrationCertificate: userData.migrationCertificate || '',
      
      // Legacy Identity Documents
      aadhaarNumber: userData.aadhaarNumber || '',
      birthCertificateNumber: userData.birthCertificateNumber || '',
      rationCardNumber: userData.rationCardNumber || '',
      voterIdNumber: userData.voterIdNumber || '',
      passportNumber: userData.passportNumber || '',
      
      // Legacy Caste and Category
      caste: userData.caste || '',
      category: userData.category || '',
      subCaste: userData.subCaste || '',
      
      // Economic Status (Legacy)
      economicStatus: userData.economicStatus || '',
      bplCardNumber: userData.bplCardNumber || '',
      scholarshipDetails: userData.scholarshipDetails || '',
      
      // Special Needs (Legacy)
      specialNeeds: userData.specialNeeds || '',
      disabilityType: userData.disabilityType || '',
      disabilityCertificate: userData.disabilityCertificate || '',
      medicalConditions: userData.medicalConditions || '',
      
      // Address Information (Additional)
      permanentAddress: userData.address?.permanent?.street || '',
      currentAddress: userData.address?.current?.street || '',
      village: userData.village || '',
      
      // Banking Information (Legacy)
      bankAccountNumber: userData.bankAccountNumber || '',
      ifscCode: userData.ifscCode || '',
      accountHolderName: userData.accountHolderName || '',
      
      // Teacher Information
      subjects: Array.isArray(userData.teachingInfo?.subjects) ? 
        userData.teachingInfo.subjects.join(', ') : 
        Array.isArray(userData.teacherDetails?.subjects) ? 
        userData.teacherDetails.subjects.join(', ') : 
        userData.teachingInfo?.subjects || userData.teacherDetails?.subjects || userData.subjects || '',
      qualification: userData.teachingInfo?.qualification || userData.teacherDetails?.qualification || userData.qualification || '',
      experience: userData.teachingInfo?.experience || userData.teacherDetails?.experience || userData.experience || 0,
      employeeId: userData.teachingInfo?.employeeId || userData.teacherDetails?.employeeId || userData.employeeId || '',
      joiningDate: userData.teachingInfo?.joiningDate ? 
        new Date(userData.teachingInfo.joiningDate).toISOString().split('T')[0] : 
        userData.joiningDate ? 
        new Date(userData.joiningDate).toISOString().split('T')[0] : '',
      classes: Array.isArray(userData.teachingInfo?.classes) ? 
        userData.teachingInfo.classes.join(', ') : 
        Array.isArray(userData.teacherDetails?.classes) ? 
        userData.teacherDetails.classes.join(', ') : 
        userData.teachingInfo?.classes || userData.teacherDetails?.classes || userData.classes || '',
      
      // Admin Information
      adminLevel: userData.adminLevel || '',
      accessLevel: userData.accessLevel || ''
    });
    
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      
      // Check if email is being changed and if it already exists
      if (formData.email !== editingUser.email) {
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists.exists) {
          toast.error(`Email already exists for ${emailExists.role}: ${emailExists.name}`);
          setLoading(false);
          return;
        }
      }
      
      // Use the same token retrieval method as Dashboard
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Build comprehensive update data
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: editingUser.role, // Keep the existing role, don't allow changing
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      // Add role-specific fields
      if (editingUser.role === 'student') {
        // Academic Information
        updateData.class = formData.class;
        updateData.section = formData.section;
        updateData.rollNumber = formData.rollNumber;
        updateData.dateOfBirth = formData.dateOfBirth;
        updateData.gender = formData.gender;
        updateData.admissionDate = formData.admissionDate;
        updateData.admissionNumber = formData.admissionNumber;
        
        // Family Information
        updateData.fatherName = formData.fatherName;
        updateData.motherName = formData.motherName;
        updateData.fatherPhone = formData.fatherPhone;
        updateData.motherPhone = formData.motherPhone;
        updateData.fatherOccupation = formData.fatherOccupation;
        updateData.motherOccupation = formData.motherOccupation;
        updateData.guardianName = formData.guardianName;
        updateData.guardianRelation = formData.guardianRelation;
        updateData.fatherEducation = formData.fatherEducation;
        updateData.motherEducation = formData.motherEducation;
        updateData.familyIncome = formData.familyIncome;
        
        // Karnataka SATS fields
        updateData.aadhaarNumber = formData.aadhaarNumber;
        updateData.birthCertificateNumber = formData.birthCertificateNumber;
        updateData.rationCardNumber = formData.rationCardNumber;
        updateData.voterIdNumber = formData.voterIdNumber;
        updateData.passportNumber = formData.passportNumber;
        updateData.caste = formData.caste;
        updateData.category = formData.category;
        updateData.subCaste = formData.subCaste;
        updateData.religion = formData.religion;
        updateData.economicStatus = formData.economicStatus;
        updateData.bplCardNumber = formData.bplCardNumber;
        updateData.scholarshipDetails = formData.scholarshipDetails;
        updateData.specialNeeds = formData.specialNeeds;
        updateData.disabilityType = formData.disabilityType;
        updateData.disabilityCertificate = formData.disabilityCertificate;
        updateData.medicalConditions = formData.medicalConditions;
        updateData.permanentAddress = formData.permanentAddress;
        updateData.currentAddress = formData.currentAddress;
        updateData.taluka = formData.taluka;
        updateData.village = formData.village;
        updateData.alternatePhone = formData.alternatePhone;
        updateData.parentEmail = formData.parentEmail;
        updateData.bankAccountNumber = formData.bankAccountNumber;
        updateData.bankName = formData.bankName;
        updateData.ifscCode = formData.ifscCode;
        updateData.accountHolderName = formData.accountHolderName;
      } else if (editingUser.role === 'teacher') {
        updateData.qualification = formData.qualification;
        updateData.experience = formData.experience;
        updateData.subjects = formData.subjects;
        updateData.employeeId = formData.employeeId;
        updateData.joiningDate = formData.joiningDate;
        updateData.classes = formData.classes;
        updateData.city = formData.city;
        updateData.district = formData.district;
        updateData.pinCode = formData.pinCode;
      } else if (editingUser.role === 'admin') {
        updateData.adminLevel = formData.adminLevel;
        updateData.department = formData.department;
        updateData.employeeId = formData.employeeId;
        updateData.accessLevel = formData.accessLevel;
      }

      // Address information (common for all roles)
      updateData.address = formData.address;
      updateData.city = formData.city;
      updateData.state = formData.state;
      updateData.pinCode = formData.pinCode;
      updateData.district = formData.district;

      console.log('Updating user with data:', updateData);

      // Make API call to update user
      await schoolUserAPI.updateUser(schoolCode, editingUser._id, updateData, token);
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
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const newStatus = !currentStatus;
      const action = newStatus ? 'activate' : 'deactivate';
      
      await schoolUserAPI.toggleStatus(schoolCode, userId, newStatus, token);
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    console.log('Delete button clicked for user:', userId, userName);
    
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Starting delete process...');
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P';
      
      console.log('Delete request details:', { schoolCode, userId, hasToken: !!token });
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('Calling delete API...');
      await schoolUserAPI.deleteUser(schoolCode, userId, token);
      console.log('Delete API successful');
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P';
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Make API call to reset password
      const response = await schoolUserAPI.resetPassword(schoolCode, userId, token);
      
      // Find the user to get email and role (try both userId and _id)
      const resetUser = users.find(u => u.userId === userId || u._id === userId);
      
      console.log('Reset password - userId passed:', userId);
      console.log('Reset password - found user:', resetUser);
      
      // Show credentials modal with new password from response
      if (response.data && resetUser) {
        // Always prioritize the actual userId from the user object
        const displayUserId = resetUser.userId || resetUser._id;
        
        setShowResetCredentials({
          userId: displayUserId,
          password: response.data.password,
          email: response.data.email || resetUser.email || 'No email provided',
          role: resetUser.role || 'Unknown'
        });
        
        console.log('Reset password - showing credentials for userId:', displayUserId);
      } else {
        toast.success('Password reset successfully. New password sent to user email.');
      }
      
      console.log('Password reset for user:', userId);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = user.role === activeTab;
    const matchesGrade = activeTab !== 'student' || selectedGrade === 'all' || user.studentDetails?.class === selectedGrade;
    return matchesSearch && matchesRole && matchesGrade;
  });

  const exportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Role,Phone,Status,Created Date\n" +
      filteredUsers.map(user => 
        `${user.name},${user.email},${user.role},${user.phone || ''},${user.isActive ? 'Active' : 'Inactive'},${new Date(user.createdAt).toLocaleDateString()}`
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

        {/* Role Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('student')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'student'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students ({users.filter(u => u.role === 'student').length})
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teacher'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teachers ({users.filter(u => u.role === 'teacher').length})
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admins ({users.filter(u => u.role === 'admin').length})
            </button>
          </nav>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
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
            {activeTab === 'student' && (
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Grades</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>
            )}
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
              onClick={async () => {
                setShowAddModal(true);
                // Set role based on active tab and generate credentials
                setFormData(prev => ({
                  ...prev,
                  role: activeTab
                }));
                // Generate credentials automatically
                const schoolCode = user?.schoolCode || 'P';
                const userId = await generateUserId(activeTab, schoolCode);
                const password = generatePassword();
                setFormData(prev => ({
                  ...prev,
                  userId: userId,
                  generatedPassword: password
                }));
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                {activeTab === 'student' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  </>
                )}
                {activeTab === 'teacher' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  </>
                )}
                {activeTab === 'admin' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'student' ? 8 : activeTab === 'teacher' ? 8 : 8} className="px-6 py-4 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'student' ? 8 : activeTab === 'teacher' ? 8 : 8} className="px-6 py-4 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(user as any).name?.displayName || 
                           ((user as any).name?.firstName && (user as any).name?.lastName 
                             ? `${(user as any).name.firstName} ${(user as any).name.lastName}` 
                             : (user as any).name?.firstName || user.name || 'No name')}
                        </div>
                        <div className="text-sm text-gray-500">{(user as any).userId || user._id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{user.email}</div>
                        <div className="text-xs text-gray-400">{(user as any).contact?.primaryPhone || user.phone || 'No phone'}</div>
                      </div>
                    </td>
                    {activeTab === 'student' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(user as any).academicInfo?.class || user.studentDetails?.class || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(user as any).academicInfo?.section || user.studentDetails?.section || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(user as any).userId || user._id || 'Not assigned'}
                        </td>
                      </>
                    )}
                    {activeTab === 'teacher' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.teacherDetails?.employeeId || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-32 truncate">
                            {Array.isArray(user.teacherDetails?.subjects) 
                              ? user.teacherDetails.subjects.join(', ') 
                              : user.teacherDetails?.subjects || 'Not assigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.teacherDetails?.experience ? `${user.teacherDetails.experience} years` : 'Not provided'}
                        </td>
                      </>
                    )}
                    {activeTab === 'admin' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Employee ID
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Administration
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Full Access
                        </td>
                      </>
                    )}
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
                          onClick={() => handleResetPassword(user.userId || user._id)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Reset Password"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        {/* Delete button - prevent self-deletion */}
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name || `User ${user._id}`)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                          disabled={false} // Temporarily allow all deletions for testing
                        >
                          <Trash2 className="h-4 w-4" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Role</label>
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-medium">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Role is automatically set based on the current tab</p>
              </div>

              {/* Generated Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Generated Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next User ID 
                      {loadingNextId && <span className="text-blue-500 ml-1">(Loading...)</span>}
                      {!loadingNextId && formData.userId && <span className="text-green-600 ml-1">✅</span>}
                    </label>
                    <input
                      type="text"
                      value={loadingNextId ? 'Generating next ID...' : (formData.userId || 'Select role to generate ID')}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                      placeholder="Next sequential ID will appear here"
                    />
                    {formData.userId && !loadingNextId && (
                      <p className="text-xs text-green-600 mt-1">
                        This is the next available ID for {formData.role} role
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generated Password
                      {formData.generatedPassword && <span className="text-green-600 ml-1">✅</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.generatedPassword || 'Password will be generated automatically'}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                      placeholder="Auto-generated password will appear here"
                    />
                    {formData.generatedPassword && (
                      <p className="text-xs text-green-600 mt-1">
                        8-character secure password generated
                      </p>
                    )}
                  </div>
                </div>
                {(formData.userId || formData.generatedPassword) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ <strong>Important:</strong> Save this password! It will be needed for the user's first login.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      The user will be required to change this password on their first login.
                    </p>
                  </div>
                )}
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
                      onChange={(e) => setFormData({...formData, phone: validatePhoneNumber(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter phone number (10 digits)"
                      maxLength={10}
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
                <div className="space-y-6">
                  
                  {/* Basic Information - SATS Standard */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
                        <input
                          type="text"
                          value={formData.enrollmentNo}
                          onChange={(e) => setFormData({...formData, enrollmentNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter enrollment number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TC No</label>
                        <input
                          type="text"
                          value={formData.tcNo}
                          onChange={(e) => setFormData({...formData, tcNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter TC number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admission Details - SATS Standard */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Admission Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admission to Class *</label>
                        <select
                          required
                          value={formData.class}
                          onChange={(e) => setFormData({...formData, class: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Class</option>
                          <option value="LKG">LKG</option>
                          <option value="UKG">UKG</option>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <option key={num} value={num.toString()}>{num}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                        <select
                          required
                          value={formData.academicYear}
                          onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="2024-2025">2024-2025</option>
                          <option value="2025-2026">2025-2026</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medium of Instruction *</label>
                        <select
                          required
                          value={formData.mediumOfInstruction}
                          onChange={(e) => setFormData({...formData, mediumOfInstruction: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="English">English</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tongue</label>
                        <select
                          value={formData.motherTongue}
                          onChange={(e) => setFormData({...formData, motherTongue: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Mother Tongue</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Malayalam">Malayalam</option>
                          <option value="English">English</option>
                          <option value="Urdu">Urdu</option>
                          <option value="Marathi">Marathi</option>
                          <option value="Bengali">Bengali</option>
                          <option value="Gujarati">Gujarati</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student Details - SATS Standard */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Student Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value, firstName: e.target.value.split(' ')[0], lastName: e.target.value.split(' ').slice(1).join(' ')})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter full name in English"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.studentNameKannada}
                          onChange={(e) => setFormData({...formData, studentNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter name in Kannada"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                        <input
                          type="number"
                          value={formData.ageYears}
                          onChange={(e) => setFormData({...formData, ageYears: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Years"
                          min="0"
                          max="25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Months)</label>
                        <input
                          type="number"
                          value={formData.ageMonths}
                          onChange={(e) => setFormData({...formData, ageMonths: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Months"
                          min="0"
                          max="11"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                        <select
                          required
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'other'})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Family Details - SATS Standard */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Family Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.fatherName}
                          onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.fatherNameKannada}
                          onChange={(e) => setFormData({...formData, fatherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.fatherAadhaar}
                          onChange={(e) => setFormData({...formData, fatherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.motherName}
                          onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.motherNameKannada}
                          onChange={(e) => setFormData({...formData, motherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.motherAadhaar}
                          onChange={(e) => setFormData({...formData, motherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identity Documents - SATS Standard */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Identity Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar/KPR No</label>
                        <input
                          type="text"
                          value={formData.studentAadhaar}
                          onChange={(e) => setFormData({...formData, studentAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.studentCasteCertNo}
                          onChange={(e) => setFormData({...formData, studentCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.fatherCasteCertNo}
                          onChange={(e) => setFormData({...formData, fatherCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.motherCasteCertNo}
                          onChange={(e) => setFormData({...formData, motherCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caste and Category - SATS Standard */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Caste and Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste</label>
                        <select
                          value={formData.studentCaste}
                          onChange={(e) => setFormData({...formData, studentCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste</label>
                        <select
                          value={formData.fatherCaste}
                          onChange={(e) => setFormData({...formData, fatherCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste</label>
                        <select
                          value={formData.motherCaste}
                          onChange={(e) => setFormData({...formData, motherCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Category</label>
                        <select
                          value={formData.socialCategory}
                          onChange={(e) => setFormData({...formData, socialCategory: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Category</option>
                          <option value="General">General</option>
                          <option value="SC">SC (Scheduled Caste)</option>
                          <option value="ST">ST (Scheduled Tribe)</option>
                          <option value="OBC">OBC (Other Backward Class)</option>
                          <option value="Category-1">Category-1</option>
                          <option value="Category-2A">Category-2A</option>
                          <option value="Category-2B">Category-2B</option>
                          <option value="Category-3A">Category-3A</option>
                          <option value="Category-3B">Category-3B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                        <select
                          value={formData.religion}
                          onChange={(e) => setFormData({...formData, religion: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Religion</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Christian">Christian</option>
                          <option value="Sikh">Sikh</option>
                          <option value="Buddhist">Buddhist</option>
                          <option value="Jain">Jain</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Category</label>
                        <select
                          value={formData.specialCategory}
                          onChange={(e) => setFormData({...formData, specialCategory: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Special Category</option>
                          <option value="None">None</option>
                          <option value="Destitute">Destitute</option>
                          <option value="Orphan">Orphan</option>
                          <option value="HIV case">HIV case</option>
                          <option value="Child of Sex worker">Child of Sex worker</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Economic Status - SATS Standard */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Economic Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Belonging to BPL</label>
                        <select
                          value={formData.belongingToBPL}
                          onChange={(e) => setFormData({...formData, belongingToBPL: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BPL Card No</label>
                        <input
                          type="text"
                          value={formData.bplCardNo}
                          onChange={(e) => setFormData({...formData, bplCardNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter BPL card number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bhagyalakshmi Bond No</label>
                        <input
                          type="text"
                          value={formData.bhagyalakshmiBondNo}
                          onChange={(e) => setFormData({...formData, bhagyalakshmiBondNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter bond number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Needs - SATS Standard */}
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Special Needs</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Disability / Child with Special Need</label>
                        <select
                          value={formData.disability}
                          onChange={(e) => setFormData({...formData, disability: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="Not Applicable">Not Applicable</option>
                          <option value="Visual Impairment">Visual Impairment</option>
                          <option value="Hearing Impairment">Hearing Impairment</option>
                          <option value="Speech and Language Disability">Speech and Language Disability</option>
                          <option value="Locomotor Disability">Locomotor Disability</option>
                          <option value="Intellectual Disability">Intellectual Disability</option>
                          <option value="Learning Disability">Learning Disability</option>
                          <option value="Autism Spectrum Disorder">Autism Spectrum Disorder</option>
                          <option value="Multiple Disabilities">Multiple Disabilities</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information - SATS Standard */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter complete address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City/Village/Town *</label>
                        <input
                          type="text"
                          required
                          value={formData.cityVillageTown}
                          onChange={(e) => setFormData({...formData, cityVillageTown: e.target.value, city: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter city/village/town"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                        <input
                          type="text"
                          value={formData.locality}
                          onChange={(e) => setFormData({...formData, locality: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter locality"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taluka/Taluk *</label>
                        <input
                          type="text"
                          required
                          value={formData.taluka}
                          onChange={(e) => setFormData({...formData, taluka: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter taluka/taluk"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                        <select
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({...formData, district: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select District</option>
                          <option value="Bagalkot">Bagalkot</option>
                          <option value="Bangalore Rural">Bangalore Rural</option>
                          <option value="Bangalore Urban">Bangalore Urban</option>
                          <option value="Belgaum">Belgaum</option>
                          <option value="Bellary">Bellary</option>
                          <option value="Bidar">Bidar</option>
                          <option value="Chamarajanagar">Chamarajanagar</option>
                          <option value="Chikkaballapur">Chikkaballapur</option>
                          <option value="Chikkamagaluru">Chikkamagaluru</option>
                          <option value="Chitradurga">Chitradurga</option>
                          <option value="Dakshina Kannada">Dakshina Kannada</option>
                          <option value="Davanagere">Davanagere</option>
                          <option value="Dharwad">Dharwad</option>
                          <option value="Gadag">Gadag</option>
                          <option value="Gulbarga">Gulbarga</option>
                          <option value="Hassan">Hassan</option>
                          <option value="Haveri">Haveri</option>
                          <option value="Kodagu">Kodagu</option>
                          <option value="Kolar">Kolar</option>
                          <option value="Koppal">Koppal</option>
                          <option value="Mandya">Mandya</option>
                          <option value="Mysore">Mysore</option>
                          <option value="Raichur">Raichur</option>
                          <option value="Ramanagara">Ramanagara</option>
                          <option value="Shimoga">Shimoga</option>
                          <option value="Tumkur">Tumkur</option>
                          <option value="Udupi">Udupi</option>
                          <option value="Uttara Kannada">Uttara Kannada</option>
                          <option value="Vijayapura">Vijayapura</option>
                          <option value="Yadgir">Yadgir</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.pinCode}
                          onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="6-digit pin code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communication Details - SATS Standard */}
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Communication Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile No</label>
                        <input
                          type="tel"
                          value={formData.studentMobile}
                          onChange={(e) => {
                            const validatedPhone = validatePhoneNumber(e.target.value);
                            setFormData({...formData, studentMobile: validatedPhone, phone: validatedPhone});
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Email ID</label>
                        <input
                          type="email"
                          value={formData.studentEmail}
                          onChange={(e) => setFormData({...formData, studentEmail: e.target.value, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Mobile No</label>
                        <input
                          type="tel"
                          value={formData.fatherMobile}
                          onChange={(e) => setFormData({...formData, fatherMobile: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Email ID</label>
                        <input
                          type="email"
                          value={formData.fatherEmail}
                          onChange={(e) => setFormData({...formData, fatherEmail: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Mobile No</label>
                        <input
                          type="tel"
                          value={formData.motherMobile}
                          onChange={(e) => setFormData({...formData, motherMobile: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Email ID</label>
                        <input
                          type="email"
                          value={formData.motherEmail}
                          onChange={(e) => setFormData({...formData, motherEmail: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* School and Banking - SATS Standard */}
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">School and Banking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Admission Date</label>
                        <input
                          type="date"
                          value={formData.schoolAdmissionDate}
                          onChange={(e) => setFormData({...formData, schoolAdmissionDate: e.target.value, admissionDate: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                        <input
                          type="text"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({...formData, bankAccountNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                        <input
                          type="text"
                          value={formData.bankIFSC}
                          onChange={(e) => setFormData({...formData, bankIFSC: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="11-character IFSC code"
                          pattern="[A-Z]{4}0[A-Z0-9]{6}"
                          maxLength={11}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information for Section/Roll Number */}
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                      <input
                        type="text"
                        value={formData.subjects}
                        onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter subjects separated by commas (e.g., Mathematics, Physics, Chemistry)"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter subjects separated by commas</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classes Assigned</label>
                      <input
                        type="text"
                        value={formData.classes || ''}
                        onChange={(e) => setFormData({...formData, classes: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter classes separated by commas (e.g., 10A, 10B, 11C)"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter class assignments separated by commas</p>
                    </div>
                  </div>
                  
                  {/* Additional Teacher Information from database structure */}
                  <div className="mt-6">
                    <h5 className="text-md font-semibold text-gray-800 mb-3">Additional Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                        <input
                          type="text"
                          value={formData.district || ''}
                          onChange={(e) => setFormData({...formData, district: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter district"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={formData.pinCode || ''}
                          onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter PIN code"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'admin' && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Administrative Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Level *</label>
                      <select
                        required
                        value={formData.adminLevel}
                        onChange={(e) => setFormData({...formData, adminLevel: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Admin Level</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Principal">Principal</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Academic Coordinator">Academic Coordinator</option>
                        <option value="Administrative Officer">Administrative Officer</option>
                        <option value="Office Staff">Office Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Student Affairs">Student Affairs</option>
                        <option value="Finance">Finance</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="IT Department">IT Department</option>
                        <option value="Facilities">Facilities</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                      <select
                        value={formData.accessLevel}
                        onChange={(e) => setFormData({...formData, accessLevel: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Access Level</option>
                        <option value="Full Access">Full Access</option>
                        <option value="Limited Access">Limited Access</option>
                        <option value="Read Only">Read Only</option>
                        <option value="Department Specific">Department Specific</option>
                      </select>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit User - {editingUser.role.charAt(0).toUpperCase() + editingUser.role.slice(1)}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              
              {/* User ID Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">User Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-mono">
                      {editingUser._id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700">
                      {editingUser.role.charAt(0).toUpperCase() + editingUser.role.slice(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: validatePhoneNumber(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter phone number (10 digits)"
                      pattern="[0-9]{10}"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'other'})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {editingUser.role === 'student' && (
                <div className="space-y-6">
                  
                  {/* Basic Information - SATS Standard */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
                        <input
                          type="text"
                          value={formData.enrollmentNo}
                          onChange={(e) => setFormData({...formData, enrollmentNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter enrollment number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TC No</label>
                        <input
                          type="text"
                          value={formData.tcNo}
                          onChange={(e) => setFormData({...formData, tcNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter TC number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admission Details - SATS Standard */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Admission Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admission to Class *</label>
                        <select
                          required
                          value={formData.class}
                          onChange={(e) => setFormData({...formData, class: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Class</option>
                          <option value="LKG">LKG</option>
                          <option value="UKG">UKG</option>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <option key={num} value={num.toString()}>{num}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                        <select
                          required
                          value={formData.academicYear}
                          onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="2024-2025">2024-2025</option>
                          <option value="2025-2026">2025-2026</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medium of Instruction *</label>
                        <select
                          required
                          value={formData.mediumOfInstruction}
                          onChange={(e) => setFormData({...formData, mediumOfInstruction: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="English">English</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tongue</label>
                        <select
                          value={formData.motherTongue}
                          onChange={(e) => setFormData({...formData, motherTongue: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Mother Tongue</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Malayalam">Malayalam</option>
                          <option value="English">English</option>
                          <option value="Urdu">Urdu</option>
                          <option value="Marathi">Marathi</option>
                          <option value="Bengali">Bengali</option>
                          <option value="Gujarati">Gujarati</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student Details - SATS Standard */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Student Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value, firstName: e.target.value.split(' ')[0], lastName: e.target.value.split(' ').slice(1).join(' ')})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter full name in English"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.studentNameKannada}
                          onChange={(e) => setFormData({...formData, studentNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter name in Kannada"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                        <input
                          type="number"
                          value={formData.ageYears}
                          onChange={(e) => setFormData({...formData, ageYears: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Years"
                          min="0"
                          max="25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Months)</label>
                        <input
                          type="number"
                          value={formData.ageMonths}
                          onChange={(e) => setFormData({...formData, ageMonths: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Months"
                          min="0"
                          max="11"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                        <select
                          required
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'other'})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Family Details - SATS Standard */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Family Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.fatherName}
                          onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.fatherNameKannada}
                          onChange={(e) => setFormData({...formData, fatherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.fatherAadhaar}
                          onChange={(e) => setFormData({...formData, fatherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.motherName}
                          onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.motherNameKannada}
                          onChange={(e) => setFormData({...formData, motherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.motherAadhaar}
                          onChange={(e) => setFormData({...formData, motherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identity Documents - SATS Standard */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Identity Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar/KPR No</label>
                        <input
                          type="text"
                          value={formData.studentAadhaar}
                          onChange={(e) => setFormData({...formData, studentAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.studentCasteCertNo}
                          onChange={(e) => setFormData({...formData, studentCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.fatherCasteCertNo}
                          onChange={(e) => setFormData({...formData, fatherCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.motherCasteCertNo}
                          onChange={(e) => setFormData({...formData, motherCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caste and Category - SATS Standard */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Caste and Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste</label>
                        <select
                          value={formData.studentCaste}
                          onChange={(e) => setFormData({...formData, studentCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste</label>
                        <select
                          value={formData.fatherCaste}
                          onChange={(e) => setFormData({...formData, fatherCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste</label>
                        <select
                          value={formData.motherCaste}
                          onChange={(e) => setFormData({...formData, motherCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Category</label>
                        <select
                          value={formData.socialCategory}
                          onChange={(e) => setFormData({...formData, socialCategory: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Category</option>
                          <option value="General">General</option>
                          <option value="SC">SC (Scheduled Caste)</option>
                          <option value="ST">ST (Scheduled Tribe)</option>
                          <option value="OBC">OBC (Other Backward Class)</option>
                          <option value="Category-1">Category-1</option>
                          <option value="Category-2A">Category-2A</option>
                          <option value="Category-2B">Category-2B</option>
                          <option value="Category-3A">Category-3A</option>
                          <option value="Category-3B">Category-3B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                        <select
                          value={formData.religion}
                          onChange={(e) => setFormData({...formData, religion: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Religion</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Christian">Christian</option>
                          <option value="Sikh">Sikh</option>
                          <option value="Buddhist">Buddhist</option>
                          <option value="Jain">Jain</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Category</label>
                        <select
                          value={formData.specialCategory}
                          onChange={(e) => setFormData({...formData, specialCategory: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Special Category</option>
                          <option value="None">None</option>
                          <option value="Destitute">Destitute</option>
                          <option value="Orphan">Orphan</option>
                          <option value="HIV case">HIV case</option>
                          <option value="Child of Sex worker">Child of Sex worker</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Economic Status - SATS Standard */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Economic Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Belonging to BPL</label>
                        <select
                          value={formData.belongingToBPL}
                          onChange={(e) => setFormData({...formData, belongingToBPL: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BPL Card No</label>
                        <input
                          type="text"
                          value={formData.bplCardNo}
                          onChange={(e) => setFormData({...formData, bplCardNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter BPL card number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bhagyalakshmi Bond No</label>
                        <input
                          type="text"
                          value={formData.bhagyalakshmiBondNo}
                          onChange={(e) => setFormData({...formData, bhagyalakshmiBondNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter bond number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Needs - SATS Standard */}
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Special Needs</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Disability / Child with Special Need</label>
                        <select
                          value={formData.disability}
                          onChange={(e) => setFormData({...formData, disability: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="Not Applicable">Not Applicable</option>
                          <option value="Visual Impairment">Visual Impairment</option>
                          <option value="Hearing Impairment">Hearing Impairment</option>
                          <option value="Speech and Language Disability">Speech and Language Disability</option>
                          <option value="Locomotor Disability">Locomotor Disability</option>
                          <option value="Intellectual Disability">Intellectual Disability</option>
                          <option value="Learning Disability">Learning Disability</option>
                          <option value="Autism Spectrum Disorder">Autism Spectrum Disorder</option>
                          <option value="Multiple Disabilities">Multiple Disabilities</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information - SATS Standard */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter complete address"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City/Village/Town *</label>
                        <input
                          type="text"
                          required
                          value={formData.cityVillageTown}
                          onChange={(e) => setFormData({...formData, cityVillageTown: e.target.value, city: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter city/village/town"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                        <input
                          type="text"
                          value={formData.locality}
                          onChange={(e) => setFormData({...formData, locality: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter locality"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taluka/Taluk *</label>
                        <input
                          type="text"
                          required
                          value={formData.taluka}
                          onChange={(e) => setFormData({...formData, taluka: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter taluka/taluk"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                        <select
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({...formData, district: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select District</option>
                          <option value="Bagalkot">Bagalkot</option>
                          <option value="Bangalore Rural">Bangalore Rural</option>
                          <option value="Bangalore Urban">Bangalore Urban</option>
                          <option value="Belgaum">Belgaum</option>
                          <option value="Bellary">Bellary</option>
                          <option value="Bidar">Bidar</option>
                          <option value="Chamarajanagar">Chamarajanagar</option>
                          <option value="Chikkaballapur">Chikkaballapur</option>
                          <option value="Chikkamagaluru">Chikkamagaluru</option>
                          <option value="Chitradurga">Chitradurga</option>
                          <option value="Dakshina Kannada">Dakshina Kannada</option>
                          <option value="Davanagere">Davanagere</option>
                          <option value="Dharwad">Dharwad</option>
                          <option value="Gadag">Gadag</option>
                          <option value="Gulbarga">Gulbarga</option>
                          <option value="Hassan">Hassan</option>
                          <option value="Haveri">Haveri</option>
                          <option value="Kodagu">Kodagu</option>
                          <option value="Kolar">Kolar</option>
                          <option value="Koppal">Koppal</option>
                          <option value="Mandya">Mandya</option>
                          <option value="Mysore">Mysore</option>
                          <option value="Raichur">Raichur</option>
                          <option value="Ramanagara">Ramanagara</option>
                          <option value="Shimoga">Shimoga</option>
                          <option value="Tumkur">Tumkur</option>
                          <option value="Udupi">Udupi</option>
                          <option value="Uttara Kannada">Uttara Kannada</option>
                          <option value="Vijayapura">Vijayapura</option>
                          <option value="Yadgir">Yadgir</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.pinCode}
                          onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="6-digit pin code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communication Details - SATS Standard */}
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Communication Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile No</label>
                        <input
                          type="tel"
                          value={formData.studentMobile}
                          onChange={(e) => {
                            const validatedPhone = validatePhoneNumber(e.target.value);
                            setFormData({...formData, studentMobile: validatedPhone, phone: validatedPhone});
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Email ID</label>
                        <input
                          type="email"
                          value={formData.studentEmail}
                          onChange={(e) => setFormData({...formData, studentEmail: e.target.value, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Mobile No</label>
                        <input
                          type="tel"
                          value={formData.fatherMobile}
                          onChange={(e) => setFormData({...formData, fatherMobile: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Email ID</label>
                        <input
                          type="email"
                          value={formData.fatherEmail}
                          onChange={(e) => setFormData({...formData, fatherEmail: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Mobile No</label>
                        <input
                          type="tel"
                          value={formData.motherMobile}
                          onChange={(e) => setFormData({...formData, motherMobile: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="10-digit mobile number"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Email ID</label>
                        <input
                          type="email"
                          value={formData.motherEmail}
                          onChange={(e) => setFormData({...formData, motherEmail: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* School and Banking - SATS Standard */}
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">School and Banking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Admission Date</label>
                        <input
                          type="date"
                          value={formData.schoolAdmissionDate}
                          onChange={(e) => setFormData({...formData, schoolAdmissionDate: e.target.value, admissionDate: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                        <input
                          type="text"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({...formData, bankAccountNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                        <input
                          type="text"
                          value={formData.bankIFSC}
                          onChange={(e) => setFormData({...formData, bankIFSC: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="11-character IFSC code"
                          pattern="[A-Z]{4}0[A-Z0-9]{6}"
                          maxLength={11}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information for Section/Roll Number */}
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
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
                </div>
              )}

              {editingUser.role === 'teacher' && (
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                      <input
                        type="text"
                        value={formData.subjects}
                        onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter subjects separated by commas (e.g., Mathematics, Physics, Chemistry)"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter subjects separated by commas</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classes Assigned</label>
                      <input
                        type="text"
                        value={formData.classes || ''}
                        onChange={(e) => setFormData({...formData, classes: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter classes separated by commas (e.g., 10A, 10B, 11C)"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter class assignments separated by commas</p>
                    </div>
                  </div>
                  
                  {/* Additional Teacher Information from database structure */}
                  <div className="mt-6">
                    <h5 className="text-md font-semibold text-gray-800 mb-3">Additional Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                        <input
                          type="text"
                          value={formData.district || ''}
                          onChange={(e) => setFormData({...formData, district: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter district"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={formData.pinCode || ''}
                          onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter PIN code"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'admin' && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Administrative Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Level *</label>
                      <select
                        required
                        value={formData.adminLevel}
                        onChange={(e) => setFormData({...formData, adminLevel: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Admin Level</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Principal">Principal</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Academic Coordinator">Academic Coordinator</option>
                        <option value="Administrative Officer">Administrative Officer</option>
                        <option value="Office Staff">Office Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Student Affairs">Student Affairs</option>
                        <option value="Finance">Finance</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="IT Department">IT Department</option>
                        <option value="Facilities">Facilities</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                      <select
                        value={formData.accessLevel}
                        onChange={(e) => setFormData({...formData, accessLevel: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Access Level</option>
                        <option value="Full Access">Full Access</option>
                        <option value="Limited Access">Limited Access</option>
                        <option value="Read Only">Read Only</option>
                        <option value="Department Specific">Department Specific</option>
                      </select>
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
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Section</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                        <input
                          type="date"
                          value={formData.admissionDate}
                          onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Family Details - SATS Standard */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Family Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.fatherName}
                          onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.fatherNameKannada}
                          onChange={(e) => setFormData({...formData, fatherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.fatherAadhaar}
                          onChange={(e) => setFormData({...formData, fatherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={formData.motherName}
                          onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (Kannada)</label>
                        <input
                          type="text"
                          value={formData.motherNameKannada}
                          onChange={(e) => setFormData({...formData, motherNameKannada: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's name in Kannada"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother Aadhaar No</label>
                        <input
                          type="text"
                          value={formData.motherAadhaar}
                          onChange={(e) => setFormData({...formData, motherAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone</label>
                        <input
                          type="tel"
                          value={formData.fatherPhone}
                          onChange={(e) => setFormData({...formData, fatherPhone: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter father's phone (10 digits)"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Phone</label>
                        <input
                          type="tel"
                          value={formData.motherPhone}
                          onChange={(e) => setFormData({...formData, motherPhone: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mother's phone (10 digits)"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: validatePhoneNumber(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter mobile number (10 digits)"
                          pattern="[0-9]{10}"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identity Documents - SATS Standard */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Identity Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Aadhaar/KPR No</label>
                        <input
                          type="text"
                          value={formData.studentAadhaar}
                          onChange={(e) => setFormData({...formData, studentAadhaar: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="12-digit Aadhaar number"
                          pattern="[0-9]{12}"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste Certificate No</label>
                        <input
                          type="text"
                          value={formData.studentCasteCertNo}
                          onChange={(e) => setFormData({...formData, studentCasteCertNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter certificate number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caste and Category - SATS Standard */}
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Caste and Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Category</label>
                        <select
                          value={formData.socialCategory}
                          onChange={(e) => setFormData({...formData, socialCategory: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Category</option>
                          <option value="General">General</option>
                          <option value="SC">SC (Scheduled Caste)</option>
                          <option value="ST">ST (Scheduled Tribe)</option>
                          <option value="OBC">OBC (Other Backward Class)</option>
                          <option value="Category-1">Category-1</option>
                          <option value="Category-2A">Category-2A</option>
                          <option value="Category-2B">Category-2B</option>
                          <option value="Category-3A">Category-3A</option>
                          <option value="Category-3B">Category-3B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                        <select
                          value={formData.religion}
                          onChange={(e) => setFormData({...formData, religion: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Religion</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Christian">Christian</option>
                          <option value="Sikh">Sikh</option>
                          <option value="Buddhist">Buddhist</option>
                          <option value="Jain">Jain</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste</label>
                        <select
                          value={formData.studentCaste}
                          onChange={(e) => setFormData({...formData, studentCaste: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="">Select Caste</option>
                          <option value="Brahmin">Brahmin</option>
                          <option value="Kshatriya">Kshatriya</option>
                          <option value="Vaishya">Vaishya</option>
                          <option value="Shudra">Shudra</option>
                          <option value="Lingayat">Lingayat</option>
                          <option value="Vokkaliga">Vokkaliga</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Banking Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                        <input
                          type="text"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({...formData, bankAccountNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                        <input
                          type="text"
                          value={formData.bankIFSC}
                          onChange={(e) => setFormData({...formData, bankIFSC: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="11-character IFSC code"
                          pattern="[A-Z]{4}0[A-Z0-9]{6}"
                          maxLength={11}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'teacher' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Teacher Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <input
                        type="text"
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
                        placeholder="Enter years of experience"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.subjects}
                        onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., Mathematics, Physics"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classes (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.classes}
                        onChange={(e) => setFormData({...formData, classes: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g., 10th A, 9th B"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'admin' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Admin Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter employee ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Department</option>
                        <option value="Administration">Administration</option>
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Student Affairs">Student Affairs</option>
                        <option value="Finance">Finance</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="IT Department">IT Department</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Information */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter complete address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter pin code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  User Created Successfully!
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Please save these credentials and share them with the user.
                </p>
              </div>
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Login Credentials</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono text-gray-900">{showCredentials.userId}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showCredentials.userId)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm text-gray-900">{showCredentials.email}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showCredentials.email)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Password</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono text-gray-900">{showCredentials.password}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showCredentials.password)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
                    <div className="mt-1 bg-white border rounded px-3 py-2">
                      <span className="text-sm capitalize text-gray-900">{showCredentials.role}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCredentials(null)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Credentials Modal */}
      {showResetCredentials && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Password Reset Successfully!
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Please save these new credentials and share them with the user.
                </p>
              </div>
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">New Login Credentials</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono text-gray-900">{showResetCredentials.userId}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showResetCredentials.userId)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm text-gray-900">{showResetCredentials.email}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showResetCredentials.email)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">New Password</label>
                    <div className="mt-1 flex items-center justify-between bg-white border rounded px-3 py-2">
                      <span className="text-sm font-mono text-gray-900">{showResetCredentials.password}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(showResetCredentials.password)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
                    <div className="mt-1 bg-white border rounded px-3 py-2">
                      <span className="text-sm capitalize text-gray-900">{showResetCredentials.role}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowResetCredentials(null)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
