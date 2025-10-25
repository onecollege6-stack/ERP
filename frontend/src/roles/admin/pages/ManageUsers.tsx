import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Edit, Trash2, Download, Upload, Filter, X,
  UserCheck, UserX, Eye, EyeOff, Lock, Unlock, Building, // Added Eye, EyeOff, X
  RotateCcw, FileText, AlertTriangle, Check, Users, GraduationCap, Shield, KeyRound, Camera // Added Camera for profile image
} from 'lucide-react';
// Use ApiUser alias here
import { schoolUserAPI, User as ApiUser } from '../../../api/schoolUsers';
// Keep other imports
import { exportImportAPI } from '../../../services/api';

import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';
import { exportUsers, generateImportTemplate } from '../../../utils/userImportExport';
import { User, UserFormData, getDefaultFormData, transformUserToFormData } from '../../../types/user'; // Keep original User for form types
import { useSchoolClasses } from '../../../hooks/useSchoolClasses';
import { ImportUsersDialog } from '../../superadmin/components/ImportUsersDialog'; // Keep if used
import UserForm from '../../../components/forms/UserForm';
import LocationSelector from '../../../components/LocationSelector';
import { State, District, Taluka } from '../../../services/locationAPI';
import { compressImage, validateImageFile, blobToFile } from '../../../utils/schoolConfig';
interface School {
  _id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

interface DisplayUser extends ApiUser {
  temporaryPassword?: string | null;
  // Class/section should be provided top-level by the updated backend controller
  class?: string | null;
  section?: string | null;
  // Explicitly add details objects if you access them directly below
  studentDetails?: { currentClass?: string | null; currentSection?: string | null; rollNumber?: string | null; };
  teacherDetails?: { subjects?: string[]; };
  adminDetails?: { designation?: string; };
  profileImage?: string | null; // 💡 FIX 1: Add the missing profileImage field to the DisplayUser interface
}
// User interface now imported from standardized types

// Old form data interface replaced with standardized types from '../../../types/user'

interface OldAddUserFormData {
  // Core Fields
  role: 'admin' | 'teacher' | 'student';

  // Enhanced Name Structure (matching backend)
  firstName: string;
  middleName?: string;
  lastName: string;

  // Basic Contact (legacy compatibility)
  email: string;
  phone: string;

  // Enhanced Contact Information (matching backend)
  primaryPhone: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;

  // Enhanced Address Information (matching backend)
  permanentStreet: string;
  permanentArea?: string;
  permanentCity: string;
  permanentState: string;
  permanentCountry: string;
  permanentPincode: string;
  permanentLandmark?: string;
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  districtText?: string;
  talukaText?: string;

  currentStreet?: string;
  currentArea?: string;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  currentPincode?: string;
  currentLandmark?: string;
  sameAsPermanent: boolean;

  // Identity Information (matching backend)
  aadharNumber?: string;
  panNumber?: string;
  voterIdNumber?: string;
  drivingLicenseNumber?: string;
  passportNumber?: string;

  // Student Specific Fields (comprehensive Karnataka SATS)
  studentDetails?: {
    // Academic Information
    currentClass: string;
    currentSection: string;
    academicYear: string;
    admissionDate?: string;
    admissionClass?: string;
    rollNumber?: string;
    admissionNumber?: string;
    enrollmentNo?: string;
    tcNo?: string;

    // Previous School
    previousSchoolName?: string;
    previousBoard?: string;
    lastClass?: string;
    tcNumber?: string;
    tcDate?: string;
    reasonForTransfer?: string;

    // Personal Information - Karnataka SATS
    dateOfBirth: string;
    placeOfBirth?: string;
    gender: string;
    bloodGroup?: string;
    nationality: string;
    religion?: string;
    religionOther?: string;
    caste?: string;
    casteOther?: string;
    category?: string;
    categoryOther?: string;
    motherTongue?: string;
    motherTongueOther?: string;

    // Karnataka SATS Specific
    ageYears: number;
    ageMonths: number;
    socialCategory?: string;
    socialCategoryOther?: string;
    studentCaste?: string;
    studentCasteOther?: string;
    studentAadhaar?: string;
    studentCasteCertNo?: string;

    // Economic Status
    belongingToBPL: string;
    bplCardNo?: string;
    bhagyalakshmiBondNo?: string;

    // Special Needs
    disability: string;
    disabilityOther?: string;

    // RTE (Right to Education) Status
    isRTECandidate: string;

    // Family Information - Father
    fatherName: string;
    fatherOccupation?: string;
    fatherQualification?: string;
    fatherPhone?: string;
    fatherEmail?: string;
    fatherAadhaar?: string;
    fatherCaste?: string;
    fatherCasteOther?: string;
    fatherCasteCertNo?: string;
    fatherAnnualIncome?: number;

    // Family Information - Mother
    motherName: string;
    motherOccupation?: string;
    motherQualification?: string;
    motherPhone?: string;
    motherEmail?: string;
    motherAadhaar?: string;
    motherCaste?: string;
    motherCasteOther?: string;
    motherCasteCertNo?: string;
    motherAnnualIncome?: number;

    // Guardian Information
    guardianName?: string;
    guardianRelationship?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    isEmergencyContact?: boolean;

    // Transportation
    transportMode?: string;
    busRoute?: string;
    pickupPoint?: string;
    dropPoint?: string;
    pickupTime?: string;
    dropTime?: string;

    // Financial Information
    feeCategory?: string;
    concessionType?: string;
    concessionPercentage?: number;
    scholarshipName?: string;
    scholarshipAmount?: number;
    scholarshipProvider?: string;

    // Banking Information
    bankName?: string;
    bankAccountNo?: string;
    bankIFSC?: string;
    bankAccountHolderName?: string;

    // Medical Information
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
    doctorName?: string;
    hospitalName?: string;
    doctorPhone?: string;
    lastMedicalCheckup?: string;
  };

  // Teacher Specific Fields (comprehensive)
  teacherDetails?: {
    employeeId?: string;
    joiningDate?: string;

    // Qualification
    highestQualification: string;
    specialization?: string;
    university?: string;
    graduationYear?: number;

    // Experience
    totalExperience: number;
    experienceAtCurrentSchool?: number;

    // Previous Experience
    previousSchools?: Array<{
      schoolName: string;
      duration: string;
      position: string;
      reasonForLeaving?: string;
    }>;

    // Subjects and Responsibilities
    subjects: string[];
    primarySubjects?: string[];
    classTeacherOf?: string;
    responsibilities?: string[];
    department?: string;

    // Work Schedule
    workingDays?: string[];
    workingHoursStart?: string;
    workingHoursEnd?: string;
    maxPeriodsPerDay?: number;
    maxPeriodsPerWeek?: number;

    // Salary Information
    basicSalary?: number;
    allowances?: Array<{
      type: string;
      amount: number;
    }>;

    // Banking Information
    bankAccountNumber?: string;
    bankIFSC?: string;
    bankName?: string;
    bankBranchName?: string;
  };

  // Admin Specific Fields (comprehensive)
  adminDetails?: {
    adminType: string;
    employeeId?: string;
    joiningDate?: string;
    designation?: string;
    department?: string;

    // Permissions
    userManagement: boolean;
    academicManagement: boolean;
    feeManagement: boolean;
    reportGeneration: boolean;
    systemSettings: boolean;
    schoolSettings: boolean;
    dataExport: boolean;
    auditLogs: boolean;

    // Work Schedule
    workingDays?: string[];
    workingHoursStart?: string;
    workingHoursEnd?: string;

    // Salary Information
    basicSalary?: number;
    allowances?: Array<{
      type: string;
      amount: number;
    }>;

    // Banking Information
    bankAccountNumber?: string;
    bankIFSC?: string;
    bankName?: string;
    bankBranchName?: string;
    bankAccountHolderName?: string;
  };

  // Legacy Compatibility Fields (for backward compatibility and existing forms)
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  qualification?: string;
  experience?: string;
  subjects?: string[];
  adminLevel?: string;
  accessLevel?: string;

  // Generated Information
  userId?: string;
  generatedPassword?: string;

  // Additional SATS fields for backward compatibility
  ageYears?: number;
  ageMonths?: number;
  socialCategory?: string;
  socialCategoryOther?: string;
  studentCaste?: string;
  studentCasteOther?: string;
  studentAadhaar?: string;
  studentCasteCertNo?: string;
  fatherAadhaar?: string;
  fatherCaste?: string;
  fatherCasteOther?: string;
  fatherCasteCertNo?: string;
  motherAadhaar?: string;
  motherCaste?: string;
  motherCasteOther?: string;
  motherCasteCertNo?: string;
  religion?: string;
  religionOther?: string;
  belongingToBPL?: string;
  bplCardNo?: string;
  bhagyalakshmiBondNo?: string;
  disability?: string;
  disabilityOther?: string;
  cityVillageTown?: string;
  locality?: string;
  taluka?: string;
  district?: string;
  pinCode?: string;
  studentMobile?: string;
  studentEmail?: string;
  fatherMobile?: string;
  fatherEmail?: string;
  motherMobile?: string;
  motherEmail?: string;
  schoolAdmissionDate?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIFSC?: string;
  nationality?: string;
  bloodGroup?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherPhone?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianRelation?: string;
  fatherEducation?: string;
  motherEducation?: string;
  familyIncome?: string;
  alternatePhone?: string;
  parentEmail?: string;
  admissionNumber?: string;
  admissionDate?: string;
  previousSchool?: string;
  previousClass?: string;
  tcNumber?: string;
  migrationCertificate?: string;
  aadhaarNumber?: string;
  birthCertificateNumber?: string;
  rationCardNumber?: string;
  caste?: string;
  casteOther?: string;
  category?: string;
  categoryOther?: string;
  subCaste?: string;
  economicStatus?: string;
  bplCardNumber?: string;
  scholarshipDetails?: string;
  specialNeeds?: string;
  disabilityType?: string;
  disabilityCertificate?: string;
  medicalConditions?: string;
  village?: string;
  motherTongue?: string;
  motherTongueOther?: string;
  mediumOfInstruction?: string;
  spouseName?: string;
}

const ManageUsers: React.FC = () => {
  const { user } = useAuth();
  // Use the school classes hook to get dynamic data
  const {
    classesData,
    loading: classesLoading,
    error: classesError,
    getClassOptions,
    getSectionsByClass,
    hasClasses
  } = useSchoolClasses();

  // State for dynamic sections based on selected class
  const [availableSections, setAvailableSections] = useState<any[]>([]);

  // Function to handle class selection and update sections
  const handleClassSelection = (selectedClass: string) => {
    if (selectedClass && classesData) {
      // Update sections for the selected class
      const sections = getSectionsByClass(selectedClass);
      setAvailableSections(sections);
    } else {
      setAvailableSections([]);
    }
  };

  // Helper function to generate sequential user ID based on role and school code
  const generateUserId = async (role: string, schoolCode: string): Promise<string> => {
    const roleCode = role.charAt(0).toUpperCase(); // A for admin, T for teacher, S for student
    const prefix = `${schoolCode.toUpperCase()}-${roleCode}-`;

    // Find existing users with the same role to determine next sequence number
    const existingUsers = users.filter(user =>
      user.role === role &&
      user._id &&
      user._id.toString().startsWith(prefix)
    );

    // Extract sequence numbers and find the highest
    const sequenceNumbers = existingUsers
      .map(user => {
        const match = user._id.toString().match(new RegExp(`${prefix}(\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => !isNaN(num));

    // Start from the next sequence after the highest existing number
    let nextSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;

    // Keep checking if the generated ID already exists and increment if needed
    let userId: string;
    let isUnique = false;

    while (!isUnique) {
      const sequenceStr = nextSequence.toString().padStart(4, '0'); // 4 digits with leading zeros
      userId = `${prefix}${sequenceStr}`;

      // Check if this ID already exists in the current users list
      const exists = users.some(user => user._id === userId);

      if (!exists) {
        isUnique = true;
      } else {
        nextSequence++;
      }
    }

    return userId!;
  };

  // Helper function to generate secure random password
  const generatePassword = (): string => {
    const length = 8;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    // Ensure at least one character from each category
    let password = "";
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to randomize character positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Prevent double submissions using a ref (synchronous guard)
  const isSubmittingRef = useRef(false);

  // Basic client-side validation before submitting the form
  const validateFormBeforeSubmit = (data: any): string[] => {
    const errors: string[] = [];

    // Check if data exists
    if (!data) {
      errors.push('Form data is required');
      return errors;
    }

    // Common required fields
    if (!data.firstName || data.firstName.trim() === '') {
      errors.push('First name is required');
    }
    if (!data.lastName || data.lastName.trim() === '') {
      errors.push('Last name is required');
    }
    if (!data.email || !data.email.includes('@')) {
      errors.push('A valid email is required');
    }

    // Phone validation - check both primaryPhone and legacy phone field
    // Phone validation - more flexible format
    const phoneToValidate = data.primaryPhone || data.phone;
    if (phoneToValidate) {
      const cleanPhone = phoneToValidate.replace(/\D/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        errors.push('Phone number must be 7-15 digits');
      }
    } else {
      // Only require phone for certain roles or make it optional
      if (data.role !== 'teacher') { // Make phone optional for teachers
        errors.push('Phone number is required');
      }
    }

    // Address validation - check both new structure and legacy fields
    // Skip address requirements for teachers to make user addition more flexible
    if (data.role !== 'teacher') {
      const streetToValidate = data.permanentStreet || data.address;
      const cityToValidate = data.permanentCity || data.city;
      const stateToValidate = data.permanentState || data.state;
      const pincodeToValidate = data.permanentPincode || data.pinCode;

      if (!streetToValidate || streetToValidate.trim() === '') {
        errors.push('Address/Street is required');
      }
      if (!cityToValidate || cityToValidate.trim() === '') {
        errors.push('City is required');
      }
      if (!stateToValidate || stateToValidate.trim() === '') {
        errors.push('State is required');
      }
      if (!pincodeToValidate || !/^\d{6}$/.test(pincodeToValidate)) {
        errors.push('A valid 6-digit PIN code is required');
      }
    }

    // Role-specific validation
    if (data.role === 'student') {
      // Check nested studentDetails or fallback to legacy fields
      const studentDetails = data.studentDetails;

      // Academic Information
      const classValue = studentDetails?.currentClass || data.class;
      const sectionValue = studentDetails?.currentSection || data.section;
      const dobValue = studentDetails?.dateOfBirth || data.dateOfBirth;
      const genderValue = studentDetails?.gender || data.gender;

      if (!classValue || classValue === '') {
        errors.push('Class selection is required for students');
      }
      if (!sectionValue || sectionValue === '') {
        errors.push('Section selection is required for students');
      }
      if (!dobValue) {
        errors.push('Date of birth is required for students');
      }
      if (!genderValue) {
        errors.push('Gender is required for students');
      }

      // Family Information - Karnataka SATS Standards
      const fatherName = studentDetails?.fatherName || data.fatherName;
      const motherName = studentDetails?.motherName || data.motherName;

      if (!fatherName || fatherName.trim() === '') {
        errors.push("Father's name is required for students");
      }
      if (!motherName || motherName.trim() === '') {
        errors.push("Mother's name is required for students");
      }

      // Karnataka SATS Specific Validations
      const ageYears = studentDetails?.ageYears || data.ageYears;
      const socialCategory = studentDetails?.socialCategory || data.socialCategory;
      const belongingToBPL = studentDetails?.belongingToBPL || data.belongingToBPL;
      const disability = studentDetails?.disability || data.disability;

      if (ageYears && (ageYears < 3 || ageYears > 25)) {
        errors.push('Student age must be between 3 and 25 years');
      }

      // Aadhaar validation for Karnataka SATS
      const studentAadhaar = studentDetails?.studentAadhaar || data.studentAadhaar;
      const fatherAadhaar = studentDetails?.fatherAadhaar || data.fatherAadhaar;
      const motherAadhaar = studentDetails?.motherAadhaar || data.motherAadhaar;

      if (studentAadhaar && !/^\d{12}$/.test(studentAadhaar)) {
        errors.push('Student Aadhaar number must be 12 digits');
      }
      if (fatherAadhaar && !/^\d{12}$/.test(fatherAadhaar)) {
        errors.push('Father Aadhaar number must be 12 digits');
      }
      if (motherAadhaar && !/^\d{12}$/.test(motherAadhaar)) {
        errors.push('Mother Aadhaar number must be 12 digits');
      }

      // Phone number validation for family
      const fatherPhone = studentDetails?.fatherPhone || data.fatherPhone || data.fatherMobile;
      const motherPhone = studentDetails?.motherPhone || data.motherPhone || data.motherMobile;

      if (fatherPhone && !/^[6-9]\d{9}$/.test(fatherPhone)) {
        errors.push('Father phone number must be a valid 10-digit mobile number');
      }
      if (motherPhone && !/^[6-9]\d{9}$/.test(motherPhone)) {
        errors.push('Mother phone number must be a valid 10-digit mobile number');
      }

      // IFSC Code validation for banking
      const bankIFSC = studentDetails?.bankIFSC || formData.bankIFSC;
      if (bankIFSC && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIFSC)) {
        errors.push('Bank IFSC code must be in valid format (e.g., SBIN0012345)');
      }

    } else if (formData.role === 'teacher') {
      // Teacher-specific validation
      const teacherDetails = formData.teacherDetails;

      const qualification = teacherDetails?.highestQualification || formData.qualification;
      const experience = teacherDetails?.totalExperience || Number(formData.experience);
      const subjects = teacherDetails?.subjects || (typeof formData.subjects === 'string' ? formData.subjects.split(',') : formData.subjects);

      if (!qualification || qualification.trim() === '') {
        errors.push('Highest qualification is required for teachers');
      }
      if (experience === undefined || experience < 0) {
        errors.push('Total experience is required for teachers (minimum 0 years)');
      }
      // Subjects are optional for teachers to allow flexible user creation
      // if (!subjects || subjects.length === 0 || (Array.isArray(subjects) && subjects.filter(s => s.trim()).length === 0)) {
      //   errors.push('At least one subject is required for teachers');
      // }

      // Employee ID validation if provided
      const employeeId = teacherDetails?.employeeId || formData.employeeId;
      if (employeeId && employeeId.trim() === '') {
        errors.push('Employee ID cannot be empty if provided');
      }

      // IFSC validation for teacher banking
      const bankIFSC = teacherDetails?.bankIFSC || formData.bankIFSC;
      if (bankIFSC && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIFSC)) {
        errors.push('Bank IFSC code must be in valid format (e.g., SBIN0012345)');
      }

    } else if (formData.role === 'admin') {
      // Admin-specific validation
      const adminDetails = formData.adminDetails;

      const adminType = adminDetails?.adminType || formData.adminLevel;
      const designation = adminDetails?.designation || '';

      if (!adminType || adminType.trim() === '') {
        errors.push('Admin type/level is required for administrators');
      }

      // Employee ID validation if provided
      const employeeId = adminDetails?.employeeId || formData.employeeId;
      if (employeeId && employeeId.trim() === '') {
        errors.push('Employee ID cannot be empty if provided');
      }

      // At least one permission should be granted
      if (adminDetails) {
        const hasAnyPermission = Object.values({
          userManagement: adminDetails.userManagement,
          academicManagement: adminDetails.academicManagement,
          feeManagement: adminDetails.feeManagement,
          reportGeneration: adminDetails.reportGeneration,
          systemSettings: adminDetails.systemSettings,
          schoolSettings: adminDetails.schoolSettings,
          dataExport: adminDetails.dataExport,
          auditLogs: adminDetails.auditLogs
        }).some(permission => permission === true);

        if (!hasAnyPermission) {
          errors.push('At least one permission must be granted to admin users');
        }
      }

      // IFSC validation for admin banking
      const bankIFSC = adminDetails?.bankIFSC || formData.bankIFSC;
      if (bankIFSC && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIFSC)) {
        errors.push('Bank IFSC code must be in valid format (e.g., SBIN0012345)');
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // PAN validation if provided
    if (formData.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber)) {
      errors.push('PAN number must be in valid format (e.g., ABCDE1234F)');
    }

    // Aadhaar validation for identity section
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
      errors.push('Aadhaar number must be 12 digits');
    }

    // Additional validation for new essential fields
    if (data.role === 'student') {
      // Nationality validation
      if (!data.nationality || data.nationality.trim() === '') {
        errors.push('Nationality is required for students');
      }

      // Emergency contact validation
      if (data.alternatePhone && !/^[6-9]\d{9}$/.test(data.alternatePhone)) {
        errors.push('Emergency contact phone must be a valid 10-digit mobile number');
      }

      // TC Number validation if previous school is mentioned
      if (data.previousSchool && data.previousSchool.trim() !== '' && (!data.tcNumber || data.tcNumber.trim() === '')) {
        errors.push('TC Number is required when previous school is mentioned');
      }

      // Birth certificate validation if provided
      if (data.birthCertificateNumber && data.birthCertificateNumber.trim().length < 5) {
        errors.push('Birth certificate number must be at least 5 characters');
      }

      // Ration card validation if provided
      if (data.rationCardNumber && data.rationCardNumber.trim().length < 5) {
        errors.push('Ration card number must be at least 5 characters');
      }

      // Family income validation
      if (data.familyIncome && !['Below 1 Lakh', '1-2 Lakhs', '2-5 Lakhs', '5-10 Lakhs', 'Above 10 Lakhs'].includes(data.familyIncome)) {
        errors.push('Please select a valid family income range');
      }

      // BPL card validation if BPL status is mentioned
      if (data.economicStatus === 'BPL' && (!data.bplCardNumber || data.bplCardNumber.trim() === '')) {
        errors.push('BPL card number is required when economic status is BPL');
      }

      // Guardian relationship validation if guardian name is provided
      if (data.guardianName && data.guardianName.trim() !== '' && (!data.guardianRelation || data.guardianRelation.trim() === '')) {
        errors.push('Guardian relationship is required when guardian name is provided');
      }

      // Transport validation
      if (data.transportMode === 'School Bus' && (!data.busRoute || data.busRoute.trim() === '')) {
        errors.push('Bus route is required when school bus transport is selected');
      }
    }

    return errors;
  };

  // Function to handle role change and auto-generate password and ID
  const handleRoleChange = async (role: 'student' | 'teacher' | 'admin') => {
    console.log(`🔄 Role changed to: ${role}`);

    // For students, don't generate password until DOB is entered
    // For other roles, generate random password
    const password = role === 'student' ? '' : generatePassword();

    // Auto-fetch next ID for the selected role
    setFormData(prev => ({
      ...prev,
      role,
      userId: '', // will be updated when fetch completes
      generatedPassword: password
    }));

    // Clear any existing next ID state
    setNextUserId('');

    try {
      console.log(`🚀 Auto-fetching next ID for role: ${role}`);
      const fetchedId = await fetchNextUserId(role);

      if (fetchedId) {
        console.log(`✅ Auto-generated ID for ${role}: ${fetchedId}`);
        toast.success(`Role set to ${role.charAt(0).toUpperCase() + role.slice(1)}. Next available ID: ${fetchedId}`);
      } else {
        console.log(`❌ Failed to auto-fetch ID for role: ${role}`);
        toast.error(`Role set to ${role.charAt(0).toUpperCase() + role.slice(1)}, but failed to fetch ID. Please try again.`);
      }
    } catch (error) {
      console.error(`❌ Error auto-fetching ID for role ${role}:`, error);
      toast.error(`Role set to ${role.charAt(0).toUpperCase() + role.slice(1)}, but failed to fetch ID. Please try again.`);
    }
  };

  // Function to handle DOB change and auto-generate password for students
  const handleDOBChange = (dob: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, dateOfBirth: dob };

      // Auto-generate DOB-based password for students in DDMMYYYY format
      if (prev.role === 'student' && dob) {
        // Always parse the date to ensure DDMMYYYY format
        const date = new Date(dob);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          newFormData.generatedPassword = `${day}${month}${year}`;
        }
      }

      return newFormData;
    });
  };

  // Enhanced DOB change handler that also updates studentDetails
  const handleDOBChangeWithStudentDetails = (dob: string) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        dateOfBirth: dob,
        studentDetails: {
          ...prev.studentDetails,
          dateOfBirth: dob
        }
      };

      // Auto-generate DOB-based password for students in DDMMYYYY format
      if (prev.role === 'student' && dob) {
        // Always parse the date to ensure DDMMYYYY format
        const date = new Date(dob);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          newFormData.generatedPassword = `${day}${month}${year}`;
        }
      }

      return newFormData;
    });
  };
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const [showCredentials, setShowCredentials] = useState<{ userId: string, password: string, email: string, role: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'teacher' | 'student'>('student');

  // Profile image state
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [imageCompressing, setImageCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showResetCredentials, setShowResetCredentials] = useState<{ userId: string, password: string, email: string, role: string } | null>(null);
  const [nextUserId, setNextUserId] = useState<string>('');
  const [loadingNextId, setLoadingNextId] = useState(false);

  // New state for hierarchical student display
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');

  // Import functionality state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: Array<{ userId: string, email: string, password: string, role: string }>,
    errors: Array<{ row: number, error: string, data: any }>
  } | null>(null);

  const [formData, setFormData] = useState<AddUserFormData>({
    // Core Fields
    role: 'student',

    // Enhanced Name Structure (matching backend)
    firstName: '',
    middleName: '',
    lastName: '',

    // Basic Contact (legacy compatibility)
    email: '',
    phone: '',

    // Enhanced Contact Information (matching backend)
    primaryPhone: '',
    secondaryPhone: '',
    whatsappNumber: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',

    // Enhanced Address Information (matching backend)
    permanentStreet: '',
    permanentArea: '',
    permanentCity: '',
    permanentState: 'Karnataka',
    permanentCountry: 'India',
    permanentPincode: '',
    permanentLandmark: '',
    stateId: '',
    districtId: '',
    talukaId: '',
    districtText: '',
    talukaText: '',

    currentStreet: '',
    currentArea: '',
    currentCity: '',
    currentState: 'Karnataka',
    currentCountry: 'India',
    currentPincode: '',
    currentLandmark: '',
    sameAsPermanent: true,

    // Identity Information (matching backend)
    aadharNumber: '',
    panNumber: '',
    voterIdNumber: '',
    drivingLicenseNumber: '',
    passportNumber: '',

    // Student Specific Fields (comprehensive Karnataka SATS)
    studentDetails: {
      // Academic Information
      currentClass: '',
      currentSection: '',
      academicYear: '2024-25',
      admissionDate: '',
      admissionClass: '',
      rollNumber: '',
      admissionNumber: '',
      enrollmentNo: '',
      tcNo: '',

      // Previous School
      previousSchoolName: '',
      previousBoard: '',
      lastClass: '',
      tcNumber: '',
      tcDate: '',
      reasonForTransfer: '',

      // Personal Information - Karnataka SATS
      dateOfBirth: '',
      placeOfBirth: '',
      gender: 'male',
      bloodGroup: '',
      nationality: 'Indian',
      religion: '',
      religionOther: '',
      caste: '',
      casteOther: '',
      category: '',
      categoryOther: '',
      motherTongue: '',
      motherTongueOther: '',

      // Karnataka SATS Specific
      ageYears: 0,
      ageMonths: 0,
      socialCategory: '',
      socialCategoryOther: '',
      studentCaste: '',
      studentCasteOther: '',
      studentAadhaar: '',
      studentCasteCertNo: '',

      // Economic Status
      belongingToBPL: 'No',
      bplCardNo: '',
      bhagyalakshmiBondNo: '',

      // Special Needs
      disability: 'Not Applicable',
      disabilityOther: '',
      isRTECandidate: 'No',

      // Family Information - Father
      fatherName: '',
      fatherOccupation: '',
      fatherQualification: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherAadhaar: '',
      fatherCaste: '',
      fatherCasteOther: '',
      fatherCasteCertNo: '',
      fatherAnnualIncome: 0,

      // Family Information - Mother
      motherName: '',
      motherOccupation: '',
      motherQualification: '',
      motherPhone: '',
      motherEmail: '',
      motherAadhaar: '',
      motherCaste: '',
      motherCasteOther: '',
      motherCasteCertNo: '',
      motherAnnualIncome: 0,

      // Guardian Information
      guardianName: '',
      guardianRelationship: '',
      guardianPhone: '',
      guardianEmail: '',
      isEmergencyContact: false,

      // Transportation
      transportMode: '',
      busRoute: '',
      pickupPoint: '',
      dropPoint: '',
      pickupTime: '',
      dropTime: '',

      // Financial Information
      feeCategory: '',
      concessionType: '',
      concessionPercentage: 0,
      scholarshipName: '',
      scholarshipAmount: 0,
      scholarshipProvider: '',

      // Banking Information
      bankName: '',
      bankAccountNo: '',
      bankIFSC: '',
      bankAccountHolderName: '',

      // Medical Information
      allergies: [],
      chronicConditions: [],
      medications: [],
      doctorName: '',
      hospitalName: '',
      doctorPhone: '',
      lastMedicalCheckup: '',
    },

    // Teacher Specific Fields (comprehensive)
    teacherDetails: {
      employeeId: '',
      joiningDate: '',

      // Qualification
      highestQualification: '',
      specialization: '',
      university: '',
      graduationYear: 0,

      // Experience
      totalExperience: 0,
      experienceAtCurrentSchool: 0,

      // Previous Experience
      previousSchools: [],

      // Subjects and Responsibilities
      subjects: [],
      primarySubjects: [],
      classTeacherOf: '',
      responsibilities: [],
      department: '',

      // Work Schedule
      workingDays: [],
      workingHoursStart: '',
      workingHoursEnd: '',
      maxPeriodsPerDay: 0,
      maxPeriodsPerWeek: 0,

      // Salary Information
      basicSalary: 0,
      allowances: [],

      // Banking Information
      bankAccountNumber: '',
      bankIFSC: '',
      bankName: '',
      bankBranchName: '',
    },

    // Admin Specific Fields (comprehensive)
    adminDetails: {
      adminType: '',
      employeeId: '',
      joiningDate: '',
      designation: '',
      department: '',

      // Permissions
      userManagement: false,
      academicManagement: false,
      feeManagement: false,
      reportGeneration: false,
      systemSettings: false,
      schoolSettings: false,
      dataExport: false,
      auditLogs: false,

      // Work Schedule
      workingDays: [],
      workingHoursStart: '',
      workingHoursEnd: '',

      // Salary Information
      basicSalary: 0,
      allowances: [],

      // Banking Information
      bankAccountNumber: '',
      bankIFSC: '',
      bankName: '',
      bankBranchName: '',
      bankAccountHolderName: '',
    },

    // Legacy Compatibility Fields (for backward compatibility)
    name: '',
    address: '',
    city: '',
    state: 'Karnataka',
    dateOfBirth: '',
    gender: 'male',
    fatherName: '',
    motherName: '',
    class: '',
    section: '',
    rollNumber: '',
    qualification: '',
    experience: '',
    subjects: [],
    adminLevel: '',
    accessLevel: '',

    // Generated Information
    userId: '',
    generatedPassword: '',

    // Additional SATS fields for backward compatibility
    studentNameKannada: '',
    ageYears: 0,
    ageMonths: 0,
    socialCategory: '',
    socialCategoryOther: '',
    studentCaste: '',
    studentCasteOther: '',
    studentAadhaar: '',
    studentCasteCertNo: '',
    fatherNameKannada: '',
    fatherAadhaar: '',
    fatherCaste: '',
    fatherCasteOther: '',
    fatherCasteCertNo: '',
    motherNameKannada: '',
    motherAadhaar: '',
    motherCaste: '',
    motherCasteOther: '',
    motherCasteCertNo: '',
    religion: '',
    religionOther: '',
    belongingToBPL: 'No',
    bplCardNo: '',
    bhagyalakshmiBondNo: '',
    disability: 'Not Applicable',
    disabilityOther: '',
    cityVillageTown: '',
    locality: '',
    taluka: '',
    district: '',
    pinCode: '',
    studentMobile: '',
    studentEmail: '',
    fatherMobile: '',
    fatherEmail: '',
    motherMobile: '',
    motherEmail: '',
    schoolAdmissionDate: '',
    bankName: '',
    bankAccountNo: '',
    bankIFSC: '',
    nationality: 'Indian',
    bloodGroup: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherPhone: '',
    motherOccupation: '',
    guardianName: '',
    guardianRelation: '',
    fatherEducation: '',
    motherEducation: '',
    familyIncome: '',
    alternatePhone: '',
    parentEmail: '',
    admissionNumber: '',
    admissionDate: '',
    previousSchool: '',
    previousClass: '',
    tcNumber: '',
    migrationCertificate: '',
    aadhaarNumber: '',
    birthCertificateNumber: '',
    rationCardNumber: '',
    caste: '',
    casteOther: '',
    category: '',
    categoryOther: '',
    subCaste: '',
    economicStatus: '',
    bplCardNumber: '',
    scholarshipDetails: '',
    specialNeeds: '',
    disabilityType: '',
    disabilityCertificate: '',
    medicalConditions: '',
    permanentAddress: '',
    currentAddress: '',
    village: '',
    motherTongue: '',
    motherTongueOther: '',
    mediumOfInstruction: '',
    spouseName: '',
  });

  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'single' | 'bulk'>('single');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);
  const [allTeacherPasswords, setAllTeacherPasswords] = useState<Array<{ userId: string, email: string, name: string, temporaryPassword: string | null }>>([]);
  const [allPasswordsVisible, setAllPasswordsVisible] = useState(false); // Track if all passwords are shown

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState<{ userId: string, name: string, email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  // -----------------------------------------

  // --- ADD TOGGLE FUNCTION ---
  const togglePasswordVisibility = (userId: string, userName: string) => {
    try {
      console.log(`Toggling visibility for user: ${userId}, Current state: ${!!passwordVisibility[userId]}`);
      const isCurrentlyVisible = passwordVisibility[userId];

      if (isCurrentlyVisible) {
        console.log(`Hiding password for ${userId}`);
        setPasswordVisibility(prev => {
          const newState = { ...prev, [userId]: false };
          console.log("New visibility state (hiding):", newState);
          return newState;
        });
      } else {
        console.log(`Requesting admin password to show password for ${userId} (${userName})`);
        setSelectedTeacherId(userId);
        setSelectedTeacherName(userName);
        setPasswordModalType('single');
        setShowPasswordModal(true);
      }
    } catch (error) {
      console.error('Error in togglePasswordVisibility:', error);
      toast.error('Failed to toggle password visibility');
    }
  };

  // Handle showing/hiding all teacher passwords
  const handleShowAllPasswords = () => {
    try {
      if (allPasswordsVisible) {
        // Hide all passwords
        console.log('Hiding all passwords');
        setPasswordVisibility({});
        setAllPasswordsVisible(false);
        setAllTeacherPasswords([]);
        toast.success('All passwords hidden');
      } else {
        // Show all passwords - open modal for admin verification
        console.log('Opening bulk password modal');
        setPasswordModalType('bulk');
        setShowPasswordModal(true);
      }
    } catch (error) {
      console.error('Error in handleShowAllPasswords:', error);
      toast.error('Failed to toggle passwords');
    }
  };

  // Handle password modal submission
  const handlePasswordModalSubmit = async () => {
    if (!adminPasswordInput.trim()) {
      toast.error('Please enter your admin password');
      return;
    }

    setPasswordModalLoading(true);
    try {
      // Get token from localStorage
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      if (!token) {
        toast.error('Authentication token not found');
        setPasswordModalLoading(false);
        return;
      }

      const schoolCode = user?.schoolCode || school?.code || 'SB';
      console.log('Verifying admin password with school code:', schoolCode);
      console.log('Token available:', !!token);

      const response = await schoolUserAPI.verifyAdminAndGetPasswords(
        schoolCode,
        adminPasswordInput,
        passwordModalType === 'single' ? selectedTeacherId : null,
        token
      );

      if (passwordModalType === 'single') {
        // Check if password exists
        const teacherData = response.data;
        if (!teacherData || !teacherData.temporaryPassword) {
          toast.error('Password not available. This user may have been created without storing the temporary password.');
          setShowPasswordModal(false);
          setAdminPasswordInput('');
          setSelectedTeacherId(null);
          setSelectedTeacherName('');
          return;
        }

        // Show single password
        setPasswordVisibility(prev => ({
          ...prev,
          [selectedTeacherId!]: true
        }));
        toast.success('Password revealed');
      } else {
        // Show all passwords
        const teachersWithPasswords = Array.isArray(response.data)
          ? response.data.filter((t: any) => t.temporaryPassword)
          : [];

        if (teachersWithPasswords.length === 0) {
          toast.error('No passwords available. Teachers may have been created without storing temporary passwords.');
          setShowPasswordModal(false);
          setAdminPasswordInput('');
          return;
        }

        setAllTeacherPasswords(response.data || []);
        const visibilityState: Record<string, boolean> = {};
        (response.data || []).forEach((teacher: any) => {
          if (teacher.temporaryPassword) {
            visibilityState[teacher.userId] = true;
          }
        });
        setPasswordVisibility(visibilityState);
        setAllPasswordsVisible(true); // Mark that all passwords are now visible

        const availableCount = teachersWithPasswords.length;
        const totalCount = response.count || (Array.isArray(response.data) ? response.data.length : 0);

        if (availableCount < totalCount) {
          toast.success(`Revealed ${availableCount} of ${totalCount} teacher passwords. Some passwords are not available.`, { duration: 5000 });
        } else {
          toast.success(`Revealed ${availableCount} teacher passwords`);
        }
      }

      // Close modal and reset
      setShowPasswordModal(false);
      setAdminPasswordInput('');
      setSelectedTeacherId(null);
      setSelectedTeacherName('');
    } catch (error: any) {
      console.error('Error verifying admin password:', error);
      toast.error(error.message || 'Invalid admin password');
    } finally {
      setPasswordModalLoading(false);
    }
  };
  // Location handlers - matching AddSchoolForm pattern
  const handleStateChange = (stateId: number, state: State) => {
    console.log('State changed:', stateId, state.name);
    setFormData(prev => ({
      ...prev,
      stateId: stateId.toString(),
      state: state.name,
      permanentState: state.name,
      // Clear dependent fields
      districtId: '',
      district: '',
      talukaId: '',
      taluka: '',
      districtText: '',
      talukaText: ''
    }));
  };

  const handleDistrictChange = (districtId: number, district: District) => {
    console.log('District changed:', districtId, district.name);
    setFormData(prev => ({
      ...prev,
      districtId: districtId.toString(),
      district: district.name,
      // Clear dependent fields
      talukaId: '',
      taluka: '',
      talukaText: ''
    }));
  };

  const handleTalukaChange = (talukaId: number, taluka: Taluka) => {
    console.log('Taluka changed:', talukaId, taluka.name);
    setFormData(prev => ({
      ...prev,
      talukaId: talukaId.toString(),
      taluka: taluka.name
    }));
  };

  const handleDistrictTextChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      districtText: text,
      district: text,
      // Clear dependent fields when typing manually
      talukaText: ''
    }));
  };

  const handleTalukaTextChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      talukaText: text,
      taluka: text
    }));
  };

  const resetForm = () => {
    setFormData({
      // Core Fields
      role: 'student',

      // Enhanced Name Structure (matching backend)
      firstName: '',
      middleName: '',
      lastName: '',

      // Basic Contact (legacy compatibility)
      email: '',
      phone: '',

      // Enhanced Contact Information (matching backend)
      primaryPhone: '',
      secondaryPhone: '',
      whatsappNumber: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',

      // Enhanced Address Information (matching backend)
      permanentStreet: '',
      permanentArea: '',
      permanentCity: '',
      permanentState: '',
      permanentCountry: 'India',
      permanentPincode: '',
      permanentLandmark: '',
      stateId: '',
      districtId: '',
      talukaId: '',
      districtText: '',
      talukaText: '',
      currentStreet: '',
      currentArea: '',
      currentCity: '',
      currentState: '',
      currentCountry: 'India',
      currentPincode: '',
      currentLandmark: '',
      sameAsPermanent: true,

      // Identity Information (matching backend)
      aadharNumber: '',
      panNumber: '',
      voterIdNumber: '',
      drivingLicenseNumber: '',
      passportNumber: '',

      // Student Specific Fields (comprehensive Karnataka SATS)
      studentDetails: {
        // Academic Information
        currentClass: '',
        currentSection: '',
        academicYear: '2024-25',
        admissionDate: '',
        admissionClass: '',
        rollNumber: '',
        admissionNumber: '',
        enrollmentNo: '',
        tcNo: '',

        // Previous School
        previousSchoolName: '',
        previousBoard: '',
        lastClass: '',
        tcNumber: '',
        tcDate: '',
        reasonForTransfer: '',

        // Personal Information - Karnataka SATS
        dateOfBirth: '',
        placeOfBirth: '',
        gender: 'male',
        bloodGroup: '',
        nationality: 'Indian',
        religion: '',
        religionOther: '',
        caste: '',
        casteOther: '',
        category: '',
        categoryOther: '',
        motherTongue: '',
        motherTongueOther: '',

        // Karnataka SATS Specific
        studentNameKannada: '',
        ageYears: 0,
        ageMonths: 0,
        socialCategory: '',
        socialCategoryOther: '',
        studentCaste: '',
        studentCasteOther: '',
        studentAadhaar: '',
        studentCasteCertNo: '',

        // Economic Status
        belongingToBPL: 'No',
        bplCardNo: '',
        bhagyalakshmiBondNo: '',

        // Special Needs
        disability: 'Not Applicable',
        disabilityOther: '',
        isRTECandidate: 'No',

        // Family Information - Father
        fatherName: '',
        fatherNameKannada: '',
        fatherOccupation: '',
        fatherQualification: '',
        fatherPhone: '',
        fatherEmail: '',
        fatherAadhaar: '',
        fatherCaste: '',
        fatherCasteOther: '',
        fatherCasteCertNo: '',
        fatherWorkAddress: '',
        fatherAnnualIncome: 0,

        // Family Information - Mother
        motherName: '',
        motherNameKannada: '',
        motherOccupation: '',
        motherQualification: '',
        motherPhone: '',
        motherEmail: '',
        motherAadhaar: '',
        motherCaste: '',
        motherCasteOther: '',
        motherCasteCertNo: '',
        motherWorkAddress: '',
        motherAnnualIncome: 0,

        // Guardian Information
        guardianName: '',
        guardianRelationship: '',
        guardianPhone: '',
        guardianEmail: '',
        guardianAddress: '',
        isEmergencyContact: false,

        // Transportation
        transportMode: '',
        busRoute: '',
        pickupPoint: '',
        dropPoint: '',
        pickupTime: '',
        dropTime: '',

        // Financial Information
        feeCategory: '',
        concessionType: '',
        concessionPercentage: 0,
        scholarshipName: '',
        scholarshipAmount: 0,
        scholarshipProvider: '',

        // Banking Information
        bankName: '',
        bankAccountNo: '',
        bankIFSC: '',
        bankAccountHolderName: '',

        // Medical Information
        allergies: [],
        chronicConditions: [],
        medications: [],
        doctorName: '',
        hospitalName: '',
        doctorPhone: '',
        lastMedicalCheckup: '',
      },

      // Teacher Specific Fields (comprehensive)
      teacherDetails: {
        employeeId: '',
        joiningDate: '',

        // Qualification
        highestQualification: '',
        specialization: '',
        university: '',
        graduationYear: 0,

        // Experience
        totalExperience: 0,
        experienceAtCurrentSchool: 0,

        // Previous Experience
        previousSchools: [],

        // Subjects and Responsibilities
        subjects: [],
        primarySubjects: [],
        classTeacherOf: '',
        responsibilities: [],
        department: '',

        // Work Schedule
        workingDays: [],
        workingHoursStart: '',
        workingHoursEnd: '',
        maxPeriodsPerDay: 0,
        maxPeriodsPerWeek: 0,

        // Salary Information
        basicSalary: 0,
        allowances: [],

        // Banking Information
        bankAccountNumber: '',
        bankIFSC: '',
        bankName: '',
        bankBranchName: '',
      },

      // Admin Specific Fields (comprehensive)
      adminDetails: {
        adminType: '',
        employeeId: '',
        joiningDate: '',
        designation: '',
        department: '',

        // Permissions
        userManagement: false,
        academicManagement: false,
        feeManagement: false,
        reportGeneration: false,
        systemSettings: false,
        schoolSettings: false,
        dataExport: false,
        auditLogs: false,

        // Work Schedule
        workingDays: [],
        workingHoursStart: '',
        workingHoursEnd: '',

        // Salary Information
        basicSalary: 0,
        allowances: [],

        // Banking Information
        bankAccountNumber: '',
        bankIFSC: '',
        bankName: '',
        bankBranchName: '',
        bankAccountHolderName: '',
      },

      // Legacy Compatibility Fields (for backward compatibility)
      name: '',
      address: '',
      city: '',
      state: '',
      dateOfBirth: '',
      gender: 'male',
      fatherName: '',
      motherName: '',
      class: '',
      section: '',
      rollNumber: '',
      qualification: '',
      experience: '',
      subjects: [],
      adminLevel: '',
      accessLevel: '',

      // Generated Information
      userId: '',
      generatedPassword: '',

      // Additional SATS fields for backward compatibility
      studentNameKannada: '',
      ageYears: 0,
      ageMonths: 0,
      socialCategory: '',
      socialCategoryOther: '',
      studentCaste: '',
      studentCasteOther: '',
      studentAadhaar: '',
      studentCasteCertNo: '',
      fatherNameKannada: '',
      fatherAadhaar: '',
      fatherCaste: '',
      fatherCasteOther: '',
      fatherCasteCertNo: '',
      motherNameKannada: '',
      motherAadhaar: '',
      motherCaste: '',
      motherCasteOther: '',
      motherCasteCertNo: '',
      religion: '',
      religionOther: '',
      belongingToBPL: 'No',
      bplCardNo: '',
      bhagyalakshmiBondNo: '',
      disability: 'Not Applicable',
      disabilityOther: '',
      cityVillageTown: '',
      locality: '',
      taluka: '',
      district: '',
      pinCode: '',
      studentMobile: '',
      studentEmail: '',
      fatherMobile: '',
      fatherEmail: '',
      motherMobile: '',
      motherEmail: '',
      schoolAdmissionDate: '',
      bankName: '',
      bankAccountNo: '',
      bankIFSC: '',
      nationality: 'Indian',
      bloodGroup: '',
      fatherPhone: '',
      fatherOccupation: '',
      motherPhone: '',
      motherOccupation: '',
      guardianName: '',
      guardianRelation: '',
      fatherEducation: '',
      motherEducation: '',
      familyIncome: '',
      alternatePhone: '',
      parentEmail: '',
      admissionNumber: '',
      admissionDate: '',
      previousSchool: '',
      previousClass: '',
      tcNumber: '',
      migrationCertificate: '',
      aadhaarNumber: '',
      birthCertificateNumber: '',
      rationCardNumber: '',
      caste: '',
      casteOther: '',
      category: '',
      categoryOther: '',
      subCaste: '',
      economicStatus: '',
      bplCardNumber: '',
      scholarshipDetails: '',
      specialNeeds: '',
      disabilityType: '',
      disabilityCertificate: '',
      medicalConditions: '',
      permanentAddress: '',
      currentAddress: '',
      village: '',
      motherTongue: '',
      motherTongueOther: '',
      mediumOfInstruction: '',
      spouseName: '',
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
  }, [showAddModal]); // only run when modal opens, do not re-run on users list changes

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
    }
  }, [activeTab, showAddModal]);

  // Debug function to test API endpoints
  const debugNextIdAPI = async () => {
    console.log('=== 🐛 DEBUG: Testing Next ID API ===');

    const roles = ['student', 'teacher', 'admin'];
    const authData = localStorage.getItem('erp.auth');
    const token = authData ? JSON.parse(authData).token : null;

    if (!token) {
      console.log('❌ No authentication token found');
      return;
    }

    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    console.log('👤 User context:', { schoolCode: user?.schoolCode, role: user?.role });

    for (const role of roles) {
      try {
        console.log(`\n🔍 Testing ${role.toUpperCase()} endpoint...`);

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        if (user?.schoolCode) {
          headers['x-school-code'] = user.schoolCode;
        }

        const response = await fetch(`http://localhost:5050/api/users/next-id/${role}`, {
          method: 'GET',
          headers
        });

        console.log(`📊 ${role} Response Status:`, response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${role.toUpperCase()} Next ID:`, data);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.log(`❌ ${role.toUpperCase()} Error:`, errorData);
        }

      } catch (error) {
        console.error(`❌ ${role.toUpperCase()} Network Error:`, error);
      }
    }

    console.log('=== 🐛 DEBUG COMPLETE ===\n');
  };

  // Add debugging useEffect (only in development)
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV === 'development' && user?.schoolCode) {
      console.log('🐛 Development mode detected, running API debug...');
      // Add a small delay to ensure user context is loaded
      setTimeout(() => {
        debugNextIdAPI();
      }, 1000);
    }
  }, [user?.schoolCode]); // Run when user context is available

  // Manual test function - can be called from browser console
  // Usage: window.testManageUsersAPI()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Register a safe manual test function. It will attempt to call fetchNextUserId if available at runtime.
      (window as any).testManageUsersAPI = async () => {
        console.log('🧪 Manual API Test Started');
        await debugNextIdAPI();

        // Test individual role endpoints
        const roles = ['student', 'teacher', 'admin'];
        for (const role of roles) {
          try {
            console.log(`\n🧪 Testing ${role} ID generation...`);
            // Access fetchNextUserId from window if it was exposed; otherwise call via component scope
            const fn = (window as any).fetchNextUserId || fetchNextUserId;
            if (typeof fn === 'function') {
              const result = await fn(role);
              console.log(`Result for ${role}:`, result);
            } else {
              console.warn('fetchNextUserId not available to call');
            }
          } catch (err) {
            console.error('Error testing role', role, err);
          }
        }

        console.log('🧪 Manual API Test Complete');
      };

      console.log('🧪 Test function registered: window.testManageUsersAPI()');
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the same token retrieval method as Dashboard
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'P'; // Use 'P' as fallback since we saw it in the database

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log('Fetching users for school:', schoolCode);
      console.log('API URL will be:', `http://localhost:5050/api/school-users/${schoolCode}/users`);
      console.log('Token being used:', token ? 'Present' : 'Missing');

      try {
        // Fetch all users from the school-specific collections
        const response = await schoolUserAPI.getAllUsers(schoolCode, token);
        console.log('API Response:', response);

        const allUsers: User[] = [];

        // Extract users from each role collection based on the actual response structure
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((userData: any) => {
            // Initialize processedUser with potential studentDetails structure
            const processedUser: User = {
              _id: userData._id || userData.userId,
              userId: userData.userId,
              name: userData.name?.displayName ||
                (userData.name?.firstName && userData.name?.lastName
                  ? `${userData.name.firstName} ${userData.name.lastName}`
                  : userData.name?.firstName || userData.name?.lastName || userData.name || 'Unknown'),
              email: userData.email || 'No email',
              role: userData.role,
              phone: userData.contact?.primaryPhone || userData.contact?.phone || userData.phone,
              temporaryPassword: userData.temporaryPassword || userData.tempPassword || null,
              address: userData.address?.permanent?.street || userData.address?.street || userData.address,
              isActive: userData.isActive !== false,
              createdAt: userData.createdAt || new Date().toISOString(),
              profileImage: userData.profileImage || userData.profilePicture || null, // 💡 FIX 2a: Map profileImage here
              // Initialize studentDetails as an empty object or undefined
              studentDetails: userData.role === 'student' ? {} : undefined
            };

            // Add role-specific details ONLY if the object exists
            if (userData.role === 'student' && processedUser.studentDetails) {
              // Assert that studentDetails is not undefined within this block
              const details = processedUser.studentDetails as { // Type assertion
                studentId?: string;
                class?: string;
                section?: string;
                // Add other potential studentDetails properties here if needed
              };
              details.class = userData.studentDetails?.currentClass || 'Not assigned';
              details.section = userData.studentDetails?.currentSection || 'Not assigned';
              details.studentId = userData.userId || userData._id;
            } else if (userData.role === 'teacher' && userData.teacherDetails) {
              // Ensure teacherDetails is properly structured if needed later
              processedUser.teacherDetails = {
                employeeId: userData.teacherDetails?.employeeId || userData.employeeId || 'Not assigned',
                temporaryPassword: userData.temporaryPassword || userData.tempPassword || null,
                // Make sure subjects is handled correctly as an array
                subjects: Array.isArray(userData.teacherDetails?.subjects)
                  ? userData.teacherDetails.subjects
                  : ((typeof userData.teacherDetails?.subjects === 'string')
                    ? userData.teacherDetails.subjects.split(',').map(s => s.trim())
                    : []),
                qualification: userData.teacherDetails?.qualification || 'Not provided',
                experience: userData.teacherDetails?.experience || 0
              };
            }
            // Make sure to add the processed user to the list
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
                  temporaryPassword: userData.temporaryPassword || userData.tempPassword || null,
                  address: userData.address?.permanent?.street || userData.address?.street || userData.address,
                  profileImage: userData.profileImage || userData.profilePicture || null, // 💡 FIX 2b: Map profileImage here (grouped response)
                  isActive: userData.isActive !== false,
                  createdAt: userData.createdAt || new Date().toISOString()
                };

                // Add role-specific details
                if (role === 'student') {
                  processedUser.studentDetails = {
                    studentId: userData.userId || userData._id,
                    class: userData.academicInfo?.class || userData.class || 'Not assigned',
                    section: userData.academicInfo?.section || userData.section || 'Not assigned',
                    rollNumber: userData.studentDetails?.rollNumber || userData.rollNumber || ''
                  };
                } else if (role === 'teacher') {
                  processedUser.teacherDetails = {
                    employeeId: userData.teacherDetails?.employeeId || userData.employeeId || userData.teacherId || 'Not assigned',
                    subjects: userData.subjects || [],
                    qualification: userData.qualification || 'Not provided',
                    experience: userData.experience || 0
                  };
                } else if (role === 'admin') {
                  processedUser.adminDetails = {
                    employeeId: userData.adminDetails?.employeeId || userData.employeeId || 'Not assigned',
                    designation: userData.adminDetails?.designation || 'Administrator'
                  };
                }

                allUsers.push(processedUser);
              });
            }
          });
        }

        console.log('Processed users:', allUsers);
        console.log('Processed Users with Passwords:', allUsers.filter(u => u.role === 'teacher').map(t => ({
          id: t.userId,
          name: t.name,
          pass: t.temporaryPassword,
          hasPassword: !!t.temporaryPassword
        }))); // Log teacher IDs and passwords
        console.log('Raw teacher data from API:', response.data?.filter((u: any) => u.role === 'teacher').map((t: any) => ({
          userId: t.userId,
          temporaryPassword: t.temporaryPassword,
          tempPassword: t.tempPassword
        })));
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
    if (!role) {
      console.log('❌ No role provided to fetchNextUserId');
      setNextUserId('');
      return '';
    }

    try {
      setLoadingNextId(true);
      console.log(`🔍 Fetching next user ID for role: ${role}`);

      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      if (!token) {
        console.error('❌ No authentication token available');
        toast.error('Authentication required. Please login again.');
        return '';
      }

      // Include school context header
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Add school context if available
      if (user?.schoolCode) {
        headers['x-school-code'] = user.schoolCode;
        console.log(`🏫 Adding school context: ${user.schoolCode}`);
      } else {
        console.log('⚠️ No school code available in user context');
      }

      console.log('📡 Making API request to:', `http://localhost:5050/api/users/next-id/${role}`);
      console.log('📋 Request headers:', headers);

      const response = await fetch(`http://localhost:5050/api/users/next-id/${role}`, {
        method: 'GET',
        headers
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);

        if (data.success && data.nextUserId) {
          const fetchedId = data.nextUserId;
          setNextUserId(fetchedId);
          // Update formData immediately with the fetched ID
          setFormData(prev => ({ ...prev, userId: fetchedId }));
          console.log(`✅ Successfully fetched next ${role} ID: ${fetchedId}`);
          toast.success(`Next available ID: ${fetchedId}`);
          return fetchedId;
        } else {
          console.error('❌ Invalid response format:', data);
          toast.error(data.message || 'Invalid response from server');
          setNextUserId('');
          return '';
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        console.error('❌ Failed to fetch next user ID:', response.status, errorData);
        toast.error(errorData.message || `Failed to fetch next user ID (${response.status})`);
        setNextUserId('');
        return '';
      }
    } catch (error) {
      console.error('❌ Error fetching next user ID:', error);
      toast.error(`Network error: ${error.message}`);
      setNextUserId('');
      return '';
    } finally {
      setLoadingNextId(false);
    }
  };

  // Expose fetchNextUserId to window in development for manual testing (avoids TDZ when used by test function)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      (window as any).fetchNextUserId = fetchNextUserId;
      console.log('🧪 Exposed fetchNextUserId on window for manual testing');
    } catch (err) {
      // ignore
    }
  }

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
  const checkEmailExists = async (email: string): Promise<{ exists: boolean, role?: string, name?: string }> => {
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
      // Prevent double submit
      if (isSubmittingRef.current) return;

      // Client-side validation: block submission if invalid
      const clientErrors = validateFormBeforeSubmit(formData);
      if (clientErrors.length > 0) {
        clientErrors.slice(0, 3).forEach(err => toast.error(err));
        return;
      }

      isSubmittingRef.current = true;
      setLoading(true);

      // Validate email uniqueness across all roles before creating user
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists.exists) {
        toast.error(`Email already exists for ${emailExists.role}: ${emailExists.name}`);
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      // Use the same token retrieval method as Dashboard
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;
      const schoolCode = user?.schoolCode || 'NPS';

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Generate password based on role
      const generatedPassword = formData.role === 'student' && formData.dateOfBirth
        ? (() => {
          const dobDate = new Date(formData.dateOfBirth);
          return `${dobDate.getDate().toString().padStart(2, '0')}${(dobDate.getMonth() + 1).toString().padStart(2, '0')}${dobDate.getFullYear()}`;
        })()
        : formData.generatedPassword || 'defaultPassword123';

      // Build comprehensive request data based on backend User model structure
      const userData: any = {
        // Core Fields (Backend Required - Flat Structure)
        role: formData.role,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.primaryPhone || formData.phone,
        password: generatedPassword,

        // Additional flat fields that might be expected
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.cityVillageTown || formData.city,
        state: formData.state,
        pinCode: formData.pinCode,

        // Enhanced Name Structure (matching backend)
        name: {
          firstName: formData.firstName,
          middleName: formData.middleName || '',
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`.trim()
        },

        // Basic Contact
        temporaryPassword: generatedPassword,
        passwordChangeRequired: true,

        // Enhanced Contact Information (matching backend)
        contact: {
          primaryPhone: formData.primaryPhone || formData.phone,
          secondaryPhone: formData.secondaryPhone || '',
          whatsappNumber: formData.whatsappNumber || '',
          emergencyContact: {
            name: formData.emergencyContactName || '',
            relationship: formData.emergencyContactRelation || '',
            phone: formData.emergencyContactPhone || ''
          }
        },

        // Enhanced Address Information (matching backend)
        addressDetails: {
          permanent: {
            street: formData.permanentStreet || formData.address || '',
            area: formData.permanentArea || '',
            city: formData.permanentCity || formData.city || '',
            state: formData.permanentState || formData.state || '',
            country: formData.permanentCountry || 'India',
            pincode: formData.permanentPincode || formData.pinCode || '',
            landmark: formData.permanentLandmark || ''
          },
          current: {
            street: formData.sameAsPermanent ? (formData.permanentStreet || formData.address || '') : (formData.currentStreet || ''),
            area: formData.sameAsPermanent ? (formData.permanentArea || '') : (formData.currentArea || ''),
            city: formData.sameAsPermanent ? (formData.permanentCity || formData.city || '') : (formData.currentCity || ''),
            state: formData.sameAsPermanent ? (formData.permanentState || formData.state || '') : (formData.currentState || ''),
            country: formData.sameAsPermanent ? (formData.permanentCountry || 'India') : (formData.currentCountry || 'India'),
            pincode: formData.sameAsPermanent ? (formData.permanentPincode || formData.pinCode || '') : (formData.currentPincode || ''),
            landmark: formData.sameAsPermanent ? (formData.permanentLandmark || '') : (formData.currentLandmark || ''),
            sameAsPermanent: formData.sameAsPermanent
          }
        },

        // Identity Information (matching backend)
        identity: {
          aadharNumber: formData.aadharNumber || formData.studentAadhaar || formData.aadhaarNumber || '',
          panNumber: formData.panNumber || '',
          voterIdNumber: formData.voterIdNumber || '',
          drivingLicenseNumber: formData.drivingLicenseNumber || '',
          passportNumber: formData.passportNumber || ''
        },

        // System Fields
        isActive: true,
        isVerified: false,
        schoolCode: schoolCode,
        schoolAccess: {
          joinedDate: new Date(),
          status: 'active',
          accessLevel: 'standard'
        }
      };

      // Add role-specific fields based on comprehensive backend structure
      if (formData.role === 'student') {
        userData.studentDetails = {
          // Academic Information - Karnataka SATS Standard
          academic: {
            currentClass: formData.studentDetails?.currentClass || formData.class || '',
            currentSection: formData.studentDetails?.currentSection || formData.section || '',
            academicYear: formData.studentDetails?.academicYear || '2024-25',
            admissionDate: formData.studentDetails?.admissionDate ? new Date(formData.studentDetails.admissionDate) : undefined,
            admissionClass: formData.studentDetails?.admissionClass || '',
            rollNumber: formData.studentDetails?.rollNumber || formData.rollNumber || '',
            admissionNumber: formData.studentDetails?.admissionNumber || formData.admissionNumber || '',
            enrollmentNo: formData.studentDetails?.enrollmentNo || '',
            tcNo: formData.studentDetails?.tcNo || '',

            previousSchool: {
              name: formData.studentDetails?.previousSchoolName || formData.previousSchool || '',
              board: formData.studentDetails?.previousBoard || '',
              lastClass: formData.studentDetails?.lastClass || formData.previousClass || '',
              tcNumber: formData.studentDetails?.tcNumber || formData.tcNumber || '',
              tcDate: formData.studentDetails?.tcDate ? new Date(formData.studentDetails.tcDate) : undefined,
              reasonForTransfer: formData.studentDetails?.reasonForTransfer || ''
            }
          },

          // Personal Information - Karnataka SATS Standard
          personal: {
            dateOfBirth: formData.studentDetails?.dateOfBirth ? new Date(formData.studentDetails.dateOfBirth) :
              (formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined),
            placeOfBirth: formData.studentDetails?.placeOfBirth || '',
            gender: formData.studentDetails?.gender || formData.gender || 'male',
            bloodGroup: formData.studentDetails?.bloodGroup || formData.bloodGroup || '',
            nationality: formData.studentDetails?.nationality || formData.nationality || 'Indian',
            religion: formData.studentDetails?.religion || formData.religion || '',
            religionOther: formData.studentDetails?.religionOther || formData.religionOther || '',
            caste: formData.studentDetails?.caste || formData.caste || '',
            casteOther: formData.studentDetails?.casteOther || formData.casteOther || '',
            category: formData.studentDetails?.category || formData.category || '',
            categoryOther: formData.studentDetails?.categoryOther || formData.categoryOther || '',
            motherTongue: formData.studentDetails?.motherTongue || formData.motherTongue || '',
            motherTongueOther: formData.studentDetails?.motherTongueOther || formData.motherTongueOther || '',

            // Karnataka SATS Specific Fields
            studentNameKannada: formData.studentDetails?.studentNameKannada || formData.studentNameKannada || '',
            ageYears: formData.studentDetails?.ageYears || formData.ageYears || 0,
            ageMonths: formData.studentDetails?.ageMonths || formData.ageMonths || 0,
            socialCategory: formData.studentDetails?.socialCategory || formData.socialCategory || '',
            socialCategoryOther: formData.studentDetails?.socialCategoryOther || formData.socialCategoryOther || '',
            studentCaste: formData.studentDetails?.studentCaste || formData.studentCaste || '',
            studentCasteOther: formData.studentDetails?.studentCasteOther || formData.studentCasteOther || '',
            studentAadhaar: formData.studentDetails?.studentAadhaar || formData.studentAadhaar || '',
            studentCasteCertNo: formData.studentDetails?.studentCasteCertNo || formData.studentCasteCertNo || '',

            // Economic Status
            belongingToBPL: formData.studentDetails?.belongingToBPL || formData.belongingToBPL || 'No',
            bplCardNo: formData.studentDetails?.bplCardNo || formData.bplCardNo || '',
            bhagyalakshmiBondNo: formData.studentDetails?.bhagyalakshmiBondNo || formData.bhagyalakshmiBondNo || '',

            // Special Needs
            disability: formData.studentDetails?.disability || formData.disability || 'Not Applicable',
            disabilityOther: formData.studentDetails?.disabilityOther || formData.disabilityOther || '',
            isRTECandidate: formData.studentDetails?.isRTECandidate || formData.isRTECandidate || 'No'
          },

          // Family Information - Karnataka SATS Standard
          family: {
            father: {
              name: formData.studentDetails?.fatherName || formData.fatherName || '',
              nameKannada: formData.studentDetails?.fatherNameKannada || formData.fatherNameKannada || '',
              occupation: formData.studentDetails?.fatherOccupation || formData.fatherOccupation || '',
              qualification: formData.studentDetails?.fatherQualification || formData.fatherEducation || '',
              phone: formData.studentDetails?.fatherPhone || formData.fatherPhone || formData.fatherMobile || '',
              email: formData.studentDetails?.fatherEmail || formData.fatherEmail || '',
              aadhaar: formData.studentDetails?.fatherAadhaar || formData.fatherAadhaar || '',
              caste: formData.studentDetails?.fatherCaste || formData.fatherCaste || '',
              casteOther: formData.studentDetails?.fatherCasteOther || formData.fatherCasteOther || '',
              casteCertNo: formData.studentDetails?.fatherCasteCertNo || formData.fatherCasteCertNo || '',
              workAddress: formData.studentDetails?.fatherWorkAddress || '',
              annualIncome: formData.studentDetails?.fatherAnnualIncome || 0
            },
            mother: {
              name: formData.studentDetails?.motherName || formData.motherName || '',
              nameKannada: formData.studentDetails?.motherNameKannada || formData.motherNameKannada || '',
              occupation: formData.studentDetails?.motherOccupation || formData.motherOccupation || '',
              qualification: formData.studentDetails?.motherQualification || formData.motherEducation || '',
              phone: formData.studentDetails?.motherPhone || formData.motherPhone || formData.motherMobile || '',
              email: formData.studentDetails?.motherEmail || formData.motherEmail || '',
              aadhaar: formData.studentDetails?.motherAadhaar || formData.motherAadhaar || '',
              caste: formData.studentDetails?.motherCaste || formData.motherCaste || '',
              casteOther: formData.studentDetails?.motherCasteOther || formData.motherCasteOther || '',
              casteCertNo: formData.studentDetails?.motherCasteCertNo || formData.motherCasteCertNo || '',
              workAddress: formData.studentDetails?.motherWorkAddress || '',
              annualIncome: formData.studentDetails?.motherAnnualIncome || 0
            },
            guardian: formData.studentDetails?.guardianName ? {
              name: formData.studentDetails.guardianName,
              relationship: formData.studentDetails.guardianRelationship || formData.guardianRelation || '',
              phone: formData.studentDetails.guardianPhone || '',
              email: formData.studentDetails.guardianEmail || '',
              address: formData.studentDetails.guardianAddress || '',
              isEmergencyContact: formData.studentDetails.isEmergencyContact || false
            } : undefined
          },

          // Transportation
          transport: {
            mode: formData.studentDetails?.transportMode || '',
            busRoute: formData.studentDetails?.busRoute || '',
            pickupPoint: formData.studentDetails?.pickupPoint || '',
            dropPoint: formData.studentDetails?.dropPoint || '',
            pickupTime: formData.studentDetails?.pickupTime || '',
            dropTime: formData.studentDetails?.dropTime || ''
          },

          // Financial Information - Karnataka SATS Standard
          financial: {
            feeCategory: formData.studentDetails?.feeCategory || '',
            concessionType: formData.studentDetails?.concessionType || '',
            concessionPercentage: formData.studentDetails?.concessionPercentage || 0,
            scholarshipDetails: formData.studentDetails?.scholarshipName ? {
              name: formData.studentDetails.scholarshipName,
              amount: formData.studentDetails.scholarshipAmount || 0,
              provider: formData.studentDetails.scholarshipProvider || ''
            } : undefined,

            // Karnataka SATS Banking Information
            bankDetails: {
              bankName: formData.studentDetails?.bankName || formData.bankName || '',
              accountNumber: formData.studentDetails?.bankAccountNo || formData.bankAccountNo || '',
              ifscCode: formData.studentDetails?.bankIFSC || formData.bankIFSC || '',
              accountHolderName: formData.studentDetails?.bankAccountHolderName || ''
            }
          },

          // Medical Information
          medical: formData.studentDetails?.allergies?.length ? {
            allergies: formData.studentDetails.allergies,
            chronicConditions: formData.studentDetails.chronicConditions || [],
            medications: formData.studentDetails.medications || [],
            emergencyMedicalContact: {
              doctorName: formData.studentDetails.doctorName || '',
              hospitalName: formData.studentDetails.hospitalName || '',
              phone: formData.studentDetails.doctorPhone || ''
            },
            lastMedicalCheckup: formData.studentDetails.lastMedicalCheckup ? new Date(formData.studentDetails.lastMedicalCheckup) : undefined
          } : undefined
        };
      } else if (formData.role === 'teacher') {
        userData.teacherDetails = {
          employeeId: formData.teacherDetails?.employeeId || formData.employeeId || '',
          joiningDate: formData.teacherDetails?.joiningDate ? new Date(formData.teacherDetails.joiningDate) : undefined,

          qualification: {
            highest: formData.teacherDetails?.highestQualification || formData.qualification || '',
            specialization: formData.teacherDetails?.specialization || '',
            university: formData.teacherDetails?.university || '',
            year: formData.teacherDetails?.graduationYear || 0
          },

          experience: {
            total: formData.teacherDetails?.totalExperience || Number(formData.experience) || 0,
            atCurrentSchool: formData.teacherDetails?.experienceAtCurrentSchool || 0,
            previousSchools: formData.teacherDetails?.previousSchools || []
          },

          subjects: formData.teacherDetails?.subjects?.map(subject => ({
            subjectCode: subject,
            subjectName: subject,
            classes: [],
            isPrimary: formData.teacherDetails?.primarySubjects?.includes(subject) || false
          })) || (typeof formData.subjects === 'string' ? formData.subjects.split(',').map(s => ({
            subjectCode: s.trim(),
            subjectName: s.trim(),
            classes: [],
            isPrimary: true
          })) : []),

          classTeacherOf: formData.teacherDetails?.classTeacherOf || '',
          responsibilities: formData.teacherDetails?.responsibilities || [],

          workSchedule: {
            workingDays: formData.teacherDetails?.workingDays || [],
            workingHours: {
              start: formData.teacherDetails?.workingHoursStart || '',
              end: formData.teacherDetails?.workingHoursEnd || ''
            },
            maxPeriodsPerDay: formData.teacherDetails?.maxPeriodsPerDay || 0,
            maxPeriodsPerWeek: formData.teacherDetails?.maxPeriodsPerWeek || 0
          },

          salary: formData.teacherDetails?.basicSalary ? {
            basic: formData.teacherDetails.basicSalary,
            allowances: formData.teacherDetails.allowances || [],
            currency: 'INR'
          } : undefined,

          bankDetails: formData.teacherDetails?.bankAccountNumber ? {
            accountNumber: formData.teacherDetails.bankAccountNumber,
            ifscCode: formData.teacherDetails.bankIFSC || '',
            bankName: formData.teacherDetails.bankName || '',
            branchName: formData.teacherDetails.bankBranchName || ''
          } : undefined
        };
      } else if (formData.role === 'admin') {
        userData.adminDetails = {
          adminType: formData.adminDetails?.adminType || formData.adminLevel || '',
          employeeId: formData.adminDetails?.employeeId || formData.employeeId || '',
          joiningDate: formData.adminDetails?.joiningDate ? new Date(formData.adminDetails.joiningDate) : undefined,
          designation: formData.adminDetails?.designation || '',
          department: formData.adminDetails?.department || formData.department || '',

          permissions: {
            userManagement: formData.adminDetails?.userManagement || false,
            academicManagement: formData.adminDetails?.academicManagement || false,
            feeManagement: formData.adminDetails?.feeManagement || false,
            reportGeneration: formData.adminDetails?.reportGeneration || false,
            systemSettings: formData.adminDetails?.systemSettings || false,
            schoolSettings: formData.adminDetails?.schoolSettings || false,
            dataExport: formData.adminDetails?.dataExport || false,
            auditLogs: formData.adminDetails?.auditLogs || false
          },

          workSchedule: {
            workingDays: formData.adminDetails?.workingDays || [],
            workingHours: {
              start: formData.adminDetails?.workingHoursStart || '',
              end: formData.adminDetails?.workingHoursEnd || ''
            }
          },

          salary: formData.adminDetails?.basicSalary ? {
            basic: formData.adminDetails.basicSalary,
            allowances: formData.adminDetails.allowances || [],
            currency: 'INR'
          } : undefined,

          bankDetails: formData.adminDetails?.bankAccountNumber ? {
            accountNumber: formData.adminDetails.bankAccountNumber,
            ifscCode: formData.adminDetails.bankIFSC || '',
            bankName: formData.adminDetails.bankName || '',
            branchName: formData.adminDetails.bankBranchName || '',
            accountHolderName: formData.adminDetails.bankAccountHolderName || ''
          } : undefined
        };
      }

      console.log('Creating user with comprehensive data:', userData);

      // Final check: ensure we have a generated userId (if not, fetch one now)
      if (!formData.userId) {
        try {
          await fetchNextUserId(formData.role);
          userData.userId = nextUserId || formData.userId;
        } catch (err) {
          console.warn('Could not fetch next user ID before create, proceeding with backend generation');
        }
      } else {
        userData.userId = formData.userId;
      }

      // Call API and capture server-assigned user info
      const createRes: any = await schoolUserAPI.addUser(schoolCode, userData, token);

      // Show credentials modal using server response
      const serverUserId = createRes?.data?.user?.userId || createRes?.data?.credentials?.userId || createRes?.user?.userId || createRes?.userId;

      // ==================================================================
      // START: EDITED LINE
      // ==================================================================
      // Use the password we generated locally as the primary source,
      // as the API response might not return it for security.
      const serverPassword = generatedPassword ||
        createRes?.data?.credentials?.password ||
        createRes?.data?.user?.tempPassword ||
        createRes?.user?.tempPassword;
      // ==================================================================
      // END: EDITED LINE
      // ==================================================================

      const serverEmail = createRes?.data?.user?.email || createRes?.user?.email || formData.email;
      const serverRole = createRes?.data?.user?.role || createRes?.user?.role || formData.role;

      if (!serverUserId || !serverPassword) {
        console.error('Server response:', createRes);
        throw new Error('Server did not return required user credentials');
      }

      setShowCredentials({
        userId: serverUserId,
        password: serverPassword,
        email: serverEmail,
        role: serverRole
      });

      toast.success('User created successfully with comprehensive details');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create user');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleEditClick = (user: User) => {
    console.log('=== EDITING USER ===');
    console.log('User:', user);
    // Set editingUser - the useEffect will handle populating formData
    setEditingUser(user);
    setShowEditModal(true);
  };

  // useEffect to populate formData when editingUser changes
  useEffect(() => {
    if (!editingUser) return;

    console.log('=== POPULATING FORM DATA FROM EDITING USER ===');
    console.log('Full editingUser:', JSON.stringify(editingUser, null, 2));
    const userData = editingUser as any;
    console.log('Name structure:', userData.name);
    console.log('userData.name?.firstName:', userData.name?.firstName);
    console.log('userData.name?.lastName:', userData.name?.lastName);
    console.log('userData.firstName:', userData.firstName);
    console.log('userData.lastName:', userData.lastName);
    console.log('Contact structure:', userData.contact);
    console.log('Address structure:', userData.address);
    console.log('StudentDetails:', userData.studentDetails);
    console.log('TeacherDetails:', userData.teacherDetails);
    console.log('AdminDetails:', userData.adminDetails);

    // Parse name if it's a string
    let parsedFirstName = '';
    let parsedLastName = '';
    if (typeof userData.name === 'string' && userData.name) {
      const nameParts = userData.name.trim().split(' ');
      parsedFirstName = nameParts[0] || '';
      parsedLastName = nameParts.slice(1).join(' ') || '';
      console.log('Parsed firstName from string:', parsedFirstName);
      console.log('Parsed lastName from string:', parsedLastName);
    }

    const newFormData = {
      // Generated Information - show existing user ID
      userId: userData.userId || userData._id || '',
      generatedPassword: '', // Never show password

      // Basic Information (SATS Standard)
      enrollmentNo: userData.enrollmentNo || '',
      tcNo: userData.tcNo || '',
      role: userData.role || 'student',

      // Admission Details (SATS Standard)
      class: userData.academicInfo?.class || userData.studentDetails?.currentClass || userData.class || '',
      academicYear: userData.academicYear || userData.studentDetails?.academicYear || '2024-2025',
      section: userData.section || userData.studentDetails?.currentSection || '',
      mediumOfInstruction: userData.mediumOfInstruction || 'English',
      motherTongue: userData.motherTongue || userData.studentDetails?.motherTongue || '',
      motherTongueOther: userData.motherTongueOther || userData.studentDetails?.motherTongueOther || '',

      // Student Details (SATS Standard)
      name: userData.name?.displayName || 
            (userData.name?.firstName && userData.name?.lastName ? userData.name.firstName + ' ' + userData.name.lastName : '') ||
            (typeof userData.name === 'string' ? userData.name : '') ||
            (userData.firstName && userData.lastName ? userData.firstName + ' ' + userData.lastName : '') ||
            (userData.studentDetails?.firstName && userData.studentDetails?.lastName ? userData.studentDetails.firstName + ' ' + userData.studentDetails.lastName : '') ||
            '',
      studentNameKannada: userData.studentNameKannada || userData.studentDetails?.studentNameKannada || '',
      firstName: userData.name?.firstName || parsedFirstName || userData.firstName || userData.studentDetails?.firstName || '',
      middleName: userData.name?.middleName || userData.middleName || userData.studentDetails?.middleName || '',
      lastName: userData.name?.lastName || parsedLastName || userData.lastName || userData.studentDetails?.lastName || '',
      dateOfBirth: userData.dateOfBirth || userData.studentDetails?.dateOfBirth || '',
      ageYears: userData.ageYears || userData.studentDetails?.ageYears || 0,
      ageMonths: userData.ageMonths || userData.studentDetails?.ageMonths || 0,
      gender: userData.gender || userData.studentDetails?.gender || 'male',

      // Family Details (SATS Standard) - stored directly in students collection
      fatherName: userData.studentDetails?.fatherName || userData.fatherName || '',
      fatherNameKannada: userData.studentDetails?.fatherNameKannada || userData.fatherNameKannada || '',
      fatherAadhaar: userData.studentDetails?.fatherAadhaar || userData.fatherAadhaar || '',
      motherName: userData.studentDetails?.motherName || userData.motherName || '',
      motherNameKannada: userData.studentDetails?.motherNameKannada || userData.motherNameKannada || '',
      motherAadhaar: userData.studentDetails?.motherAadhaar || userData.motherAadhaar || '',
      guardianName: userData.studentDetails?.guardianName || userData.guardianName || '',

      // Identity Documents (SATS Standard)
      studentAadhaar: userData.identity?.aadharNumber || userData.studentDetails?.studentAadhaar || userData.studentAadhaar || userData.aadhaarNumber || '',
      studentCasteCertNo: userData.studentDetails?.studentCasteCertNo || userData.studentCasteCertNo || '',
      fatherCasteCertNo: userData.studentDetails?.fatherCasteCertNo || userData.fatherCasteCertNo || '',
      motherCasteCertNo: userData.studentDetails?.motherCasteCertNo || userData.motherCasteCertNo || '',

      // Caste and Category (SATS Standard)
      studentCaste: userData.studentDetails?.caste || userData.studentCaste || userData.caste || '',
      studentCasteOther: userData.studentDetails?.studentCasteOther || userData.studentCasteOther || '',
      fatherCaste: userData.studentDetails?.fatherCaste || userData.fatherCaste || '',
      fatherCasteOther: userData.studentDetails?.fatherCasteOther || userData.fatherCasteOther || '',
      motherCaste: userData.studentDetails?.motherCaste || userData.motherCaste || '',
      motherCasteOther: userData.studentDetails?.motherCasteOther || userData.motherCasteOther || '',
      socialCategory: userData.studentDetails?.category || userData.socialCategory || userData.category || '',
      socialCategoryOther: userData.studentDetails?.socialCategoryOther || userData.socialCategoryOther || '',
      religion: userData.studentDetails?.religion || userData.religion || '',
      religionOther: userData.studentDetails?.religionOther || userData.religionOther || '',

      // Economic Status (SATS Standard)
      belongingToBPL: userData.belongingToBPL || userData.studentDetails?.belongingToBPL || 'No',
      bplCardNo: userData.bplCardNo || userData.studentDetails?.bplCardNo || userData.bplCardNumber || '',
      bhagyalakshmiBondNo: userData.bhagyalakshmiBondNo || userData.studentDetails?.bhagyalakshmiBondNo || '',

      // Special Needs (SATS Standard)
      disability: userData.disability || userData.studentDetails?.disability || userData.specialNeeds || 'Not Applicable',
      disabilityOther: userData.disabilityOther || userData.studentDetails?.disabilityOther || '',
      isRTECandidate: userData.isRTECandidate || userData.studentDetails?.isRTECandidate || 'No',

      // Address Information (SATS Standard)
      address: userData.address?.permanent?.street || userData.address || '',
      cityVillageTown: userData.cityVillageTown || userData.city || userData.address?.permanent?.city || '',
      locality: userData.locality || '',
      taluka: userData.taluka || userData.taluk || '',
      district: userData.district || userData.address?.permanent?.district || '',
      pinCode: userData.pinCode || userData.address?.permanent?.pincode || '',
      state: userData.state || userData.address?.permanent?.state || '',
      stateId: userData.stateId || userData.address?.permanent?.stateId || '',
      districtId: userData.districtId || userData.address?.permanent?.districtId || '',
      talukaId: userData.talukaId || userData.address?.permanent?.talukaId || '',
      districtText: userData.districtText || userData.district || '',
      talukaText: userData.talukaText || userData.taluka || '',

      // Enhanced Address Fields
      permanentStreet: userData.address?.permanent?.street || '',
      permanentArea: userData.address?.permanent?.area || '',
      permanentCity: userData.address?.permanent?.city || userData.city || '',
      permanentState: userData.address?.permanent?.state || userData.state || 'Karnataka',
      permanentCountry: userData.address?.permanent?.country || 'India',
      permanentPincode: userData.address?.permanent?.pincode || userData.pinCode || '',
      permanentLandmark: userData.address?.permanent?.landmark || '',

      currentStreet: userData.address?.current?.street || '',
      currentArea: userData.address?.current?.area || '',
      currentCity: userData.address?.current?.city || '',
      currentState: userData.address?.current?.state || 'Karnataka',
      currentCountry: userData.address?.current?.country || 'India',
      currentPincode: userData.address?.current?.pincode || '',
      currentLandmark: userData.address?.current?.landmark || '',
      sameAsPermanent: userData.address?.sameAsPermanent !== undefined ? userData.address.sameAsPermanent : true,

      // Communication Details (SATS Standard)
      studentMobile: userData.contact?.primaryPhone || userData.studentMobile || userData.phone || '',
      studentEmail: userData.email || userData.studentEmail || '',
      fatherMobile: userData.studentDetails?.fatherPhone || userData.fatherMobile || userData.fatherPhone || '',
      fatherEmail: userData.studentDetails?.fatherEmail || userData.fatherEmail || '',
      motherMobile: userData.studentDetails?.motherPhone || userData.motherMobile || userData.motherPhone || '',
      motherEmail: userData.studentDetails?.motherEmail || userData.motherEmail || '',

      // School and Banking (SATS Standard)
      schoolAdmissionDate: userData.studentDetails?.admissionDate ? new Date(userData.studentDetails.admissionDate).toISOString().split('T')[0] : 
                           (userData.schoolAdmissionDate || userData.admissionDate || ''),
      bankName: userData.studentDetails?.bankName || userData.bankName || '',
      bankAccountNo: userData.studentDetails?.bankAccountNo || userData.bankAccountNo || userData.bankAccountNumber || '',
      bankIFSC: userData.studentDetails?.bankIFSC || userData.bankIFSC || userData.ifscCode || '',

      // Legacy Compatibility Fields
      email: userData.email || '',
      phone: userData.contact?.primaryPhone || userData.phone || '',
      primaryPhone: userData.contact?.primaryPhone || userData.phone || '',
      secondaryPhone: userData.contact?.secondaryPhone || '',
      whatsappNumber: userData.contact?.whatsappNumber || '',
      city: userData.address?.permanent?.city || '',
      nationality: userData.nationality || userData.studentDetails?.nationality || 'Indian',
      bloodGroup: userData.bloodGroup || userData.studentDetails?.bloodGroup || '',

      // Family Information (Legacy)
      fatherPhone: userData.fatherPhone || userData.studentDetails?.fatherPhone || '',
      fatherOccupation: userData.fatherOccupation || userData.studentDetails?.fatherOccupation || '',
      motherPhone: userData.motherPhone || userData.studentDetails?.motherPhone || '',
      motherOccupation: userData.motherOccupation || userData.studentDetails?.motherOccupation || '',
      guardianRelation: userData.guardianRelation || userData.studentDetails?.guardianRelationship || '',
      fatherEducation: userData.fatherEducation || userData.studentDetails?.fatherQualification || '',
      motherEducation: userData.motherEducation || userData.studentDetails?.motherQualification || '',
      familyIncome: userData.familyIncome || '',

      // Emergency Contact
      emergencyContactName: userData.emergencyContactName || '',
      emergencyContactPhone: userData.contact?.emergencyContact || '',
      emergencyContactRelation: userData.emergencyContactRelation || '',
      alternatePhone: userData.contact?.secondaryPhone || '',
      parentEmail: userData.parentEmail || '',

      // Academic Information (Legacy)
      rollNumber: userData.academicInfo?.rollNumber || userData.rollNumber || userData.studentDetails?.rollNumber || '',
      admissionNumber: userData.academicInfo?.admissionNumber || userData.admissionNumber || userData.studentDetails?.admissionNumber || '',
      admissionDate: userData.academicInfo?.admissionDate ?
        new Date(userData.academicInfo.admissionDate).toISOString().split('T')[0] :
        (userData.admissionDate || userData.studentDetails?.admissionDate || ''),
      previousSchool: userData.previousSchool || userData.studentDetails?.previousSchoolName || '',
      previousClass: userData.previousClass || userData.studentDetails?.lastClass || '',
      tcNumber: userData.tcNumber || userData.studentDetails?.tcNumber || '',
      migrationCertificate: userData.migrationCertificate || '',

      // Legacy Identity Documents
      aadhaarNumber: userData.identity?.aadharNumber || userData.aadhaarNumber || '',
      panNumber: userData.identity?.panNumber || userData.panNumber || '',
      drivingLicenseNumber: userData.drivingLicenseNumber || '',
      birthCertificateNumber: userData.birthCertificateNumber || '',
      rationCardNumber: userData.rationCardNumber || '',
      voterIdNumber: userData.voterIdNumber || '',
      passportNumber: userData.passportNumber || '',

      // Legacy Caste and Category
      caste: userData.studentDetails?.caste || userData.caste || '',
      casteOther: userData.casteOther || '',
      category: userData.studentDetails?.category || userData.category || '',
      categoryOther: userData.categoryOther || '',
      subCaste: userData.subCaste || '',

      // Economic Status (Legacy)
      economicStatus: userData.economicStatus || '',
      bplCardNumber: userData.bplCardNumber || '',
      scholarshipDetails: userData.scholarshipDetails || '',

      // Special Needs (Legacy)
      specialNeeds: userData.studentDetails?.specialNeeds || userData.specialNeeds || '',
      disabilityType: userData.disabilityType || '',
      disabilityCertificate: userData.disabilityCertificate || '',
      medicalConditions: userData.studentDetails?.medicalConditions || userData.medicalConditions || '',
      allergies: userData.studentDetails?.allergies || userData.allergies || '',

      // Address Information (Additional)
      permanentAddress: userData.address?.permanent?.street || '',
      currentAddress: userData.address?.current?.street || '',
      village: userData.village || '',

      // Banking Information (Legacy)
      bankAccountNumber: userData.bankAccountNumber || '',
      ifscCode: userData.ifscCode || '',
      accountHolderName: userData.accountHolderName || '',

      // Teacher Information
      subjects: Array.isArray(userData.teacherDetails?.subjects) ?
        userData.teacherDetails.subjects.map((s: any) => s.subjectName || s).join(', ') :
        userData.teacherDetails?.subjects || userData.subjects || '',
      qualification: userData.teacherDetails?.qualification?.highest || userData.qualification || '',
      experience: userData.teacherDetails?.experience?.total || userData.experience || 0,
      employeeId: userData.teacherDetails?.employeeId || userData.employeeId || '',
      department: userData.department || userData.teacherDetails?.department || '',
      joiningDate: userData.joiningDate || userData.teacherDetails?.joiningDate || '',

      // Admin Information
      adminLevel: userData.adminLevel || userData.adminDetails?.adminType || '',
      accessLevel: userData.accessLevel || '',

      // Student Details Object
      studentDetails: userData.studentDetails || {},
      // Teacher Details Object
      teacherDetails: userData.teacherDetails || {},
      // Admin Details Object
      adminDetails: userData.adminDetails || {}
    };

    console.log('=== FORM DATA POPULATED ===');
    console.log('Basic Info:');
    console.log('  firstName:', newFormData.firstName);
    console.log('  middleName:', newFormData.middleName);
    console.log('  lastName:', newFormData.lastName);
    console.log('  email:', newFormData.email);
    console.log('  phone:', newFormData.phone);
    console.log('  dateOfBirth:', newFormData.dateOfBirth);
    console.log('  gender:', newFormData.gender);
    console.log('Contact Info:');
    console.log('  primaryPhone:', newFormData.primaryPhone);
    console.log('  secondaryPhone:', newFormData.secondaryPhone);
    console.log('  whatsappNumber:', newFormData.whatsappNumber);
    console.log('Address Info:');
    console.log('  permanentStreet:', newFormData.permanentStreet);
    console.log('  permanentCity:', newFormData.permanentCity);
    console.log('  permanentState:', newFormData.permanentState);
    console.log('  permanentPincode:', newFormData.permanentPincode);
    console.log('Location Info:');
    console.log('  stateId:', newFormData.stateId);
    console.log('  districtId:', newFormData.districtId);
    console.log('  talukaId:', newFormData.talukaId);
    console.log('  districtText:', newFormData.districtText);
    console.log('  talukaText:', newFormData.talukaText);
    console.log('Academic Info:');
    console.log('  class:', newFormData.class);
    console.log('  section:', newFormData.section);
    console.log('  rollNumber:', newFormData.rollNumber);
    console.log('  admissionNumber:', newFormData.admissionNumber);
    console.log('Total fields populated:', Object.keys(newFormData).length);

    setFormData(newFormData as any);
  }, [editingUser]);

  // OLD handleEditClick logic - now handled by useEffect
  const OLD_handleEditClick_UNUSED = (user: User) => {
    const userData = user as any;
    const newFormData = {
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
      motherTongueOther: userData.motherTongueOther || '',

      // Student Details (SATS Standard)
      name: userData.name?.displayName || userData.name?.firstName + ' ' + userData.name?.lastName || userData.name || '',
      studentNameKannada: userData.studentNameKannada || '',
      firstName: userData.name?.firstName || '',
      lastName: userData.name?.lastName || '',
      dateOfBirth: userData.dateOfBirth || '',
      ageYears: userData.ageYears || 0,
      ageMonths: userData.ageMonths || 0,
      gender: userData.gender || 'male',

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
      studentCasteOther: userData.studentCasteOther || '',
      fatherCaste: userData.fatherCaste || '',
      fatherCasteOther: userData.fatherCasteOther || '',
      motherCaste: userData.motherCaste || '',
      motherCasteOther: userData.motherCasteOther || '',
      socialCategory: userData.socialCategory || userData.category || '',
      socialCategoryOther: userData.socialCategoryOther || '',
      religion: userData.religion || '',
      religionOther: userData.religionOther || '',

      // Economic Status (SATS Standard)
      belongingToBPL: userData.belongingToBPL || 'No',
      bplCardNo: userData.bplCardNo || userData.bplCardNumber || '',
      bhagyalakshmiBondNo: userData.bhagyalakshmiBondNo || '',

      // Special Needs (SATS Standard)
      disability: userData.disability || userData.specialNeeds || 'Not Applicable',
      disabilityOther: userData.disabilityOther || '',
      isRTECandidate: userData.isRTECandidate || 'No',

      // Address Information (SATS Standard)
      address: userData.address?.permanent?.street || userData.address || '',
      cityVillageTown: userData.cityVillageTown || userData.city || userData.address?.permanent?.city || '',
      locality: userData.locality || '',
      taluka: userData.taluka || userData.taluk || '',
      district: userData.district || userData.address?.permanent?.district || '',
      pinCode: userData.pinCode || userData.address?.permanent?.pincode || '',
      state: userData.state || userData.address?.permanent?.state || '',
      stateId: userData.stateId || userData.address?.permanent?.stateId || '',
      districtId: userData.districtId || userData.address?.permanent?.districtId || '',
      talukaId: userData.talukaId || userData.address?.permanent?.talukaId || '',
      districtText: userData.districtText || userData.district || '',
      talukaText: userData.talukaText || userData.taluka || '',

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
      city: userData.address?.permanent?.city || '',
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
      casteOther: userData.casteOther || '',
      category: userData.category || '',
      categoryOther: userData.categoryOther || '',
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
      subjects: Array.isArray(userData.teacherDetails?.subjects) ?
        userData.teacherDetails.subjects.join(', ') :
        userData.teacherDetails?.subjects || userData.subjects || '',
      qualification: userData.teacherDetails?.qualification || userData.qualification || '',
      experience: userData.teacherDetails?.experience || userData.experience || 0,
      employeeId: userData.teacherDetails?.employeeId || userData.employeeId || '',
      department: userData.department || '',
      joiningDate: userData.joiningDate || '',

      // Admin Information
      adminLevel: userData.adminLevel || '',
      accessLevel: userData.accessLevel || '',

      // Student Details Object
      studentDetails: {
        currentClass: userData.studentDetails?.currentClass || userData.class || '',
        currentSection: userData.studentDetails?.currentSection || userData.section || '',
        academicYear: userData.studentDetails?.academicYear || userData.academicYear || '2024-25',
        admissionDate: userData.studentDetails?.admissionDate || userData.admissionDate || '',
        admissionClass: userData.studentDetails?.admissionClass || '',
        rollNumber: userData.studentDetails?.rollNumber || userData.rollNumber || '',
        admissionNumber: userData.studentDetails?.admissionNumber || userData.admissionNumber || '',
        enrollmentNo: userData.studentDetails?.enrollmentNo || userData.enrollmentNo || '',
        tcNo: userData.studentDetails?.tcNo || userData.tcNo || '',
        previousSchoolName: userData.studentDetails?.previousSchoolName || userData.previousSchool || '',
        previousBoard: userData.studentDetails?.previousBoard || '',
        lastClass: userData.studentDetails?.lastClass || userData.previousClass || '',
        tcNumber: userData.studentDetails?.tcNumber || userData.tcNumber || '',
        tcDate: userData.studentDetails?.tcDate || '',
        reasonForTransfer: userData.studentDetails?.reasonForTransfer || '',
        dateOfBirth: userData.studentDetails?.dateOfBirth || userData.dateOfBirth || '',
        placeOfBirth: userData.studentDetails?.placeOfBirth || '',
        gender: userData.studentDetails?.gender || userData.gender || 'male',
        bloodGroup: userData.studentDetails?.bloodGroup || userData.bloodGroup || '',
        nationality: userData.studentDetails?.nationality || userData.nationality || 'Indian',
        religion: userData.studentDetails?.religion || userData.religion || '',
        religionOther: userData.studentDetails?.religionOther || userData.religionOther || '',
        caste: userData.studentDetails?.caste || userData.caste || '',
        casteOther: userData.studentDetails?.casteOther || userData.casteOther || '',
        category: userData.studentDetails?.category || userData.category || '',
        categoryOther: userData.studentDetails?.categoryOther || userData.categoryOther || '',
        motherTongue: userData.studentDetails?.motherTongue || userData.motherTongue || '',
        motherTongueOther: userData.studentDetails?.motherTongueOther || userData.motherTongueOther || '',
        studentNameKannada: userData.studentDetails?.studentNameKannada || userData.studentNameKannada || '',
        ageYears: userData.studentDetails?.ageYears || userData.ageYears || 0,
        ageMonths: userData.studentDetails?.ageMonths || userData.ageMonths || 0,
        socialCategory: userData.studentDetails?.socialCategory || userData.socialCategory || '',
        socialCategoryOther: userData.studentDetails?.socialCategoryOther || userData.socialCategoryOther || '',
        studentCaste: userData.studentDetails?.studentCaste || userData.studentCaste || '',
        studentCasteOther: userData.studentDetails?.studentCasteOther || userData.studentCasteOther || '',
        studentAadhaar: userData.studentDetails?.studentAadhaar || userData.studentAadhaar || '',
        studentCasteCertNo: userData.studentDetails?.studentCasteCertNo || userData.studentCasteCertNo || '',
        belongingToBPL: userData.studentDetails?.belongingToBPL || userData.belongingToBPL || 'No',
        bplCardNo: userData.studentDetails?.bplCardNo || userData.bplCardNo || '',
        bhagyalakshmiBondNo: userData.studentDetails?.bhagyalakshmiBondNo || userData.bhagyalakshmiBondNo || '',
        disability: userData.studentDetails?.disability || userData.disability || 'Not Applicable',
        disabilityOther: userData.studentDetails?.disabilityOther || userData.disabilityOther || '',
        isRTECandidate: userData.studentDetails?.isRTECandidate || userData.isRTECandidate || 'No',
        fatherName: userData.studentDetails?.fatherName || userData.fatherName || '',
        fatherNameKannada: userData.studentDetails?.fatherNameKannada || userData.fatherNameKannada || '',
        fatherOccupation: userData.studentDetails?.fatherOccupation || userData.fatherOccupation || '',
        fatherQualification: userData.studentDetails?.fatherQualification || userData.fatherEducation || '',
        fatherPhone: userData.studentDetails?.fatherPhone || userData.fatherPhone || '',
        fatherEmail: userData.studentDetails?.fatherEmail || userData.fatherEmail || '',
        fatherAadhaar: userData.studentDetails?.fatherAadhaar || userData.fatherAadhaar || '',
        fatherCaste: userData.studentDetails?.fatherCaste || userData.fatherCaste || '',
        fatherCasteOther: userData.studentDetails?.fatherCasteOther || userData.fatherCasteOther || '',
        fatherCasteCertNo: userData.studentDetails?.fatherCasteCertNo || userData.fatherCasteCertNo || '',
        fatherWorkAddress: userData.studentDetails?.fatherWorkAddress || '',
        fatherAnnualIncome: userData.studentDetails?.fatherAnnualIncome || 0,
        motherName: userData.studentDetails?.motherName || userData.motherName || '',
        motherNameKannada: userData.studentDetails?.motherNameKannada || userData.motherNameKannada || '',
        motherOccupation: userData.studentDetails?.motherOccupation || userData.motherOccupation || '',
        motherQualification: userData.studentDetails?.motherQualification || userData.motherEducation || '',
        motherPhone: userData.studentDetails?.motherPhone || userData.motherPhone || '',
        motherEmail: userData.studentDetails?.motherEmail || userData.motherEmail || '',
        motherAadhaar: userData.studentDetails?.motherAadhaar || userData.motherAadhaar || '',
        motherCaste: userData.studentDetails?.motherCaste || userData.motherCaste || '',
        motherCasteOther: userData.studentDetails?.motherCasteOther || userData.motherCasteOther || '',
        motherCasteCertNo: userData.studentDetails?.motherCasteCertNo || userData.motherCasteCertNo || '',
        motherWorkAddress: userData.studentDetails?.motherWorkAddress || '',
        motherAnnualIncome: userData.studentDetails?.motherAnnualIncome || 0,
        guardianName: userData.studentDetails?.guardianName || userData.guardianName || '',
        guardianRelationship: userData.studentDetails?.guardianRelationship || userData.guardianRelation || '',
        guardianPhone: userData.studentDetails?.guardianPhone || '',
        guardianEmail: userData.studentDetails?.guardianEmail || '',
        guardianAddress: userData.studentDetails?.guardianAddress || '',
        isEmergencyContact: userData.studentDetails?.isEmergencyContact || false,
        transportMode: userData.studentDetails?.transportMode || '',
        busRoute: userData.studentDetails?.busRoute || '',
        pickupPoint: userData.studentDetails?.pickupPoint || '',
        dropPoint: userData.studentDetails?.dropPoint || '',
        pickupTime: userData.studentDetails?.pickupTime || '',
        dropTime: userData.studentDetails?.dropTime || '',
        feeCategory: userData.studentDetails?.feeCategory || '',
        concessionType: userData.studentDetails?.concessionType || '',
        concessionPercentage: userData.studentDetails?.concessionPercentage || 0,
        scholarshipName: userData.studentDetails?.scholarshipName || '',
        scholarshipAmount: userData.studentDetails?.scholarshipAmount || 0,
        scholarshipProvider: userData.studentDetails?.scholarshipProvider || '',
        bankName: userData.studentDetails?.bankName || userData.bankName || '',
        bankAccountNo: userData.studentDetails?.bankAccountNo || userData.bankAccountNo || '',
        bankIFSC: userData.studentDetails?.bankIFSC || userData.bankIFSC || '',
        bankAccountHolderName: userData.studentDetails?.bankAccountHolderName || userData.accountHolderName || '',
        allergies: userData.studentDetails?.allergies || [],
        chronicConditions: userData.studentDetails?.chronicConditions || [],
        medications: userData.studentDetails?.medications || [],
        doctorName: userData.studentDetails?.doctorName || '',
        hospitalName: userData.studentDetails?.hospitalName || '',
        doctorPhone: userData.studentDetails?.doctorPhone || '',
        lastMedicalCheckup: userData.studentDetails?.lastMedicalCheckup || '',
      },

      // Teacher Details Object
      teacherDetails: {
        employeeId: userData.teacherDetails?.employeeId || userData.employeeId || '',
        joiningDate: userData.teacherDetails?.joiningDate || userData.joiningDate || '',
        highestQualification: userData.teacherDetails?.highestQualification || userData.qualification || '',
        specialization: userData.teacherDetails?.specialization || '',
        university: userData.teacherDetails?.university || '',
        graduationYear: userData.teacherDetails?.graduationYear || 0,
        totalExperience: userData.teacherDetails?.totalExperience || userData.experience || 0,
        experienceAtCurrentSchool: userData.teacherDetails?.experienceAtCurrentSchool || 0,
        previousSchools: userData.teacherDetails?.previousSchools || [],
        subjects: userData.teacherDetails?.subjects || [],
        primarySubjects: userData.teacherDetails?.primarySubjects || [],
        classTeacherOf: userData.teacherDetails?.classTeacherOf || '',
        responsibilities: userData.teacherDetails?.responsibilities || [],
        department: userData.teacherDetails?.department || userData.department || '',
        workingDays: userData.teacherDetails?.workingDays || [],
        workingHoursStart: userData.teacherDetails?.workingHoursStart || '',
        workingHoursEnd: userData.teacherDetails?.workingHoursEnd || '',
        maxPeriodsPerDay: userData.teacherDetails?.maxPeriodsPerDay || 0,
        maxPeriodsPerWeek: userData.teacherDetails?.maxPeriodsPerWeek || 0,
        basicSalary: userData.teacherDetails?.basicSalary || 0,
        allowances: userData.teacherDetails?.allowances || [],
        bankAccountNumber: userData.teacherDetails?.bankAccountNumber || '',
        bankIFSC: userData.teacherDetails?.bankIFSC || '',
        bankName: userData.teacherDetails?.bankName || '',
        bankBranchName: userData.teacherDetails?.bankBranchName || '',
      },

      // Admin Details Object
      adminDetails: {
        adminType: userData.adminDetails?.adminType || '',
        employeeId: userData.adminDetails?.employeeId || userData.employeeId || '',
        joiningDate: userData.adminDetails?.joiningDate || userData.joiningDate || '',
        designation: userData.adminDetails?.designation || '',
        department: userData.adminDetails?.department || userData.department || '',
        userManagement: userData.adminDetails?.userManagement || false,
        academicManagement: userData.adminDetails?.academicManagement || false,
        feeManagement: userData.adminDetails?.feeManagement || false,
        reportGeneration: userData.adminDetails?.reportGeneration || false,
        systemSettings: userData.adminDetails?.systemSettings || false,
        schoolSettings: userData.adminDetails?.schoolSettings || false,
        dataExport: userData.adminDetails?.dataExport || false,
        auditLogs: userData.adminDetails?.auditLogs || false,
        workingDays: userData.adminDetails?.workingDays || [],
        workingHoursStart: userData.adminDetails?.workingHoursStart || '',
        workingHoursEnd: userData.adminDetails?.workingHoursEnd || '',
        basicSalary: userData.adminDetails?.basicSalary || 0,
        allowances: userData.adminDetails?.allowances || [],
        bankAccountNumber: userData.adminDetails?.bankAccountNumber || '',
        bankIFSC: userData.adminDetails?.bankIFSC || '',
        bankName: userData.adminDetails?.bankName || '',
        bankBranchName: userData.adminDetails?.bankBranchName || '',
      }
    };

    console.log('=== FORM DATA BEING SET ===');
    console.log('firstName:', newFormData.firstName);
    console.log('lastName:', newFormData.lastName);
    console.log('email:', newFormData.email);
    console.log('phone:', newFormData.phone);
    console.log('dateOfBirth:', newFormData.dateOfBirth);
    console.log('stateId:', newFormData.stateId);
    console.log('districtId:', newFormData.districtId);
    console.log('Full newFormData keys:', Object.keys(newFormData));

    setFormData(newFormData);
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

      // Build comprehensive update data with ALL fields (flat structure for backend)
      const updateData: any = {
        // Basic name and contact
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: editingUser.role, // Keep the existing role, don't allow changing

        // Enhanced contact fields (flat)
        primaryPhone: formData.primaryPhone || formData.phone,
        secondaryPhone: formData.secondaryPhone,
        whatsappNumber: formData.whatsappNumber,
        emergencyContactPhone: formData.emergencyContactPhone,

        // Enhanced address fields (flat)
        permanentStreet: formData.permanentStreet,
        permanentArea: formData.permanentArea,
        permanentCity: formData.permanentCity,
        permanentState: formData.permanentState,
        permanentCountry: formData.permanentCountry,
        permanentPincode: formData.permanentPincode,
        permanentLandmark: formData.permanentLandmark,

        currentStreet: formData.currentStreet,
        currentArea: formData.currentArea,
        currentCity: formData.currentCity,
        currentState: formData.currentState,
        currentCountry: formData.currentCountry,
        currentPincode: formData.currentPincode,
        currentLandmark: formData.currentLandmark,
        sameAsPermanent: formData.sameAsPermanent,

        // Location fields
        stateId: formData.stateId,
        districtId: formData.districtId,
        talukaId: formData.talukaId,
        districtText: formData.districtText,
        talukaText: formData.talukaText,
        state: formData.state || formData.permanentState,
        district: formData.district,
        taluka: formData.taluka,
        city: formData.city || formData.permanentCity,
        pinCode: formData.pinCode || formData.permanentPincode
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

        // Admission Details
        updateData.motherTongue = formData.motherTongue;
        updateData.motherTongueOther = formData.motherTongueOther;

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

        // Karnataka SATS fields - Caste and Category
        updateData.studentCaste = formData.studentCaste;
        updateData.studentCasteOther = formData.studentCasteOther;
        updateData.fatherCaste = formData.fatherCaste;
        updateData.fatherCasteOther = formData.fatherCasteOther;
        updateData.motherCaste = formData.motherCaste;
        updateData.motherCasteOther = formData.motherCasteOther;
        updateData.socialCategory = formData.socialCategory;
        updateData.socialCategoryOther = formData.socialCategoryOther;
        updateData.religion = formData.religion;
        updateData.religionOther = formData.religionOther;

        // Special Needs
        updateData.disability = formData.disability;
        updateData.disabilityOther = formData.disabilityOther;
        updateData.isRTECandidate = formData.isRTECandidate;

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

        // Add complete studentDetails object
        if (formData.studentDetails) {
          updateData.studentDetails = formData.studentDetails;
        }
      } else if (editingUser.role === 'teacher') {
        updateData.qualification = formData.qualification;
        updateData.experience = formData.experience;
        updateData.subjects = formData.subjects;
        updateData.department = formData.department;
        updateData.employeeId = formData.employeeId;
        updateData.joiningDate = formData.joiningDate;

        // Add complete teacherDetails object
        if (formData.teacherDetails) {
          updateData.teacherDetails = formData.teacherDetails;
        }
      } else if (editingUser.role === 'admin') {
        updateData.adminLevel = formData.adminLevel;
        updateData.department = formData.department;
        updateData.employeeId = formData.employeeId;
        updateData.accessLevel = formData.accessLevel;

        // Add complete adminDetails object
        if (formData.adminDetails) {
          updateData.adminDetails = formData.adminDetails;
        }
      }

      // Address information (common for all roles)
      updateData.address = formData.address;
      updateData.city = formData.city;
      updateData.state = formData.state;
      updateData.pinCode = formData.pinCode;
      updateData.district = formData.district;

      console.log('Updating user with data:', updateData);

      // Make API call to update user - use FormData if profile image is present
      if (profileImageFile) {
        console.log('📸 Uploading with profile image...');
        const formDataToSend = new FormData();

        // Append all user data
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formDataToSend.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        });

        // Append profile image
        formDataToSend.append('profileImage', profileImageFile);

        console.log('Sending FormData with image...');

        // Make fetch call with FormData
        const response = await fetch(`http://localhost:5050/api/user-management/${schoolCode}/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataToSend
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user with image');
        }

        console.log('✅ User updated with image successfully');
      } else {
        // No image - use regular API call
        console.log('Updating without image...');
        await schoolUserAPI.updateUser(schoolCode, editingUser._id, updateData, token);
      }

      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      setProfileImageFile(null);
      setProfileImagePreview(null);
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

      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const schoolCode = user?.schoolCode || school?.code || 'SB';

      const response = await schoolUserAPI.resetPassword(schoolCode, userId, token);

      if (response.data) {
        setShowResetCredentials({
          userId: response.data.userId,
          password: response.data.password,
          email: response.data.email,
          role: response.data.role
        });

        toast.success('Password reset successfully');
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  // Handle opening change password modal
  const handleOpenChangePassword = (userId: string, name: string, email: string) => {
    console.log('Opening change password modal for:', { userId, name, email });
    setSelectedUserForPasswordChange({ userId, name, email });
    setNewPassword('');
    setConfirmNewPassword('');
    setShowChangePasswordModal(true);
  };

  // Handle changing password
  const handleChangePassword = async () => {
    if (!selectedUserForPasswordChange) {
      console.error('No user selected for password change');
      return;
    }

    console.log('Starting password change for:', selectedUserForPasswordChange.userId);

    // Validation
    if (!newPassword || !confirmNewPassword) {
      toast.error('Please enter both password fields');
      return;
    }

    if (newPassword.trim() === '') {
      toast.error('Password cannot be empty');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const schoolCode = user?.schoolCode || school?.code || 'SB';

      console.log('Calling changePassword API with:', { schoolCode, userId: selectedUserForPasswordChange.userId });

      // Call API to change password
      const response = await schoolUserAPI.changePassword(
        schoolCode,
        selectedUserForPasswordChange.userId,
        newPassword,
        token
      );

      console.log('Change password response:', response);

      if (response.data || response.success) {
        toast.success('Password changed successfully');
        setShowChangePasswordModal(false);
        setSelectedUserForPasswordChange(null);
        setNewPassword('');
        setConfirmNewPassword('');
        fetchUsers(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = user.role === activeTab;
    const matchesGrade = activeTab !== 'student' || selectedGrade === 'all' || user.studentDetails?.class === selectedGrade;
    const matchesSection = activeTab !== 'student' || selectedSection === 'all' || user.studentDetails?.section === selectedSection;
    return matchesSearch && matchesRole && matchesGrade && matchesSection;
  }).sort((a, b) => {
    // Sort students by rollNumber (Student ID)
    if (a.role === 'student' && b.role === 'student') {
      const rollA = a.studentDetails?.rollNumber || '';
      const rollB = b.studentDetails?.rollNumber || '';
      // Try numeric comparison first, fall back to string comparison
      const numA = parseInt(rollA);
      const numB = parseInt(rollB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return rollA.localeCompare(rollB);
    }

    // Sort teachers by employeeId (Employee ID)
    if (a.role === 'teacher' && b.role === 'teacher') {
      const empA = a.teacherDetails?.employeeId || '';
      const empB = b.teacherDetails?.employeeId || '';
      // Try numeric comparison first, fall back to string comparison
      const numA = parseInt(empA);
      const numB = parseInt(empB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return empA.localeCompare(empB);
    }

    // Sort admins by employeeId (Employee ID)
    if (a.role === 'admin' && b.role === 'admin') {
      const empA = a.adminDetails?.employeeId || '';
      const empB = b.adminDetails?.employeeId || '';
      // Try numeric comparison first, fall back to string comparison
      const numA = parseInt(empA);
      const numB = parseInt(empB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return empA.localeCompare(empB);
    }

    // Default: maintain existing order
    return 0;
  });

  // Simple form validity check for disabling submit button
  const isFormValid = () => {
    const errors = validateFormBeforeSubmit(formData);
    return errors.length === 0;
  };

  // Compute human-friendly missing fields list for tooltip
  const missingFieldsForTooltip = () => {
    const errors = validateFormBeforeSubmit(formData);
    if (errors.length === 0) return '';
    // Map validation messages to shorter labels where possible
    const mapLabel = (msg: string) => {
      if (msg.includes('First name')) return 'First name';
      if (msg.includes('Last name')) return 'Last name';
      if (msg.includes('email')) return 'Email';
      if (msg.includes('phone')) return 'Phone';
      if (msg.includes('Date of birth')) return 'Date of birth';
      if (msg.includes('Gender')) return 'Gender';
      if (msg.includes('Address')) return 'Address';
      if (msg.includes('Class selection')) return 'Class';
      if (msg.includes("Father's name")) return "Father's name";
      if (msg.includes("Mother's name")) return "Mother's name";
      return msg;
    };

    const labels = errors.map(mapLabel);
    return `Missing: ${Array.from(new Set(labels)).join(', ')}`;
  };

  // Arrow/Enter based navigation inside the Add User form
  const getFocusableElements = (container: HTMLElement) => {
    const selector = 'input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])';
    const nodeList = Array.from(container.querySelectorAll<HTMLElement>(selector));
    // Filter out elements that are not visible
    return nodeList.filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const key = e.key;
    if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(key)) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // If inside a textarea, don't intercept (allow newlines and arrow movement)
    if (target.tagName === 'TEXTAREA') return;

    // For input elements, respect caret position: only move next on Enter or ArrowDown when caret at end
    if (target.tagName === 'INPUT') {
      const input = target as HTMLInputElement;
      // If the input supports selectionStart, check caret pos
      if (typeof input.selectionStart === 'number') {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        // If there is a selection, don't move
        if (start !== end) return;

        if (key === 'ArrowDown' || key === 'Enter') {
          // only move when caret is at end
          if (start < (input.value?.length || 0)) return;
        }

        if (key === 'ArrowUp') {
          // only move up when caret at start
          if (start > 0) return;
        }
      }
    }

    // Find the form container
    let formEl: HTMLElement | null = target.closest('form');
    if (!formEl) return;

    const focusables = getFocusableElements(formEl);
    const currentIndex = focusables.indexOf(target as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (key === 'Enter' || key === 'ArrowDown') nextIndex = Math.min(focusables.length - 1, currentIndex + 1);
    if (key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);

    if (nextIndex !== currentIndex) {
      e.preventDefault();
      const nextEl = focusables[nextIndex];
      // Focus and if input/select, select the text for convenience
      nextEl.focus();
      try {
        if ((nextEl as HTMLInputElement).select) (nextEl as HTMLInputElement).select();
      } catch (err) {
        // ignore
      }
    }
  };

  const exportUsers = async () => {
    try {
      const schoolCode = user?.schoolCode || 'P';
      const response = await exportImportAPI.exportUsers(schoolCode, {
        role: activeTab,
        format: 'csv'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `${activeTab}_users_${currentDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${filteredUsers.length} ${activeTab} records exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users. Please try again.');
    }
  };

  // CSV Template Generation Functions
  const generateTemplate = async (role: 'student' | 'teacher' | 'admin') => {
    try {
      const schoolCode = user?.schoolCode || 'P';
      const response = await exportImportAPI.generateTemplate(schoolCode, role);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `${role}_import_template_${currentDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${role} template downloaded successfully!`);
    } catch (error: any) {
      console.error('Template generation error:', error);
      toast.error('API template failed. Using fallback template.');
      // Fallback to old template generation if API fails
      try {
        generateTemplateOld(role);
      } catch (fallbackError) {
        console.error('Fallback template error:', fallbackError);
        toast.error('Failed to generate template. Please try again.');
      }
    }
  };

  // Old template generation logic (keeping for reference but not used)
  // abhishek-khot/erp/ERP-0a05ff2086e334aa3f3522d1903654711a94ebb2/frontend/src/roles/admin/pages/ManageUsers.tsx

  // ... existing code ...

  // Old template generation logic (keeping for reference but not used)
  const generateTemplateOld = (role: 'student' | 'teacher' | 'admin') => {
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${role}_import_template_${currentDate}.csv`;

    let headers: string[] = [];
    let sampleRow: string[] = [];
    let csvRows: string[] = [];

    if (role === 'student') {
      // Comprehensive student export headers - matching template fields
      headers = [
        // Basic Information
        'User ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone',

        // Student Academic Details
        'Student ID', 'Admission Number', 'Roll Number', 'Class', 'Section', 'Academic Year', 'Admission Date', 'Admission Class',
        'Stream', 'Electives', 'Enrollment No', 'TC No',

        // Personal Information - Basic
        'Date of Birth', 'Place of Birth', 'Gender', 'Blood Group', 'Nationality', 'Religion', 'Religion Other',
        'Caste', 'Caste Other', 'Category', 'Category Other', 'Mother Tongue', 'Mother Tongue Other', 'Languages Known',

        // Karnataka SATS Specific Personal Fields
        'Student Name Kannada', 'Age Years', 'Age Months', 'Social Category', 'Social Category Other',
        'Student Caste', 'Student Caste Other', 'Student Aadhaar', 'Student Caste Certificate No',
        'Belonging to BPL', 'BPL Card No', 'Bhagyalakshmi Bond No',
        'Disability', 'Disability Other', 'Is RTE Candidate*',

        // Address Information - Current
        'Current Address Line 1', 'Current Address Line 2', 'Current City', 'Current District', 'Current State', 'Current Pin Code',
        'Current Taluka', 'Current Urban Rural',

        // Address Information - Permanent  
        'Permanent Address Line 1', 'Permanent Address Line 2', 'Permanent City', 'Permanent District', 'Permanent State', 'Permanent Pin Code',
        'Permanent Taluka', 'Permanent Urban Rural',

        // Father Information
        'Father Name', 'Father Name Kannada', 'Father Occupation', 'Father Qualification', 'Father Phone', 'Father Email',
        'Father Work Address', 'Father Annual Income', 'Father Aadhaar', 'Father Caste', 'Father Caste Other', 'Father Caste Certificate No',

        // Mother Information
        'Mother Name', 'Mother Name Kannada', 'Mother Occupation', 'Mother Qualification', 'Mother Phone', 'Mother Email',
        'Mother Work Address', 'Mother Annual Income', 'Mother Aadhaar', 'Mother Caste', 'Mother Caste Other', 'Mother Caste Certificate No',

        // Guardian Information
        'Guardian Name', 'Guardian Relationship', 'Guardian Phone', 'Guardian Email', 'Guardian Address', 'Guardian Is Emergency Contact',

        // Siblings Information (up to 3 siblings)
        'Sibling 1 Name', 'Sibling 1 Age', 'Sibling 1 Relationship', 'Sibling 1 School', 'Sibling 1 Class',
        'Sibling 2 Name', 'Sibling 2 Age', 'Sibling 2 Relationship', 'Sibling 2 School', 'Sibling 2 Class',
        'Sibling 3 Name', 'Sibling 3 Age', 'Sibling 3 Relationship', 'Sibling 3 School', 'Sibling 3 Class',

        // Medical Information
        'Allergies', 'Chronic Conditions', 'Medications', 'Emergency Doctor Name', 'Emergency Hospital Name', 'Emergency Hospital Phone',
        'Last Medical Checkup', 'Vaccination Status',

        // Transportation
        'Transport Mode', 'Bus Route', 'Pickup Point', 'Drop Point', 'Pickup Time', 'Drop Time',

        // Financial Information
        'Fee Category', 'Concession Type', 'Concession Percentage', 'Scholarship Name', 'Scholarship Amount', 'Scholarship Provider',

        // Banking Information
        'Bank Name', 'Account Number', 'IFSC Code', 'Account Holder Name',

        'Profile Image Path', // <--- ADDED THE NEW FIELD FOR STUDENT

        // Previous School Information
        'Previous School Name', 'Previous School Board', 'Previous School Last Class', 'Previous School TC Number', 'Previous School TC Date', 'Reason for Transfer',

        // Emergency Contacts (additional)
        'Emergency Contact 1 Name', 'Emergency Contact 1 Relationship', 'Emergency Contact 1 Phone', 'Emergency Contact 1 Address', 'Emergency Contact 1 Is Primary',
        'Emergency Contact 2 Name', 'Emergency Contact 2 Relationship', 'Emergency Contact 2 Phone', 'Emergency Contact 2 Address', 'Emergency Contact 2 Is Primary',

        // Academic History (current year)
        'Current Academic Year', 'Current Class Result', 'Current Percentage', 'Current Rank', 'Current Attendance',

        // System Information
        'Status', 'Created Date', 'Last Modified', 'Source', 'Import Batch', 'Tags', 'Notes'
      ];

      csvRows = filteredUsers.map(user => {
        const userData = user as any;
        const studentDetails = userData.studentDetails || {};
        const name = userData.name || {};
        const address = userData.address || {};
        const contact = userData.contact || {};
        const personal = studentDetails.personal || {};
        const academic = studentDetails.academic || {};
        const family = studentDetails.family || {};
        const father = family.father || {};
        const mother = family.mother || {};
        const guardian = family.guardian || {};
        const siblings = family.siblings || [];
        const medical = studentDetails.medical || {};
        const transport = studentDetails.transport || {};
        const financial = studentDetails.financial || {};
        const bankDetails = financial.bankDetails || {};
        const previousSchool = academic.previousSchool || {};
        const academicHistory = studentDetails.academicHistory || [];
        const currentAcademic = academicHistory[0] || {};
        const identity = userData.identity || {};
        const metadata = userData.metadata || {};
        const parentDetails = userData.parentDetails || {};

        return [
          // Basic Information
          userData.userId || user._id || '',
          name.firstName || '',
          name.middleName || '',
          name.lastName || '',
          user.email || '',
          contact.primaryPhone || contact.phone || user.phone || '',

          // Student Academic Details
          studentDetails.studentId || '',
          studentDetails.admissionNumber || academic.admissionNumber || '',
          studentDetails.rollNumber || academic.rollNumber || '',
          academic.currentClass || '',
          academic.currentSection || '',
          academic.academicYear || '',
          academic.admissionDate ? new Date(academic.admissionDate).toISOString().split('T')[0] : '',
          academic.admissionClass || '',
          academic.stream || '',
          Array.isArray(academic.electives) ? academic.electives.join(', ') : '',
          academic.enrollmentNo || '',
          academic.tcNo || '',

          // Personal Information - Basic
          personal.dateOfBirth ? new Date(personal.dateOfBirth).toISOString().split('T')[0] : '',
          personal.placeOfBirth || '',
          personal.gender || '',
          personal.bloodGroup || '',
          personal.nationality || '',
          personal.religion || '',
          personal.religionOther || '',
          personal.caste || '',
          personal.casteOther || '',
          personal.category || '',
          personal.categoryOther || '',
          personal.motherTongue || '',
          personal.motherTongueOther || '',
          Array.isArray(personal.languagesKnown) ? personal.languagesKnown.join(', ') : '',

          // Karnataka SATS Specific Personal Fields
          personal.studentNameKannada || '',
          personal.ageYears || '',
          personal.ageMonths || '',
          personal.socialCategory || '',
          personal.socialCategoryOther || '',
          personal.studentCaste || '',
          personal.studentCasteOther || '',
          personal.studentAadhaar || identity.aadharNumber || '',
          personal.studentCasteCertNo || '',
          personal.belongingToBPL || '',
          personal.bplCardNo || '',
          personal.bhagyalakshmiBondNo || '',
          personal.disability || '',
          personal.disabilityOther || '',
          personal.isRTECandidate || '',

          // Address Information - Current
          address.current?.street || '', // Using street for Address Line 1
          address.current?.area || '',   // Using area for Address Line 2
          address.current?.city || '',
          address.current?.district || '', // District not standard in Address model, but mapping to empty
          address.current?.state || '',
          address.current?.pincode || '',
          address.current?.taluka || '', // Taluka not standard in Address model, but mapping to empty
          address.current?.urbanRural || '', // UrbanRural not standard in Address model, but mapping to empty

          // Address Information - Permanent  
          address.permanent?.street || '',
          address.permanent?.area || '',
          address.permanent?.city || '',
          address.permanent?.district || '', // District not standard in Address model, but mapping to empty
          address.permanent?.state || '',
          address.permanent?.pincode || '',
          address.permanent?.taluka || '', // Taluka not standard in Address model, but mapping to empty
          address.permanent?.urbanRural || '', // UrbanRural not standard in Address model, but mapping to empty

          // Father Information
          father.name || '',
          father.nameKannada || '',
          father.occupation || '',
          father.qualification || '',
          father.phone || '',
          father.email || '',
          father.workAddress || '',
          father.annualIncome || '',
          father.aadhaar || '',
          father.caste || '',
          father.casteOther || '',
          father.casteCertNo || '',

          // Mother Information
          mother.name || '',
          mother.nameKannada || '',
          mother.occupation || '',
          mother.qualification || '',
          mother.phone || '',
          mother.email || '',
          mother.workAddress || '',
          mother.annualIncome || '',
          mother.aadhaar || '',
          mother.caste || '',
          mother.casteOther || '',
          mother.casteCertNo || '',

          // Guardian Information
          guardian.name || '',
          guardian.relationship || '',
          guardian.phone || '',
          guardian.email || '',
          guardian.address || '',
          (guardian.isEmergencyContact === true ? 'TRUE' : 'FALSE') || '',

          // Siblings Information (up to 3 siblings)
          siblings[0]?.name || '',
          siblings[0]?.age || '',
          siblings[0]?.relationship || '',
          siblings[0]?.school || '',
          siblings[0]?.class || '',
          siblings[1]?.name || '',
          siblings[1]?.age || '',
          siblings[1]?.relationship || '',
          siblings[1]?.school || '',
          siblings[1]?.class || '',
          siblings[2]?.name || '',
          siblings[2]?.age || '',
          siblings[2]?.relationship || '',
          siblings[2]?.school || '',
          siblings[2]?.class || '',

          // Medical Information
          Array.isArray(medical.allergies) ? medical.allergies.join(', ') : '',
          Array.isArray(medical.chronicConditions) ? medical.chronicConditions.join(', ') : '',
          Array.isArray(medical.medications) ? medical.medications.join(', ') : '',
          medical.emergencyMedicalContact?.doctorName || '',
          medical.emergencyMedicalContact?.hospitalName || '',
          medical.emergencyMedicalContact?.phone || '',
          medical.lastMedicalCheckup ? new Date(medical.lastMedicalCheckup).toISOString().split('T')[0] : '',
          Array.isArray(medical.vaccinationStatus) ? medical.vaccinationStatus.map((v: any) => v.vaccine).join(', ') : '',

          // Transportation
          transport.mode || '',
          transport.busRoute || '',
          transport.pickupPoint || '',
          transport.dropPoint || '',
          transport.pickupTime || '',
          transport.dropTime || '',

          // Financial Information
          financial.feeCategory || '',
          financial.concessionType || '',
          financial.concessionPercentage || '',
          financial.scholarshipDetails?.name || '',
          financial.scholarshipDetails?.amount || '',
          financial.scholarshipDetails?.provider || '',

          // Banking Information
          bankDetails.bankName || '',
          bankDetails.accountNumber || '',
          bankDetails.ifscCode || '',
          bankDetails.accountHolderName || '',

          userData.profileImage || userData.profilePicture || '', // <--- MAPPING FOR STUDENT

          // Previous School Information
          previousSchool.name || '',
          previousSchool.board || '',
          previousSchool.lastClass || '',
          previousSchool.tcNumber || '',
          previousSchool.tcDate ? new Date(previousSchool.tcDate).toISOString().split('T')[0] : '',
          previousSchool.reasonForTransfer || '',

          // Emergency Contacts (additional - getting from parentDetails if available)
          parentDetails.emergencyContacts?.[0]?.name || '',
          parentDetails.emergencyContacts?.[0]?.relationship || '',
          parentDetails.emergencyContacts?.[0]?.phone || '',
          parentDetails.emergencyContacts?.[0]?.address || '',
          parentDetails.emergencyContacts?.[0]?.isPrimary || '',
          parentDetails.emergencyContacts?.[1]?.name || '',
          parentDetails.emergencyContacts?.[1]?.relationship || '',
          parentDetails.emergencyContacts?.[1]?.phone || '',
          parentDetails.emergencyContacts?.[1]?.address || '',
          parentDetails.emergencyContacts?.[1]?.isPrimary || '',

          // Academic History (current year)
          currentAcademic.academicYear || '',
          currentAcademic.result || '',
          currentAcademic.percentage || '',
          currentAcademic.rank || '',
          currentAcademic.attendance || '',

          // System Information
          user.isActive ? 'Active' : 'Inactive',
          new Date(user.createdAt).toLocaleDateString(),
          (userData as any).updatedAt ? new Date((userData as any).updatedAt).toLocaleDateString() : '',
          metadata.source || '',
          metadata.importBatch || '',
          Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '',
          metadata.notes || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });

    } else if (activeTab === 'teacher') {
      // Comprehensive teacher export headers - matching template fields
      headers = [
        // Basic Information
        'User ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone',

        // Personal Information
        'Date of Birth', 'Place of Birth', 'Gender', 'Blood Group', 'Nationality', 'Religion', 'Caste', 'Category',
        'Mother Tongue', 'Languages Known', 'Marital Status', 'Spouse Name',

        // Address Information - Current
        'Current Address Line 1', 'Current Address Line 2', 'Current City', 'Current District', 'Current State', 'Current Pin Code',

        // Address Information - Permanent  
        'Permanent Address Line 1', 'Permanent Address Line 2', 'Permanent City', 'Permanent District', 'Permanent State', 'Permanent Pin Code',

        // Identity Documents
        'Aadhaar Number', 'PAN Number', 'Passport Number', 'Driving License',

        // Professional Information
        'Employee ID', 'Joining Date', 'Designation', 'Department',

        // Qualification Information
        'Highest Qualification', 'Specialization', 'University', 'Qualification Year', 'Teaching License',

        // Additional Certificates (up to 3)
        'Certificate 1 Name', 'Certificate 1 Institution', 'Certificate 1 Year',
        'Certificate 2 Name', 'Certificate 2 Institution', 'Certificate 2 Year',
        'Certificate 3 Name', 'Certificate 3 Institution', 'Certificate 3 Year',

        // Experience Information
        'Total Experience (Years)', 'Experience at Current School (Years)',

        // Previous Schools (up to 3)
        'Previous School 1 Name', 'Previous School 1 Duration', 'Previous School 1 Position', 'Previous School 1 Reason for Leaving',
        'Previous School 2 Name', 'Previous School 2 Duration', 'Previous School 2 Position', 'Previous School 2 Reason for Leaving',
        'Previous School 3 Name', 'Previous School 3 Duration', 'Previous School 3 Position', 'Previous School 3 Reason for Leaving',

        // Subject and Class Information
        'Primary Subject 1 Code', 'Primary Subject 1 Name', 'Primary Subject 1 Classes', 'Primary Subject 1 Is Primary',
        'Secondary Subject 2 Code', 'Secondary Subject 2 Name', 'Secondary Subject 2 Classes', 'Secondary Subject 2 Is Primary',
        'Secondary Subject 3 Code', 'Secondary Subject 3 Name', 'Secondary Subject 3 Classes', 'Secondary Subject 3 Is Primary',
        'Class Teacher Of', 'Responsibilities',

        // Work Schedule
        'Working Days', 'Working Hours Start', 'Working Hours End', 'Max Periods Per Day', 'Max Periods Per Week',

        // Performance Review (Latest)
        'Latest Review Academic Year', 'Latest Review Rating', 'Latest Review Comments',

        // Salary Information
        'Basic Salary', 'HRA Allowance', 'Transport Allowance', 'Medical Allowance', 'Other Allowances', 'Currency',

        // Banking Information
        'Bank Name', 'Account Number', 'IFSC Code', 'Branch Name', 'Account Holder Name',

        'Profile Image Path', // <--- ADDED THE NEW FIELD FOR TEACHER

        // Emergency Contact Information
        'Emergency Contact 1 Name', 'Emergency Contact 1 Relationship', 'Emergency Contact 1 Phone', 'Emergency Contact 1 Address',
        'Emergency Contact 2 Name', 'Emergency Contact 2 Relationship', 'Emergency Contact 2 Phone', 'Emergency Contact 2 Address',

        // Administrative
        'Assigned By', 'Admin Role Level', 'Permissions', 'Last Login',

        // System Information
        'Status', 'Created Date', 'Last Modified', 'Source', 'Import Batch', 'Tags', 'Notes'
      ];

      csvRows = filteredUsers.map(user => {
        const userData = user as any;
        const teacherDetails = userData.teacherDetails || {};
        const name = userData.name || {};
        const address = userData.address || {};
        const contact = userData.contact || {};
        const personalInfo = userData.personalInfo || {};
        const identity = userData.identity || {};
        const qualification = teacherDetails.qualification || {};
        const certificates = qualification.certificates || [];
        const experience = teacherDetails.experience || {};
        const previousSchools = experience.previousSchools || [];
        const subjects = teacherDetails.subjects || [];
        const responsibilities = teacherDetails.responsibilities || [];
        const workSchedule = teacherDetails.workSchedule || {};
        const performanceReviews = teacherDetails.performanceReviews || [];
        const latestReview = performanceReviews[0] || {};
        const salary = teacherDetails.salary || {};
        const allowances = salary.allowances || [];
        const bankDetails = teacherDetails.bankDetails || {};
        const emergencyContacts = userData.emergencyContacts || [];
        const metadata = userData.metadata || {};
        const contactEmergency = contact.emergencyContact || {};

        const defaultExperience = { total: 0, atCurrentSchool: 0, previousSchools: [] };
        const exp = teacherDetails.experience || defaultExperience;
        const qual = teacherDetails.qualification || {};
        const workSch = teacherDetails.workSchedule || {};

        // Map allowances to easy access structure
        const allowanceMap = new Map(allowances.map((a: any) => [a.type, a.amount]));

        // Get subjects (handling array of objects or just array of strings from the backend)
        const formattedSubjects = subjects.map((s: any) => ({
          subjectCode: s.subjectCode || s,
          subjectName: s.subjectName || s,
          classes: Array.isArray(s.classes) ? s.classes.join(', ') : '',
          isPrimary: s.isPrimary === true ? 'TRUE' : 'FALSE'
        })).filter(Boolean);

        return [
          // Basic Information
          userData.userId || user._id || '',
          name.firstName || '',
          name.middleName || '',
          name.lastName || '',
          user.email || '',
          contact.primaryPhone || contact.phone || user.phone || '',

          // Personal Information (using top-level contact/details fields if available)
          teacherDetails.dateOfBirth ? new Date(teacherDetails.dateOfBirth).toISOString().split('T')[0] : '',
          personalInfo.placeOfBirth || '',
          teacherDetails.gender || '',
          teacherDetails.bloodGroup || '',
          teacherDetails.nationality || '',
          teacherDetails.religion || '',
          personalInfo.caste || '',
          personalInfo.category || '',
          personalInfo.motherTongue || '',
          Array.isArray(personalInfo.languagesKnown) ? personalInfo.languagesKnown.join(', ') : '',
          personalInfo.maritalStatus || '',
          personalInfo.spouseName || '',

          // Address Information - Current
          address.current?.street || '',
          address.current?.area || '', // Using area for Address Line 2
          address.current?.city || '',
          address.current?.district || '',
          address.current?.state || '',
          address.current?.pincode || '',

          // Address Information - Permanent  
          address.permanent?.street || '',
          address.permanent?.area || '',
          address.permanent?.city || '',
          address.permanent?.district || '',
          address.permanent?.state || '',
          address.permanent?.pincode || '',

          // Identity Documents
          identity.aadharNumber || '',
          identity.panNumber || '',
          identity.passportNumber || '',
          identity.drivingLicenseNumber || '',

          // Professional Information
          teacherDetails.employeeId || '',
          teacherDetails.joiningDate ? new Date(teacherDetails.joiningDate).toISOString().split('T')[0] : '',
          teacherDetails.designation || '',
          teacherDetails.department || '',

          // Qualification Information
          qual.highest || '',
          qual.specialization || '',
          qual.university || '',
          qual.year || '',
          '', // Teaching License field not explicitly mapped to user model yet

          // Additional Certificates (up to 3)
          certificates[0]?.name || '',
          certificates[0]?.institution || '',
          certificates[0]?.year || '',
          certificates[1]?.name || '',
          certificates[1]?.institution || '',
          certificates[1]?.year || '',
          certificates[2]?.name || '',
          certificates[2]?.institution || '',
          certificates[2]?.year || '',

          // Experience Information
          exp.total || '',
          exp.atCurrentSchool || '',

          // Previous Schools (up to 3)
          exp.previousSchools[0]?.schoolName || '',
          exp.previousSchools[0]?.duration || '',
          exp.previousSchools[0]?.position || '',
          exp.previousSchools[0]?.reasonForLeaving || '',
          exp.previousSchools[1]?.schoolName || '',
          exp.previousSchools[1]?.duration || '',
          exp.previousSchools[1]?.position || '',
          exp.previousSchools[1]?.reasonForLeaving || '',
          exp.previousSchools[2]?.schoolName || '',
          exp.previousSchools[2]?.duration || '',
          exp.previousSchools[2]?.position || '',
          exp.previousSchools[2]?.reasonForLeaving || '',

          // Subject and Class Information
          formattedSubjects[0]?.subjectCode || '',
          formattedSubjects[0]?.subjectName || '',
          formattedSubjects[0]?.classes || '',
          formattedSubjects[0]?.isPrimary || '',
          formattedSubjects[1]?.subjectCode || '',
          formattedSubjects[1]?.subjectName || '',
          formattedSubjects[1]?.classes || '',
          formattedSubjects[1]?.isPrimary || '',
          formattedSubjects[2]?.subjectCode || '',
          formattedSubjects[2]?.subjectName || '',
          formattedSubjects[2]?.classes || '',
          formattedSubjects[2]?.isPrimary || '',
          teacherDetails.classTeacherOf || '',
          Array.isArray(teacherDetails.responsibilities) ? teacherDetails.responsibilities.join(', ') : '',

          // Work Schedule
          Array.isArray(workSch.workingDays) ? workSch.workingDays.join(', ') : '',
          workSch.workingHours?.start || '',
          workSch.workingHours?.end || '',
          workSch.maxPeriodsPerDay || '',
          workSch.maxPeriodsPerWeek || '',

          // Performance Review (Latest)
          latestReview.academicYear || '',
          latestReview.rating || '',
          latestReview.comments || '',

          // Salary Information
          salary.basic || '',
          allowanceMap.get('HRA') || '',
          allowanceMap.get('Transport') || '',
          allowanceMap.get('Medical') || '',
          allowances.filter((a: any) => !['HRA', 'Transport', 'Medical'].includes(a.type)).map((a: any) => `${a.type}: ${a.amount}`).join(', ') || '',
          salary.currency || '',

          // Banking Information
          bankDetails.bankName || '',
          bankDetails.accountNumber || '',
          bankDetails.ifscCode || '',
          bankDetails.branchName || '',
          bankDetails.accountHolderName || name.firstName && name.lastName ? `${name.firstName} ${name.lastName}` : '',

          userData.profileImage || userData.profilePicture || '', // <--- MAPPING FOR TEACHER

          // Emergency Contact Information (using main contact.emergencyContact for simplicity)
          contactEmergency.name || '',
          contactEmergency.relationship || '',
          contactEmergency.phone || '',
          contactEmergency.address || '', // Address not directly available in model structure for emergencyContact
          emergencyContacts[0]?.name || '',
          emergencyContacts[0]?.relationship || '',
          emergencyContacts[0]?.phone || '',
          emergencyContacts[0]?.address || '',

          // Administrative
          (userData as any).schoolAccess?.assignedBy || '',
          user.role || 'teacher',
          Array.isArray(userData.permissions) ? userData.permissions.join(', ') : '', // Assuming top-level permissions might exist
          userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : '',

          // System Information
          user.isActive ? 'Active' : 'Inactive',
          new Date(user.createdAt).toLocaleDateString(),
          (userData as any).updatedAt ? new Date((userData as any).updatedAt).toLocaleDateString() : '',
          metadata.source || '',
          metadata.importBatch || '',
          Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '',
          metadata.notes || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });

    } else if (activeTab === 'admin') {
      // Comprehensive admin export headers - matching template fields
      headers = [
        // Basic Information
        'User ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone',

        // Personal Information
        'Date of Birth', 'Place of Birth', 'Gender', 'Blood Group', 'Nationality', 'Religion', 'Caste', 'Category',
        'Mother Tongue', 'Languages Known', 'Marital Status', 'Spouse Name',

        // Address Information - Current
        'Current Address Line 1', 'Current Address Line 2', 'Current City', 'Current District', 'Current State', 'Current Pin Code',

        // Address Information - Permanent  
        'Permanent Address Line 1', 'Permanent Address Line 2', 'Permanent City', 'Permanent District', 'Permanent State', 'Permanent Pin Code',

        // Identity Documents
        'Aadhaar Number', 'PAN Number', 'Passport Number', 'Driving License',

        // Administrative Information
        'Admin ID', 'Admin Level', 'Designation', 'Department', 'Joining Date', 'Reporting Manager',

        // Permissions and Access
        'Permissions', 'Access Level', 'Can Manage Users', 'Can Manage Academics', 'Can Manage Finance', 'Can Manage Reports',
        'Can Manage School Settings', 'Can View All Data', 'Can Export Data', 'Can Import Data',

        // Responsibilities
        'Primary Responsibilities', 'Secondary Responsibilities', 'Committees', 'Special Duties',

        // Professional Background
        'Highest Qualification', 'Specialization', 'University', 'Qualification Year', 'Total Experience (Years)',
        'Administrative Experience (Years)', 'Education Sector Experience (Years)',

        // Previous Experience (up to 3)
        'Previous Organization 1', 'Previous Position 1', 'Previous Duration 1', 'Previous Responsibilities 1',
        'Previous Organization 2', 'Previous Position 2', 'Previous Duration 2', 'Previous Responsibilities 2',
        'Previous Organization 3', 'Previous Position 3', 'Previous Duration 3', 'Previous Responsibilities 3',

        // Work Schedule and Availability
        'Working Days', 'Working Hours Start', 'Working Hours End', 'Overtime Eligible', 'On-Call Duties',

        // Salary Information
        'Basic Salary', 'HRA Allowance', 'Transport Allowance', 'Medical Allowance', 'Management Allowance', 'Other Allowances', 'Currency',

        // Banking Information
        'Bank Name', 'Account Number', 'IFSC Code', 'Branch Name', 'Account Holder Name',

        'Profile Image Path', // <--- NEW FIELD ADDED HERE

        // Emergency Contact Information
        'Emergency Contact 1 Name', 'Emergency Contact 1 Relationship', 'Emergency Contact 1 Phone', 'Emergency Contact 1 Address',
        'Emergency Contact 2 Name', 'Emergency Contact 2 Relationship', 'Emergency Contact 2 Phone', 'Emergency Contact 2 Address',

        // Administrative
        'Assigned By', 'Admin Role Level', 'Permissions', 'Last Login',

        // System Information
        'Status', 'Created Date', 'Last Modified', 'Source', 'Import Batch', 'Tags', 'Notes'
      ];

      csvRows = filteredUsers.map(user => {
        const userData = user as any;
        const adminDetails = userData.adminDetails || {};
        const name = userData.name || {};
        const address = userData.address || {};
        const contact = userData.contact || {};
        const personalInfo = userData.personalInfo || {}; // Not explicitly in model, using top-level or adminDetails
        const identity = userData.identity || {};
        const permissions = adminDetails.permissions || {};
        const responsibilities = adminDetails.responsibilities || {}; // Not explicitly in model
        const qualification = adminDetails.qualification || {}; // Not explicitly in model
        const experience = adminDetails.experience || {};
        const previousExperience = experience.previousExperience || [];
        const workSchedule = adminDetails.workSchedule || {};
        const salary = adminDetails.salary || {};
        const allowances = salary.allowances || [];
        const bankDetails = adminDetails.bankDetails || {};
        const emergencyContacts = userData.emergencyContacts || []; // Using top-level for non-parent roles
        const systemAccess = adminDetails.systemAccess || {}; // Not explicitly in model
        const performanceReview = adminDetails.performanceReview || {}; // Not explicitly in model
        const metadata = userData.metadata || {};
        const contactEmergency = contact.emergencyContact || {};

        // Map allowances to easy access structure
        const allowanceMap = new Map(allowances.map((a: any) => [a.type, a.amount]));

        const adminPermissions = [
          permissions.userManagement ? 'UserManagement' : '',
          permissions.academicManagement ? 'AcademicManagement' : '',
          permissions.feeManagement ? 'FeeManagement' : '',
          permissions.reportGeneration ? 'ReportGeneration' : '',
          permissions.systemSettings ? 'SystemSettings' : '',
          permissions.schoolSettings ? 'SchoolSettings' : '',
          permissions.dataExport ? 'DataExport' : '',
          permissions.auditLogs ? 'AuditLogs' : ''
        ].filter(Boolean).join(', ');

        return [
          // Basic Information
          userData.userId || user._id || '',
          name.firstName || '',
          name.middleName || '',
          name.lastName || '',
          user.email || '',
          contact.primaryPhone || contact.phone || user.phone || '',

          // Personal Information (using top-level user fields or nested adminDetails for consistency)
          adminDetails.dateOfBirth ? new Date(adminDetails.dateOfBirth).toISOString().split('T')[0] : '',
          personalInfo.placeOfBirth || '',
          user.gender || adminDetails.gender || '',
          user.bloodGroup || adminDetails.bloodGroup || '',
          user.nationality || 'Indian',
          user.religion || adminDetails.religion || '',
          user.caste || adminDetails.caste || '',
          user.category || adminDetails.category || '',
          personalInfo.motherTongue || '',
          Array.isArray(personalInfo.languagesKnown) ? personalInfo.languagesKnown.join(', ') : '',
          personalInfo.maritalStatus || '',
          personalInfo.spouseName || '',

          // Address Information - Current
          address.current?.street || '',
          address.current?.area || '',
          address.current?.city || '',
          address.current?.district || '',
          address.current?.state || '',
          address.current?.pincode || '',

          // Address Information - Permanent  
          address.permanent?.street || '',
          address.permanent?.area || '',
          address.permanent?.city || '',
          address.permanent?.district || '',
          address.permanent?.state || '',
          address.permanent?.pincode || '',

          // Identity Documents
          identity.aadharNumber || '',
          identity.panNumber || '',
          identity.passportNumber || '',
          identity.drivingLicenseNumber || '',

          // Administrative Information
          adminDetails.employeeId || '',
          adminDetails.adminType || 'Admin',
          adminDetails.designation || '',
          adminDetails.department || '',
          adminDetails.joiningDate ? new Date(adminDetails.joiningDate).toISOString().split('T')[0] : '',
          adminDetails.reportingTo || '',

          // Permissions and Access
          adminPermissions,
          (userData as any).accessLevel || '', // Assuming legacy field for this template
          permissions.userManagement ? 'TRUE' : 'FALSE',
          permissions.academicManagement ? 'TRUE' : 'FALSE',
          permissions.feeManagement ? 'TRUE' : 'FALSE',
          permissions.reportGeneration ? 'TRUE' : 'FALSE',
          permissions.systemSettings ? 'TRUE' : 'FALSE',
          permissions.schoolSettings ? 'TRUE' : 'FALSE',
          permissions.dataExport ? 'TRUE' : 'FALSE',
          permissions.auditLogs ? 'TRUE' : 'FALSE',

          // Responsibilities
          Array.isArray(adminDetails.responsibilities) ? adminDetails.responsibilities.join(', ') : '', // Using array from model
          responsibilities.secondary || '', // Placeholder for secondary duties
          responsibilities.committees || '', // Placeholder
          responsibilities.specialDuties || '', // Placeholder

          // Professional Background
          qualification.highest || '',
          qualification.specialization || '',
          qualification.university || '',
          qualification.year || '',
          experience.total || '',
          experience.administrativeYears || '',
          experience.educationSectorYears || '',

          // Previous Experience (up to 3)
          previousExperience[0]?.organization || '',
          previousExperience[0]?.position || '',
          previousExperience[0]?.duration || '',
          previousExperience[0]?.responsibilities || '',
          previousExperience[1]?.organization || '',
          previousExperience[1]?.position || '',
          previousExperience[1]?.duration || '',
          previousExperience[1]?.responsibilities || '',
          previousExperience[2]?.organization || '',
          previousExperience[2]?.position || '',
          previousExperience[2]?.duration || '',
          previousExperience[2]?.responsibilities || '',

          // Work Schedule and Availability
          Array.isArray(workSchedule.workingDays) ? workSchedule.workingDays.join(', ') : '',
          workSchedule.workingHours?.start || '',
          workSchedule.workingHours?.end || '',
          workSchedule.overtimeEligible || '',
          workSchedule.onCallDuties || '',

          // Salary Information
          salary.basic || '',
          allowanceMap.get('HRA') || '',
          allowanceMap.get('Transport') || '',
          allowanceMap.get('Medical') || '',
          allowanceMap.get('Management') || '',
          allowances.filter((a: any) => !['HRA', 'Transport', 'Medical', 'Management'].includes(a.type)).map((a: any) => `${a.type}: ${a.amount}`).join(', ') || '',
          salary.currency || '',

          // Banking Information
          bankDetails.bankName || '',
          bankDetails.accountNumber || '',
          bankDetails.ifscCode || '',
          bankDetails.branchName || '',
          bankDetails.accountHolderName || name.firstName && name.lastName ? `${name.firstName} ${name.lastName}` : '',

          userData.profileImage || userData.profilePicture || '', // <--- NEW MAPPING FOR ADMIN

          // Emergency Contact Information (using main contact.emergencyContact and nested emergencyContacts)
          contactEmergency.name || '',
          contactEmergency.relationship || '',
          contactEmergency.phone || '',
          contactEmergency.address || '',
          emergencyContacts[0]?.name || '',
          emergencyContacts[0]?.relationship || '',
          emergencyContacts[0]?.phone || '',
          emergencyContacts[0]?.address || '',

          // Administrative
          (userData as any).schoolAccess?.assignedBy || '',
          user.role || 'admin',
          adminPermissions, // Using joined string again
          userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : '',

          // System Information
          user.isActive ? 'Active' : 'Inactive',
          new Date(user.createdAt).toLocaleDateString(),
          (userData as any).updatedAt ? new Date((userData as any).updatedAt).toLocaleDateString() : '',
          metadata.source || '',
          metadata.importBatch || '',
          Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '',
          metadata.notes || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });
    }

    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," +
      headers.join(',') + '\n' +
      csvRows.map(row => row.map(cell => {
        const strCell = String(cell ?? '');
        if (strCell.includes('"') || strCell.includes(',') || strCell.includes('\n') || strCell.includes('\r')) {
          return `"${strCell.replace(/"/g, '""')}"`;
        }
        return strCell;
      }).join(',')).join('\n');

    // Create and trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filteredUsers.length} ${activeTab} records exported successfully!`);
  };

  // ... existing code ...
  // CSV Import Functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setImportFile(file);
    // For new system, we don't need to parse CSV on frontend
    // The backend will handle parsing and validation
    setImportPreview([]); // Clear any previous preview
    setImportResults(null); // Clear any previous results
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1);

        const parsedData = dataRows.map((line, index) => {
          const values: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const rowData: any = { _rowIndex: index + 2 };
          headers.forEach((header, i) => {
            rowData[header] = values[i] || '';
          });
          return rowData;
        });

        setImportPreview(parsedData);
        toast.success(`Parsed ${parsedData.length} rows from CSV file`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const validateImportData = (data: any[], role: string) => {
    const errors: Array<{ row: number, error: string, data: any }> = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Common validations
      if (!row['First Name*']) {
        rowErrors.push('First Name is required');
      }
      if (!row['Last Name*']) {
        rowErrors.push('Last Name is required');
      }
      if (!row['Email*'] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email*'])) {
        rowErrors.push('Valid email is required');
      }
      if (!row['Phone*'] || !/^[6-9]\d{9}$/.test(row['Phone*'].replace(/\D/g, ''))) {
        rowErrors.push('Valid 10-digit Indian mobile number is required (starting with 6-9)');
      }
      if (!row['Date of Birth* (YYYY-MM-DD)'] || !/^\d{4}-\d{2}-\d{2}$/.test(row['Date of Birth* (YYYY-MM-DD)'])) {
        rowErrors.push('Date of Birth must be in YYYY-MM-DD format');
      }
      if (!row['Gender*'] || !['male', 'female', 'other'].includes(row['Gender*'].toLowerCase())) {
        rowErrors.push('Gender must be male, female, or other');
      }

      // Role-specific validations
      if (role === 'student') {
        if (!row['Class*']) {
          rowErrors.push('Class is required for students');
        }
        if (!row['Father Name*']) {
          rowErrors.push('Father Name is required for students');
        }
        if (!row['Mother Name*']) {
          rowErrors.push('Mother Name is required for students');
        }

        // Karnataka SATS specific validations
        if (row['Student Aadhaar'] && !/^\d{12}$/.test(row['Student Aadhaar'])) {
          rowErrors.push('Student Aadhaar must be 12 digits');
        }
        if (row['Father Aadhaar'] && !/^\d{12}$/.test(row['Father Aadhaar'])) {
          rowErrors.push('Father Aadhaar must be 12 digits');
        }
        if (row['Mother Aadhaar'] && !/^\d{12}$/.test(row['Mother Aadhaar'])) {
          rowErrors.push('Mother Aadhaar must be 12 digits');
        }
        if (row['Father Phone'] && !/^[6-9]\d{9}$/.test(row['Father Phone'].replace(/\D/g, ''))) {
          rowErrors.push('Father Phone must be valid 10-digit Indian mobile number');
        }
        if (row['Mother Phone'] && !/^[6-9]\d{9}$/.test(row['Mother Phone'].replace(/\D/g, ''))) {
          rowErrors.push('Mother Phone must be valid 10-digit Indian mobile number');
        }
        if (row['Age Years'] && (isNaN(parseInt(row['Age Years'])) || parseInt(row['Age Years']) < 0 || parseInt(row['Age Years']) > 25)) {
          rowErrors.push('Age Years must be a number between 0 and 25');
        }
        if (row['Age Months'] && (isNaN(parseInt(row['Age Months'])) || parseInt(row['Age Months']) < 0 || parseInt(row['Age Months']) > 11)) {
          rowErrors.push('Age Months must be a number between 0 and 11');
        }

      } else if (role === 'teacher') {
        if (!row['Highest Qualification*']) {
          rowErrors.push('Highest Qualification is required for teachers');
        }
        if (!row['Total Experience (Years)*']) {
          rowErrors.push('Total Experience is required for teachers');
        }
        if (row['Total Experience (Years)*'] && isNaN(parseInt(row['Total Experience (Years)*']))) {
          rowErrors.push('Total Experience must be a valid number');
        }

        // Teacher specific validations
        if (row['Employee ID'] && !/^[A-Z]{3}_[A-Z]{3}\d{3}$/.test(row['Employee ID'])) {
          rowErrors.push('Employee ID should follow format: SCH_TEA001');
        }
        if (row['Joining Date (YYYY-MM-DD)'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['Joining Date (YYYY-MM-DD)'])) {
          rowErrors.push('Joining Date must be in YYYY-MM-DD format');
        }

      } else if (role === 'admin') {
        if (!row['Admin Level*']) {
          rowErrors.push('Admin Level is required for admins');
        }
        if (!row['Designation*']) {
          rowErrors.push('Designation is required for admins');
        }
        if (!row['Department*']) {
          rowErrors.push('Department is required for admins');
        }
        if (!row['Highest Qualification*']) {
          rowErrors.push('Highest Qualification is required for admins');
        }

        // Admin specific validations
        if (row['Admin ID'] && !/^[A-Z]{3}_[A-Z]{3}\d{3}$/.test(row['Admin ID'])) {
          rowErrors.push('Admin ID should follow format: SCH_ADM001');
        }
        if (row['Joining Date (YYYY-MM-DD)'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['Joining Date (YYYY-MM-DD)'])) {
          rowErrors.push('Joining Date must be in YYYY-MM-DD format');
        }
      }

      // Common address validations - skip for teachers to make user addition more flexible
      if (role !== 'teacher') {
        if (!row['Current Address Line 1*']) {
          rowErrors.push('Current Address Line 1 is required');
        }
        if (!row['Current City*']) {
          rowErrors.push('Current City is required');
        }
        if (!row['Current State*']) {
          rowErrors.push('Current State is required');
        }
        if (!row['Current Pin Code*'] || !/^\d{6}$/.test(row['Current Pin Code*'])) {
          rowErrors.push('Valid 6-digit pin code is required for Current Address');
        }
      }

      // Optional field validations
      if (row['Aadhaar Number'] && !/^\d{12}$/.test(row['Aadhaar Number'])) {
        rowErrors.push('Aadhaar Number must be 12 digits');
      }
      if (row['PAN Number'] && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row['PAN Number'])) {
        rowErrors.push('PAN Number must be in format: ABCDE1234F');
      }
      if (row['IFSC Code'] && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(row['IFSC Code'])) {
        rowErrors.push('IFSC Code must be in format: ABCD0123456');
      }
      if (row['Permanent Pin Code'] && row['Permanent Pin Code'] !== '' && !/^\d{6}$/.test(row['Permanent Pin Code'])) {
        rowErrors.push('Permanent Pin Code must be 6 digits');
      }

      // Date validations for optional date fields
      const dateFields = [
        'Admission Date (YYYY-MM-DD)', 'Last Medical Checkup (YYYY-MM-DD)',
        'Previous School TC Date (YYYY-MM-DD)', 'Joining Date (YYYY-MM-DD)',
        'Latest Review Date'
      ];

      dateFields.forEach(field => {
        if (row[field] && row[field] !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(row[field])) {
          rowErrors.push(`${field} must be in YYYY-MM-DD format`);
        }
      });

      // Blood group validation
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (row['Blood Group'] && !validBloodGroups.includes(row['Blood Group'])) {
        rowErrors.push('Blood Group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-');
      }

      // Numeric field validations
      const numericFields = [
        'Age Years', 'Age Months', 'Father Annual Income', 'Mother Annual Income',
        'Total Experience (Years)', 'Experience at Current School (Years)',
        'Qualification Year', 'Administrative Experience (Years)', 'Education Sector Experience (Years)',
        'Max Periods Per Day', 'Max Periods Per Week', 'Basic Salary',
        'HRA Allowance', 'Transport Allowance', 'Medical Allowance', 'Management Allowance',
        'Concession Percentage', 'Scholarship Amount', 'Current Percentage', 'Current Rank',
        'Current Attendance', 'Latest Review Rating'
      ];

      numericFields.forEach(field => {
        if (row[field] && row[field] !== '' && isNaN(Number(row[field]))) {
          rowErrors.push(`${field} must be a valid number`);
        }
      });

      // Email validations for family members
      const emailFields = ['Father Email', 'Mother Email', 'Guardian Email'];
      emailFields.forEach(field => {
        if (row[field] && row[field] !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[field])) {
          rowErrors.push(`${field} must be a valid email address`);
        }
      });

      // Phone number validations for family/emergency contacts
      const phoneFields = [
        'Father Phone', 'Mother Phone', 'Guardian Phone',
        'Emergency Contact 1 Phone', 'Emergency Contact 2 Phone',
        'Emergency Hospital Phone'
      ];
      phoneFields.forEach(field => {
        if (row[field] && row[field] !== '' && !/^[6-9]\d{9}$/.test(row[field].replace(/\D/g, ''))) {
          rowErrors.push(`${field} must be a valid 10-digit Indian mobile number`);
        }
      });

      // Boolean field validations
      const booleanFields = [
        'Guardian Is Emergency Contact', 'Primary Subject 1 Is Primary',
        'Secondary Subject 2 Is Primary', 'Secondary Subject 3 Is Primary',
        'Emergency Contact 1 Is Primary', 'Emergency Contact 2 Is Primary',
        'Overtime Eligible', 'Can Manage Users', 'Can Manage Academics',
        'Can Manage Finance', 'Can Manage Reports', 'Can Manage School Settings',
        'Can View All Data', 'Can Export Data', 'Can Import Data',
        'Multi-School Access', 'API Access'
      ];
      booleanFields.forEach(field => {
        if (row[field] && row[field] !== '' && !['true', 'false', 'yes', 'no', ''].includes(row[field].toLowerCase())) {
          rowErrors.push(`${field} must be true/false or yes/no`);
        }
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: row._rowIndex,
          error: rowErrors.join(', '),
          data: row
        });
      }
    });

    return errors;
  };

  const processImport = async () => {
    if (!importFile) {
      toast.error('No file selected for import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const schoolCode = user?.schoolCode || 'SB';
      console.log('Starting import for school:', schoolCode);

      const response = await exportImportAPI.importUsers(schoolCode, importFile);
      console.log('Import response:', response);

      setImportProgress(100);

      // Handle different response structures
      const results = response.data?.results || response.data || { successData: [], errors: [] };

      // Backend returns 'successData' not 'success'
      const successArray = Array.isArray(results.successData) ? results.successData :
        Array.isArray(results.success) ? results.success : [];
      const errorsArray = Array.isArray(results.errors) ? results.errors : [];

      // Use insertedCount if available (actual DB inserts)
      const actualInserted = results.insertedCount || successArray.length;

      // Ensure results has the expected structure
      const importResults = {
        success: successArray,
        errors: errorsArray
      };

      setImportResults(importResults);

      if (actualInserted > 0) {
        toast.success(`Successfully imported ${actualInserted} users`);
        // Don't refresh yet - wait for user to click "Done"
        // fetchUsers will be called when modal closes
      }

      if (errorsArray.length > 0) {
        toast.error(`${errorsArray.length} rows had errors`);
      }

      if (actualInserted === 0 && errorsArray.length === 0) {
        toast.error('No users were imported. Please check your CSV file.');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import users. Please try again.';
      toast.error(errorMessage);

      // Check if there are partial results in the error response
      const partialResults = error.response?.data?.results;
      if (partialResults) {
        setImportResults({
          success: partialResults.successData || partialResults.success || [],
          errors: partialResults.errors || []
        });
      } else {
        setImportResults({
          success: [],
          errors: [{ row: 'N/A', error: errorMessage, data: {} }]
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Old import processing logic (keeping for reference)
  const processImportOld = async () => {
    if (!importPreview.length) {
      toast.error('No data to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Validate data
      const validationErrors = validateImportData(importPreview, activeTab);

      if (validationErrors.length > 0) {
        setImportResults({
          success: [],
          errors: validationErrors
        });
        setIsImporting(false);
        return;
      }

      const successResults: Array<{ userId: string, email: string, password: string, role: string }> = [];
      const errorResults: Array<{ row: number, error: string, data: any }> = [];

      // Process each row
      for (let i = 0; i < importPreview.length; i++) {
        const row = importPreview[i];
        setImportProgress(((i + 1) / importPreview.length) * 100);

        try {
          // Generate user ID and password
          const schoolCode = user?.schoolCode || 'P';
          const userId = await generateUserId(activeTab, schoolCode);

          // Use DOB as password (format: DDMMYYYY)
          const dobStr = row['Date of Birth* (YYYY-MM-DD)'];
          const dobDate = new Date(dobStr);
          const dobPassword = `${dobDate.getDate().toString().padStart(2, '0')}${(dobDate.getMonth() + 1).toString().padStart(2, '0')}${dobDate.getFullYear()}`;

          // Create comprehensive user data based on role and all template fields
          let userData: any = {
            userId: userId,
            generatedPassword: dobPassword,
            role: activeTab,
            email: row['Email*'],

            // Name structure
            name: {
              firstName: row['First Name*'],
              middleName: row['Middle Name'] || '',
              lastName: row['Last Name*'],
              displayName: `${row['First Name*']} ${row['Last Name*']}`
            },

            // Contact information
            contact: {
              primaryPhone: row['Phone*'].replace(/\D/g, ''),
              phone: row['Phone*'].replace(/\D/g, '')
            },

            // Personal information
            personalInfo: {
              dateOfBirth: row['Date of Birth* (YYYY-MM-DD)'],
              placeOfBirth: row['Place of Birth'] || '',
              gender: row['Gender*'].toLowerCase(),
              bloodGroup: row['Blood Group'] || '',
              nationality: row['Nationality'] || 'Indian',
              religion: row['Religion'] || '',
              religionOther: row['Religion Other'] || '',
              caste: row['Caste'] || '',
              casteOther: row['Caste Other'] || '',
              category: row['Category'] || '',
              categoryOther: row['Category Other'] || '',
              motherTongue: row['Mother Tongue'] || '',
              motherTongueOther: row['Mother Tongue Other'] || '',
              languagesKnown: row['Languages Known'] ? row['Languages Known'].split(',').map((s: string) => s.trim()) : [],
              maritalStatus: row['Marital Status'] || '',
              spouseName: row['Spouse Name'] || ''
            },

            // Address information
            address: {
              current: {
                addressLine1: row['Current Address Line 1*'],
                addressLine2: row['Current Address Line 2'] || '',
                city: row['Current City*'],
                district: row['Current District*'],
                state: row['Current State*'],
                pinCode: row['Current Pin Code*'],
                taluka: row['Current Taluka'] || '',
                urbanRural: row['Current Urban Rural'] || ''
              },
              permanent: {
                addressLine1: row['Permanent Address Line 1'] || '',
                addressLine2: row['Permanent Address Line 2'] || '',
                city: row['Permanent City'] || '',
                district: row['Permanent District'] || '',
                state: row['Permanent State'] || '',
                pinCode: row['Permanent Pin Code'] || '',
                taluka: row['Permanent Taluka'] || '',
                urbanRural: row['Permanent Urban Rural'] || ''
              }
            },

            // Identity documents
            identityDocs: {
              aadhaarNumber: row['Aadhaar Number'] || '',
              panNumber: row['PAN Number'] || '',
              passportNumber: row['Passport Number'] || '',
              drivingLicense: row['Driving License'] || ''
            },

            // Emergency contacts
            emergencyContacts: []
          };

          // Add emergency contacts if provided
          if (row['Emergency Contact 1 Name']) {
            userData.emergencyContacts.push({
              name: row['Emergency Contact 1 Name'],
              relationship: row['Emergency Contact 1 Relationship'] || '',
              phone: row['Emergency Contact 1 Phone'] || '',
              address: row['Emergency Contact 1 Address'] || '',
              isPrimary: ['true', 'yes'].includes((row['Emergency Contact 1 Is Primary'] || '').toLowerCase())
            });
          }

          if (row['Emergency Contact 2 Name']) {
            userData.emergencyContacts.push({
              name: row['Emergency Contact 2 Name'],
              relationship: row['Emergency Contact 2 Relationship'] || '',
              phone: row['Emergency Contact 2 Phone'] || '',
              address: row['Emergency Contact 2 Address'] || '',
              isPrimary: ['true', 'yes'].includes((row['Emergency Contact 2 Is Primary'] || '').toLowerCase())
            });
          }

          // Metadata
          userData.metadata = {
            source: row['Source'] || 'bulk_import',
            importBatch: row['Import Batch'] || new Date().toISOString().split('T')[0],
            tags: row['Tags'] ? row['Tags'].split(',').map((s: string) => s.trim()) : [],
            notes: row['Notes'] || ''
          };

          if (activeTab === 'student') {
            // Comprehensive student data mapping
            userData.studentDetails = {
              studentId: row['Student ID'] || '',
              admissionNumber: row['Admission Number'] || '',
              rollNumber: row['Roll Number'] || '',

              // Academic information
              academic: {
                currentClass: row['Class*'],
                currentSection: row['Section*'] || 'A',
                academicYear: row['Academic Year'] || '2024-25',
                admissionDate: row['Admission Date (YYYY-MM-DD)'] ? new Date(row['Admission Date (YYYY-MM-DD)']) : new Date(),
                admissionClass: row['Admission Class'] || row['Class*'],
                stream: row['Stream'] || '',
                electives: row['Electives'] ? row['Electives'].split(',').map((s: string) => s.trim()) : [],
                enrollmentNo: row['Enrollment No'] || '',
                tcNo: row['TC No'] || '',
                previousSchool: {
                  name: row['Previous School Name'] || '',
                  board: row['Previous School Board'] || '',
                  lastClass: row['Previous School Last Class'] || '',
                  tcNumber: row['Previous School TC Number'] || '',
                  tcDate: row['Previous School TC Date (YYYY-MM-DD)'] ? new Date(row['Previous School TC Date (YYYY-MM-DD)']) : null,
                  reasonForTransfer: row['Reason for Transfer'] || ''
                }
              },

              // Personal information (Karnataka SATS)
              personal: {
                ...userData.personalInfo,
                studentNameKannada: row['Student Name Kannada'] || '',
                ageYears: row['Age Years'] ? parseInt(row['Age Years']) : null,
                ageMonths: row['Age Months'] ? parseInt(row['Age Months']) : null,
                socialCategory: row['Social Category'] || '',
                socialCategoryOther: row['Social Category Other'] || '',
                studentCaste: row['Student Caste'] || '',
                studentCasteOther: row['Student Caste Other'] || '',
                studentAadhaar: row['Student Aadhaar'] || '',
                studentCasteCertNo: row['Student Caste Certificate No'] || '',
                belongingToBPL: row['Belonging to BPL'] || 'No',
                bplCardNo: row['BPL Card No'] || '',
                bhagyalakshmiBondNo: row['Bhagyalakshmi Bond No'] || '',
                disability: row['Disability'] || 'Not Applicable',
                disabilityOther: row['Disability Other'] || ''
              },

              // Family information
              family: {
                father: {
                  name: row['Father Name*'],
                  nameKannada: row['Father Name Kannada'] || '',
                  occupation: row['Father Occupation'] || '',
                  qualification: row['Father Qualification'] || '',
                  phone: row['Father Phone'] || '',
                  email: row['Father Email'] || '',
                  workAddress: row['Father Work Address'] || '',
                  annualIncome: row['Father Annual Income'] ? parseFloat(row['Father Annual Income']) : null,
                  aadhaar: row['Father Aadhaar'] || '',
                  caste: row['Father Caste'] || '',
                  casteOther: row['Father Caste Other'] || '',
                  casteCertNo: row['Father Caste Certificate No'] || ''
                },
                mother: {
                  name: row['Mother Name*'],
                  nameKannada: row['Mother Name Kannada'] || '',
                  occupation: row['Mother Occupation'] || '',
                  qualification: row['Mother Qualification'] || '',
                  phone: row['Mother Phone'] || '',
                  email: row['Mother Email'] || '',
                  workAddress: row['Mother Work Address'] || '',
                  annualIncome: row['Mother Annual Income'] ? parseFloat(row['Mother Annual Income']) : null,
                  aadhaar: row['Mother Aadhaar'] || '',
                  caste: row['Mother Caste'] || '',
                  casteOther: row['Mother Caste Other'] || '',
                  casteCertNo: row['Mother Caste Certificate No'] || ''
                },
                guardian: {
                  name: row['Guardian Name'] || '',
                  relationship: row['Guardian Relationship'] || '',
                  phone: row['Guardian Phone'] || '',
                  email: row['Guardian Email'] || '',
                  address: row['Guardian Address'] || '',
                  isEmergencyContact: ['true', 'yes'].includes((row['Guardian Is Emergency Contact'] || '').toLowerCase())
                },
                siblings: []
              },

              // Medical information
              medical: {
                allergies: row['Allergies'] ? row['Allergies'].split(',').map((s: string) => s.trim()) : [],
                chronicConditions: row['Chronic Conditions'] ? row['Chronic Conditions'].split(',').map((s: string) => s.trim()) : [],
                medications: row['Medications'] ? row['Medications'].split(',').map((s: string) => s.trim()) : [],
                emergencyMedicalContact: {
                  doctorName: row['Emergency Doctor Name'] || '',
                  hospitalName: row['Emergency Hospital Name'] || '',
                  phone: row['Emergency Hospital Phone'] || ''
                },
                lastMedicalCheckup: row['Last Medical Checkup (YYYY-MM-DD)'] ? new Date(row['Last Medical Checkup (YYYY-MM-DD)']) : null,
                vaccinationStatus: row['Vaccination Status'] ? row['Vaccination Status'].split(',').map((v: string) => ({ vaccine: v.trim(), date: new Date(), nextDue: null })) : []
              },

              // Transportation
              transport: {
                mode: row['Transport Mode'] || '',
                busRoute: row['Bus Route'] || '',
                pickupPoint: row['Pickup Point'] || '',
                dropPoint: row['Drop Point'] || '',
                pickupTime: row['Pickup Time'] || '',
                dropTime: row['Drop Time'] || ''
              },

              // Financial information
              financial: {
                feeCategory: row['Fee Category'] || 'regular',
                concessionType: row['Concession Type'] || '',
                concessionPercentage: row['Concession Percentage'] ? parseFloat(row['Concession Percentage']) : null,
                scholarshipDetails: {
                  name: row['Scholarship Name'] || '',
                  amount: row['Scholarship Amount'] ? parseFloat(row['Scholarship Amount']) : null,
                  provider: row['Scholarship Provider'] || ''
                },
                bankDetails: {
                  bankName: row['Bank Name'] || '',
                  accountNumber: row['Account Number'] || '',
                  ifscCode: row['IFSC Code'] || '',
                  accountHolderName: row['Account Holder Name'] || ''
                }
              },

              // Academic history
              academicHistory: row['Current Academic Year'] ? [{
                academicYear: row['Current Academic Year'],
                class: row['Class*'],
                section: row['Section*'] || 'A',
                result: row['Current Class Result'] || '',
                percentage: row['Current Percentage'] ? parseFloat(row['Current Percentage']) : null,
                rank: row['Current Rank'] ? parseInt(row['Current Rank']) : null,
                attendance: row['Current Attendance'] ? parseFloat(row['Current Attendance']) : null
              }] : []
            };

            // Add siblings information
            for (let i = 1; i <= 3; i++) {
              if (row[`Sibling ${i} Name`]) {
                userData.studentDetails.family.siblings.push({
                  name: row[`Sibling ${i} Name`],
                  age: row[`Sibling ${i} Age`] ? parseInt(row[`Sibling ${i} Age`]) : null,
                  relationship: row[`Sibling ${i} Relationship`] || '',
                  school: row[`Sibling ${i} School`] || '',
                  class: row[`Sibling ${i} Class`] || ''
                });
              }
            }

          } else if (activeTab === 'teacher') {
            // Comprehensive teacher data mapping
            userData.teacherDetails = {
              employeeId: row['Employee ID'] || '',
              joiningDate: row['Joining Date (YYYY-MM-DD)'] ? new Date(row['Joining Date (YYYY-MM-DD)']) : new Date(),
              designation: row['Designation'] || '',
              department: row['Department'] || '',

              // Qualification
              qualification: {
                highest: row['Highest Qualification*'],
                specialization: row['Specialization'] || '',
                university: row['University'] || '',
                year: row['Qualification Year'] ? parseInt(row['Qualification Year']) : null,
                teachingLicense: row['Teaching License'] || '',
                certificates: []
              },

              // Experience
              experience: {
                total: row['Total Experience (Years)*'] ? parseInt(row['Total Experience (Years)*']) : 0,
                atCurrentSchool: row['Experience at Current School (Years)'] ? parseInt(row['Experience at Current School (Years)']) : 0,
                previousSchools: []
              },

              // Subjects
              subjects: [],

              // Class teacher and responsibilities
              classTeacherOf: row['Class Teacher Of'] || '',
              responsibilities: row['Responsibilities'] ? row['Responsibilities'].split(',').map((s: string) => s.trim()) : [],

              // Work schedule
              workSchedule: {
                workingDays: row['Working Days'] ? row['Working Days'].split(',').map((s: string) => s.trim()) : [],
                workingHours: {
                  start: row['Working Hours Start'] || '',
                  end: row['Working Hours End'] || ''
                },
                maxPeriodsPerDay: row['Max Periods Per Day'] ? parseInt(row['Max Periods Per Day']) : null,
                maxPeriodsPerWeek: row['Max Periods Per Week'] ? parseInt(row['Max Periods Per Week']) : null
              },

              // Performance reviews
              performanceReviews: row['Latest Review Academic Year'] ? [{
                academicYear: row['Latest Review Academic Year'],
                rating: row['Latest Review Rating'] ? parseFloat(row['Latest Review Rating']) : null,
                comments: row['Latest Review Comments'] || '',
                reviewedBy: null,
                reviewDate: new Date()
              }] : [],

              // Salary
              salary: {
                basic: row['Basic Salary'] ? parseFloat(row['Basic Salary']) : null,
                allowances: [],
                currency: row['Currency'] || 'INR'
              },

              // Bank details
              bankDetails: {
                bankName: row['Bank Name'] || '',
                accountNumber: row['Account Number'] || '',
                ifscCode: row['IFSC Code'] || '',
                branchName: row['Branch Name'] || '',
                accountHolderName: row['Account Holder Name'] || `${row['First Name*']} ${row['Last Name*']}`
              }
            };

            // Add certificates
            for (let i = 1; i <= 3; i++) {
              if (row[`Certificate ${i} Name`]) {
                userData.teacherDetails.qualification.certificates.push({
                  name: row[`Certificate ${i} Name`],
                  institution: row[`Certificate ${i} Institution`] || '',
                  year: row[`Certificate ${i} Year`] ? parseInt(row[`Certificate ${i} Year`]) : null,
                  documentUrl: ''
                });
              }
            }

            // Add previous schools
            for (let i = 1; i <= 3; i++) {
              if (row[`Previous School ${i} Name`]) {
                userData.teacherDetails.experience.previousSchools.push({
                  schoolName: row[`Previous School ${i} Name`],
                  duration: row[`Previous School ${i} Duration`] || '',
                  position: row[`Previous School ${i} Position`] || '',
                  reasonForLeaving: row[`Previous School ${i} Reason for Leaving`] || ''
                });
              }
            }

            // Add subjects
            for (let i = 1; i <= 3; i++) {
              const codeField = i === 1 ? 'Primary Subject 1 Code' : `Secondary Subject ${i} Code`;
              const nameField = i === 1 ? 'Primary Subject 1 Name' : `Secondary Subject ${i} Name`;
              const classesField = i === 1 ? 'Primary Subject 1 Classes' : `Secondary Subject ${i} Classes`;
              const isPrimaryField = i === 1 ? 'Primary Subject 1 Is Primary' : `Secondary Subject ${i} Is Primary`;

              if (row[codeField] || row[nameField]) {
                userData.teacherDetails.subjects.push({
                  subjectCode: row[codeField] || '',
                  subjectName: row[nameField] || '',
                  classes: row[classesField] ? row[classesField].split(',').map((s: string) => s.trim()) : [],
                  isPrimary: ['true', 'yes'].includes((row[isPrimaryField] || '').toLowerCase())
                });
              }
            }

            // Add salary allowances
            const allowanceTypes = ['HRA', 'Transport', 'Medical'];
            allowanceTypes.forEach(type => {
              const amount = row[`${type} Allowance`];
              if (amount && parseFloat(amount) > 0) {
                userData.teacherDetails.salary.allowances.push({
                  type: type,
                  amount: parseFloat(amount)
                });
              }
            });

            // Add other allowances if specified
            if (row['Other Allowances']) {
              row['Other Allowances'].split(',').forEach((allowance: string) => {
                const [type, amount] = allowance.trim().split(':');
                if (type && amount) {
                  userData.teacherDetails.salary.allowances.push({
                    type: type.trim(),
                    amount: parseFloat(amount.trim())
                  });
                }
              });
            }

          } else if (activeTab === 'admin') {
            // Comprehensive admin data mapping
            userData.adminDetails = {
              adminId: row['Admin ID'] || '',
              adminLevel: row['Admin Level*'],
              designation: row['Designation*'],
              department: row['Department*'],
              joiningDate: row['Joining Date (YYYY-MM-DD)'] ? new Date(row['Joining Date (YYYY-MM-DD)']) : new Date(),
              reportingManager: row['Reporting Manager'] || '',

              // Permissions
              permissions: {
                list: row['Permissions'] ? row['Permissions'].split(',').map((s: string) => s.trim()) : [],
                accessLevel: row['Access Level'] || '',
                canManageUsers: ['true', 'yes'].includes((row['Can Manage Users'] || '').toLowerCase()),
                canManageAcademics: ['true', 'yes'].includes((row['Can Manage Academics'] || '').toLowerCase()),
                canManageFinance: ['true', 'yes'].includes((row['Can Manage Finance'] || '').toLowerCase()),
                canManageReports: ['true', 'yes'].includes((row['Can Manage Reports'] || '').toLowerCase()),
                canManageSchoolSettings: ['true', 'yes'].includes((row['Can Manage School Settings'] || '').toLowerCase()),
                canViewAllData: ['true', 'yes'].includes((row['Can View All Data'] || '').toLowerCase()),
                canExportData: ['true', 'yes'].includes((row['Can Export Data'] || '').toLowerCase()),
                canImportData: ['true', 'yes'].includes((row['Can Import Data'] || '').toLowerCase())
              },

              // Responsibilities
              responsibilities: {
                primary: row['Primary Responsibilities'] ? row['Primary Responsibilities'].split(',').map((s: string) => s.trim()) : [],
                secondary: row['Secondary Responsibilities'] ? row['Secondary Responsibilities'].split(',').map((s: string) => s.trim()) : [],
                committees: row['Committees'] ? row['Committees'].split(',').map((s: string) => s.trim()) : [],
                specialDuties: row['Special Duties'] ? row['Special Duties'].split(',').map((s: string) => s.trim()) : []
              },

              // Qualification
              qualification: {
                highest: row['Highest Qualification*'],
                specialization: row['Specialization'] || '',
                university: row['University'] || '',
                year: row['Qualification Year'] ? parseInt(row['Qualification Year']) : null
              },

              // Experience
              experience: {
                totalYears: row['Total Experience (Years)'] ? parseInt(row['Total Experience (Years)']) : null,
                administrativeYears: row['Administrative Experience (Years)'] ? parseInt(row['Administrative Experience (Years)']) : null,
                educationSectorYears: row['Education Sector Experience (Years)'] ? parseInt(row['Education Sector Experience (Years)']) : null,
                previousExperience: []
              },

              // Work schedule
              workSchedule: {
                workingDays: row['Working Days'] ? row['Working Days'].split(',').map((s: string) => s.trim()) : [],
                workingHours: {
                  start: row['Working Hours Start'] || '',
                  end: row['Working Hours End'] || ''
                },
                overtimeEligible: ['true', 'yes'].includes((row['Overtime Eligible'] || '').toLowerCase()),
                onCallDuties: row['On-Call Duties'] ? row['On-Call Duties'].split(',').map((s: string) => s.trim()) : []
              },

              // Salary
              salary: {
                basic: row['Basic Salary'] ? parseFloat(row['Basic Salary']) : null,
                allowances: [],
                currency: row['Currency'] || 'INR'
              },

              // Bank details
              bankDetails: {
                bankName: row['Bank Name'] || '',
                accountNumber: row['Account Number'] || '',
                ifscCode: row['IFSC Code'] || '',
                branchName: row['Branch Name'] || '',
                accountHolderName: row['Account Holder Name'] || `${row['First Name*']} ${row['Last Name*']}`
              },

              // System access
              systemAccess: {
                loginPermissions: row['Login Permissions'] || '',
                systemRole: row['System Role'] || '',
                multiSchoolAccess: ['true', 'yes'].includes((row['Multi-School Access'] || '').toLowerCase()),
                apiAccess: ['true', 'yes'].includes((row['API Access'] || '').toLowerCase()),
                reportingAccess: row['Reporting Access'] || ''
              },

              // Performance review
              performanceReview: {
                latestReviewDate: row['Latest Review Date'] ? new Date(row['Latest Review Date']) : null,
                latestReviewRating: row['Latest Review Rating'] ? parseFloat(row['Latest Review Rating']) : null,
                latestReviewComments: row['Latest Review Comments'] || '',
                goalsAndTargets: row['Goals and Targets'] ? row['Goals and Targets'].split(',').map((s: string) => s.trim()) : []
              }
            };

            // Add previous experience
            for (let i = 1; i <= 3; i++) {
              if (row[`Previous Organization ${i}`]) {
                userData.adminDetails.experience.previousExperience.push({
                  organization: row[`Previous Organization ${i}`],
                  position: row[`Previous Position ${i}`] || '',
                  duration: row[`Previous Duration ${i}`] || '',
                  responsibilities: row[`Previous Responsibilities ${i}`] || ''
                });
              }
            }

            // Add salary allowances
            const allowanceTypes = ['HRA', 'Transport', 'Medical', 'Management'];
            allowanceTypes.forEach(type => {
              const amount = row[`${type} Allowance`];
              if (amount && parseFloat(amount) > 0) {
                userData.adminDetails.salary.allowances.push({
                  type: type,
                  amount: parseFloat(amount)
                });
              }
            });

            // Add other allowances if specified
            if (row['Other Allowances']) {
              row['Other Allowances'].split(',').forEach((allowance: string) => {
                const [type, amount] = allowance.trim().split(':');
                if (type && amount) {
                  userData.adminDetails.salary.allowances.push({
                    type: type.trim(),
                    amount: parseFloat(amount.trim())
                  });
                }
              });
            }
          }

          // Create user via API
          const response = await schoolUserAPI.createUser(userData);

          successResults.push({
            userId: userId,
            email: row['Email*'],
            password: dobPassword,
            role: activeTab
          });

        } catch (error: any) {
          console.error(`Error creating user in row ${row._rowIndex}:`, error);
          errorResults.push({
            row: row._rowIndex,
            error: error.response?.data?.message || error.message || 'Failed to create user',
            data: row
          });
        }
      }

      setImportResults({
        success: successResults,
        errors: errorResults
      });

      if (successResults.length > 0) {
        toast.success(`Successfully imported ${successResults.length} users!`);
        fetchUsers(); // Refresh the users list
      }

      if (errorResults.length > 0) {
        toast.error(`${errorResults.length} users failed to import. Check the results.`);
      }

    } catch (error) {
      console.error('Import process error:', error);
      toast.error('Import process failed');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const downloadCredentials = () => {
    if (!importResults?.success.length) {
      toast.error('No successful imports to download credentials for');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `imported_user_credentials_${currentDate}.csv`;

    // 1. Changed 'Password' to 'Default Password'
    const headers = ['User ID', 'Email', 'Default Password', 'Role', 'Login Instructions'];

    // 2. Changed 'user.password' to the actual instruction
    const rows = importResults.success.map(user => [
      user.userId,
      user.email,
      'Use DOB (DDMMYYYY)', // <-- THE FIX
      user.role,
      'Use Date of Birth (DDMMYYYY) as password, change on first login'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," +
      headers.join(',') + '\n' +
      rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('User credentials downloaded successfully!');
  };
  // Helper function to organize students hierarchically
  const organizeStudentsByClass = () => {
    const students = filteredUsers.filter(user => user.role === 'student');
    const organized: { [key: string]: { [key: string]: User[] } } = {};

    // Define class order
    const classOrder = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    students.forEach(student => {
      const className = student.studentDetails?.class || 'Unassigned';
      const section = student.studentDetails?.section || 'A';

      if (!organized[className]) {
        organized[className] = {};
      }
      if (!organized[className][section]) {
        organized[className][section] = [];
      }
      organized[className][section].push(student);
    });

    // Sort classes according to defined order
    const sortedClasses = Object.keys(organized).sort((a, b) => {
      const indexA = classOrder.indexOf(a);
      const indexB = classOrder.indexOf(b);

      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const result: { [key: string]: { [key: string]: User[] } } = {};
    sortedClasses.forEach(className => {
      result[className] = organized[className];
      // Sort sections within each class
      const sortedSections: { [key: string]: User[] } = {};
      Object.keys(organized[className]).sort().forEach(section => {
        sortedSections[section] = organized[className][section].sort((a, b) => a.name.localeCompare(b.name));
      });
      result[className] = sortedSections;
    });

    return result;
  };

  const toggleClassExpansion = (className: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(className)) {
      newExpanded.delete(className);
    } else {
      newExpanded.add(className);
    }
    setExpandedClasses(newExpanded);
  };

  // Handle grade change and reset section
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedSection('all'); // Reset section when grade changes
  };
  const userData = user as DisplayUser;

  // Add error boundary state
  const [hasRenderError, setHasRenderError] = React.useState(false);

  if (hasRenderError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">There was an error rendering the page.</p>
          <button
            onClick={() => {
              setHasRenderError(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  try {
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
                onClick={() => {
                  console.log('🔄 Switching to Student tab');
                  setActiveTab('student');
                  // If modal is open, update the role immediately
                  if (showAddModal) {
                    handleRoleChange('student');
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'student'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Students ({users.filter(u => u.role === 'student').length})
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Switching to Teacher tab');
                  setActiveTab('teacher');
                  // If modal is open, update the role immediately
                  if (showAddModal) {
                    handleRoleChange('teacher');
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'teacher'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Teachers ({users.filter(u => u.role === 'teacher').length})
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Switching to Admin tab');
                  setActiveTab('admin');
                  // If modal is open, update the role immediately
                  if (showAddModal) {
                    handleRoleChange('admin');
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin'
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Classes</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
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

                    {/* Section Dropdown - only show when a specific class is selected */}
                    {selectedGrade !== 'all' && (
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                        <option value="E">Section E</option>
                        <option value="F">Section F</option>
                      </select>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Table View
                    </button>
                    <button
                      onClick={() => setViewMode('hierarchy')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === 'hierarchy'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Class View
                    </button>
                  </div>
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
                onClick={() => {
                  try {
                    console.log('Opening import modal for:', activeTab);
                    setShowImportModal(true);
                  } catch (error) {
                    console.error('Error opening import modal:', error);
                    toast.error('Failed to open import dialog');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button
                onClick={() => generateTemplate(activeTab)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={`Download ${activeTab} import template`}
              >
                <FileText className="h-4 w-4" />
                <span>Template</span>
              </button>
              {activeTab === 'teacher' && (
                <button
                  onClick={handleShowAllPasswords}
                  className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${allPasswordsVisible
                    ? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  title={allPasswordsVisible ? "Hide all teacher passwords" : "Show all teacher passwords (requires admin password)"}
                >
                  {allPasswordsVisible ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide All Passwords</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Show All Passwords</span>
                    </>
                  )}
                </button>
              )}
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
                  // For students, don't generate password until DOB is entered
                  const password = activeTab === 'student' ? '' : generatePassword();
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

        {/* Users Display */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {activeTab === 'student' && viewMode === 'hierarchy' ? (
            /* Hierarchical Student View */
            <div className="p-6">
              {Object.keys(organizeStudentsByClass()).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(organizeStudentsByClass()).map(([className, sections]) => (
                    <div key={className} className="border border-gray-200 rounded-lg">
                      {/* Class Header */}
                      <div
                        className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                        onClick={() => toggleClassExpansion(className)}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`transform transition-transform ${expandedClasses.has(className) ? 'rotate-90' : ''}`}>
                            ▶️
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Class {className}
                          </h3>
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                            {Object.values(sections).reduce((total, students) => total + students.length, 0)} students
                          </span>
                        </div>
                      </div>

                      {/* Sections */}
                      {expandedClasses.has(className) && (
                        <div className="border-t border-gray-200">
                          {Object.entries(sections).map(([section, students]) => (
                            <div key={section} className="border-b border-gray-100 last:border-b-0">
                              {/* Section Header */}
                              <div className="bg-gray-25 px-6 py-2 border-b border-gray-100">
                                <h4 className="text-md font-medium text-gray-700 flex items-center space-x-2">
                                  <span>Section {section}</span>
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                    {students.length} students
                                  </span>
                                </h4>
                              </div>

                              {/* Students in Section */}
                              <div className="divide-y divide-gray-100">
                                {students.map((student) => (
                                  <div key={student._id} className="px-6 py-3 hover:bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <span className="text-sm font-medium text-blue-600">
                                            {student.name.charAt(0)}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.email}</div>
                                        {student.studentDetails?.studentId && (
                                          <div className="text-xs text-gray-400">ID: {student.studentDetails.studentId}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center">
                                        {student.isActive ? (
                                          <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                                        ) : (
                                          <UserX className="h-4 w-4 text-red-500 mr-1" />
                                        )}
                                        <span className={`text-sm ${student.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                          {student.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleEditClick(student)}
                                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                          title="Edit User"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        {/* Reset Password removed for students */}
                                        <button
                                          onClick={() => handleDeleteUser(student._id, student.name || `User ${student._id}`)}
                                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                          title="Delete User"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
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
                    filteredUsers.map((user) => {
                      // Construct photo URL (robust): remove trailing '/api' from API base or fallback to current origin
                      const envBase = (import.meta.env.VITE_API_BASE_URL as string) || '';
                      const originBase = envBase ? envBase.replace(/\/api\/?$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
                      const photoUrl = (user as any).profileImage || (user as any).profilePicture;
                      const fullPhotoUrl = photoUrl
                        ? (photoUrl.startsWith('http') ? photoUrl : `${originBase}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`)
                        : null;

                      // Get user initials for fallback
                      const firstName = (user as any).name?.firstName || '';
                      const lastName = (user as any).name?.lastName || '';
                      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';

                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          {/* Photo Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-10 w-10">
                              {fullPhotoUrl ? (
                                <img
                                  src={fullPhotoUrl}
                                  // alt={`${(user as any).name?.displayName || 'User'} photo`}
                                  alt={`${fullPhotoUrl}`}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                  onError={(e) => {
                                    // Fallback to initials if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><span class="text-sm font-medium text-blue-700">${initials}</span></div>`;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-700">{initials}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* User Column */}
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
                                {/* Reads from the processed studentDetails object */}
                                {user.studentDetails?.class || 'Not assigned'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {/* Reads from the processed studentDetails object */}
                                {user.studentDetails?.section || 'Not assigned'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(user as any).userId || user._id || 'Not assigned'}
                              </td>
                            </>
                          )}
                          {activeTab === 'teacher' && (
                            <>
                              {/* Employee ID Column - Access via user.teacherDetails */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.teacherDetails?.employeeId || 'N/A'}
                              </td>

                              {/* Password Column - Access user.temporaryPassword directly */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  {(user as any).temporaryPassword ? (
                                    <>
                                      {/* Display Password with Show/Hide */}
                                      <span className="flex-grow font-mono text-xs text-gray-700">
                                        {passwordVisibility[user.userId]
                                          ? (user as any).temporaryPassword
                                          : '********'
                                        }
                                      </span>
                                      {/* Show/Hide Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePasswordVisibility(user.userId, (user as any).name?.displayName || 'this user');
                                        }}
                                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 flex-shrink-0"
                                        title={passwordVisibility[user.userId] ? "Hide password" : "Show password (requires admin password)"}
                                        type="button"
                                      >
                                        {passwordVisibility[user.userId] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Not Available</span>
                                  )}
                                </div>
                              </td>

                              {/* Experience Column - Access via user.teacherDetails */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {/* Check if experience is defined and not null */}
                                {user.teacherDetails?.experience !== undefined && user.teacherDetails?.experience !== null
                                  ? `${user.teacherDetails.experience} years`
                                  : 'N/A'}
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
                              {/* Change Password only for teachers */}
                              {activeTab === 'teacher' && (
                                <button
                                  onClick={() => {
                                    console.log('Change password clicked for:', user.userId, user.email);
                                    handleOpenChangePassword(
                                      user.userId || user._id,
                                      (user as any).name?.displayName || (user as any).name || 'User',
                                      user.email
                                    );
                                  }}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="Change Password (Set New Password)"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </button>
                              )}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto relative z-[61]">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Add New {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} - Enrollment Form
              </h3>
              <form onSubmit={handleAddUser} onKeyDown={handleFormKeyDown} className="space-y-6">

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
                        value={loadingNextId ? 'Generating next ID...' : (formData.userId || nextUserId || 'Select a role to auto-generate ID')}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                        placeholder="Next sequential ID will appear here"
                      />
                      {!formData.userId && !loadingNextId && formData.role && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-700">
                            💡 Select a role above to automatically fetch the next available ID from the database
                          </p>
                        </div>
                      )}
                      {formData.userId && !loadingNextId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs text-green-700 font-medium">
                            ✅ Next available ID for {formData.role} role: <strong>{formData.userId}</strong>
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            This ID has been reserved from the backend database
                          </p>
                        </div>
                      )}
                      {loadingNextId && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-700">
                            🔄 Fetching next available ID from database...
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.role === 'student' ? 'Student Password' : 'Generated Password'}
                        {formData.generatedPassword && <span className="text-green-600 ml-1">✅</span>}
                      </label>
                      {formData.role === 'student' ? (
                        <div>
                          {formData.generatedPassword ? (
                            <div className="w-full border rounded-lg px-3 py-2 bg-green-50 border-green-300 text-green-800 font-mono">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-lg">{formData.generatedPassword}</span>
                                <span className="text-green-600 text-sm font-semibold">✅ Generated from DOB</span>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Password format: DDMMYYYY (e.g., 15032010)
                              </div>
                            </div>
                          ) : (
                            <div className="w-full border rounded-lg px-3 py-2 bg-blue-50 border-blue-300 text-blue-800">
                              <div className="flex items-center">
                                <span className="text-blue-500 mr-2">📅</span>
                                <span className="font-medium">Enter Date of Birth to generate password</span>
                              </div>
                              <div className="text-sm text-blue-600 mt-1">
                                Password will be in DDMMYYYY format (e.g., 15032010)
                              </div>
                            </div>
                          )}
                          {formData.generatedPassword && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <span className="text-green-500 text-lg">🔐</span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-green-700 font-medium">
                                    ✅ Password created from Date of Birth: <code className="bg-green-100 px-2 py-1 rounded font-mono text-sm">{formData.generatedPassword}</code>
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Give this password to the student for their first login. They will be required to change it on first login.
                                  </p>
                                  <div className="mt-2 text-xs text-green-600">
                                    <strong>Format:</strong> DDMMYYYY (Day-Month-Year)
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.generatedPassword || 'Password will be generated when role is selected'}
                          readOnly
                          className={`w-full border rounded-lg px-3 py-2 font-mono ${formData.generatedPassword
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                            }`}
                          placeholder="8-character secure password will appear here"
                        />
                      )}
                      {formData.generatedPassword && formData.role !== 'student' && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs text-green-700 font-medium">
                            ✅ 8-character secure password generated:
                            <code className="bg-green-100 px-1 rounded">{formData.generatedPassword}</code>
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Copy this password - user will need it for first login
                          </p>
                        </div>
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
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName}`.trim() })}
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
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value, name: `${formData.firstName} ${e.target.value}`.trim() })}
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter phone number (10 digits)"
                        pattern="[0-9]{10}"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth || formData.studentDetails?.dateOfBirth || ''}
                        onChange={(e) => handleDOBChangeWithStudentDetails(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={formData.gender || formData.studentDetails?.gender || 'male'}
                        onChange={(e) => {
                          const newGender = e.target.value;
                          setFormData({
                            ...formData,
                            gender: newGender as any,
                            studentDetails: {
                              ...formData.studentDetails,
                              gender: newGender
                            }
                          });
                        }}
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
                            onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter enrollment number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">TC No</label>
                          <input
                            type="text"
                            value={formData.tcNo}
                            onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
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
                          {classesLoading ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                              Loading classes...
                            </div>
                          ) : (
                            <select
                              required
                              value={formData.class || formData.studentDetails?.currentClass || ''}
                              onChange={(e) => {
                                const newClass = e.target.value;
                                handleClassSelection(newClass); // Update sections
                                setFormData({
                                  ...formData,
                                  class: newClass,
                                  section: '', // Clear section when class changes
                                  studentDetails: {
                                    ...formData.studentDetails,
                                    currentClass: newClass,
                                    currentSection: '' // Clear section when class changes
                                  }
                                });
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select Class</option>
                              {hasClasses() ? (
                                getClassOptions().map(cls => (
                                  <option key={cls.value} value={cls.value}>{cls.label}</option>
                                ))
                              ) : (
                                <>
                                  <option value="LKG">LKG</option>
                                  <option value="UKG">UKG</option>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                    <option key={num} value={num.toString()}>{num}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          )}
                          {classesError && <p className="text-yellow-600 text-sm mt-1">⚠️ Using default classes (Super Admin hasn't configured classes yet)</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                          <select
                            required
                            value={formData.studentDetails?.academicYear || '2024-25'}
                            onChange={(e) => {
                              const newYear = e.target.value;
                              setFormData({
                                ...formData,
                                studentDetails: {
                                  ...formData.studentDetails,
                                  academicYear: newYear
                                }
                              });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="2024-25">2024-25</option>
                            <option value="2025-26">2025-26</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                          <select
                            value={formData.section || formData.studentDetails?.currentSection || ''}
                            onChange={(e) => {
                              const newSection = e.target.value;
                              setFormData({
                                ...formData,
                                section: newSection,
                                studentDetails: {
                                  ...formData.studentDetails,
                                  currentSection: newSection
                                }
                              });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            disabled={!formData.class && !formData.studentDetails?.currentClass}
                          >
                            <option value="">
                              {!formData.class && !formData.studentDetails?.currentClass
                                ? 'Select Class First'
                                : 'Select Section'
                              }
                            </option>
                            {availableSections.length > 0 ? (
                              availableSections.map(section => (
                                <option key={section.value} value={section.value}>{section.label}</option>
                              ))
                            ) : (
                              ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(letter => (
                                <option key={letter} value={letter}>Section {letter}</option>
                              ))
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medium of Instruction *</label>
                          <select
                            required
                            value={formData.mediumOfInstruction}
                            onChange={(e) => setFormData({ ...formData, mediumOfInstruction: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
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
                          {formData.motherTongue === 'Other' && (
                            <input
                              type="text"
                              value={formData.motherTongueOther || ''}
                              onChange={(e) => setFormData({ ...formData, motherTongueOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify mother tongue"
                            />
                          )}
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
                            onChange={(e) => setFormData({ ...formData, name: e.target.value, firstName: e.target.value.split(' ')[0], lastName: e.target.value.split(' ').slice(1).join(' ') })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter full name in English"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.studentNameKannada}
                            onChange={(e) => setFormData({ ...formData, studentNameKannada: e.target.value })}
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
                            onChange={(e) => handleDOBChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                          <input
                            type="number"
                            value={formData.ageYears}
                            onChange={(e) => setFormData({ ...formData, ageYears: parseInt(e.target.value) || 0 })}
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
                            onChange={(e) => setFormData({ ...formData, ageMonths: parseInt(e.target.value) || 0 })}
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
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
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
                            onChange={(e) => setFormData({
                              ...formData,
                              fatherName: e.target.value,
                              studentDetails: {
                                ...formData.studentDetails,
                                fatherName: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter father's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.fatherNameKannada}
                            onChange={(e) => setFormData({ ...formData, fatherNameKannada: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter father's name in Kannada"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Aadhaar No</label>
                          <input
                            type="text"
                            value={formData.fatherAadhaar}
                            onChange={(e) => setFormData({ ...formData, fatherAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({
                              ...formData,
                              motherName: e.target.value,
                              studentDetails: {
                                ...formData.studentDetails,
                                motherName: e.target.value
                              }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter mother's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.motherNameKannada}
                            onChange={(e) => setFormData({ ...formData, motherNameKannada: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter mother's name in Kannada"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Aadhaar No</label>
                          <input
                            type="text"
                            value={formData.motherAadhaar}
                            onChange={(e) => setFormData({ ...formData, motherAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentCasteCertNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter certificate number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste Certificate No</label>
                          <input
                            type="text"
                            value={formData.fatherCasteCertNo}
                            onChange={(e) => setFormData({ ...formData, fatherCasteCertNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter certificate number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste Certificate No</label>
                          <input
                            type="text"
                            value={formData.motherCasteCertNo}
                            onChange={(e) => setFormData({ ...formData, motherCasteCertNo: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentCaste: e.target.value })}
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
                          {formData.studentCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.studentCasteOther}
                              onChange={(e) => setFormData({ ...formData, studentCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify student caste"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste</label>
                          <select
                            value={formData.fatherCaste}
                            onChange={(e) => setFormData({ ...formData, fatherCaste: e.target.value })}
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
                          {formData.fatherCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.fatherCasteOther}
                              onChange={(e) => setFormData({ ...formData, fatherCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify father caste"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste</label>
                          <select
                            value={formData.motherCaste}
                            onChange={(e) => setFormData({ ...formData, motherCaste: e.target.value })}
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
                          {formData.motherCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.motherCasteOther}
                              onChange={(e) => setFormData({ ...formData, motherCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify mother caste"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Social Category</label>
                          <select
                            value={formData.socialCategory}
                            onChange={(e) => setFormData({ ...formData, socialCategory: e.target.value })}
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
                            <option value="Other">Other</option>
                          </select>
                          {formData.socialCategory === 'Other' && (
                            <input
                              type="text"
                              value={formData.socialCategoryOther}
                              onChange={(e) => setFormData({ ...formData, socialCategoryOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify social category"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                          <select
                            value={formData.religion}
                            onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
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
                          {formData.religion === 'Other' && (
                            <input
                              type="text"
                              value={formData.religionOther}
                              onChange={(e) => setFormData({ ...formData, religionOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify religion"
                            />
                          )}
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
                            onChange={(e) => setFormData({ ...formData, belongingToBPL: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, bplCardNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter BPL card number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bhagyalakshmi Bond No</label>
                          <input
                            type="text"
                            value={formData.bhagyalakshmiBondNo}
                            onChange={(e) => setFormData({ ...formData, bhagyalakshmiBondNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter bond number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Needs - SATS Standard */}
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Special Needs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Disability / Child with Special Need</label>
                          <select
                            value={formData.disability}
                            onChange={(e) => setFormData({ ...formData, disability: e.target.value })}
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
                          {formData.disability === 'Other' && (
                            <input
                              type="text"
                              value={formData.disabilityOther}
                              onChange={(e) => setFormData({ ...formData, disabilityOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify disability type"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Is the student an RTE (Right to Education) candidate? <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.isRTECandidate || ''}
                            onChange={(e) => setFormData({ ...formData, isRTECandidate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select Option</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
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
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, cityVillageTown: e.target.value, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter city/village/town"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                          <input
                            type="text"
                            value={formData.locality}
                            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter locality"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code *</label>
                          <input
                            type="text"
                            required
                            value={formData.pinCode}
                            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="6-digit pin code"
                            pattern="[0-9]{6}"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-md font-medium text-gray-800 mb-2">Location Details (State, District, Taluka)</h5>
                        <LocationSelector
                          selectedState={formData.stateId}
                          selectedDistrict={formData.districtId}
                          selectedTaluka={formData.talukaId}
                          districtText={formData.districtText}
                          talukaText={formData.talukaText}
                          onStateChange={handleStateChange}
                          onDistrictChange={handleDistrictChange}
                          onTalukaChange={handleTalukaChange}
                          onDistrictTextChange={handleDistrictTextChange}
                          onTalukaTextChange={handleTalukaTextChange}
                          required={true}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            onChange={(e) => setFormData({ ...formData, studentMobile: e.target.value, phone: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Mobile No</label>
                          <input
                            type="tel"
                            value={formData.fatherMobile}
                            onChange={(e) => setFormData({ ...formData, fatherMobile: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Mobile No</label>
                          <input
                            type="tel"
                            value={formData.motherMobile}
                            onChange={(e) => setFormData({ ...formData, motherMobile: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, schoolAdmissionDate: e.target.value, admissionDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter bank name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                          <input
                            type="text"
                            value={formData.bankAccountNo}
                            onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter account number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                          <input
                            type="text"
                            value={formData.bankIFSC}
                            onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select Section</option>
                            {['A', 'B', 'C', 'D', 'E'].map(section => (
                              <option key={section} value={section}>{section}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                          <input
                            type="text"
                            value={formData.rollNumber}
                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter roll number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Essential Information - Missing Fields */}
                    <div className="bg-rose-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Essential Information</h4>

                      {/* Personal Details */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Personal Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                            <select
                              value={formData.bloodGroup || ''}
                              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                            <input
                              type="text"
                              required
                              value={formData.nationality || 'Indian'}
                              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter nationality"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                            <input
                              type="text"
                              value={formData.placeOfBirth || ''}
                              onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter place of birth"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Previous School Details */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Previous School Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Name</label>
                            <input
                              type="text"
                              value={formData.previousSchool || ''}
                              onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter previous school name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">TC Number</label>
                            <input
                              type="text"
                              value={formData.tcNumber || ''}
                              onChange={(e) => setFormData({ ...formData, tcNumber: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter TC number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Migration Certificate</label>
                            <input
                              type="text"
                              value={formData.migrationCertificate || ''}
                              onChange={(e) => setFormData({ ...formData, migrationCertificate: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter migration certificate number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Class Passed</label>
                            <input
                              type="text"
                              value={formData.previousClass || ''}
                              onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter last class passed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Guardian/Emergency Contact Details */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Guardian & Emergency Contact</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                            <input
                              type="text"
                              value={formData.guardianName || ''}
                              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter guardian name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Relationship</label>
                            <select
                              value={formData.guardianRelation || ''}
                              onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select Relationship</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Uncle">Uncle</option>
                              <option value="Aunt">Aunt</option>
                              <option value="Grandfather">Grandfather</option>
                              <option value="Grandmother">Grandmother</option>
                              <option value="Elder Brother">Elder Brother</option>
                              <option value="Elder Sister">Elder Sister</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                            <input
                              type="tel"
                              value={formData.alternatePhone || ''}
                              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="10-digit emergency contact"
                              pattern="[0-9]{10}"
                              maxLength={10}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Medical Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                            <textarea
                              value={formData.medicalConditions || ''}
                              onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter any chronic medical conditions"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
                            <textarea
                              value={formData.specialNeeds || ''}
                              onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter any special educational needs"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Transport Details */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Transport Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Required</label>
                            <select
                              value={formData.transportMode || 'Own'}
                              onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="Own">Own Transport</option>
                              <option value="School Bus">School Bus</option>
                              <option value="Public Transport">Public Transport</option>
                              <option value="Walking">Walking</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bus Route</label>
                            <input
                              type="text"
                              value={formData.busRoute || ''}
                              onChange={(e) => setFormData({ ...formData, busRoute: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter bus route (if applicable)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point</label>
                            <input
                              type="text"
                              value={formData.pickupPoint || ''}
                              onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter pickup point"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Document Information */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Additional Documents</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Certificate Number</label>
                            <input
                              type="text"
                              value={formData.birthCertificateNumber || ''}
                              onChange={(e) => setFormData({ ...formData, birthCertificateNumber: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter birth certificate number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ration Card Number</label>
                            <input
                              type="text"
                              value={formData.rationCardNumber || ''}
                              onChange={(e) => setFormData({ ...formData, rationCardNumber: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter ration card number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Details</label>
                            <input
                              type="text"
                              value={formData.scholarshipDetails || ''}
                              onChange={(e) => setFormData({ ...formData, scholarshipDetails: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter scholarship information"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Family Economic Information */}
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-800 mb-3">Family Economic Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Father Education</label>
                            <input
                              type="text"
                              value={formData.fatherEducation || ''}
                              onChange={(e) => setFormData({ ...formData, fatherEducation: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter father's education"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mother Education</label>
                            <input
                              type="text"
                              value={formData.motherEducation || ''}
                              onChange={(e) => setFormData({ ...formData, motherEducation: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter mother's education"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Family Income (Annual)</label>
                            <select
                              value={formData.familyIncome || ''}
                              onChange={(e) => setFormData({ ...formData, familyIncome: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select Income Range</option>
                              <option value="Below 1 Lakh">Below ₹1 Lakh</option>
                              <option value="1-2 Lakhs">₹1-2 Lakhs</option>
                              <option value="2-5 Lakhs">₹2-5 Lakhs</option>
                              <option value="5-10 Lakhs">₹5-10 Lakhs</option>
                              <option value="Above 10 Lakhs">Above ₹10 Lakhs</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Economic Status</label>
                            <select
                              value={formData.economicStatus || ''}
                              onChange={(e) => setFormData({ ...formData, economicStatus: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="">Select Status</option>
                              <option value="BPL">Below Poverty Line (BPL)</option>
                              <option value="APL">Above Poverty Line (APL)</option>
                              <option value="EWS">Economically Weaker Section (EWS)</option>
                              <option value="General">General</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BPL Card Number</label>
                            <input
                              type="text"
                              value={formData.bplCardNumber || ''}
                              onChange={(e) => setFormData({ ...formData, bplCardNumber: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Enter BPL card number"
                            />
                          </div>
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
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter qualification"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter experience in years"
                          min="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
                        <input
                          type="text"
                          value={formData.subjects}
                          onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter subjects separated by commas (e.g., Mathematics, Physics, Chemistry)"
                        />
                        <p className="text-sm text-gray-500 mt-1">Enter subjects separated by commas</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter employee ID (optional)"
                        />
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
                          onChange={(e) => setFormData({ ...formData, adminLevel: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter employee ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                        <select
                          value={formData.accessLevel}
                          onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    disabled={loading || !isFormValid()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    title={loading ? 'Please wait...' : (!isFormValid() ? missingFieldsForTooltip() : undefined)}
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative z-[61]">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Edit User - {editingUser.role.charAt(0).toUpperCase() + editingUser.role.slice(1)}</h3>
              <form onSubmit={handleUpdateUser} className="space-y-6">

                {/* User ID Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 font-mono">
                        {editingUser.userId || editingUser._id}
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

                {/* Profile Picture */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h4>
                  <div className="flex items-start gap-6">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                        {profileImagePreview || (editingUser.profileImage && `http://localhost:5050${editingUser.profileImage}`) ? (
                          <img
                            src={profileImagePreview || `http://localhost:5050${editingUser.profileImage}`}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          console.log(`📸 Selected image: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB`);

                          const validation = validateImageFile(file);
                          if (!validation.valid) {
                            toast.error(validation.error || 'Invalid file');
                            return;
                          }

                          // Create preview without compression (backend will compress)
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setProfileImagePreview(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);

                          setProfileImageFile(file);
                          toast.success('Image selected. Will be compressed on upload.');
                        }}
                        className="hidden"
                        id="profile-image-input"
                      />

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <label
                            htmlFor="profile-image-input"
                            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${imageCompressing ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            {(profileImagePreview || editingUser.profileImage) ? 'Change Photo' : 'Upload Photo'}
                          </label>

                          {(profileImagePreview || editingUser.profileImage) && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileImagePreview(null);
                                setProfileImageFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">
                          Upload JPG, PNG, GIF or WebP (max 10MB). Image will be automatically compressed to ~30KB on the server.
                        </p>

                        {editingUser.profileImage && !profileImagePreview && (
                          <p className="text-sm text-blue-600">
                            Current image will be kept if no new image is uploaded.
                          </p>
                        )}
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
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName}`.trim() })}
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
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value, name: `${formData.firstName} ${e.target.value}`.trim() })}
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        onChange={(e) => handleDOBChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
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
                            onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter enrollment number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">TC No</label>
                          <input
                            type="text"
                            value={formData.tcNo}
                            onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter TC number"
                          />
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
                            onChange={(e) => setFormData({ ...formData, name: e.target.value, firstName: e.target.value.split(' ')[0], lastName: e.target.value.split(' ').slice(1).join(' ') })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter full name in English"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.studentNameKannada}
                            onChange={(e) => setFormData({ ...formData, studentNameKannada: e.target.value })}
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
                            onChange={(e) => handleDOBChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                          <input
                            type="number"
                            value={formData.ageYears}
                            onChange={(e) => setFormData({ ...formData, ageYears: parseInt(e.target.value) || 0 })}
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
                            onChange={(e) => setFormData({ ...formData, ageMonths: parseInt(e.target.value) || 0 })}
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
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Admission Details - SATS Standard */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Admission Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                          <select
                            required
                            value={formData.academicYear}
                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="2024-2025">2024-2025</option>
                            <option value="2025-2026">2025-2026</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medium of Instruction *</label>
                          <select
                            required
                            value={formData.mediumOfInstruction}
                            onChange={(e) => setFormData({ ...formData, mediumOfInstruction: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, motherTongue: e.target.value })}
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
                          {formData.motherTongue === 'Other' && (
                            <input
                              type="text"
                              value={formData.motherTongueOther || ''}
                              onChange={(e) => setFormData({ ...formData, motherTongueOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify mother tongue"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                          <select
                            required
                            value={formData.class}
                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select Class</option>
                            <option value="LKG">LKG</option>
                            <option value="UKG">UKG</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                              <option key={num} value={num.toString()}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                          <select
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select Section</option>
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(letter => (
                              <option key={letter} value={letter}>Section {letter}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                          <input
                            type="text"
                            value={formData.rollNumber}
                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter roll number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                          <input
                            type="date"
                            value={formData.admissionDate}
                            onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter father's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.fatherNameKannada}
                            onChange={(e) => setFormData({ ...formData, fatherNameKannada: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter father's name in Kannada"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Aadhaar No</label>
                          <input
                            type="text"
                            value={formData.fatherAadhaar}
                            onChange={(e) => setFormData({ ...formData, fatherAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter mother's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name (Kannada)</label>
                          <input
                            type="text"
                            value={formData.motherNameKannada}
                            onChange={(e) => setFormData({ ...formData, motherNameKannada: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter mother's name in Kannada"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Aadhaar No</label>
                          <input
                            type="text"
                            value={formData.motherAadhaar}
                            onChange={(e) => setFormData({ ...formData, motherAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Mobile</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentAadhaar: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, studentCasteCertNo: e.target.value })}
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
                            onChange={(e) => setFormData({ ...formData, socialCategory: e.target.value })}
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
                            <option value="Other">Other</option>
                          </select>
                          {formData.socialCategory === 'Other' && (
                            <input
                              type="text"
                              value={formData.socialCategoryOther}
                              onChange={(e) => setFormData({ ...formData, socialCategoryOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify social category"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                          <select
                            value={formData.religion}
                            onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
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
                          {formData.religion === 'Other' && (
                            <input
                              type="text"
                              value={formData.religionOther}
                              onChange={(e) => setFormData({ ...formData, religionOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify religion"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Caste</label>
                          <select
                            value={formData.studentCaste}
                            onChange={(e) => setFormData({ ...formData, studentCaste: e.target.value })}
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
                          {formData.studentCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.studentCasteOther}
                              onChange={(e) => setFormData({ ...formData, studentCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify student caste"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Caste</label>
                          <select
                            value={formData.fatherCaste}
                            onChange={(e) => setFormData({ ...formData, fatherCaste: e.target.value })}
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
                          {formData.fatherCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.fatherCasteOther}
                              onChange={(e) => setFormData({ ...formData, fatherCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify father caste"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Caste</label>
                          <select
                            value={formData.motherCaste}
                            onChange={(e) => setFormData({ ...formData, motherCaste: e.target.value })}
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
                          {formData.motherCaste === 'Other' && (
                            <input
                              type="text"
                              value={formData.motherCasteOther}
                              onChange={(e) => setFormData({ ...formData, motherCasteOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify mother caste"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Special Needs - SATS Standard */}
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Special Needs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Disability / Child with Special Need</label>
                          <select
                            value={formData.disability}
                            onChange={(e) => setFormData({ ...formData, disability: e.target.value })}
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
                          {formData.disability === 'Other' && (
                            <input
                              type="text"
                              value={formData.disabilityOther}
                              onChange={(e) => setFormData({ ...formData, disabilityOther: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                              placeholder="Please specify disability type"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Is the student an RTE (Right to Education) candidate? <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.isRTECandidate || ''}
                            onChange={(e) => setFormData({ ...formData, isRTECandidate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select Option</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
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
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter bank name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No</label>
                          <input
                            type="text"
                            value={formData.bankAccountNo}
                            onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Enter account number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                          <input
                            type="text"
                            value={formData.bankIFSC}
                            onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter employee ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter qualification"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
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
                          onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="e.g., Mathematics, Physics"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editingUser.role === 'admin' && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Administrative Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Level *</label>
                        <select
                          required
                          value={formData.adminLevel}
                          onChange={(e) => setFormData({ ...formData, adminLevel: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Enter employee ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                        <select
                          value={formData.accessLevel}
                          onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
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

                {/* Address Information */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                      <input
                        type="text"
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Enter pin code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-md font-medium text-gray-800 mb-2">Location Details</h5>
                    <LocationSelector
                      selectedState={formData.stateId}
                      selectedDistrict={formData.districtId}
                      selectedTaluka={formData.talukaId}
                      districtText={formData.districtText}
                      talukaText={formData.talukaText}
                      onStateChange={(stateId, state) => {
                        setFormData(prev => ({
                          ...prev,
                          stateId: stateId.toString(),
                          state: state.name,
                          permanentState: state.name,
                          districtId: '',
                          district: '',
                          talukaId: '',
                          taluka: '',
                          districtText: '',
                          talukaText: ''
                        }));
                      }}
                      onDistrictChange={(districtId, district) => {
                        setFormData(prev => ({
                          ...prev,
                          districtId: districtId.toString(),
                          district: district.name,
                          talukaId: '',
                          taluka: '',
                          talukaText: ''
                        }));
                      }}
                      onTalukaChange={(talukaId, taluka) => {
                        setFormData(prev => ({
                          ...prev,
                          talukaId: talukaId.toString(),
                          taluka: taluka.name
                        }));
                      }}
                      onDistrictTextChange={(text) => {
                        setFormData(prev => ({
                          ...prev,
                          districtText: text,
                          district: text,
                          talukaText: ''
                        }));
                      }}
                      onTalukaTextChange={(text) => {
                        setFormData(prev => ({
                          ...prev,
                          talukaText: text,
                          taluka: text
                        }));
                      }}
                      required={false}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    />
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[71]">
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[71]">
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

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[61]">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Import {activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : 'User'}s
                  </h3>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportPreview([]);
                      setImportResults(null);
                      setIsImporting(false);
                      setImportProgress(0);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                {!importResults ? (
                  <div className="space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Import Instructions</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Download the template for {activeTab}s using the "Template" button</li>
                        <li>• Fill in your data (required fields marked with *)</li>
                        <li>• Date of Birth will be used as the default password (format: DDMMYYYY)</li>
                        <li>• User IDs will be auto-generated sequentially</li>
                        <li>• Upload the completed CSV file below</li>
                      </ul>
                    </div>

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg text-gray-600 mb-2">
                          {importFile ? importFile.name : 'Choose CSV file or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500">
                          CSV files only. Make sure to use the template format.
                        </p>
                      </label>
                    </div>

                    {/* File Selected */}
                    {importFile && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">
                            File Selected: {importFile.name}
                          </h4>
                          <div className="space-x-2">
                            <button
                              onClick={() => generateTemplate(activeTab)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Download Template
                            </button>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Ready to import {activeTab} users
                              </p>
                              <p className="text-xs text-blue-600">
                                Make sure your CSV file follows the template format
                              </p>
                            </div>
                          </div>
                        </div>

                        {isImporting ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Processing users...</span>
                              <span>{Math.round(importProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setImportFile(null);
                                setImportPreview([]);
                                setImportResults(null);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Clear
                            </button>
                            <button
                              onClick={processImport}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Import Users
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Import Results */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        Import Completed
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {importResults.success.length} users imported successfully
                        {importResults.errors.length > 0 && `, ${importResults.errors.length} failed`}
                      </p>
                    </div>

                    {/* Success Summary */}
                    {importResults.success.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">
                          Successfully Imported ({importResults.success.length})
                        </h4>
                        <div className="max-h-40 overflow-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-green-700">
                                <th className="font-medium">User ID</th>
                                <th className="font-medium">Email</th>
                                <th className="font-medium">Password</th>
                              </tr>
                            </thead>
                            <tbody className="text-green-800">
                              {importResults.success.slice(0, 10).map((user, index) => (
                                <tr key={index}>
                                  <td className="font-mono">{user.userId}</td>
                                  <td>{user.email}</td>
                                  <td className="font-mono">{user.password}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importResults.success.length > 10 && (
                            <p className="text-green-600 text-center mt-2">
                              +{importResults.success.length - 10} more users
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error Summary */}
                    {importResults.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">
                          Failed to Import ({importResults.errors.length})
                        </h4>
                        <div className="max-h-40 overflow-auto space-y-2">
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-red-800">Row {error.row}:</span>
                              <span className="text-red-700 ml-2">{error.error}</span>
                            </div>
                          ))}
                          {importResults.errors.length > 10 && (
                            <p className="text-red-600 text-center">
                              +{importResults.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => {
                          setImportResults(null);
                          setImportFile(null);
                          setImportPreview([]);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Import More
                      </button>
                      <div className="space-x-2">
                        {importResults.success.length > 0 && (
                          <button
                            onClick={downloadCredentials}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Download Credentials
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Refresh the user list to show newly imported users
                            fetchUsers();
                            // Close the modal and reset state
                            setShowImportModal(false);
                            setImportFile(null);
                            setImportPreview([]);
                            setImportResults(null);
                            setIsImporting(false);
                            setImportProgress(0);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Verification Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-[71]">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {passwordModalType === 'single'
                    ? `Verify Admin Password${selectedTeacherName ? ` - ${selectedTeacherName}` : ''}`
                    : 'Show All Teacher Passwords'}
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setAdminPasswordInput('');
                    setSelectedTeacherId(null);
                    setSelectedTeacherName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Admin Authentication Required
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {passwordModalType === 'single'
                          ? `Enter your admin password to view the password${selectedTeacherName ? ` for ${selectedTeacherName}` : ''}`
                          : 'Enter your admin password to reveal all teacher passwords'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Only passwords stored during user creation are available.
                    Users created before this feature may not have viewable passwords.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordModalSubmit();
                      }
                    }}
                    placeholder="Enter your admin password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t rounded-b-xl">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setAdminPasswordInput('');
                    setSelectedTeacherId(null);
                    setSelectedTeacherName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordModalSubmit}
                  disabled={passwordModalLoading || !adminPasswordInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {passwordModalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Show Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePasswordModal && selectedUserForPasswordChange && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[71]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setSelectedUserForPasswordChange(null);
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Set a new password for <strong>{selectedUserForPasswordChange.name}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Email: {selectedUserForPasswordChange.email}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Re-enter new password"
                    />
                  </div>

                  {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-600">Passwords do not match</p>
                    </div>
                  )}

                  {newPassword && newPassword.trim() !== '' && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-600">Password length: {newPassword.length} characters</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setSelectedUserForPasswordChange(null);
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    disabled={changePasswordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={changePasswordLoading || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || newPassword.trim() === ''}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {changePasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Changing...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Render error in ManageUsers:', error);
    setHasRenderError(true);
    return null;
  }
};

export default ManageUsers;
