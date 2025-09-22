import React, { useState } from 'react';
import { Users, BookOpen, Award, Plus, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { classAPI, testAPI } from '../../../services/api';

interface ClassData {
  _id: string;
  className: string;
  sections: string[];
  academicYear: string;
  createdAt: string;
}

interface TestData {
  _id: string;
  name: string;
  className: string;
  description: string;
  maxMarks: number;
  weightage: number;
  isActive: boolean;
}

const AcademicNavigation: React.FC = () => {
  const appContext = useApp();
  const selectedSchoolId = appContext?.selectedSchoolId || '';
  const schools = appContext?.schools || [];

  // Navigation state
  const [activeView, setActiveView] = useState<'classes' | 'sections' | 'tests'>('classes');
  
  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [newTestName, setNewTestName] = useState('');

  const school = schools.find(s => s.id === selectedSchoolId);

  // Navigation cards
  const navigationCards = [
    {
      id: 'classes',
      title: 'Classes',
      description: 'Manage school classes',
      icon: BookOpen,
      color: 'blue',
      count: classes.length
    },
    {
      id: 'sections',
      title: 'Sections',
      description: 'Manage class sections',
      icon: Users,
      color: 'green',
      count: classes.reduce((total, cls) => total + cls.sections.length, 0)
    },
    {
      id: 'tests',
      title: 'Tests',
      description: 'Manage academic tests',
      icon: Award,
      color: 'purple',
      count: tests.length
    }
  ];

  // Fetch classes
  const fetchClasses = async () => {
    if (!selectedSchoolId) return;
    
    try {
      setLoading(true);
      console.log('Fetching classes for school:', selectedSchoolId);
      const response = await classAPI.getSchoolClasses(selectedSchoolId);
      console.log('Classes response:', response);
      if (response.success) {
        console.log('Classes data:', response.data.classes);
        setClasses(response.data.classes || []);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Error fetching classes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tests
  const fetchTests = async () => {
    if (!selectedSchoolId) return;
    
    try {
      setLoading(true);
      console.log('Fetching tests for school:', selectedSchoolId);
      const response = await testAPI.getSchoolTests(selectedSchoolId);
      console.log('Tests response:', response);
      if (response.success) {
        console.log('Tests data:', response.data.tests);
        console.log('School info:', { 
          schoolId: response.data.schoolId, 
          schoolCode: response.data.schoolCode, 
          schoolName: response.data.schoolName 
        });
        setTests(response.data.tests || []);
      }
    } catch (error: any) {
      console.error('Error fetching tests:', error);
      toast.error('Error fetching tests');
    } finally {
      setLoading(false);
    }
  };

  // Add new class
  const addClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Please enter class name');
      return;
    }

    try {
      const response = await classAPI.addClass(selectedSchoolId, {
        className: newClassName.trim(),
        academicYear: '2024-25'
      });

      if (response.success) {
        toast.success(`Class ${newClassName} created successfully`);
        setNewClassName('');
        await fetchClasses();
      } else {
        throw new Error(response.message || 'Failed to create class');
      }
    } catch (error: any) {
      console.error('Error adding class:', error);
      toast.error(error.message || 'Failed to add class');
    }
  };

  // Add section to class
  const addSection = async () => {
    if (!selectedClass || !newSection.trim()) {
      toast.error('Please select class and enter section name');
      return;
    }

    try {
      const response = await classAPI.addSectionToClass(selectedSchoolId, selectedClass, newSection.trim());
      
      if (response.success) {
        toast.success(`Section ${newSection} added successfully`);
        setNewSection('');
        await fetchClasses();
      } else {
        throw new Error(response.message || 'Failed to add section');
      }
    } catch (error: any) {
      console.error('Error adding section:', error);
      toast.error(error.message || 'Failed to add section');
    }
  };

  // Remove section from class
  const removeSection = async (classId: string, section: string) => {
    if (!confirm(`Remove section ${section}?`)) return;

    try {
      const response = await classAPI.removeSectionFromClass(selectedSchoolId, classId, section);
      
      if (response.success) {
        toast.success(`Section ${section} removed successfully`);
        await fetchClasses();
      } else {
        throw new Error(response.message || 'Failed to remove section');
      }
    } catch (error: any) {
      console.error('Error removing section:', error);
      toast.error(error.message || 'Failed to remove section');
    }
  };

  // Delete class
  const deleteClass = async (classId: string, className: string) => {
    if (!confirm(`Delete class ${className}? This will also remove all sections.`)) return;

    try {
      const response = await classAPI.deleteClass(selectedSchoolId, classId);
      
      if (response.success) {
        toast.success(`Class ${className} deleted successfully`);
        await fetchClasses();
      } else {
        throw new Error(response.message || 'Failed to delete class');
      }
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete class');
    }
  };

  // Add new test
  const addTest = async () => {
    if (!selectedClass || !newTestName.trim()) {
      toast.error('Please select class and enter test name');
      return;
    }

    try {
      const selectedClassData = classes.find(c => c._id === selectedClass);
      if (!selectedClassData) {
        toast.error('Selected class not found');
        return;
      }

      // Create test for all sections of the class
      const testData = {
        name: newTestName.trim(),
        className: selectedClassData.className,
        description: `Test for Class ${selectedClassData.className}`,
        maxMarks: 100,
        weightage: 25,
        isActive: true,
        sections: selectedClassData.sections || ['A'], // Apply to all sections
        academicYear: '2024-25'
      };

      // Call API to create test
      const response = await testAPI.addTest(selectedSchoolId, testData);
      
      console.log('Add test response:', response);
      
      if (response.success) {
        toast.success(`Test "${newTestName}" created for all sections of Class ${selectedClassData.className}`);
        
        // Reset form
        setNewTestName('');
        setSelectedClass('');
        
        // Refresh tests list
        await fetchTests();
      } else {
        throw new Error(response.message || 'Failed to create test');
      }

    } catch (error: any) {
      console.error('Error adding test:', error);
      toast.error('Failed to add test');
    }
  };

  // Delete test
  const deleteTest = async (testId: string, testName: string) => {
    if (!confirm(`Delete test "${testName}"?`)) return;

    try {
      console.log('Deleting test:', { testId, testName, selectedSchoolId });
      
      // Call API to delete test
      const response = await testAPI.deleteTest(selectedSchoolId, testId);
      
      console.log('Delete test response:', response);
      
      if (response.success) {
        toast.success(`Test "${testName}" deleted successfully`);
        
        // Refresh tests list
        await fetchTests();
      } else {
        throw new Error(response.message || 'Failed to delete test');
      }

    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast.error(error.message || 'Failed to delete test');
    }
  };

  // Load data when component mounts or school changes
  React.useEffect(() => {
    if (selectedSchoolId) {
      fetchClasses();
      fetchTests();
    }
  }, [selectedSchoolId]);

  if (!selectedSchoolId || !school) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Academic Management</h2>
              <p className="text-gray-600">Please select a school to manage academic settings.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Academic Management</h1>
          <p className="text-gray-600">Manage classes, sections, and tests for {school.name}</p>
          <div className="mt-2 text-sm text-gray-500">
            School Code: {school.code} | Total Classes: {classes.length}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeView === card.id;
            
            return (
              <div
                key={card.id}
                onClick={() => setActiveView(card.id as any)}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isActive ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    card.color === 'green' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{card.count}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeView === 'classes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Classes Management</h2>
                <button
                  onClick={addClass}
                  disabled={!newClassName.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Class
                </button>
              </div>

              {/* Add Class Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-800 mb-4">Create New Class</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Enter class name (e.g., 1, 2, LKG, UKG)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addClass}
                    disabled={!newClassName.trim() || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Debug Info */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  Debug: Classes count: {classes.length} | Loading: {loading.toString()}
                </p>
                <p className="text-xs text-yellow-600">
                  Selected School ID: {selectedSchoolId}
                </p>
              </div>

              {/* Classes List */}
              <div className="space-y-4">
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
                    <p className="text-gray-600">Create your first class to get started.</p>
                  </div>
                ) : (
                  classes.map((cls) => (
                  <div key={cls._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Class {cls.className}</h4>
                        <p className="text-sm text-gray-600">
                          {cls.sections.length} sections • Academic Year: {cls.academicYear}
                        </p>
                        {cls.sections.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {cls.sections.map((section, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                Section {section}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteClass(cls._id, cls.className)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Delete class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === 'sections' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sections Management</h2>
                <button
                  onClick={addSection}
                  disabled={!selectedClass || !newSection.trim() || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </button>
              </div>

              {/* Add Section Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-800 mb-4">Add Section to Class</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        Class {cls.className}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Enter section name (e.g., A, B, C)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={addSection}
                      disabled={!selectedClass || !newSection.trim() || loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls._id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Class {cls.className}</h4>
                    {cls.sections.length === 0 ? (
                      <p className="text-gray-500 text-sm">No sections added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cls.sections.map((section, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full"
                          >
                            <span className="text-sm">Section {section}</span>
                            <button
                              onClick={() => removeSection(cls._id, section)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove section"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'tests' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Tests Management</h2>
                <button
                  onClick={addTest}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Test
                </button>
              </div>

              {/* Add Test Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-800 mb-4">Create New Test</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        Class {cls.className}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      placeholder="Enter test name (e.g., Midterm, Unit Test 1)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={addTest}
                      disabled={!selectedClass || !newTestName.trim() || loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Test'}
                    </button>
                  </div>
                </div>
                {selectedClass && (
                  <div className="mt-2 text-sm text-gray-600">
                    This test will be created for <strong>all sections</strong> of Class {classes.find(c => c._id === selectedClass)?.className}
                  </div>
                )}
              </div>

              {/* Tests List */}
              <div className="space-y-4">
                {tests.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
                    <p className="text-gray-600">Create your first test to get started.</p>
                  </div>
                ) : (
                  tests.map((test) => (
                    <div key={test._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{test.name}</h4>
                          <p className="text-sm text-gray-600">
                            Class: {test.className} | Max Marks: {test.maxMarks} | Weightage: {test.weightage}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{test.description}</p>
                        </div>
                        <button
                          onClick={() => deleteTest(test._id, test.name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                          title="Delete test"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicNavigation;
