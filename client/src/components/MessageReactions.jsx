'use client';

import React, { useState, useEffect, useRef } from 'react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({ message, currentUserId, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const pickerRef = useRef(null);

  // Get reaction counts
  const reactionCounts = {};
  const userReaction = message.reactions?.find(r => r.userId === currentUserId);
  
  message.reactions?.forEach(reaction => {
    reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowPicker(true);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReaction = (emoji) => {
    // If user already reacted with same emoji, remove it
    if (userReaction?.emoji === emoji) {
      onReact(message._id, null);
    } else {
      onReact(message._id, emoji);
    }
    setShowPicker(false);
  };

  return (
    <div className="relative inline-block">
      {/* Message wrapper with long press */}
      <div
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        className="relative"
      >
        {/* Reaction Picker */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-full px-2 py-1.5 shadow-2xl border border-white/10 z-50 animate-fadeIn"
          >
            <div className="flex items-center gap-1">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`text-2xl p-2 rounded-full transition-all hover:scale-125 hover:bg-white/10 ${
                    userReaction?.emoji === emoji ? 'bg-white/20 scale-110' : ''
                  }`}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="absolute -bottom-2 -right-2 bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Add reaction"
        >
          <span className="text-sm">😊</span>
        </button>
      </div>

      {/* Display existing reactions */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const isUserReaction = userReaction?.emoji === emoji;
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                  isUserReaction
                    ? 'bg-blue-500/30 border border-blue-500/50'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
                title={isUserReaction ? 'Remove your reaction' : 'React with this'}
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <span className="text-white/70 font-medium">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
