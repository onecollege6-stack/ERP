import React, { useState } from 'react';
import { Send, Search, Users, User, Plus, MessageCircle, Clock } from 'lucide-react';
import { mockStudents } from '../../utils/mockData';
import { Message } from '../../types';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'sarah.johnson@school.edu',
      recipient: ['parent.johnson@email.com'],
      subject: 'Student Performance Update',
      content: 'Alex has shown excellent improvement in Mathematics this month. His test scores have consistently been above 85%. Keep encouraging him at home!',
      timestamp: '2025-01-15T10:30:00Z',
      isRead: true,
      type: 'individual'
    },
    {
      id: '2',
      sender: 'sarah.johnson@school.edu',
      recipient: ['parent.smith@email.com', 'parent.brown@email.com'],
      subject: 'Physics Lab Assignment',
      content: 'Tomorrow we have a physics lab session on electromagnetic induction. Please ensure your child brings their lab notebook and safety goggles.',
      timestamp: '2025-01-14T14:20:00Z',
      isRead: true,
      type: 'group'
    }
  ]);

  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipients: [] as string[],
    subject: '',
    content: '',
    type: 'individual' as 'individual' | 'group'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendMessage = () => {
    if (newMessage.recipients.length > 0 && newMessage.subject && newMessage.content) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'sarah.johnson@school.edu',
        recipient: newMessage.recipients,
        subject: newMessage.subject,
        content: newMessage.content,
        timestamp: new Date().toISOString(),
        isRead: true,
        type: newMessage.type
      };

      setMessages([message, ...messages]);
      setNewMessage({
        recipients: [],
        subject: '',
        content: '',
        type: 'individual'
      });
      setShowCompose(false);
    }
  };

  const handleRecipientChange = (email: string, checked: boolean) => {
    if (checked) {
      setNewMessage(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
    } else {
      setNewMessage(prev => ({
        ...prev,
        recipients: prev.recipients.filter(r => r !== email)
      }));
    }
  };

  const getRecipientContacts = () => {
    const contacts: { name: string; email: string; type: string }[] = [];
    
    mockStudents.forEach(student => {
      if (student.email) {
        contacts.push({
          name: student.name,
          email: student.email,
          type: 'Student'
        });
      }
      if (student.parentEmail) {
        contacts.push({
          name: `${student.name}'s Parent`,
          email: student.parentEmail,
          type: 'Parent'
        });
      }
    });
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with students and parents</p>
        </div>
        
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Compose Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Message Panel */}
        {showCompose && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Compose Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="individual"
                      checked={newMessage.type === 'individual'}
                      onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as 'individual' })}
                      className="mr-2"
                    />
                    <User className="h-4 w-4 mr-1" />
                    Individual
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="group"
                      checked={newMessage.type === 'group'}
                      onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as 'group' })}
                      className="mr-2"
                    />
                    <Users className="h-4 w-4 mr-1" />
                    Group
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {getRecipientContacts().map((contact, index) => (
                      <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMessage.recipients.includes(contact.email)}
                          onChange={(e) => handleRecipientChange(contact.email, e.target.checked)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-xs text-gray-500">{contact.email} • {contact.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {newMessage.recipients.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {newMessage.recipients.length} recipient(s) selected
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Message subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message List */}
        <div className={showCompose ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            </div>

            {messages.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          message.type === 'group' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {message.type === 'group' ? (
                            <Users className={`h-4 w-4 text-purple-600`} />
                          ) : (
                            <User className={`h-4 w-4 text-blue-600`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{message.subject}</h3>
                          <p className="text-sm text-gray-600">
                            To: {message.recipient.length > 1 ? 
                              `${message.recipient.length} recipients` : 
                              message.recipient[0].split('@')[0]
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {message.content}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          message.type === 'group' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {message.type === 'group' ? 'Group Message' : 'Individual'}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Sent
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">Start communicating with students and parents</p>
                <button
                  onClick={() => setShowCompose(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;