import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit3, BookOpen, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TestType {
  _id?: string;
  name: string;
  code: string;
  description: string;
  maxMarks: number;
  weightage: number;
  isActive: boolean;
}

interface TestDetailsManagerProps {
  schoolCode: string;
  isOpen: boolean;
  onClose: () => void;
}

const TestDetailsManager: React.FC<TestDetailsManagerProps> = ({ schoolCode, isOpen, onClose }) => {
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && schoolCode) {
      fetchTestDetails();
    }
  }, [isOpen, schoolCode]);

  const fetchTestDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp.auth') ? JSON.parse(localStorage.getItem('erp.auth')!).token : null;
      
      const response = await fetch(`/api/test-details/school/${schoolCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestTypes(data.data?.testTypes || []);
      } else if (response.status === 404) {
        // No test details found, start with default types
        setTestTypes(getDefaultTestTypes());
      } else {
        throw new Error('Failed to fetch test details');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('Failed to load test details');
      // Initialize with default types on error
      setTestTypes(getDefaultTestTypes());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTestTypes = (): TestType[] => [
    { name: 'Formative Assessment 1', code: 'FA-1', description: 'First Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
    { name: 'Formative Assessment 2', code: 'FA-2', description: 'Second Formative Assessment', maxMarks: 20, weightage: 0.1, isActive: true },
    { name: 'Summative Assessment 1', code: 'SA-1', description: 'First Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true },
    { name: 'Summative Assessment 2', code: 'SA-2', description: 'Second Summative Assessment', maxMarks: 80, weightage: 0.3, isActive: true },
    { name: 'Final Examination', code: 'FINAL', description: 'Final Examination', maxMarks: 100, weightage: 1.0, isActive: true },
    { name: 'Unit Test 1', code: 'UT-1', description: 'First Unit Test', maxMarks: 25, weightage: 0.15, isActive: true },
    { name: 'Unit Test 2', code: 'UT-2', description: 'Second Unit Test', maxMarks: 25, weightage: 0.15, isActive: true },
    { name: 'Half Yearly', code: 'HY', description: 'Half Yearly Examination', maxMarks: 100, weightage: 0.5, isActive: true },
    { name: 'Annual Examination', code: 'ANNUAL', description: 'Annual Examination', maxMarks: 100, weightage: 0.5, isActive: true }
  ];

  const addTestType = () => {
    const newTestType: TestType = {
      name: '',
      code: '',
      description: '',
      maxMarks: 100,
      weightage: 1.0,
      isActive: true
    };
    setTestTypes([...testTypes, newTestType]);
    setEditingIndex(testTypes.length);
  };

  const updateTestType = (index: number, field: keyof TestType, value: any) => {
    const updated = [...testTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTestTypes(updated);
  };

  const removeTestType = (index: number) => {
    if (testTypes.length <= 1) {
      toast.error('At least one test type is required');
      return;
    }
    const updated = testTypes.filter((_, i) => i !== index);
    setTestTypes(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const saveTestDetails = async () => {
    // Validate test types
    const errors = [];
    testTypes.forEach((testType, index) => {
      if (!testType.name.trim()) errors.push(`Test type ${index + 1}: Name is required`);
      if (!testType.code.trim()) errors.push(`Test type ${index + 1}: Code is required`);
      if (testType.maxMarks <= 0) errors.push(`Test type ${index + 1}: Max marks must be greater than 0`);
      if (testType.weightage <= 0) errors.push(`Test type ${index + 1}: Weightage must be greater than 0`);
    });

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    // Check for duplicate codes
    const codes = testTypes.map(t => t.code.toUpperCase());
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      toast.error(`Duplicate test codes found: ${duplicates.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('erp.auth') ? JSON.parse(localStorage.getItem('erp.auth')!).token : null;
      
      const response = await fetch(`/api/test-details/school/${schoolCode}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testTypes })
      });

      if (response.ok) {
        toast.success('Test details saved successfully');
        setEditingIndex(null);
      } else {
        throw new Error('Failed to save test details');
      }
    } catch (error) {
      console.error('Error saving test details:', error);
      toast.error('Failed to save test details');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Test Details - {schoolCode}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">Configure test types and assessment structure for this school</p>
              <button
                onClick={addTestType}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Test Type</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading test details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testTypes.map((testType, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={testType.name}
                          onChange={(e) => updateTestType(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Formative Assessment 1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                        <input
                          type="text"
                          value={testType.code}
                          onChange={(e) => updateTestType(index, 'code', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., FA-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks *</label>
                        <input
                          type="number"
                          value={testType.maxMarks}
                          onChange={(e) => updateTestType(index, 'maxMarks', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weightage *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={testType.weightage}
                          onChange={(e) => updateTestType(index, 'weightage', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0.1"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={testType.description}
                          onChange={(e) => updateTestType(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description of this test type"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={testType.isActive}
                          onChange={(e) => updateTestType(index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      
                      <button
                        onClick={() => removeTestType(index)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveTestDetails}
                disabled={saving || loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Test Details'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailsManager;
