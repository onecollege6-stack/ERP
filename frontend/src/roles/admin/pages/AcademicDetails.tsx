import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';

interface Subject {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

interface ClassSubjects {
  className: string;
  subjects: Subject[];
}

const AcademicDetails: React.FC = () => {
  console.log('AcademicDetails component starting...');
  
  const { token, user } = useAuth();
  console.log('Auth token obtained:', token ? 'Present' : 'Missing');
  
  const [classSubjects, setClassSubjects] = useState<ClassSubjects[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Debug log to see if component is rendering
  console.log('AcademicDetails component rendering...');

  // Standard classes
  const standardClasses = [
    'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      // Include school context header
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Add school context if available
      if (user?.schoolCode) {
        headers['x-school-code'] = user.schoolCode;
      }

      const response = await fetch('/api/subjects/all', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        
        // Initialize class subjects with existing data or empty arrays
        const initialClassSubjects = standardClasses.map(className => ({
          className,
          subjects: data.subjects?.filter((subject: any) => subject.className === className) || []
        }));
        
        setClassSubjects(initialClassSubjects);
      } else {
        throw new Error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
      
      // Initialize with empty arrays if fetch fails
      const initialClassSubjects = standardClasses.map(className => ({
        className,
        subjects: []
      }));
      setClassSubjects(initialClassSubjects);
    } finally {
      setLoading(false);
    }
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

  const addSubject = (className: string) => {
    const newSubject: Subject = {
      name: '',
      code: '',
      description: '',
      isActive: true
    };

    setClassSubjects(prev => prev.map(classItem => 
      classItem.className === className 
        ? { ...classItem, subjects: [...classItem.subjects, newSubject] }
        : classItem
    ));

    // Expand the class if not already expanded
    if (!expandedClasses.has(className)) {
      setExpandedClasses(prev => new Set([...prev, className]));
    }
  };

  const updateSubject = (className: string, subjectIndex: number, field: keyof Subject, value: string | boolean) => {
    setClassSubjects(prev => prev.map(classItem => 
      classItem.className === className 
        ? {
            ...classItem,
            subjects: classItem.subjects.map((subject, index) => 
              index === subjectIndex 
                ? { ...subject, [field]: value }
                : subject
            )
          }
        : classItem
    ));
  };

  const removeSubject = (className: string, subjectIndex: number) => {
    setClassSubjects(prev => prev.map(classItem => 
      classItem.className === className 
        ? {
            ...classItem,
            subjects: classItem.subjects.filter((_, index) => index !== subjectIndex)
          }
        : classItem
    ));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Prepare subjects data for saving
      const allSubjects = classSubjects.flatMap(classItem => 
        classItem.subjects
          .filter(subject => subject.name.trim() && subject.code.trim())
          .map(subject => ({
            ...subject,
            className: classItem.className
          }))
      );

      const response = await fetch('/api/subjects/bulk-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(user?.schoolCode && { 'x-school-code': user.schoolCode })
        },
        body: JSON.stringify({ subjects: allSubjects })
      });

      if (response.ok) {
        toast.success('Subjects saved successfully');
        fetchSubjects(); // Refresh data
      } else {
        throw new Error('Failed to save subjects');
      }
    } catch (error) {
      console.error('Error saving subjects:', error);
      toast.error('Failed to save subjects');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Details</h1>
          <p className="text-gray-600 mt-1">Manage subjects for each class</p>
        </div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
          </div>

          <div className="space-y-4">
            {classSubjects.map((classItem) => (
              <div key={classItem.className} className="border rounded-lg">
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => toggleClassExpansion(classItem.className)}
                    className="flex items-center space-x-3 text-left hover:bg-gray-50 flex-1 rounded"
                  >
                    {expandedClasses.has(classItem.className) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">{classItem.className}</span>
                    <span className="text-sm text-gray-500">
                      ({classItem.subjects.length} subjects)
                    </span>
                  </button>
                  <button
                    onClick={() => addSubject(classItem.className)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 ml-4"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add Subject</span>
                  </button>
                </div>

                {expandedClasses.has(classItem.className) && (
                  <div className="border-t bg-gray-50 p-4">
                    {classItem.subjects.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No subjects added yet. Click "Add Subject" to get started.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {classItem.subjects.map((subject, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded border">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input
                                type="text"
                                placeholder="Subject Name"
                                value={subject.name}
                                onChange={(e) => updateSubject(classItem.className, index, 'name', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Subject Code"
                                value={subject.code}
                                onChange={(e) => updateSubject(classItem.className, index, 'code', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Description (optional)"
                                value={subject.description || ''}
                                onChange={(e) => updateSubject(classItem.className, index, 'description', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={subject.isActive}
                                  onChange={(e) => updateSubject(classItem.className, index, 'isActive', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Active</span>
                              </label>
                              <button
                                onClick={() => removeSubject(classItem.className, index)}
                                className="p-1 text-red-600 hover:text-red-700"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicDetails;
