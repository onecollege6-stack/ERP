import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, FileText, ChevronDown, ChevronRight, BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';

interface TestType {
  testType: string;
  testName: string;
  description?: string;
  code?: string;
  maxMarks?: number;
  weightage?: number;
  isActive?: boolean;
  _id?: string;
}

interface ClassTestDetails {
  className: string;
  testTypes: TestType[];
}

const AcademicTestConfig: React.FC = () => {
  const { token, user } = useAuth();

  // State management
  const [classTestDetails, setClassTestDetails] = useState<ClassTestDetails[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedClass, setExpandedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newTestType, setNewTestType] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Class list from UKG, LKG, 1-12
  const classList = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  // Fetch test details for all classes
  const fetchAllClassTestDetails = async () => {
    setLoading(true);
    try {
      // Get the school code from localStorage or auth context
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      console.log('Fetching test details with school code:', schoolCode);
      
      if (!schoolCode) {
        toast.error('School code not available');
        setLoading(false);
        return;
      }

      // Always fetch from backend API - no fallbacks to hardcoded data
      const response = await fetch('/api/superadmin/academic/test-details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-school-code': schoolCode
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
        
        // Always use backend data, even if empty
        const classesData: ClassTestDetails[] = data.data?.classes || [];
        
        // Initialize empty arrays for all classes if not present in backend
        const allClassesData = classList.map(className => {
          const existingClass = classesData.find((cls: ClassTestDetails) => cls.className === className);
          return existingClass || { className, testTypes: [] };
        });
        
        setClassTestDetails(allClassesData);
        console.log('Set class test details:', allClassesData);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        toast.error(`API Error: ${errorData.message || 'Failed to fetch test details'}`);
        
        // Initialize with empty data structure if API fails
        const emptyClassesData = classList.map(className => ({ className, testTypes: [] }));
        setClassTestDetails(emptyClassesData);
      }
    } catch (error) {
      console.error('Network error fetching test details:', error);
      toast.error('Network error connecting to server');
      
      // Initialize with empty data structure on network error
      const emptyClassesData = classList.map(className => ({ className, testTypes: [] }));
      setClassTestDetails(emptyClassesData);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Only fetch from backend - no hardcoded data
    fetchAllClassTestDetails();
  }, [token, user]);

  // Add test type to selected class
  const addTestType = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    
    if (!newTestName.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    try {
      // Get the school code from localStorage or auth context
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      if (!schoolCode) {
        toast.error('School code not available');
        return;
      }
      
      console.log('Adding test type with school code:', schoolCode);
      
      const response = await fetch('/api/superadmin/academic/add-test-type', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-school-code': schoolCode
        },
        body: JSON.stringify({
          className: selectedClass,
          testName: newTestName.trim(),
          testType: newTestType.trim() || 'Assessment',
          description: newDescription.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Test type added successfully');
        setNewTestName('');
        setNewTestType('');
        setNewDescription('');
        // Always refresh from backend after adding
        await fetchAllClassTestDetails();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error adding test type:', errorData);
        toast.error(errorData.message || 'Failed to add test type');
      }
    } catch (error) {
      console.error('Network error adding test type:', error);
      toast.error('Network error while adding test type');
    }
  };

  // Remove test type from class
  const removeTestType = async (className: string, testName: string) => {
    if (!confirm(`Remove "${testName}" from Class ${className}?`)) {
      return;
    }

    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';
      
      if (!schoolCode) {
        toast.error('School code not available');
        return;
      }
      
      const response = await fetch('/api/superadmin/academic/remove-test-type', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-school-code': schoolCode
        },
        body: JSON.stringify({
          className,
          testName
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Test type removed successfully');
        // Always refresh from backend after removal
        await fetchAllClassTestDetails();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error removing test type:', errorData);
        toast.error(errorData.message || 'Failed to remove test type');
      }
    } catch (error) {
      console.error('Network error removing test type:', error);
      toast.error('Network error while removing test type');
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
    const classData = classTestDetails.find(ctd => ctd.className === className);
    return classData?.testTypes || [];
  };

  // Toggle class expansion
  const toggleClassExpansion = (className: string) => {
    setExpandedClass(expandedClass === className ? '' : className);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Academic Test Configuration</h1>
          </div>
          <p className="text-gray-600">Manage test types and configurations for each class from LKG to Class 12</p>
        </div>

        {/* Add Test Type Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Test Type</h2>
          <div className="flex gap-4 items-end">
            {/* Class Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
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

            {/* Test Name Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name
              </label>
              <input
                type="text"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter test name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addTestType}
              disabled={!selectedClass || !newTestName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Test Type
            </button>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Classes & Test Types</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading test configurations...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classList.map(className => {
                const testTypes = getClassTestTypes(className);
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
                        <h3 className="text-lg font-medium text-gray-800">
                          Class {className}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                          {testTypes.length} test types
                        </span>
                      </div>
                    </div>

                    {/* Test Types List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        {testTypes.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No test types added yet for Class {className}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {testTypes.map((test, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="text-gray-800 font-medium">
                                  {test.testName}
                                </span>
                                <button
                                  onClick={() => removeTestType(className, test.testName)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Remove test type"
                                >
                                  <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default AcademicTestConfig;
