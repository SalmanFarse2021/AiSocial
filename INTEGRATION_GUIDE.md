# 🚀 Quick Integration Guide - New Features

## How to Add Voice Messages & Reactions to Messenger

This guide shows exactly where to add the new components in your existing Messenger.

---

## 1. Voice Messages Integration

### Step 1: Add State & Import to Messenger.jsx

```javascript
// At the top of Messenger.jsx
import VoiceRecorder from '@/components/VoiceRecorder';
import VoiceMessage from '@/components/VoiceMessage';

// Inside Messenger component, add state:
const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
```

### Step 2: Add Microphone Button to Message Input

Find the message input section (around line 1000-1100) and add a mic button:

```javascript
{/* Voice Message Button */}
<button
  onClick={() => setShowVoiceRecorder(true)}
  className="p-2 hover:bg-white/10 rounded-full transition-all"
  title="Record voice message"
>
  <Mic className="w-5 h-5 text-white" />
</button>
```

### Step 3: Add Voice Recorder Modal

Before the closing `</div>` of the main Messenger component:

```javascript
{/* Voice Recorder Modal */}
{showVoiceRecorder && (
  <VoiceRecorder
    onSendVoice={async (audioBlob, duration) => {
      try {
        setIsSending(true);
        
        // Create form data for upload
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
        formData.append('folder', 'voice-messages');
        
        // Upload to Cloudinary
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          }
        );
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload voice message');
        }
        
        const { url } = await uploadResponse.json();
        
        // Send message with voice attachment
        const messageData = {
          type: 'voice',
          content: 'Voice message',
          attachment: {
            type: 'voice',
            url,
            duration,
          },
        };
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/${selectedConversation}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to send voice message');
        }
        
        const newMessage = await response.json();
        
        // Optimistic update
        setMessages(prev => [...prev, newMessage.message]);
        
        // Emit via socket
        emitSendMessage(selectedConversation, newMessage.message);
        
        setShowVoiceRecorder(false);
      } catch (error) {
        console.error('Error sending voice message:', error);
        alert('Failed to send voice message');
      } finally {
        setIsSending(false);
      }
    }}
    onCancel={() => setShowVoiceRecorder(false)}
  />
)}
```

### Step 4: Render Voice Messages in Chat

Find where messages are rendered (around line 900-1000) and add this condition:

```javascript
{/* Render different message types */}
{message.type === 'voice' ? (
  <VoiceMessage
    audioUrl={message.attachment.url}
    duration={message.attachment.duration}
    isPlayed={message.readBy?.some(r => r.user === currentUser?._id)}
    isSentByMe={message.sender === currentUser?._id}
    onPlay={async () => {
      // Mark as read
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/${selectedConversation}/read`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }}
  />
) : (
  <div className="message-text">
    {message.content}
  </div>
)}
```

---

## 2. Message Reactions Integration

### Step 1: Import Component

```javascript
// At top of Messenger.jsx
import MessageReactions from '@/components/MessageReactions';
```

### Step 2: Add Reaction Handler Function

Add this function inside the Messenger component:

```javascript
const handleReaction = async (messageId, emoji) => {
  try {
    const message = messages.find(m => m._id === messageId);
    if (!message) return;
    
    const conversationId = selectedConversation;
    
    if (emoji) {
      // Add reaction
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/${messageId}/reactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emoji }),
        }
      );
    } else {
      // Remove reaction (get user's current reaction first)
      const userReaction = message.reactions?.find(
        r => r.users.includes(currentUser?._id)
      );
      
      if (userReaction) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/${messageId}/reactions`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emoji: userReaction.emoji }),
          }
        );
      }
    }
    
    // Emit socket event for real-time update
    const socket = getSocket();
    socket?.emit('message-reaction', {
      conversationId,
      messageId,
      emoji,
    });
    
    // Optimistically update UI
    setMessages(prev => prev.map(m => {
      if (m._id !== messageId) return m;
      
      const reactions = [...(m.reactions || [])];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (emoji) {
        if (reactionIndex >= 0) {
          // Add user to existing reaction
          if (!reactions[reactionIndex].users.includes(currentUser?._id)) {
            reactions[reactionIndex].users.push(currentUser?._id);
          }
        } else {
          // Create new reaction
          reactions.push({ emoji, users: [currentUser?._id] });
        }
      } else {
        // Remove user from all reactions
        reactions.forEach(r => {
          r.users = r.users.filter(u => u !== currentUser?._id);
        });
        // Remove empty reactions
        const filtered = reactions.filter(r => r.users.length > 0);
        return { ...m, reactions: filtered };
      }
      
      return { ...m, reactions };
    }));
    
  } catch (error) {
    console.error('Error handling reaction:', error);
  }
};
```

### Step 3: Add Socket Listener for Reactions

In the Socket.io useEffect (around line 70-90), add:

```javascript
// Listen for reaction updates
socket.on('message-reaction-updated', (data) => {
  console.log('Reaction updated:', data);
  
  setMessages(prev => prev.map(m => {
    if (m._id !== data.messageId) return m;
    
    const reactions = [...(m.reactions || [])];
    
    if (data.action === 'add') {
      const reactionIndex = reactions.findIndex(r => r.emoji === data.emoji);
      if (reactionIndex >= 0) {
        if (!reactions[reactionIndex].users.includes(data.userId)) {
          reactions[reactionIndex].users.push(data.userId);
        }
      } else {
        reactions.push({ emoji: data.emoji, users: [data.userId] });
      }
    } else if (data.action === 'remove') {
      reactions.forEach(r => {
        r.users = r.users.filter(u => u !== data.userId);
      });
      const filtered = reactions.filter(r => r.users.length > 0);
      return { ...m, reactions: filtered };
    }
    
    return { ...m, reactions };
  }));
});

// Don't forget to cleanup
return () => {
  socket.off('message-reaction-updated');
};
```

### Step 4: Wrap Message Bubbles with Reactions

Find where individual messages are rendered and wrap them:

```javascript
<div className="group relative">
  <MessageReactions
    message={message}
    currentUserId={currentUser?._id}
    onReact={handleReaction}
  >
    {/* Your existing message bubble */}
    <div className={`message-bubble ${message.sender === currentUser?._id ? 'sent' : 'received'}`}>
      {/* Message content here */}
      {message.type === 'voice' ? (
        <VoiceMessage {...voiceProps} />
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  </MessageReactions>
</div>
```

---

## 3. Import Missing Icons

Make sure you have these imports at the top of Messenger.jsx:

```javascript
import { Mic } from 'lucide-react';
```

---

## 4. Test Everything

### Test Voice Messages:
1. ✅ Click microphone button
2. ✅ Grant microphone permission
3. ✅ Speak and see waveform animate
4. ✅ Click stop or wait for timeout
5. ✅ Preview audio
6. ✅ Click "Send"
7. ✅ See voice message in chat
8. ✅ Click play and scrub through audio

### Test Reactions:
1. ✅ Long press on any message (0.5 seconds)
2. ✅ See reaction picker appear
3. ✅ Tap an emoji
4. ✅ See reaction appear below message
5. ✅ Tap again to remove
6. ✅ Check real-time sync in another browser

### Test Call Switching:
1. ✅ Already integrated in CallWindow!
2. ✅ Start audio call
3. ✅ Click "Enable Video" button
4. ✅ Camera activates
5. ✅ Click "Audio Only"
6. ✅ Camera stops
7. ✅ Click "Flip Camera" (mobile)

---

## 5. Optional: Add Loading States

```javascript
{isSending && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="text-white mt-4">Sending voice message...</p>
    </div>
  </div>
)}
```

---

## 🎉 You're Done!

All three major features are now integrated:
- ✅ Voice Messages with waveform
- ✅ Emoji Reactions
- ✅ Advanced Call Controls

**Pro Tips:**
- Voice messages are automatically uploaded to Cloudinary
- Reactions sync in real-time across all users
- Call controls work seamlessly during active calls
- All components are mobile-optimized

**Need Help?**
- Check browser console for errors
- Verify socket connection is active
- Ensure Cloudinary is configured
- Test microphone permissions

Happy coding! 🚀
