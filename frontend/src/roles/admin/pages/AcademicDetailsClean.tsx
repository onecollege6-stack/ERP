import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, BookOpen, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';

interface Subject {
  name: string;
  teacherId?: string;
  teacherName?: string;
}

interface ClassSubjects {
  className: string;
  subjects: Subject[];
}

const AcademicDetails: React.FC = () => {
  const { token, user } = useAuth();

  // State management
  const [classSubjects, setClassSubjects] = useState<ClassSubjects[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedClass, setExpandedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Class list from UKG, LKG, 1-12
  const classList = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  // Fetch subjects for all classes
  const fetchAllClassSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/class-subjects/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-school-code': user?.schoolCode || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClassSubjects(data.data.classes || []);
      } else {
        toast.error('Failed to fetch class subjects');
      }
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClassSubjects();
  }, []);

  // Add subject to selected class
  const addSubject = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    try {
      const response = await fetch('/api/class-subjects/add-subject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-school-code': user?.schoolCode || ''
        },
        body: JSON.stringify({
          className: selectedClass,
          grade: selectedClass,
          section: 'A',
          subjectName: newSubjectName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setNewSubjectName('');
        fetchAllClassSubjects(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Error adding subject');
    }
  };

  // Remove subject from class
  const removeSubject = async (className: string, subjectName: string) => {
    if (!confirm(`Remove "${subjectName}" from Class ${className}?`)) {
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

  // Get subjects for a specific class
  const getClassSubjects = (className: string): Subject[] => {
    const classData = classSubjects.find(cs => cs.className === className);
    return classData?.subjects || [];
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
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Class Subjects Management</h1>
          </div>
          <p className="text-gray-600">Manage subjects for each class from LKG to Class 12</p>
        </div>

        {/* Add Subject Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Subject</h2>
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

            {/* Subject Name Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
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
            <button
              onClick={addSubject}
              disabled={!selectedClass || !newSubjectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Classes & Subjects</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading classes...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classList.map(className => {
                const subjects = getClassSubjects(className);
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
                          {subjects.length} subjects
                        </span>
                      </div>
                    </div>

                    {/* Subjects List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        {subjects.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No subjects added yet for Class {className}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjects.map((subject, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="text-gray-800 font-medium">
                                  {subject.name}
                                </span>
                                <button
                                  onClick={() => removeSubject(className, subject.name)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Remove subject"
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

export default AcademicDetails;
