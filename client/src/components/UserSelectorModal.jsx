"use client";
import { useState, useEffect } from 'react';
import { Icon } from './Navbar';
import { apiGet, apiPost } from '@/lib/api';
import Image from 'next/image';

function Avatar({ name, src }) {
  const initials = name ? name[0]?.toUpperCase() : 'U';
  const [imageError, setImageError] = useState(false);
  
  if (src && !imageError) {
    return (
      <div className="relative h-12 w-12 rounded-full ring-2 ring-gray-100 dark:ring-gray-800 overflow-hidden">
        <Image 
          src={src} 
          alt={name || 'User'} 
          fill
          className="object-cover"
          sizes="48px"
          onError={() => setImageError(true)}
          unoptimized={src?.includes('googleusercontent.com')}
        />
      </div>
    );
  }
  
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-fuchsia-500 text-white text-sm font-semibold ring-2 ring-gray-100 dark:ring-gray-800">
      {initials}
    </div>
  );
}

export default function UserSelectorModal({ isOpen, onClose, post, onSend }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  async function loadUsers() {
    setLoading(true);
    try {
      // Get current user info
      const { user } = await apiGet('/api/users/me');
      // Get user's following list
      const { users: followingList } = await apiGet(`/api/users/${user.username}/following`);
      setUsers(followingList || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(userId) {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  async function handleSend() {
    if (selectedUsers.size === 0) return;
    
    setSending(true);
    try {
      // Send to each selected user
      const promises = Array.from(selectedUsers).map(async (userId) => {
        // Get or create conversation
        const { conversation } = await apiPost('/api/messages/conversations/direct', {
          recipientId: userId
        });
        
        // Send message with shared post
        await apiPost(`/api/messages/conversations/${conversation._id}/messages`, {
          content: message.trim() || 'Check out this post!',
          sharedPost: post._id
        });
      });
      
      await Promise.all(promises);
      
      // Call success callback
      if (onSend) {
        onSend();
      }
      
      // Reset and close
      setSelectedUsers(new Set());
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send post. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-black dark:text-white">Send to</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Icon name="close" className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Icon name="search" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Selected count */}
        {selectedUsers.size > 0 && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {selectedUsers.size} {selectedUsers.size === 1 ? 'person' : 'people'} selected
            </p>
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Icon name="user" className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No users found' : 'Follow people to send them posts'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <button
                  key={user._id || user.id}
                  onClick={() => toggleUser(user._id || user.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <Avatar name={user.username} src={user.profilePic} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {user.username}
                    </div>
                    {user.fullName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.fullName}
                      </div>
                    )}
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                    selectedUsers.has(user._id || user.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedUsers.has(user._id || user.id) && (
                      <Icon name="check" className="h-4 w-4 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional message */}
        {selectedUsers.size > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <textarea
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            />
          </div>
        )}

        {/* Send button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleSend}
            disabled={selectedUsers.size === 0 || sending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : `Send to ${selectedUsers.size} ${selectedUsers.size === 1 ? 'person' : 'people'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
