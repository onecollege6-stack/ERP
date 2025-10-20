import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Eye, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { useSchoolClasses } from '../../../hooks/useSchoolClasses';
import { toast } from 'react-hot-toast';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  // Use the useSchoolClasses hook to fetch classes configured by superadmin
  const {
    classesData,
    loading: classesLoading,
    error: classesError,
    getClassOptions,
    getSectionsByClass,
    hasClasses
  } = useSchoolClasses();

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState<number>(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get class list from superadmin configuration
  const classList = classesData?.classes?.map(c => c.className) || [];

  console.log('MessagesPage render:', {
    user: user?.schoolCode,
    classesData,
    classList,
    hasClasses: hasClasses()
  });

  // Update available sections when class changes - same logic as Results
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
  }, [selectedClass, classesData, getSectionsByClass]);

  // Preview recipients when class/section changes
  useEffect(() => {
    if (selectedClass && selectedSection) {
      previewRecipients();
    } else {
      setRecipientCount(0);
    }
  }, [selectedClass, selectedSection]);

  const previewRecipients = async () => {
    if (!selectedClass || !selectedSection) return;

    try {
      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';

      if (!schoolCode) {
        console.error('School code not available');
        return;
      }

      // Simulate API call to get recipient count
      // Replace this with your actual API endpoint
      const response = await fetch('/api/students/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolCode,
          class: selectedClass,
          section: selectedSection
        })
      });

      if (response.ok) {
        const result = await response.json();
        setRecipientCount(result.data?.count || 25); // Fallback to 25 for demo
      } else {
        // Fallback for demo purposes
        setRecipientCount(25);
      }
    } catch (err) {
      console.error('Error previewing recipients:', err);
      // Fallback for demo purposes
      setRecipientCount(25);
    }
  };

  // Preview message
  const handlePreview = () => {
    if (!title.trim() || !body.trim()) {
      setError('Please fill in both title and message body');
      return;
    }
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }
    setShowPreviewModal(true);
  };

  // Send message
  const handleSendMessage = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!selectedClass || !selectedSection) {
        throw new Error('Please select class and section');
      }

      const schoolCode = localStorage.getItem('erp.schoolCode') || user?.schoolCode || '';

      if (!schoolCode) {
        throw new Error('School code not available');
      }

      // Simulate API call - replace with your actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would make the actual API call:
      /*
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolCode,
          class: selectedClass,
          section: selectedSection,
          title,
          body,
          target: `${selectedClass}-${selectedSection}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      */

      setSuccess(`Message sent successfully to ${recipientCount} students!`);
      setTitle('');
      setBody('');
      setSelectedClass('');
      setSelectedSection('');
      setRecipientCount(0);
      setShowPreviewModal(false);

    } catch (error: any) {
      setError(error.message || 'Failed to send message');
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const renderClassSectionSelector = () => {
    if (classesLoading) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading classes...</span>
          </div>
        </div>
      );
    }

    if (classesError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-red-800 font-medium">Error Loading Classes</h3>
          </div>
          <p className="text-red-700 mt-1 text-sm">{classesError}</p>
        </div>
      );
    }

    if (!hasClasses() || classList.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-yellow-800 font-medium">No Classes Configured</h3>
          </div>
          <p className="text-yellow-700 mt-1 text-sm">
            No classes have been defined for this school. Please contact the Super Admin to add classes and sections.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Selection */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              id="class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          {/* Section Selection */}
          <div>
            <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-2">
              Section <span className="text-red-500">*</span>
            </label>
            <select
              id="section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedClass || availableSections.length === 0}
            >
              <option value="">
                {!selectedClass
                  ? 'Select Class First'
                  : availableSections.length === 0
                    ? 'No Sections Available'
                    : 'Select Section'
                }
              </option>
              {availableSections.map((section) => (
                <option key={section.value} value={section.value}>
                  Section {section.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipient Count Display */}
        {recipientCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              This message will be sent to <strong>{recipientCount}</strong> student{recipientCount !== 1 ? 's' : ''} in Class {selectedClass} - Section {selectedSection}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        <MessageSquare className="mr-3 h-8 w-8 text-blue-600" /> Messages
      </h1>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      {/* Send New Message Section */}
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Send New Message</h2>

        {/* Class and Section Selection */}
        <div className="mb-6">
          {renderClassSectionSelector()}
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter message title"
              disabled={!hasClasses() || classList.length === 0}
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              rows={5}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              disabled={!hasClasses() || classList.length === 0}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handlePreview}
            disabled={!hasClasses() || classList.length === 0 || !title || !body || !selectedClass || !selectedSection}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-5 w-5 mr-2" /> Preview
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !hasClasses() || classList.length === 0 || !title || !body || !selectedClass || !selectedSection}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading || !hasClasses() || classList.length === 0 || !title || !body || !selectedClass || !selectedSection
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
          >
            {loading ? 'Sending...' : <><Send className="h-5 w-5 mr-2" />Send Message</>}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-full max-w-md md:max-w-lg lg:max-w-xl shadow-lg rounded-md bg-white">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Message Preview</h3>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Title:</p>
              <p className="text-gray-900 font-semibold">{title}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Message Body:</p>
              <p className="text-gray-800 whitespace-pre-wrap">{body}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Target Audience:</p>
              <p className="text-gray-800">
                Class {selectedClass} - Section {selectedSection}
                {recipientCount > 0 && (
                  <span className="text-blue-600 font-semibold"> ({recipientCount} students)</span>
                )}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-md ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
              >
                {loading ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sent Messages List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sent Messages</h2>
        <div className="text-center py-8 text-gray-500">
          No messages sent yet. Send your first message above.
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;