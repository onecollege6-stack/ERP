import * as configAPI from '../api/config';

// Cache for school config to avoid repeated API calls
let cachedConfig: any = null;
let configPromise: Promise<any> | null = null;

export const getSchoolConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configPromise) {
    return configPromise;
  }

  configPromise = configAPI.getSchoolConfig().then(config => {
    cachedConfig = config;
    return config;
  }).catch(error => {
    console.error('Failed to fetch school config:', error);
    // Return fallback data
    const fallback = {
      school: {
        name: 'School Name',
        code: 'SCH',
        academicYear: '2024-25'
      },
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Economics', 'Art'],
      classes: [
        { name: 'LKG', sections: ['A', 'B'] },
        { name: 'UKG', sections: ['A', 'B'] },
        { name: '1', sections: ['A', 'B', 'C'] },
        { name: '2', sections: ['A', 'B', 'C'] },
        { name: '3', sections: ['A', 'B', 'C'] },
        { name: '4', sections: ['A', 'B', 'C'] },
        { name: '5', sections: ['A', 'B', 'C'] },
        { name: '6', sections: ['A', 'B', 'C'] },
        { name: '7', sections: ['A', 'B', 'C'] },
        { name: '8', sections: ['A', 'B', 'C'] },
        { name: '9', sections: ['A', 'B'] },
        { name: '10', sections: ['A', 'B'] },
        { name: '11', sections: ['A', 'B'] },
        { name: '12', sections: ['A', 'B'] }
      ],
      sections: ['A', 'B', 'C', 'D', 'E'],
      academicYears: ['2024-25', '2025-26', '2026-27'],
      terms: ['Term 1', 'Term 2', 'Term 3']
    };
    cachedConfig = fallback;
    return fallback;
  });

  return configPromise;
};

export const clearConfigCache = () => {
  cachedConfig = null;
  configPromise = null;
};

// Helper functions
export const getClassDisplayName = (className: string) => {
  if (className === 'LKG' || className === 'UKG') return className;
  return `Grade ${className}`;
};

export const getClassOptions = async () => {
  const config = await getSchoolConfig();
  return config.classes.map((cls: any) => ({
    value: cls.name,
    label: getClassDisplayName(cls.name),
    sections: cls.sections
  }));
};

export const getSectionOptions = async (className?: string) => {
  const config = await getSchoolConfig();
  if (className) {
    const classData = config.classes.find((cls: any) => cls.name === className);
    return classData ? classData.sections : config.sections;
  }
  return config.sections;
};

export const getSubjectOptions = async () => {
  const config = await getSchoolConfig();
  return config.subjects;
};
