import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, BookOpen, ChevronDown, ChevronRight, Edit3, Save, Award, GraduationCap, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { testDetailsAPI, testDetailsHelpers, TEST_DETAILS_CONFIG } from '../../../api/testDetails';

interface TestType {
  _id?: string;
  name: string;
  code: string;
  description: string;
  maxMarks: number;
  weightage: number;
  isActive: boolean;
}

interface ClassTestTypes {
  className: string;
  testTypes: TestType[];
}

const AcademicTestConfiguration: React.FC = () => {
  const appContext = useApp();
  const selectedSchoolId = appContext?.selectedSchoolId || '';
  const schools = appContext?.schools || [];

  // Configuration constants
  const CONFIG = {
    auth: {
      primaryAuthKey: 'erp.auth',
      fallbackTokenKey: 'token',
      tokenProperty: 'token'
    },
    defaults: {
      maxMarks: TEST_DETAILS_CONFIG.defaultMaxMarks,
      weightage: TEST_DETAILS_CONFIG.defaultWeightage,
      academicYear: TEST_DETAILS_CONFIG.defaultAcademicYear
    },
    classes: {
      prePrimary: TEST_DETAILS_CONFIG.prePrimaryClasses,
      maxGrade: TEST_DETAILS_CONFIG.maxGrade
    }
  };

  // Helper functions
  const generateClassList = (): string[] => {
    return testDetailsHelpers.generateClassList();
  };

  const getDefaultTestType = (): TestType => {
    return testDetailsHelpers.getDefaultTestType();
  };

  const getDefaultTestTypes = (): TestType[] => {
    // Return empty array - only fetch from backend, no defaults
    return [];
  };

  const classList = generateClassList();

  // State management
  const [classTestTypes, setClassTestTypes] = useState<ClassTestTypes[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedClass, setExpandedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // New test form - initialize with default template
  const [newTestType, setNewTestType] = useState<TestType>(getDefaultTestType());

  // Helper function to get token consistently
  const getAuthToken = (): string | null => {
    let token;
    const auth = localStorage.getItem(CONFIG.auth.primaryAuthKey);
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        token = parsed[CONFIG.auth.tokenProperty];
      } catch (e) {
        console.log(`Failed to parse ${CONFIG.auth.primaryAuthKey}:`, e);
      }
    }
    // Fallback to direct token storage
    if (!token) {
      token = localStorage.getItem(CONFIG.auth.fallbackTokenKey);
    }
    return token;
  };

  // Find the selected school
  const school = schools.find(s => s.id === selectedSchoolId);

  // Fetch test types for all classes
  const fetchAllClassTestTypes = async () => {
    if (!selectedSchoolId || !school?.code) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching test types for school code:', school.code);
      
      // Use configurable API function
      const responseData = await testDetailsAPI.getTestDetailsBySchoolCodeSuperadmin(
        school.code, 
        CONFIG.defaults.academicYear
      );

      console.log('API Response:', responseData);

      if (responseData?.success && responseData?.data?.classTestTypes) {
        const testDetailsData = responseData.data.classTestTypes;
        
        // Convert Map/Object to our format - only show classes that have actual test data
        const formattedData: ClassTestTypes[] = [];
        
        if (testDetailsData instanceof Map) {
          // Handle Map format
          testDetailsData.forEach((testTypes, className) => {
            if (testTypes && testTypes.length > 0) {
              formattedData.push({ className, testTypes });
            }
          });
        } else if (typeof testDetailsData === 'object') {
          // Handle Object format
          Object.entries(testDetailsData).forEach(([className, testTypes]) => {
            if (Array.isArray(testTypes) && testTypes.length > 0) {
              formattedData.push({ className, testTypes: testTypes as TestType[] });
            }
          });
        }
        
        setClassTestTypes(formattedData);
        console.log('Test types loaded:', formattedData);
      } else {
        // No data found - show empty state
        setClassTestTypes([]);
        console.log('No test configuration data found');
      }
    } catch (error: any) {
      console.error('Error fetching test types:', error);
      
      if (error.response?.status === 404) {
        // No data found - show empty state
        setClassTestTypes([]);
        console.log('No test configuration found (404)');
      } else {
        toast.error('Error fetching test types');
        setClassTestTypes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClassTestTypes();
  }, [selectedSchoolId]);

  // Add test type to selected class
  const addTestType = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    
    if (!newTestType.name.trim()) {
      toast.error('Please enter test name');
      return;
    }

    try {
      setSaving(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get school code from the school object
      const schoolCode = school?.code;
      if (!schoolCode) {
        throw new Error('School code not found');
      }

      // Prepare the new test type
      const testTypeToAdd = {
        name: newTestType.name.trim(),
        code: (newTestType.code || testDetailsHelpers.generateTestCode()).toUpperCase(),
        description: newTestType.description || '',
        maxMarks: newTestType.maxMarks || CONFIG.defaults.maxMarks,
        weightage: newTestType.weightage || CONFIG.defaults.weightage,
        isActive: true
      };
      
      console.log('Adding test type to backend:', testTypeToAdd);

      // Use configurable API function
      const responseData = await testDetailsAPI.addTestTypeToClassSuperadmin(
        schoolCode, 
        selectedClass, 
        testTypeToAdd, 
        CONFIG.defaults.academicYear
      );

      if (responseData?.success) {
        toast.success('Test type added successfully');
        setNewTestType(getDefaultTestType());
        // Refresh the data from backend
        await fetchAllClassTestTypes();
      } else {
        throw new Error(responseData?.message || 'Failed to add test type');
      }
    } catch (error: any) {
      console.error('Error adding test type:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add test type';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Remove test type from class
  const removeTestType = async (className: string, testTypeIndex: number) => {
    if (!confirm(`Remove this test type from Class ${className}?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const schoolCode = school?.code;
      if (!schoolCode) {
        throw new Error('School code not found');
      }

      // Get the test type to be removed
      const currentTestTypes = getClassTestTypes(className);
      const testTypeToRemove = currentTestTypes[testTypeIndex];
      
      if (!testTypeToRemove) {
        throw new Error('Test type not found');
      }

      console.log('Removing test type from backend:', testTypeToRemove);

      // Use configurable API function
      const responseData = await testDetailsAPI.removeTestTypeFromClassSuperadmin(
        schoolCode, 
        className, 
        testTypeToRemove.code, 
        CONFIG.defaults.academicYear
      );

      if (responseData?.success) {
        toast.success('Test type removed successfully');
        // Refresh the data from backend
        await fetchAllClassTestTypes();
      } else {
        throw new Error(responseData?.message || 'Failed to remove test type');
      }
    } catch (error: any) {
      console.error('Error removing test type:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove test type';
      toast.error(errorMessage);
    }
  };

  // Save all test configurations (batch operation)
  const saveAllTestConfigurations = async () => {
    if (!selectedSchoolId) {
      toast.error('No school selected');
      return;
    }

    if (classTestTypes.length === 0) {
      toast.error('No test configurations to save');
      return;
    }

    try {
      setSaving(true);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const schoolCode = school?.code;
      if (!schoolCode) {
        throw new Error('School code not found');
      }

      // Convert classTestTypes to the Map format expected by the backend
      const classTestTypesMap: Record<string, any[]> = {};
      classTestTypes.forEach(classData => {
        // Clean up test types by removing frontend-specific fields
        const cleanTestTypes = classData.testTypes.map(testType => 
          testDetailsHelpers.cleanTestType(testType)
        );
        
        classTestTypesMap[classData.className] = cleanTestTypes;
      });

      console.log('Batch saving test configurations:', classTestTypesMap);

      // Use configurable API function
      const responseData = await testDetailsAPI.updateSchoolTestDetailsSuperadmin(
        schoolCode, 
        classTestTypesMap, 
        CONFIG.defaults.academicYear
      );

      if (responseData?.success) {
        toast.success('All test configurations saved successfully');
        console.log('Save response:', responseData);
        // Refresh the data from backend
        await fetchAllClassTestTypes();
      } else {
        throw new Error(responseData?.message || 'Failed to save test configurations');
      }
    } catch (error: any) {
      console.error('Error saving test configurations:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save test configurations';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle Enter key press for adding test types
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTestType();
    }
  };

  // Get test types for a specific class
  const getClassTestTypes = (className: string): TestType[] => {
    const classData = classTestTypes.find(ct => ct.className === className);
    return classData?.testTypes || [];
  };

  // Toggle class expansion
  const toggleClassExpansion = (className: string) => {
    setExpandedClass(expandedClass === className ? '' : className);
  };

  // Update test type in state
  const updateTestType = (className: string, testTypeIndex: number, updatedTestType: TestType) => {
    setClassTestTypes(prev => prev.map(classData => {
      if (classData.className === className) {
        const updatedTestTypes = [...classData.testTypes];
        updatedTestTypes[testTypeIndex] = updatedTestType;
        return { ...classData, testTypes: updatedTestTypes };
      }
      return classData;
    }));
  };

  if (!selectedSchoolId || !school) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Academic Test Configuration</h1>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Please select a school to configure test types.</p>
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
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Academic Test Configuration</h1>
          </div>
          <p className="text-gray-600">Configure test types and assessments for {school.name}</p>
          <div className="mt-2 text-sm text-gray-500">
            School Code: {school.code} | Total Classes: {classList.length}
          </div>
        </div>

        {/* Add Test Type Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Test Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Class Selection - REQUIRED */}
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

            {/* Test Name - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTestType.name}
                onChange={(e) => setNewTestType(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Enter test name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Add Button */}
          <div className="flex gap-3">
            <button
              onClick={addTestType}
              disabled={!selectedClass || !newTestType.name.trim() || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {saving ? 'Adding...' : 'Add Test Type'}
            </button>
            
            {classTestTypes.length > 0 && (
              <button
                onClick={saveAllTestConfigurations}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Bulk Save All'}
              </button>
            )}
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Classes & Test Types</h2>
            <button
              onClick={fetchAllClassTestTypes}
              disabled={loading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading test configurations...</p>
            </div>
          ) : classTestTypes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Configurations Found</h3>
              <p className="text-gray-600 mb-4">No test types have been configured for this school yet.</p>
              <p className="text-sm text-gray-500">Select a class above and add test types to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classTestTypes.map(({ className, testTypes }) => {
                const isExpanded = expandedClass === className;
                
                return (
                  <div key={className} className="border border-gray-200 rounded-lg">
                    {/* Class Header */}
                    <div
                      onClick={() => toggleClassExpansion(className)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-800">
                          Class {className}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {testTypes.length} tests
                        </span>
                      </div>
                    </div>

                    {/* Test Types List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        {testTypes.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No test types configured yet for Class {className}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {testTypes.map((testType, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 rounded-lg border"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-2">
                                      <h4 className="font-medium text-gray-900">{testType.name}</h4>
                                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                        {testType.code}
                                      </span>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        testType.isActive 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {testType.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <span>Max Marks: {testType.maxMarks}</span>
                                      {testType.description && (
                                        <>
                                          <span className="mx-2">•</span>
                                          <span>{testType.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeTestType(className, index)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                                    title="Remove test type"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
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
      </div>
    </div>
  );
};

export default AcademicTestConfiguration;
