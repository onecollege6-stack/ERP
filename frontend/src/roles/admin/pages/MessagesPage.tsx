import React, { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Eye, AlertCircle, Users, Clock, Mail, BookOpen } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { useSchoolClasses } from '../../../hooks/useSchoolClasses';
import { toast } from 'react-hot-toast';
import { getMessages, sendMessage as sendMessageAPI, previewMessageRecipients } from '../../../api/message';

// Define Message type based on the backend controller format
interface Message {
  id: string;
  title: string;
  body: string;
  target: string; // e.g., "10 - A"
  sentAt: string;
  recipientsCount: number;
  readCount: number;
  status: string;
  sender: string;
  messageType: string;
  priority: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  // Use the useSchoolClasses hook to fetch classes configured by superadmin
  const {
    classesData,
    loading: classesLoading,
    error: classesError,
    hasClasses
  } = useSchoolClasses();

  // Form state (for sending a new message) - defaults to empty string to enforce selection
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedClass, setSelectedClass] = useState(''); // Changed from 'ALL'
  const [selectedSection, setSelectedSection] = useState(''); // Changed from 'ALL'
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState<number>(0);

  // Sent Messages List filter state
  const [messagesFilterClass, setMessagesFilterClass] = useState('ALL'); // 'ALL' for filtering
  const [messagesFilterSection, setMessagesFilterSection] = useState('ALL'); // 'ALL' for filtering
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // UI state for sending
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get class list from superadmin configuration
  const classList = classesData?.classes?.map(c => c.className) || [];

  // Helper function to format date
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch messages from the backend
  const fetchMessages = useCallback(async (page: number, currentClass: string, currentSection: string) => {
    if (!user?.schoolId) return;

    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const params = {
        schoolId: user.schoolId.toString(), // Ensure schoolId is stringified for API params
        page,
        limit: LIMIT,
        status: 'sent', // Fetch only sent messages
        class: currentClass === 'ALL' ? undefined : currentClass, // Pass undefined if ALL is selected
        section: currentSection === 'ALL' ? undefined : currentSection, // Pass undefined if ALL is selected
      };

      const result = await getMessages(params);

      setMessages(result.data.messages);
      setCurrentPage(result.data.pagination.page);
      setTotalPages(result.data.pagination.pages);

    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setMessagesError('Failed to load sent messages.');
      toast.error('Failed to load sent messages.');
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.schoolId]);

  // Initial fetch of messages and refetch on filter change
  useEffect(() => {
    if (user?.schoolId) {
      // Use the filter states for the message list
      fetchMessages(1, messagesFilterClass, messagesFilterSection);
    }
  }, [user?.schoolId, fetchMessages, messagesFilterClass, messagesFilterSection]);

  // Update available sections when class changes (for the SEND NEW MESSAGE form)
  useEffect(() => {
    // If no class is selected (empty string)
    if (!selectedClass || selectedClass === 'ALL') {
      setAvailableSections([]); // No sections to choose from
      setSelectedSection(''); // Clear section
      return;
    }

    // Logic for a specific class
    if (classesData) {
      const selectedClassData = classesData.classes.find(c => c.className === selectedClass);

      if (selectedClassData) {
        // Map sections to the expected format.
        const rawSections = selectedClassData.sections || [];

        // FIX: Robust mapping to extract section name correctly and ensure section options appear
        const sections = rawSections.map((s: any) => {
          // Handle data structure that is an object { sectionName: 'A' } or potentially just the string 'A'
          const sectionName = s.sectionName || s;
          return {
            value: sectionName, // The actual value to be sent to the API (e.g., 'A')
            section: sectionName // The display value (e.g., 'A')
          };
        });

        setAvailableSections(sections);

        // If current section is invalid, reset it. Otherwise keep the old value.
        const currentValidSections = sections.map(s => s.value);
        if (selectedSection && !currentValidSections.includes(selectedSection)) {
          setSelectedSection(''); // Reset to empty if no valid selection exists
        }

      } else {
        // Class exists but no sections defined
        setAvailableSections([]);
        setSelectedSection('');
      }
    }
  }, [selectedClass, classesData]);

  // Preview recipients when class/section changes
  useEffect(() => {
    // Only preview when a specific class and section is selected (not empty or 'ALL')
    if (selectedClass && selectedSection && selectedClass !== 'ALL' && selectedSection !== 'ALL') {
      previewRecipients(selectedClass, selectedSection);
    } else {
      // FIX: Ensure recipient count is cleared if selection is incomplete
      setRecipientCount(0);
    }
  }, [selectedClass, selectedSection]);


  const previewRecipients = async (targetClass: string, targetSection: string) => {
    try {
      // Backend gets schoolId from req.user.schoolId, no need to send it
      const result = await previewMessageRecipients({
        class: targetClass,
        section: targetSection
      });

      // The backend `previewMessage` returns `estimatedRecipients`
      setRecipientCount(result.data?.estimatedRecipients || 0);
    } catch (err: any) {
      console.error('Error previewing recipients:', err);
      // Fallback for demo purposes
      setRecipientCount(0);
    }
  };

  // Preview message
  const handlePreview = () => {
    if (!title.trim() || !body.trim()) {
      setError('Please fill in both title and message body');
      return;
    }
    // Validation: Require specific class/section for sending (non-empty, non-'ALL')
    if (!selectedClass || selectedClass === 'ALL') {
      setError('Please select a specific Class to send a message');
      return;
    }
    if (!selectedSection || selectedSection === 'ALL') {
      setError('Please select a specific Section to send a message');
      return;
    }

    setError(null);
    setShowPreviewModal(true);
  };

  // Send message
  const handleSendMessage = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setShowPreviewModal(false); // Close modal on send attempt

      // Re-validate just in case
      if (!selectedClass || selectedClass === 'ALL' || !selectedSection || selectedSection === 'ALL') {
        throw new Error('Please select a specific Class and Section to send a message.');
      }

      // Backend gets schoolId from req.user.schoolId, no need to send it
      const payload = {
        title,
        body,
        class: selectedClass, // Correct class value (e.g., '7') is sent
        section: selectedSection // Correct section value (e.g., 'A') is sent
      };

      // Message is saved here (backend `messagesController.js` handles saving to message collection with class/section attributes)
      const response = await sendMessageAPI(payload);

      if (response.success) {
        const sentCount = response.data.sentCount;
        setSuccess(`Message sent successfully to ${sentCount} students!`);
        setTitle('');
        setBody('');

        // Re-fetch the message list to show the new message
        fetchMessages(1, messagesFilterClass, messagesFilterSection);

      } else {
        // Check for specific error message from the response body
        throw new Error(response.message || 'Failed to send message');
      }

    } catch (error: any) {
      setError(error.message || 'Failed to send message');
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchMessages(newPage, messagesFilterClass, messagesFilterSection);
    }
  };


  const renderClassSectionSelector = () => {
    // ... (omitted unchanged loading/error/no-classes logic)

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

    // Helper for section select text
    const getSectionSelectText = () => {
      if (!selectedClass) return 'Select Class First';
      if (availableSections.length === 0) return 'No Sections Available';
      return 'Select Section';
    };

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
              {/* Added key prop for the default 'Select Class' option */}
              <option key="select-class-default" value="">Select Class</option>
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
              disabled={!selectedClass}
            >
              {/* Added key prop for the default 'Select Section' option */}
              <option key="select-section-default" value="">
                {getSectionSelectText()}
              </option>
              {/* Only map sections if a class is selected AND sections are available */}
              {selectedClass && availableSections.map((section) => (
                <option key={section.value} value={section.value}>
                  Section {section.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipient Count Display */}
        {/* Only show count if a specific Class AND Section is selected */}
        {recipientCount > 0 && selectedClass && selectedSection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              This message will be sent to **{recipientCount}** student{recipientCount !== 1 ? 's' : ''} in Class {selectedClass} - Section {selectedSection}
            </span>
          </div>
        )}
        {recipientCount === 0 && selectedClass && selectedSection && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            {/* FIX: Use correct variables for display, which are the values sent to the API */}
            <span className="text-sm text-yellow-800">
              No students found matching Class **{selectedClass}** - Section **{selectedSection}**.
            </span>
          </div>
        )}
      </div>
    );
  };

  // New section for message history filter options
  const renderMessageFilter = () => {

    // Add 'ALL' to the class list for filtering purposes
    const filterClassOptions = [{ name: 'ALL Classes', value: 'ALL' }, ...classList.map(cls => ({ name: `Class ${cls}`, value: cls }))];

    // Determine available sections for filtering
    let filterSectionOptions = [{ name: 'ALL Sections', value: 'ALL' }];
    if (messagesFilterClass !== 'ALL' && classesData) {
      const selectedClassData = classesData.classes.find(c => c.className === messagesFilterClass);
      if (selectedClassData) {
        // FIX: Robust mapping for filter options as well
        const rawSections = selectedClassData.sections || [];
        const sections = rawSections.map((s: any) => {
          const sectionName = s.sectionName || s;
          return { name: `Section ${sectionName}`, value: sectionName };
        });
        filterSectionOptions = [...filterSectionOptions, ...sections];
      }
    }

    return (
      <div className="flex space-x-4 mb-4">
        {/* Class Filter */}
        <div className="w-1/3">
          <label htmlFor="filter-class" className="block text-xs font-medium text-gray-500 mb-1">
            Filter by Class
          </label>
          <select
            id="filter-class"
            value={messagesFilterClass}
            onChange={(e) => {
              setMessagesFilterClass(e.target.value);
              setMessagesFilterSection('ALL'); // Reset section filter when class changes
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {filterClassOptions.map((option) => (
              <option key={`filter-class-${option.value}`} value={option.value}>{option.name}</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div className="w-1/3">
          <label htmlFor="filter-section" className="block text-xs font-medium text-gray-500 mb-1">
            Filter by Section
          </label>
          <select
            id="filter-section"
            value={messagesFilterSection}
            onChange={(e) => setMessagesFilterSection(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={messagesFilterClass === 'ALL' && filterSectionOptions.length === 1}
          >
            {filterSectionOptions.map((option) => (
              <option key={`filter-section-${option.value}`} value={option.value}>{option.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }


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
            // Disabled if class/section is not selected (empty string)
            onClick={handlePreview}
            disabled={!hasClasses() || classList.length === 0 || !title || !body || !selectedClass || !selectedSection}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-5 w-5 mr-2" /> Preview
          </button>
          <button
            onClick={handleSendMessage}
            // Disabled if class/section is not selected (empty string)
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

      <hr className="my-6" />

      {/* Sent Messages List (NEW SECTION) */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Mail className="h-6 w-6 mr-2 text-blue-600" /> Sent Messages
        </h2>

        {/* Message Filtering UI */}
        {renderMessageFilter()}

        {messagesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {messagesError}</span>
            <button onClick={() => fetchMessages(currentPage, messagesFilterClass, messagesFilterSection)} className="ml-4 text-sm font-semibold underline">Retry</button>
          </div>
        )}

        {messagesLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sent messages found matching the selected filters.
          </div>
        ) : (
          <>
            {/* Messages Table */}
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Read/Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{message.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{message.body}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-semibold text-gray-700">{message.target}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <BookOpen className="h-3 w-3 mr-1" /> {message.messageType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" /> {formatDateTime(message.sentAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="font-medium text-blue-600">{message.recipientsCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {message.recipientsCount > 0 ? (
                          <div className="text-sm">
                            <span className="font-semibold text-green-600">{message.readCount}</span> / {message.recipientsCount}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${message.status === 'read' ? 'bg-green-100 text-green-800' :
                            message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {message.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page **{currentPage}** of **{totalPages}**
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;