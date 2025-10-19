import React, { useState, useEffect } from 'react';
import * as messageAPI from '../../../api/message';
import { Send, Search, Filter, Users, MessageSquare, Bell, Mail, CheckCircle } from 'lucide-react';
import { useSchoolClasses } from '../../../hooks/useSchoolClasses';
import { useAuth } from '../../../auth/AuthContext';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  title: string;
  body: string;
  target: string;
  sentAt: string;
  recipientsCount: number;
  readCount: number;
  status: string;
  sender: string;
  messageType: string;
  priority: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const {
    classesData,
    loading: classesLoading,
    error: classesError,
    getClassOptions,
    getSectionsByClass,
    hasClasses
  } = useSchoolClasses();

  const [activeTab, setActiveTab] = useState('compose');
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    priority: 'normal',
    messageType: 'general',
  });
  const [recipientCount, setRecipientCount] = useState<number>(0);

  const classList = classesData?.classes?.map(c => c.className) || [];

  // Update available sections when class changes
  useEffect(() => {
    if (selectedClass && classesData) {
      const sections = getSectionsByClass(selectedClass);
      setAvailableSections(sections);
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

  // Preview recipients when class/section changes
  useEffect(() => {
    if (selectedClass && selectedSection) {
      previewRecipients();
    } else {
      setRecipientCount(0);
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchMessages();
    }
  }, [activeTab]);

  const previewRecipients = async () => {
    if (!selectedClass || !selectedSection) return;

    try {
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      const response = await fetch('/api/messages/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolId: user?.schoolId,
          class: selectedClass,
          section: selectedSection
        })
      });

      const result = await response.json();
      if (result.success) {
        setRecipientCount(result.data.estimatedRecipients);
      }
    } catch (err) {
      console.error('Error previewing recipients:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setMessages(result.data.messages || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass || !selectedSection) {
      toast.error('Please select class and section');
      return;
    }

    if (!formData.subject || !formData.content) {
      toast.error('Please fill in subject and message content');
      return;
    }

    try {
      setSending(true);
      setError('');

      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      const messageData = {
        schoolId: user?.schoolId,
        class: selectedClass,
        section: selectedSection,
        title: formData.subject,
        body: formData.content,
        priority: formData.priority,
        messageType: formData.messageType
      };

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Message sent successfully to ${result.data.sentCount} students`);
        setFormData({ subject: '', content: '', priority: 'normal', messageType: 'general' });
        setSelectedClass('');
        setSelectedSection('');
        setRecipientCount(0);
        setActiveTab('sent');
        fetchMessages();
      } else {
        toast.error(result.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-yellow-100 text-yellow-800';
      case 'read': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'normal':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.target.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const [stats, setStats] = useState({
    totalMessages: 0,
    sentToday: 0,
    totalRecipients: 0,
    readRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const authData = localStorage.getItem('erp.auth');
      const token = authData ? JSON.parse(authData).token : null;

      const response = await fetch('/api/messages/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setStats({
          totalMessages: data.totalMessages || 0,
          sentToday: 0,
          totalRecipients: data.totalRecipients || 0,
          readRate: data.avgReadRate ? Math.round(data.avgReadRate * 100) : 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecipients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-teal-500 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Read Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.readRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'compose'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Compose Message
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Sent Messages
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Message Templates
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'compose' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Compose New Message</h3>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={classesLoading || !hasClasses()}
                      required
                    >
                      <option value="">{classesLoading ? 'Loading...' : 'Select Class'}</option>
                      {classList.map(cls => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))}
                    </select>
                    {!classesLoading && !hasClasses() && (
                      <span className="text-xs text-red-500 mt-1">No classes configured</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedClass || availableSections.length === 0}
                      required
                    >
                      <option value="">{!selectedClass ? 'Select Class First' : 'Select Section'}</option>
                      {availableSections.map(section => (
                        <option key={section.value} value={section.value}>Section {section.section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {recipientCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      This message will be sent to <strong>{recipientCount}</strong> student{recipientCount !== 1 ? 's' : ''} in Class {selectedClass} - Section {selectedSection}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    value={formData.messageType}
                    onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="assignment">Assignment</option>
                    <option value="result">Result</option>
                    <option value="attendance">Attendance</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Message subject..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Type your message here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  ></textarea>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={sending || !selectedClass || !selectedSection || recipientCount === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Sent Messages</h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading messages...</span>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{message.title}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(message.sentAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{message.target}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          <span>{message.recipientsCount} recipient{message.recipientsCount !== 1 ? 's' : ''}</span>
                        </div>
                        {message.readCount > 0 && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>{message.readCount} read</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-700 mb-2">
                        {message.body.length > 150 ? `${message.body.substring(0, 150)}...` : message.body}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Type: <span className="font-medium capitalize">{message.messageType}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Sent by: <span className="font-medium">{message.sender}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Message Templates</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Create Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Absence Notification', category: 'Attendance', usage: 45 },
                  { name: 'Assignment Reminder', category: 'Academic', usage: 32 },
                  { name: 'Parent Meeting', category: 'Events', usage: 28 },
                  { name: 'Fee Payment Reminder', category: 'Administrative', usage: 19 },
                  { name: 'Holiday Announcement', category: 'General', usage: 15 },
                  { name: 'Exam Schedule', category: 'Academic', usage: 12 },
                ].map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{template.category}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Used {template.usage} times this month
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Use Template</button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;