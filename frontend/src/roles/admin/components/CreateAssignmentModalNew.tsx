import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, FileText, Users, AlertCircle } from 'lucide-react';
import * as assignmentAPI from '../../../api/assignment';
import { useAuth } from '../../../auth/AuthContext';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  subject: string;
  class: string;
  section: string;
  startDate: string;
  dueDate: string;
  instructions: string;
  attachments: File[];
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subject: '',
    class: '',
    section: '',
    startDate: '',
    dueDate: '',
    instructions: '',
    attachments: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Class options matching our class-subjects system
  const classes = [
    'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

  useEffect(() => {
    if (isOpen && formData.class) {
      fetchSubjectsForClass(formData.class);
    }
  }, [isOpen, formData.class]);

  const fetchSubjectsForClass = async (className: string) => {
    try {
      console.log(`🔍 Fetching subjects for class: ${className}`);
      
      const response = await fetch(`/api/class-subjects/class/${encodeURIComponent(className)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Class subjects response:', data);
        
        // Extract subjects from the response
        const subjects = data.data?.subjects || [];
        const subjectNames = subjects
          .filter((subject: any) => subject.isActive)
          .map((subject: any) => subject.name);
        
        console.log('📚 Available subjects:', subjectNames);
        setAvailableSubjects(subjectNames);
        
        // If current subject is not available for selected class, reset it
        if (formData.subject && !subjectNames.includes(formData.subject)) {
          setFormData(prev => ({ ...prev, subject: '' }));
        }
      } else {
        console.error('❌ Failed to fetch subjects:', response.status, response.statusText);
        setAvailableSubjects([]);
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      // Fallback to empty array if API fails
      setAvailableSubjects([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject) newErrors.subject = 'Please select a subject';
    if (!formData.class) newErrors.class = 'Please select a class';
    if (!formData.section) newErrors.section = 'Please select a section';
    if (!formData.startDate) newErrors.startDate = 'Please set a start date';
    if (!formData.dueDate) newErrors.dueDate = 'Please set a deadline date';
    if (!formData.instructions.trim()) newErrors.instructions = 'Please write assignment instructions';

    // Validate start date is not in the past
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // Validate due date is after start date
    if (formData.startDate && formData.dueDate) {
      const startDate = new Date(formData.startDate);
      const dueDate = new Date(formData.dueDate);
      if (dueDate <= startDate) {
        newErrors.dueDate = 'Due date must be after start date';
      }
    }

    // Validate file sizes
    const oversizedFiles = formData.attachments.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      newErrors.attachments = `Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max 10MB per file.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/gif', 'text/plain'];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          attachments: `Invalid file type: ${file.name}. Only PDFs, Word docs, images, and text files allowed.`
        }));
        return false;
      }
      return true;
    });

    setFormData(prev => ({ ...prev, attachments: validFiles }));
    if (validFiles.length > 0) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('title', formData.instructions.split('\n')[0] || 'Assignment');
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('class', formData.class);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('instructions', formData.instructions);

      // Add files
      formData.attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await assignmentAPI.createAssignmentWithFiles(formDataToSend);
      
      setSuccessMessage(response.message || `Sent to ${formData.class} • Section ${formData.section}`);
      
      // Show success for 2 seconds then close
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage('');
        setFormData({
          title: '', subject: '', class: '', section: '', startDate: '',
          dueDate: '', instructions: '', attachments: []
        });
      }, 2000);

    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to create assignment' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create & Send Assignment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {successMessage && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">✅ {successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1: Assignment Setup */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                1. Choose class and subject
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    disabled={!formData.class}
                  >
                    <option value="">
                      {formData.class ? 'Select Subject' : 'Select Class First'}
                    </option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.class ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.class}
                    onChange={e => {
                      const newClass = e.target.value;
                      setFormData({ ...formData, class: newClass, subject: '' });
                      if (newClass) {
                        fetchSubjectsForClass(newClass);
                      } else {
                        setAvailableSubjects([]);
                      }
                    }}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>
                        {cls === 'LKG' ? 'LKG' : cls === 'UKG' ? 'UKG' : `Class ${cls}`}
                      </option>
                    ))}
                  </select>
                  {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.section ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                  {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>
              </div>
            </div>

            {/* Step 2: Assignment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                2. Write the assignment details
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions (what to do, how many questions, format, etc.) *
                </label>
                <textarea
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.instructions ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Write detailed instructions for the assignment..."
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                />
                {errors.instructions && <p className="text-red-500 text-xs mt-1">{errors.instructions}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Attach Files (optional)
                </label>
                <input
                  type="file"
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, Word docs, images, text files. Max 10MB per file.
                </p>
                {errors.attachments && <p className="text-red-500 text-xs mt-1">{errors.attachments}</p>}
                
                {formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create & Send Assignment</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
