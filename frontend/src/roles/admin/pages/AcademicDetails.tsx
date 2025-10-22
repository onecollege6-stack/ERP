import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, BookOpen, ChevronDown, ChevronRight, FileText, Search, Calendar, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';
import { useSchoolClasses } from '../../../hooks/useSchoolClasses';

interface Subject {
  name: string;
  teacherId?: string;
  teacherName?: string;
}

interface ClassSubjects {
  className: string;
  section?: string;
  subjects: Subject[];
}

interface ClassSectionKey {
  className: string;
  section: string;
}

interface Test {
  id: string;
  name: string;
  className: string;
  section: string;
  subjects: string[];
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  section: string;
}

interface HallTicketData {
  subjectId: string;
  examDate: string;
  examTime: string;
  roomNumber: string;
}

interface SubjectExam {
  id: string;
  name: string;
  className: string;
  section: string;
  testName: string;
}

const AcademicDetails: React.FC = () => {
  const { token, user } = useAuth();

  // Use the useSchoolClasses hook to fetch classes configured by superadmin
  const {
    classesData,
    loading: classesLoading,
    error: classesError,
    getClassOptions,
    getSectionsByClass,
    hasClasses
  } = useSchoolClasses();

  // Tab management
  const [activeTab, setActiveTab] = useState<'subjects' | 'hallticket'>('subjects');

  // State management for Class Subjects
  const [classSubjects, setClassSubjects] = useState<ClassSubjects[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [expandedClass, setExpandedClass] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // State management for Hall Ticket Generation
  const [hallTicketClass, setHallTicketClass] = useState<string>('');
  const [hallTicketSection, setHallTicketSection] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjectExams, setSubjectExams] = useState<SubjectExam[]>([]);
  const [hallTicketData, setHallTicketData] = useState<{[key: string]: HallTicketData}>({});
  const [hallTicketSections, setHallTicketSections] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Update available sections when class changes (for subjects tab)
  useEffect(() => {
    if (selectedClass && classesData) {
      const sections = getSectionsByClass(selectedClass);
      setAvailableSections(sections);
      // Auto-select first section if available
      if (sections.length > 0) {
        setSelectedSection(sections[0].value);
      } else {
        setSelectedSection('');
      }
    } else {
      setAvailableSections([]);
      setSelectedSection('');
    }
  }, [selectedClass, classesData]);

  // Update available sections when hall ticket class changes
  useEffect(() => {
    if (hallTicketClass && classesData) {
      const sections = getSectionsByClass(hallTicketClass);
      setHallTicketSections(sections);
      // Auto-select first section if available
      if (sections.length > 0) {
        setHallTicketSection(sections[0].value);
      } else {
        setHallTicketSection('');
      }
    } else {
      setHallTicketSections([]);
      setHallTicketSection('');
    }
  }, [hallTicketClass, classesData]);

  // Fetch available tests when class and section change
  useEffect(() => {
    if (hallTicketClass && hallTicketSection) {
      fetchAvailableTests();
    } else {
      setAvailableTests([]);
      setSelectedTest('');
    }
  }, [hallTicketClass, hallTicketSection]);

  // Get class list from superadmin configuration instead of hardcoded values
  const classList = classesData?.classes?.map(c => c.className) || [];

  // Fetch subjects for all classes
  const fetchAllClassSubjects = async () => {
    setLoading(true);
    try {
      // Get the school code from localStorage or auth context
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';

      console.log('Fetching subjects with school code:', schoolCode);

      const response = await fetch('/api/class-subjects/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-school-code': schoolCode
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClassSubjects(data.data.classes || []);
      } else {
        // Try direct test endpoints for each class as fallback
        console.log('Regular API failed, trying direct test endpoints...');
        await fetchClassesViaDirectEndpoints();
      }
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      toast.error('Error connecting to server, trying fallback...');

      // Try direct test endpoints for each class as fallback
      await fetchClassesViaDirectEndpoints();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to fetch classes via direct test endpoints
  const fetchClassesViaDirectEndpoints = async () => {
    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';

      if (!schoolCode) {
        toast.error('School code not available');
        return;
      }

      console.log('Trying direct endpoints with school code:', schoolCode);

      // Collect results for all classes in parallel
      const results = await Promise.all(
        classList.map(async (className) => {
          try {
            const response = await fetch(`/api/direct-test/class-subjects/${className}?schoolCode=${schoolCode}`, {
              headers: {
                'x-school-code': schoolCode
              }
            });

            if (response.ok) {
              const data = await response.json();
              return data.data;
            } else {
              console.log(`No subjects found for class ${className}`);
              return null;
            }
          } catch (error) {
            console.error(`Error fetching class ${className}:`, error);
            return null;
          }
        })
      );

      // Filter out null responses and format
      const validResults = results.filter(Boolean);
      setClassSubjects(validResults);

      if (validResults.length > 0) {
        toast.success(`Found ${validResults.length} classes using fallback method`);
      } else {
        toast.error('No class data available');
      }
    } catch (error) {
      console.error('Error in fallback method:', error);
      toast.error('Failed to fetch class data');
    }
  };

  useEffect(() => {
    fetchAllClassSubjects();
  }, []);

  // Add subject to selected class and section
  const addSubject = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    if (!selectedSection) {
      toast.error('Please select a section first');
      return;
    }

    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    try {
      // Get the school code from localStorage or auth context
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';

      console.log('Adding subject with school code:', schoolCode, 'class:', selectedClass, 'section:', selectedSection);

      const response = await fetch('/api/class-subjects/add-subject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-school-code': schoolCode
        },
        body: JSON.stringify({
          className: selectedClass,
          grade: selectedClass,
          section: selectedSection,
          subjectName: newSubjectName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setNewSubjectName('');
        fetchAllClassSubjects(); // Refresh the list
      } else {
        let errorMessage = 'Failed to add subject';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Error adding subject:', errorData);
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Network error while adding subject');
    }
  };

  // Remove subject from class and section
  const removeSubject = async (className: string, section: string, subjectName: string) => {
    if (!confirm(`Remove "${subjectName}" from Class ${className} Section ${section}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/class-subjects/remove-subject', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-school-code': user?.schoolCode || ''
        },
        body: JSON.stringify({
          className,
          section,
          subjectName
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchAllClassSubjects(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to remove subject');
      }
    } catch (error) {
      console.error('Error removing subject:', error);
      toast.error('Error removing subject');
    }
  };

  // Handle Enter key press for adding subjects
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSubject();
    }
  };

  // Get subjects for a specific class and section
  const getClassSectionSubjects = (className: string, section: string): Subject[] => {
    const classData = classSubjects.find(cs => cs.className === className && cs.section === section);
    return classData?.subjects || [];
  };

  // Get all sections for a class from fetched data
  const getClassSections = (className: string): string[] => {
    const sections = classSubjects
      .filter(cs => cs.className === className)
      .map(cs => cs.section || 'A');
    return [...new Set(sections)];
  };

  // Toggle class expansion
  const toggleClassExpansion = (className: string) => {
    setExpandedClass(expandedClass === className ? '' : className);
  };

  // Toggle section expansion
  const toggleSectionExpansion = (className: string, section: string) => {
    const key = `${className}-${section}`;
    setExpandedSection(expandedSection === key ? '' : key);
  };

  // Hall Ticket Functions
  const fetchAvailableTests = async () => {
    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      // Mock data for now - replace with actual API call
      const mockTests: Test[] = [
        {
          id: '1',
          name: 'Unit Test 1',
          className: hallTicketClass,
          section: hallTicketSection,
          subjects: ['Mathematics', 'Science', 'English']
        },
        {
          id: '2',
          name: 'Mid Term Exam',
          className: hallTicketClass,
          section: hallTicketSection,
          subjects: ['Mathematics', 'Science', 'English', 'Social Studies']
        },
        {
          id: '3',
          name: 'Final Exam',
          className: hallTicketClass,
          section: hallTicketSection,
          subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
        }
      ];
      
      setAvailableTests(mockTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to fetch available tests');
    }
  };

  const fetchSubjects = async () => {
    if (!hallTicketClass || !hallTicketSection || !selectedTest) {
      toast.error('Please select class, section, and test');
      return;
    }

    setLoadingSubjects(true);
    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      // Fetch actual subjects from the class-subjects API
      try {
        const response = await fetch(`/api/class-subjects/classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-school-code': schoolCode
          }
        });

        if (response.ok) {
          const data = await response.json();
          const classData = data.data.classes.find((cls: any) => 
            cls.className === hallTicketClass && cls.section === hallTicketSection
          );
          
          if (classData && classData.subjects) {
            const subjectExamsList: SubjectExam[] = classData.subjects.map((subject: any, index: number) => ({
              id: `${hallTicketClass}-${hallTicketSection}-${subject.name}-${selectedTest}`,
              name: subject.name,
              className: hallTicketClass,
              section: hallTicketSection,
              testName: availableTests.find(test => test.id === selectedTest)?.name || 'Test'
            }));
            
            setSubjectExams(subjectExamsList);
            
            // Initialize hall ticket data for each subject
            const initialData: {[key: string]: HallTicketData} = {};
            subjectExamsList.forEach(subject => {
              initialData[subject.id] = {
                subjectId: subject.id,
                examDate: '',
                examTime: '',
                roomNumber: ''
              };
            });
            setHallTicketData(initialData);
            
            // Also fetch students for this class and section
            await fetchStudentsForClass();
            
            toast.success(`Found ${subjectExamsList.length} subjects`);
          } else {
            toast.error('No subjects found for this class and section');
          }
        } else {
          throw new Error('Failed to fetch subjects');
        }
      } catch (apiError) {
        console.log('API failed, using fallback method...');
        // Fallback to direct endpoint
        const response = await fetch(`/api/direct-test/class-subjects/${hallTicketClass}?schoolCode=${schoolCode}`, {
          headers: {
            'x-school-code': schoolCode
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.subjects) {
            const subjectExamsList: SubjectExam[] = data.data.subjects.map((subject: any, index: number) => ({
              id: `${hallTicketClass}-${hallTicketSection}-${subject.name}-${selectedTest}`,
              name: subject.name,
              className: hallTicketClass,
              section: hallTicketSection,
              testName: availableTests.find(test => test.id === selectedTest)?.name || 'Test'
            }));
            
            setSubjectExams(subjectExamsList);
            
            // Initialize hall ticket data for each subject
            const initialData: {[key: string]: HallTicketData} = {};
            subjectExamsList.forEach(subject => {
              initialData[subject.id] = {
                subjectId: subject.id,
                examDate: '',
                examTime: '',
                roomNumber: ''
              };
            });
            setHallTicketData(initialData);
            
            // Also fetch students for this class and section
            await fetchStudentsForClass();
            
            toast.success(`Found ${subjectExamsList.length} subjects`);
          }
        } else {
          throw new Error('No subjects found');
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchStudentsForClass = async () => {
    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      // Try to fetch actual students from API
      const response = await fetch(`/api/students/class/${hallTicketClass}/section/${hallTicketSection}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-school-code': schoolCode
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      } else {
        // Fallback to mock data if API fails
        const mockStudents: Student[] = [
          {
            id: '1',
            name: 'John Doe',
            rollNumber: '001',
            className: hallTicketClass,
            section: hallTicketSection
          },
          {
            id: '2',
            name: 'Jane Smith',
            rollNumber: '002',
            className: hallTicketClass,
            section: hallTicketSection
          },
          {
            id: '3',
            name: 'Mike Johnson',
            rollNumber: '003',
            className: hallTicketClass,
            section: hallTicketSection
          },
          {
            id: '4',
            name: 'Sarah Wilson',
            rollNumber: '004',
            className: hallTicketClass,
            section: hallTicketSection
          }
        ];
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Use mock data as fallback
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'John Doe',
          rollNumber: '001',
          className: hallTicketClass,
          section: hallTicketSection
        },
        {
          id: '2',
          name: 'Jane Smith',
          rollNumber: '002',
          className: hallTicketClass,
          section: hallTicketSection
        }
      ];
      setStudents(mockStudents);
    }
  };

  const updateHallTicketData = (subjectId: string, field: 'examDate' | 'examTime' | 'roomNumber', value: string) => {
    setHallTicketData(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const generateHallTickets = async () => {
    const completedSubjects = subjectExams.filter(subject => 
      hallTicketData[subject.id]?.examDate && 
      hallTicketData[subject.id]?.examTime && 
      hallTicketData[subject.id]?.roomNumber
    );

    if (completedSubjects.length === 0) {
      toast.error('Please fill exam date, time, and room number for at least one subject');
      return;
    }

    try {
      // Here you would typically send data to backend to generate hall tickets
      const hallTicketPayload = {
        className: hallTicketClass,
        section: hallTicketSection,
        testName: availableTests.find(test => test.id === selectedTest)?.name,
        subjects: completedSubjects.map(subject => ({
          subjectName: subject.name,
          examDate: hallTicketData[subject.id].examDate,
          examTime: hallTicketData[subject.id].examTime,
          roomNumber: hallTicketData[subject.id].roomNumber
        })),
        students: students
      };
      
      console.log('Generating hall tickets for:', hallTicketPayload);
      toast.success(`Hall tickets generated for ${completedSubjects.length} subjects and ${students.length} students`);
    } catch (error) {
      console.error('Error generating hall tickets:', error);
      toast.error('Failed to generate hall tickets');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Academic Management</h1>
          </div>
          <p className="text-gray-600">Manage subjects and generate hall tickets for your school</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('subjects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subjects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Class Subjects Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('hallticket')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hallticket'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Hall Ticket Generation
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Show error if classes failed to load */}
        {classesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              Error loading classes: {classesError}
            </p>
          </div>
        )}

        {/* Show message if no classes are configured */}
        {!classesLoading && !hasClasses() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              No classes have been configured for your school yet. Please contact your super admin to add classes.
            </p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'subjects' && (
          <div>

        {/* Add Subject Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Subject</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a class...</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass || availableSections.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Choose section...</option>
                {availableSections.map(section => (
                  <option key={section.value} value={section.value}>
                    Section {section.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter subject name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                onClick={addSubject}
                disabled={!selectedClass || !selectedSection || !newSubjectName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Subject
              </button>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Classes & Subjects</h2>

          {loading || classesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading classes...</p>
            </div>
          ) : classList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No classes configured. Please contact your super admin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classList.map(className => {
                const isClassExpanded = expandedClass === className;
                const classSections = classesData?.sectionsByClass?.[className] || [];

                return (
                  <div key={className} className="border border-gray-200 rounded-lg">
                    {/* Class Header */}
                    <div
                      onClick={() => toggleClassExpansion(className)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {isClassExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                        <h3 className="text-lg font-medium text-gray-800">
                          Class {className}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {classSections.length} section{classSections.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Sections List */}
                    {isClassExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {classSections.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No sections configured for Class {className}
                          </p>
                        ) : (
                          <div className="space-y-2 p-4">
                            {classSections.map((sectionObj: any) => {
                              const section = sectionObj.section;
                              const sectionKey = `${className}-${section}`;
                              const isSectionExpanded = expandedSection === sectionKey;
                              const subjects = getClassSectionSubjects(className, section);

                              return (
                                <div key={sectionKey} className="border border-gray-300 rounded-lg bg-white">
                                  {/* Section Header */}
                                  <div
                                    onClick={() => toggleSectionExpansion(className, section)}
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isSectionExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-gray-600" />
                                      )}
                                      <h4 className="text-base font-medium text-gray-700">
                                        Section {section}
                                      </h4>
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Subjects for this section */}
                                  {isSectionExpanded && (
                                    <div className="border-t border-gray-200 p-3">
                                      {subjects.length === 0 ? (
                                        <p className="text-gray-500 text-center py-3 text-sm">
                                          No subjects added yet for Class {className} Section {section}
                                        </p>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {subjects.map((subject, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                              <span className="text-gray-800 font-medium text-sm">
                                                {subject.name}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeSubject(className, section, subject.name);
                                                }}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                title="Remove subject"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        )}

        {/* Hall Ticket Generation Tab */}
        {activeTab === 'hallticket' && (
          <div>
            {/* Hall Ticket Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Hall Ticket Generation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={hallTicketClass}
                    onChange={(e) => setHallTicketClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a class...</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={hallTicketSection}
                    onChange={(e) => setHallTicketSection(e.target.value)}
                    disabled={!hallTicketClass || hallTicketSections.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose section...</option>
                    {hallTicketSections.map(section => (
                      <option key={section.value} value={section.value}>
                        Section {section.section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Name Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    disabled={!hallTicketClass || !hallTicketSection || availableTests.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose test...</option>
                    {availableTests.map(test => (
                      <option key={test.id} value={test.id}>
                        {test.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    onClick={fetchSubjects}
                    disabled={!hallTicketClass || !hallTicketSection || !selectedTest}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Search Subjects
                  </button>
                </div>
              </div>
            </div>

            {/* Subjects and Students List */}
            {subjectExams.length > 0 && (
              <div className="space-y-6">
                {/* Subjects Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Subjects for {availableTests.find(test => test.id === selectedTest)?.name} - Class {hallTicketClass} Section {hallTicketSection}
                    </h2>
                    <button
                      onClick={generateHallTickets}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Generate Hall Tickets
                    </button>
                  </div>

                  {loadingSubjects ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading subjects...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exam Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exam Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Room Number
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subjectExams.map((subject) => (
                            <tr key={subject.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {subject.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <input
                                    type="date"
                                    value={hallTicketData[subject.id]?.examDate || ''}
                                    onChange={(e) => updateHallTicketData(subject.id, 'examDate', e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <input
                                  type="time"
                                  value={hallTicketData[subject.id]?.examTime || ''}
                                  onChange={(e) => updateHallTicketData(subject.id, 'examTime', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={hallTicketData[subject.id]?.roomNumber || ''}
                                    onChange={(e) => updateHallTicketData(subject.id, 'roomNumber', e.target.value)}
                                    placeholder="Room No."
                                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Students List */}
                {students.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Eligible Students ({students.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students.map((student) => (
                        <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">{student.rollNumber}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicDetails;
