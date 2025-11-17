"use client";
import { useState } from 'react';
import { apiPut, apiDelete } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

export default function ConversationSettings({ conversation, onClose, onSettingsSaved }) {
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [muteDuration, setMuteDuration] = useState('1hour');
  const [isMuted, setIsMuted] = useState(conversation.isMuted);
  const [isArchived, setIsArchived] = useState(conversation.isArchived);
  const [isPinned, setIsPinned] = useState(conversation.isPinned);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const muteOptions = [
    { value: '15min', label: '15 minutes' },
    { value: '1hour', label: '1 hour' },
    { value: '8hours', label: '8 hours' },
    { value: '24hours', label: '24 hours' },
    { value: 'until_turned_on', label: 'Until I turn it back on' }
  ];

  const handleMute = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await fetch(
        `${API_BASE}/api/messages/conversations/${conversation._id}/mute`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ duration: muteDuration })
        }
      );
      setIsMuted(true);
      setShowMuteOptions(false);
      onSettingsSaved?.();
    } catch (err) {
      setError('Failed to mute conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmute = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await fetch(
        `${API_BASE}/api/messages/conversations/${conversation._id}/unmute`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsMuted(false);
      onSettingsSaved?.();
    } catch (err) {
      setError('Failed to unmute conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await fetch(
        `${API_BASE}/api/messages/conversations/${conversation._id}/archive`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsArchived(!isArchived);
      onSettingsSaved?.();
    } catch (err) {
      setError('Failed to archive conversation');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await fetch(
        `${API_BASE}/api/messages/conversations/${conversation._id}/pin`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsPinned(!isPinned);
      onSettingsSaved?.();
    } catch (err) {
      setError('Failed to pin conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Conversation Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl">
            ×
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          {/* Notifications */}
          {!isMuted ? (
            <button
              onClick={() => setShowMuteOptions(!showMuteOptions)}
              disabled={loading}
              className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg dark:text-white disabled:opacity-50"
            >
              🔕 Mute Notifications
            </button>
          ) : (
            <button
              onClick={handleUnmute}
              disabled={loading}
              className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg dark:text-white disabled:opacity-50"
            >
              🔔 Unmute Notifications
            </button>
          )}

          {showMuteOptions && !isMuted && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
              {muteOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setMuteDuration(option.value)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    muteDuration === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={handleMute}
                disabled={loading}
                className="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg"
              >
                Apply Mute
              </button>
            </div>
          )}

          {/* Archive */}
          <button
            onClick={handleArchive}
            disabled={loading}
            className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg dark:text-white disabled:opacity-50"
          >
            📦 {isArchived ? 'Unarchive' : 'Archive'} Conversation
          </button>

          {/* Pin */}
          <button
            onClick={handlePin}
            disabled={loading}
            className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg dark:text-white disabled:opacity-50"
          >
            📌 {isPinned ? 'Unpin' : 'Pin'} Conversation
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg font-semibold mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
