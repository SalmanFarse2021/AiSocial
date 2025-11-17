"use client";
import { useState, useEffect } from 'react';
import { apiPost, apiGet, apiPut } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

export default function GroupChatManager({ onGroupCreated, onClose }) {
  const [step, setStep] = useState('select'); // select, details, members
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/search?q=`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length < 2) {
      setError('Select at least 2 members');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiPost(`/api/messages/conversations/group`, {
        groupName,
        groupDescription,
        memberIds: selectedUsers
      });

      if (response.success) {
        onGroupCreated(response.conversation);
        onClose();
      } else {
        setError(response.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('Group creation error:', err);
      setError('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (step === 'select') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Create Group Chat</h2>
          
          <button
            onClick={() => setStep('details')}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold mb-2"
          >
            Create New Group
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Group Details</h2>
          
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg mb-3 dark:bg-gray-800 dark:text-white"
          />

          <textarea
            placeholder="Group description (optional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg mb-4 dark:bg-gray-800 dark:text-white"
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('members')}
              disabled={!groupName.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold"
            >
              Next
            </button>
            <button
              onClick={() => setStep('select')}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-black dark:text-white rounded-lg font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Select Members</h2>
        
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg mb-3 dark:bg-gray-800 dark:text-white"
        />

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {filteredUsers.map(user => (
            <label key={user._id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user._id)}
                onChange={() => toggleUserSelection(user._id)}
                className="w-4 h-4 mr-3"
              />
              <div className="flex-1">
                <p className="font-semibold dark:text-white">{user.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
              </div>
              {selectedUsers.includes(user._id) && (
                <span className="text-blue-500">✓</span>
              )}
            </label>
          ))}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selected: {selectedUsers.length} members
        </p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleCreateGroup}
            disabled={selectedUsers.length < 2 || loading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button
            onClick={() => setStep('details')}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-black dark:text-white rounded-lg font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
