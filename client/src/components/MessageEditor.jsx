"use client";
import { useState } from 'react';
import { apiPut } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

export default function MessageEditor({ message, onSave, onCancel }) {
  const [editedContent, setEditedContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!editedContent.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/api/messages/${message._id}/edit`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: editedContent })
        }
      );

      if (response.ok) {
        const data = await response.json();
        onSave(data.message);
      } else {
        setError('Failed to edit message');
      }
    } catch (err) {
      console.error('Edit error:', err);
      setError('Error editing message');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-2">
      <textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        rows="3"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || editedContent === message.content}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-sm"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
