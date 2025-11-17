# 🎯 Feature Integration Examples

## Quick Start Guide for New Instagram Messenger Features

---

## 1️⃣ INTEGRATING GROUP CHAT

### Step 1: Import Component
```jsx
import GroupChatManager from '@/components/GroupChatManager';
import { useState } from 'react';

export default function Messenger() {
  const [showGroupManager, setShowGroupManager] = useState(false);

  const handleGroupCreated = (newGroup) => {
    console.log('Group created:', newGroup);
    setSelectedConversation(newGroup._id);
    // Refresh conversations list
    fetchConversations();
  };

  return (
    <>
      {/* Add button in toolbar */}
      <button
        onClick={() => setShowGroupManager(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        ➕ Create Group
      </button>

      {/* Render manager modal */}
      {showGroupManager && (
        <GroupChatManager
          onGroupCreated={handleGroupCreated}
          onClose={() => setShowGroupManager(false)}
        />
      )}
    </>
  );
}
```

---

## 2️⃣ ADDING RICH TEXT EDITOR

### Step 1: Replace Message Input
```jsx
import RichTextEditor from '@/components/RichTextEditor';
import { useState } from 'react';

export default function Messenger() {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Parse markdown formatting
    const formattedMessage = parseMarkdown(newMessage);

    // Send message
    await sendMessage(formattedMessage);
    setNewMessage('');
  };

  return (
    <div className="p-4 border-t">
      <RichTextEditor
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={handleSendMessage}
      />

      <button
        onClick={handleSendMessage}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Send
      </button>
    </div>
  );
}
```

### Step 2: Parse Markdown on Backend
```javascript
// Backend - messageController.js
function parseMarkdown(content) {
  // Bold: **text** -> <strong>text</strong>
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* -> <em>text</em>
  content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code: `text` -> <code>text</code>
  content = content.replace(/`(.+?)`/g, '<code>$1</code>');

  // Strikethrough: ~~text~~ -> <s>text</s>
  content = content.replace(/~~(.+?)~~/g, '<s>$1</s>');

  return content;
}
```

---

## 3️⃣ IMPLEMENTING MESSAGE SEARCH

### Step 1: Add Search UI
```jsx
import MessageSearch from '@/components/MessageSearch';
import { useState } from 'react';

export default function ConversationHeader() {
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchResult = (message) => {
    // Jump to message in conversation
    scrollToMessage(message._id);
    highlightMessage(message._id);
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <button
        onClick={() => setShowSearch(true)}
        className="p-2 hover:bg-gray-100 rounded"
      >
        🔍 Search
      </button>

      {showSearch && (
        <MessageSearch
          conversationId={conversationId}
          onResultSelect={handleSearchResult}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
```

### Step 2: Backend Search Endpoint
```javascript
// Backend - messageController.js
exports.searchMessages = async (req, res) => {
  try {
    const { conversationId, q } = req.query;
    const userId = req.user._id;

    // Create search regex (case-insensitive)
    const searchRegex = new RegExp(q, 'i');

    const messages = await Message.find({
      conversationId,
      $or: [
        { content: searchRegex },
        { sender: userId }
      ]
    })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
};

// routes/message.routes.js
router.get('/search', messageController.searchMessages);
```

---

## 4️⃣ USING MESSAGE CONTEXT MENU

### Step 1: Wrap Message Component
```jsx
import MessageContextMenu from '@/components/MessageContextMenu';
import MessageEditor from '@/components/MessageEditor';
import { useState } from 'react';

export default function Message({ message, currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwarding, setForwarding] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm('Delete this message?');
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/messages/${message._id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Emit Socket.io event
    socket.emit('message-deleted', { messageId: message._id, conversationId });
  };

  if (isEditing) {
    return (
      <MessageEditor
        message={message}
        onSave={(updated) => {
          // Update message
          updateMessage(updated);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="message-bubble">
      <div className="flex justify-between">
        <p>{message.content}</p>
        <MessageContextMenu
          message={message}
          currentUserId={currentUser._id}
          onEdit={() => setIsEditing(true)}
          onReply={() => setReplyTo(message)}
          onForward={() => setForwarding(true)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
```

---

## 5️⃣ IMPLEMENTING MESSAGE REPLIES

### Step 1: Track Reply State
```jsx
import MessageReply from '@/components/MessageReply';

export default function MessageInput() {
  const [replyTo, setReplyTo] = useState(null);

  const handleSendMessage = async () => {
    const messageData = {
      content: newMessage,
      conversationId: selectedConversation,
      replyTo: replyTo?._id // Include reply reference
    };

    await sendMessage(messageData);
    setNewMessage('');
    setReplyTo(null); // Clear reply
  };

  return (
    <div>
      {replyTo && (
        <MessageReply
          message={replyTo}
          sender={replyTo.sender}
          onClose={() => setReplyTo(null)}
        />
      )}

      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

### Step 2: Store Reply in Database
```javascript
// Backend - Message model
const messageSchema = new Schema({
  content: String,
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  replyTo: {
    messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    senderName: String,
    content: String // Quote
  },
  createdAt: { type: Date, default: Date.now }
});

// Backend - messageController.js
exports.sendMessage = async (req, res) => {
  try {
    const { content, conversationId, replyTo } = req.body;

    const message = new Message({
      content,
      conversationId,
      sender: req.user._id,
      replyTo: replyTo ? {
        messageId: replyTo._id,
        senderName: replyTo.sender.fullName,
        content: replyTo.content.substring(0, 100) // Quote first 100 chars
      } : null
    });

    await message.save();
    await message.populate('sender', 'fullName avatar');

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};
```

---

## 6️⃣ ADDING CONVERSATION SETTINGS

### Step 1: Add Settings Button
```jsx
import ConversationSettings from '@/components/ConversationSettings';
import { useState } from 'react';

export default function ConversationHeader() {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsSaved = () => {
    // Refresh conversation data
    fetchConversation();
  };

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h2>Conversation</h2>

      <button
        onClick={() => setShowSettings(true)}
        className="p-2 text-lg"
      >
        ⚙️
      </button>

      {showSettings && (
        <ConversationSettings
          conversation={conversation}
          onClose={() => setShowSettings(false)}
          onSettingsSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}
```

### Step 2: Backend Settings Endpoints
```javascript
// Backend - conversationController.js
exports.muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { duration } = req.body;

    const conversation = await Conversation.findById(conversationId);
    
    const durationMs = {
      '15min': 15 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '8hours': 8 * 60 * 60 * 1000,
      '24hours': 24 * 60 * 60 * 1000,
      'until_turned_on': 999999999999 // Very large number
    }[duration];

    conversation.isMuted = true;
    conversation.mutedUntil = new Date(Date.now() + durationMs);

    await conversation.save();
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mute' });
  }
};

exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { isArchived: !conversation.isArchived },
      { new: true }
    );

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive' });
  }
};

exports.pinConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { isPinned: !conversation.isPinned },
      { new: true }
    );

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin' });
  }
};
```

---

## 7️⃣ SOCKET.IO EVENT HANDLERS

### Step 1: Client Socket Events
```javascript
// client/lib/socket.js
export function emitMessageEdit(messageId, newContent) {
  socket.emit('message-edit', {
    messageId,
    content: newContent
  });
}

export function emitMessagePin(messageId, conversationId) {
  socket.emit('message-pin', {
    messageId,
    conversationId
  });
}

export function onMessageEdited(callback) {
  socket.on('message-edited', callback);
}

export function onMessagePinned(callback) {
  socket.on('message-pinned', callback);
}

export function onConversationMuted(callback) {
  socket.on('conversation-muted', callback);
}

export function onConversationArchived(callback) {
  socket.on('conversation-archived', callback);
}
```

### Step 2: Server Socket Events
```javascript
// server/modules/socket.js
io.on('connection', (socket) => {
  socket.on('message-edit', async (data) => {
    const { messageId, content } = data;

    // Update message
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        content,
        editedAt: new Date(),
        $push: { editHistory: { content, editedAt: new Date() } }
      },
      { new: true }
    ).populate('sender', 'fullName avatar');

    // Broadcast to room
    socket.to(data.conversationId).emit('message-edited', message);
  });

  socket.on('message-pin', async (data) => {
    const { messageId, conversationId } = data;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isPinned: true },
      { new: true }
    );

    socket.to(conversationId).emit('message-pinned', message);
  });
});
```

---

## 🎯 COMPLETE MESSENGER INTEGRATION

### All Together Example:
```jsx
"use client";
import { useState, useEffect } from 'react';
import GroupChatManager from '@/components/GroupChatManager';
import RichTextEditor from '@/components/RichTextEditor';
import MessageSearch from '@/components/MessageSearch';
import MessageContextMenu from '@/components/MessageContextMenu';
import MessageReply from '@/components/MessageReply';
import ConversationSettings from '@/components/ConversationSettings';

export default function Messenger() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
      conversationId: selectedConversation,
      replyTo: replyTo?._id
    };

    await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(messageData)
    });

    setNewMessage('');
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2>Messenger</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(true)}>🔍</button>
          <button onClick={() => setShowGroupManager(true)}>➕</button>
          <button onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => (
          <div key={msg._id} className="flex justify-between">
            <p>{msg.content}</p>
            <MessageContextMenu
              message={msg}
              currentUserId={currentUser._id}
              onEdit={() => setEditingMessage(msg)}
              onReply={() => setReplyTo(msg)}
              onDelete={() => deleteMessage(msg._id)}
            />
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {replyTo && (
          <MessageReply
            message={replyTo}
            sender={replyTo.sender}
            onClose={() => setReplyTo(null)}
          />
        )}

        <RichTextEditor
          value={newMessage}
          onChange={setNewMessage}
          onSubmit={handleSendMessage}
        />
      </div>

      {/* Modals */}
      {showGroupManager && (
        <GroupChatManager
          onGroupCreated={handleGroupCreated}
          onClose={() => setShowGroupManager(false)}
        />
      )}

      {showSearch && (
        <MessageSearch
          conversationId={selectedConversation}
          onResultSelect={jumpToMessage}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showSettings && (
        <ConversationSettings
          conversation={conversation}
          onClose={() => setShowSettings(false)}
          onSettingsSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Import all 7 components
- [ ] Add group chat button + manager
- [ ] Replace input with RichTextEditor
- [ ] Add search functionality
- [ ] Add context menu to messages
- [ ] Implement message replies
- [ ] Add conversation settings
- [ ] Create backend API endpoints
- [ ] Add Socket.io event handlers
- [ ] Test all features
- [ ] Deploy to production

---

*All components ready for integration!*
