import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface ClassOption {
  value: string;
  label: string;
  className: string;
}

interface SectionOption {
  value: string;
  label: string;
  section: string;
}

interface ClassData {
  _id: string;
  className: string;
  sections: string[];
  academicYear: string;
  displayName: string;
  hasMultipleSections: boolean;
}

interface TestData {
  _id: string;
  testId: string;
  testName: string;
  testType: string;
  className: string;
  academicYear: string;
  maxMarks: number;
  duration: number;
  description: string;
  displayName: string;
  isActive: boolean;
}

interface SchoolClassesData {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  classes: ClassData[];
  classOptions: ClassOption[];
  sectionsByClass: Record<string, SectionOption[]>;
  allSections: SectionOption[];
  totalClasses: number;
  tests: TestData[];
  testsByClass: Record<string, TestData[]>;
  totalTests: number;
}

export const useSchoolClasses = () => {
  const { user, token } = useAuth();
  const [classesData, setClassesData] = useState<SchoolClassesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolClasses = async () => {
    if (!user?.schoolCode || !token) {
      setError('School code or authentication token not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both classes and tests in parallel
      const [classesResponse, testsResponse] = await Promise.all([
        fetch(`/api/admin/classes/${user.schoolCode}/classes-sections`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/admin/classes/${user.schoolCode}/tests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!classesResponse.ok) {
        throw new Error(`Failed to fetch classes: ${classesResponse.statusText}`);
      }

      const classesResult = await classesResponse.json();
      
      if (!classesResult.success) {
        throw new Error(classesResult.message || 'Failed to fetch classes');
      }

      // Handle tests response (optional - don't fail if tests don't exist)
      let testsData = { tests: [], testsByClass: {}, totalTests: 0 };
      if (testsResponse.ok) {
        const testsResult = await testsResponse.json();
        if (testsResult.success) {
          testsData = testsResult.data;
        }
      }

      // Combine classes and tests data
      const combinedData = {
        ...classesResult.data,
        ...testsData
      };

      setClassesData(combinedData);
      console.log('📚 Classes, sections, and tests loaded:', combinedData);

    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError(err.message || 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  };

  const getSectionsForClass = async (className: string): Promise<SectionOption[]> => {
    if (!user?.schoolCode || !token) {
      throw new Error('School code or authentication token not available');
    }

    try {
      const response = await fetch(`/api/admin/classes/${user.schoolCode}/classes/${className}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data.sections;
      } else {
        throw new Error(result.message || 'Failed to fetch sections');
      }

    } catch (err: any) {
      console.error('Error fetching sections for class:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSchoolClasses();
  }, [user?.schoolCode, token]);

  return {
    classesData,
    loading,
    error,
    refetch: fetchSchoolClasses,
    getSectionsForClass,
    // Helper functions
    getClassOptions: () => classesData?.classOptions || [],
    getAllSections: () => classesData?.allSections || [],
    getSectionsByClass: (className: string) => classesData?.sectionsByClass[className] || [],
    hasClasses: () => (classesData?.totalClasses || 0) > 0,
    // Test helper functions
    getAllTests: () => classesData?.tests || [],
    getTestsByClass: (className: string) => classesData?.testsByClass[className] || [],
    hasTests: () => (classesData?.totalTests || 0) > 0
  };
};
