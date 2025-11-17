"use client";
import { useState, useRef, useEffect } from 'react';
import { apiPost, apiDelete, apiPut } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

export default function MessageContextMenu({ message, currentUserId, onEdit, onReply, onForward, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwnMessage = message.sender._id === currentUserId;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/messages/${message._id}/pin`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ⋮
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onReply();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg dark:text-white"
          >
            ↩️ Reply
          </button>

          <button
            onClick={() => {
              onForward();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            ↪️ Forward
          </button>

          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
          >
            📋 Copy
          </button>

          {isOwnMessage && (
            <>
              <button
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              >
                ✏️ Edit
              </button>

              <button
                onClick={handlePin}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              >
                📌 Pin
              </button>
            </>
          )}

          {isOwnMessage && (
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 last:rounded-b-lg"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
