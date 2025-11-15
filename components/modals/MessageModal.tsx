import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuth, useMessage, useTheme } from '@/contexts';

export const MessageModal: React.FC = () => {
  // Consume contexts directly
  const { user } = useAuth();
  const { messages, setMessages, setShowMessageModal } = useMessage();
  const { darkMode } = useTheme();
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch('/api/users/admins');
        const data = await response.json();
        if (data.success) {
          setRecipients(data.data);
          if (data.data.length > 0) {
            setSelectedRecipient(data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admins:', err);
      }
    };

    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/users/customers');
        const data = await response.json();
        if (data.success) {
          setRecipients(data.data);
          if (data.data.length > 0) {
            setSelectedRecipient(data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    if (user?.role === 'CUSTOMER') {
      fetchAdmins();
    } else if (user?.role === 'ADMIN') {
      fetchCustomers();
    }
    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!selectedRecipient) {
      alert('Please select a recipient to message');
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedRecipient,
          subject: messageSubject || null,
          message: messageText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Message sent successfully!');
        setMessageSubject('');
        setMessageText('');
        // Refetch messages
        const msgResponse = await fetch('/api/messages');
        const msgData = await msgResponse.json();
        if (msgData.success) {
          setMessages(msgData.data);
        }
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      alert('Network error. Failed to send message.');
      console.error('Send message error:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6 z-10`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h3>
            <button
              onClick={() => setShowMessageModal(false)}
              className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Send Message Form */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 mb-6`}>
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Send Message</h4>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  {user?.role === 'CUSTOMER' ? 'Send to Admin' : 'Send to Customer'}
                </label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                >
                  {recipients.map((recipient: any) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name || recipient.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Message *
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Type your message..."
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sendingMessage}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {sendingMessage ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>

          {/* Messages List */}
          <div>
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Conversation History</h4>
            {messages.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageSquare className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-2`} />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg: any) => {
                  const isSent = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isSent ? `To: ${msg.receiver.name || msg.receiver.email}` : `From: ${msg.sender.name || msg.sender.email}`}
                          </p>
                          {msg.subject && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subject: {msg.subject}</p>
                          )}
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
