import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { School, ViewType, DashboardStats, SchoolData } from '../types';
import { schoolAPI } from '../../../services/api';
import api from '../../../api/axios';

// Initial empty values for state
const initialSchools: School[] = [];
const initialSchoolsData: { [schoolId: string]: SchoolData } = {};
const initialStats: DashboardStats = {
  totalSchools: 0,
  totalUsers: 0,
  messagesSent: 0,
  lastLogin: ''
};

interface AppContextType {
  schools: School[];
  schoolsData: { [schoolId: string]: SchoolData };
  currentView: ViewType;
  selectedSchoolId: string | null;
  stats: DashboardStats;
  setCurrentView: (view: ViewType) => void;
  setSelectedSchoolId: (id: string | null) => void;
  addSchool: (school: Partial<School> & { logoFile?: File }) => Promise<void>;
  updateSchool: (school: School) => void;
  deleteSchool: (id: string) => void;
  updateSchoolAccess: (schoolId: string, accessMatrix: any) => void;
  updateBankDetails: (schoolId: string, bankDetails: any) => void;
  updateUserRole: (schoolId: string, userId: string, newRole: 'admin' | 'teacher' | 'student' | 'parent') => void;
  updateSchoolSettings: (schoolId: string, settings: any) => void;
  getSchoolData: (schoolId: string) => SchoolData | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [schoolsData, setSchoolsData] = useState<{ [schoolId: string]: SchoolData }>(initialSchoolsData);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  // Fetch all schools and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching schools from backend...');
  const schoolsRes = await api.get('/schools');
        console.log('Schools response:', schoolsRes.data);
        
        const mapped = (schoolsRes.data || []).map((created: any) => ({
          id: created._id || created.id,
          name: created.name,
          code: created.code || '',
          logo: created.logoUrl ? (created.logoUrl.startsWith('http') ? created.logoUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${created.logoUrl}`) : '',
          area: created.address?.street || '',
          district: created.address?.city || '',
          pinCode: created.address?.zipCode || '',
          mobile: created.contact?.phone || '',
          principalName: created.principalName || '',
          principalEmail: created.principalEmail || created.contact?.email || '',
          bankDetails: created.bankDetails || {},
          accessMatrix: created.accessMatrix || {}
        }));
        
        console.log('Mapped schools:', mapped);
        setSchools(mapped);
        // Basic stats derived locally; backend aggregate may not exist
        setStats(prev => ({
          ...prev,
          totalSchools: mapped.length,
        }));
      } catch (err: any) {
        console.error('Error fetching schools:', err);
        setSchools([]);
        setStats(initialStats);
      }
    }
    fetchData();
  }, []);

  // Add a new school via backend
  const addSchool = async (schoolData: Partial<School> & { logoFile?: File }) => {
    const form = new FormData();
    
    // Basic school information
    form.append('name', String(schoolData.name || ''));
    form.append('code', String(schoolData.code || ''));
    form.append('mobile', String(schoolData.mobile || ''));
    form.append('principalName', String(schoolData.principalName || ''));
    form.append('principalEmail', String(schoolData.principalEmail || ''));
    form.append('area', String(schoolData.area || ''));
    form.append('district', String(schoolData.district || ''));
    form.append('pinCode', String(schoolData.pinCode || ''));
    
    // Bank details as JSON string
    form.append('bankDetails', JSON.stringify({
      bankName: (schoolData as any).bankDetails?.bankName || '',
      accountNumber: (schoolData as any).bankDetails?.accountNumber || '',
      ifscCode: (schoolData as any).bankDetails?.ifscCode || '',
      branch: (schoolData as any).bankDetails?.branch || '',
      accountHolderName: (schoolData as any).bankDetails?.accountHolderName || '',
    }));
    
    // Access matrix as JSON string
    form.append('accessMatrix', JSON.stringify((schoolData as any).accessMatrix || {
      admin: { manageUsers: true, manageSchoolSettings: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      teacher: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: true },
      student: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: false },
      parent: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: false }
    }));
    
    // Additional school details
    form.append('schoolType', String((schoolData as any).schoolType || 'Public'));
    form.append('establishedYear', String((schoolData as any).establishedYear || new Date().getFullYear()));
    form.append('affiliationBoard', String((schoolData as any).affiliationBoard || 'CBSE'));
    form.append('website', String((schoolData as any).website || ''));
    form.append('secondaryContact', String((schoolData as any).secondaryContact || ''));
    
    // Settings and features
    form.append('settings', JSON.stringify({ 
      academicYear: { 
        startDate: new Date().toISOString(), 
        endDate: new Date().toISOString(), 
        currentYear: '2024-25' 
      } 
    }));
    form.append('features', JSON.stringify({}));
    
    // Logo file upload
    if ((schoolData as any).logoFile) {
      form.append('logo', (schoolData as any).logoFile as File);
    }

    try {
      // Try to get token from multiple possible storage locations
      let token = localStorage.getItem('token');
      
      if (!token) {
        token = localStorage.getItem('authToken');
      }
      
      if (!token) {
        const authData = localStorage.getItem('erp.auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            token = parsed.token;
          } catch (err) {
            console.error('Error parsing auth data:', err);
          }
        }
      }
      
      console.log('Retrieved token:', token);
      if (!token) {
        throw new Error('Authorization token is missing');
      }
      
      // Use the schoolAPI.createSchool method which should automatically include the Authorization header via interceptor
      const res = await schoolAPI.createSchool(form);
      const created = res.data?.school || res.data;
      if (created) {
        setSchools(prev => [...prev, {
          id: created._id || created.id,
          name: created.name,
          code: created.code || '',
          logo: created.logoUrl ? (created.logoUrl.startsWith('http') ? created.logoUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${created.logoUrl}`) : '',
          area: created.address?.street || '',
          district: created.address?.city || '',
          pinCode: created.address?.zipCode || '',
          mobile: created.contact?.phone || '',
          principalName: created.principalName || '',
          principalEmail: created.contact?.email || '',
          bankDetails: created.bankDetails || {},
          accessMatrix: created.accessMatrix || {},
        } as any]);
        setStats(prev => ({ ...prev, totalSchools: prev.totalSchools + 1 }));
      }
    } catch (error) {
      console.error('Error adding school:', error);
      throw error;
    }
  };

  // Delete a school via backend
  const deleteSchool = async (id: string) => {
    try {
      console.log(`Deleting school with ID: ${id}`);
  const res = await api.delete(`/schools/${id}`);
      console.log('Delete response:', res.data);
      
      setSchools(prev => {
        const filtered = prev.filter(school => school.id !== id);
        console.log(`School deleted. Remaining schools: ${filtered.length}`);
        return filtered;
      });
      
      setStats(prev => ({ ...prev, totalSchools: prev.totalSchools - 1 }));
      console.log('School successfully deleted from UI');
    } catch (error: any) {
      console.error('Error deleting school:', error);
      throw error;
    }
  };

  // Update school (scaffold, implement as needed)
  const updateSchool = async (updatedSchool: School) => {
  const res = await api.put(`/schools/${updatedSchool.id}`, updatedSchool);
    const returned = (res.data as any)?.school || res.data;
    setSchools(prev => prev.map(school => school.id === updatedSchool.id ? {
      ...school,
      name: returned.name ?? school.name,
      code: returned.code ?? school.code,
      logo: returned.logoUrl ? (String(returned.logoUrl).startsWith('http') ? returned.logoUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${returned.logoUrl}`) : school.logo,
      area: returned.address?.street ?? school.area,
      district: returned.address?.city ?? school.district,
      pinCode: returned.address?.zipCode ?? school.pinCode,
      mobile: returned.contact?.phone ?? school.mobile,
      principalName: returned.principalName ?? school.principalName,
      principalEmail: returned.principalEmail ?? school.principalEmail,
      bankDetails: returned.bankDetails ?? school.bankDetails,
      accessMatrix: returned.accessMatrix ?? school.accessMatrix,
    } : school));
  };

  // Placeholder for other update functions
  const updateSchoolAccess = async (schoolId: string, accessMatrix: any) => {
    // Persist to backend then update local cache
  const res = await api.put(`/schools/${schoolId}`, { accessMatrix });
    const updated = (res.data as any)?.school || res.data;
    setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, accessMatrix: updated.accessMatrix || accessMatrix } : s));
  };

  const updateBankDetails = async (schoolId: string, bankDetails: any) => {
  const res = await api.patch(`/schools/${schoolId}/bank-details`, { bankDetails });
    const updated = (res.data as any)?.bankDetails || (res.data as any)?.school?.bankDetails || bankDetails;
    setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, bankDetails: updated } : s));
  };

  const updateUserRole = async (schoolId: string, userId: string, newRole: 'admin' | 'teacher' | 'student' | 'parent') => {
    // Scoped user update endpoint exists under /schools/:schoolId/users/:userId
  await api.put(`/schools/${schoolId}/users/${userId}`, { role: newRole });
    // No local user list here; SchoolDetails handles refresh via its own API layer
  };

  const updateSchoolSettings = async (schoolId: string, settings: any) => {
  const res = await api.put(`/schools/${schoolId}`, { settings });
    const updated = (res.data as any)?.school || res.data;
    // We don't store full settings on the dashboard list, but keep bank/access in sync if returned
    setSchools(prev => prev.map(s => s.id === schoolId ? {
      ...s,
      bankDetails: updated.bankDetails ?? s.bankDetails,
      accessMatrix: updated.accessMatrix ?? s.accessMatrix,
    } : s));
    // Also cache detailed settings for SchoolDetails consumers if present
    setSchoolsData(prev => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] || {} as any),
        settings: updated.settings || settings,
      } as any
    }));
  };
  const getSchoolData = (schoolId: string) => schoolsData[schoolId];

  return (
    <AppContext.Provider
      value={{
        schools,
        schoolsData,
        currentView,
        selectedSchoolId,
        stats,
        setCurrentView,
        setSelectedSchoolId,
        addSchool,
        updateSchool,
        deleteSchool,
        updateSchoolAccess,
        updateBankDetails,
        updateUserRole,
        updateSchoolSettings,
        getSchoolData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppProvider;