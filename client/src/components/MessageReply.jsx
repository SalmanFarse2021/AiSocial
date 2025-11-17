"use client";

export default function MessageReply({ message, onClose, sender }) {
  if (!message) return null;

  const truncateText = (text, length = 100) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border-l-4 border-blue-500 p-3 rounded mb-3 flex justify-between items-start">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Replying to {sender?.fullName}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
          {truncateText(message.content)}
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold text-lg"
      >
        ×
      </button>
    </div>
  );
}
