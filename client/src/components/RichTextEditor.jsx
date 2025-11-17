"use client";
import { useState, useRef } from 'react';

export default function RichTextEditor({ value, onChange, onSubmit }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  const emojis = ['😀', '😂', '❤️', '😍', '🔥', '👍', '😢', '😡', '🎉', '😎', '🙏', '💪', '👌', '✨', '🚀'];

  const applyFormatting = (format) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      default:
        return;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + emoji + value.substring(start);
    onChange(newValue);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex-wrap">
        <button
          type="button"
          onClick={() => applyFormatting('bold')}
          className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('italic')}
          className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('code')}
          className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-mono"
          title="Code"
        >
          {'<>'}
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('strikethrough')}
          className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm line-through"
          title="Strikethrough"
        >
          S
        </button>

        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
            title="Emoji Picker"
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-700 rounded-lg p-2 grid grid-cols-5 gap-1 z-10 shadow-lg">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Ctrl+Enter to send)"
        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-b-lg dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
      />

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        **bold** *italic* `code` ~~strikethrough~~
      </p>
    </div>
  );
}
