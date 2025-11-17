# 📱 Messages Integration with Navbar

## What Was Done

### 1. Added Real-Time Unread Count Updates

**Frontend Changes:**

#### `client/src/lib/socket.js`
Added new listener function:
```javascript
export const onUnreadCountUpdated = (callback) => {
  if (socket) {
    socket.off('unread-count-updated');
    socket.on('unread-count-updated', (data) => {
      console.log('📬 Unread count updated:', data);
      callback(data);
    });
  }
};
```

#### `client/src/components/Navbar.jsx`
- Imported socket listener: `onUnreadCountUpdated`
- Fetches current user info
- Initializes socket connection
- Listens for real-time unread count updates
- Falls back to polling every 5 seconds
- Shows unread badge on Messages link

**Backend Changes:**

#### `server/src/index.js`
Updated send-message handler:
```javascript
socket.on('send-message', async (data) => {
  const { conversationId, message } = data;
  io.to(`conversation:${conversationId}`).emit('message-received', message);
  
  // Emit unread count update to recipient
  if (message.senderId && message.recipientId) {
    io.to(`user:${message.recipientId}`).emit('unread-count-updated', {
      unreadCount: message.unreadCount || 1
    });
  }
});
```

### 2. How It Works

**Real-Time Flow:**

```
User A sends message
    ↓
Messenger emits 'send-message'
    ↓
Server receives event
    ↓
Server forwards message to conversation room
    ↓
Server emits 'unread-count-updated' to User B's room
    ↓
User B's Navbar socket listener receives update
    ↓
Navbar state updates: unreadCount increases
    ↓
Badge appears on Messages icon in real-time ✅
```

**Fallback (5-second polling):**
If real-time update doesn't arrive, Navbar polls API every 5 seconds as backup.

## How to Connect Messages Page with Navbar

The messages page should now automatically show unread counts in the Navbar. Here's how to verify:

### Option 1: Use Existing Navbar Component (Recommended)

Update the messages page layout to use the Navbar:

```jsx
// client/src/app/messages/page.js
"use client";
import Navbar from '@/components/Navbar';
import Messenger from '@/components/Messenger';

export default function MessagesPage() {
  return (
    <div className="flex h-screen">
      {/* Navbar */}
      <Navbar />
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <Messenger compact={false} />
      </div>
    </div>
  );
}
```

### Option 2: Create App Layout Wrapper (Best for All Pages)

Create a new file: `client/src/components/AppLayout.jsx`

```jsx
"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  
  // Show Navbar on all authenticated pages
  const showNavbar = !['/', '/login', '/signup'].includes(pathname);

  return (
    <div className={showNavbar ? "flex h-screen" : ""}>
      {showNavbar && <Navbar />}
      <div className={showNavbar ? "flex-1 overflow-auto" : ""}>
        {children}
      </div>
    </div>
  );
}
```

Then wrap all authenticated pages with this layout.

## Features Now Connected

### Navbar Shows:
- ✅ Messages link with active state
- ✅ Unread message count badge
- ✅ Real-time updates when new messages arrive
- ✅ Polls every 5 seconds as fallback

### Messenger Shows:
- ✅ All conversations
- ✅ Message history
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ Audio message recording
- ✅ Video call integration

## Integration Points

### 1. User Connection
```
Navbar:     Fetches current user → initializes socket
Messenger:  Fetches current user → initializes socket
Both use same socket connection ✅
```

### 2. Real-Time Updates
```
New message arrives
  ↓
Socket 'message-received' event
  ↓
Messenger: Updates message list
Navbar:    Updates unread count badge
```

### 3. Socket Events Flow

**Messenger sends:**
- `send-message` → Server broadcasts to conversation room
- `join-conversation` → Server adds user to room
- `leave-conversation` → Server removes user from room

**Server broadcasts back:**
- `message-received` → To entire conversation room
- `unread-count-updated` → To specific user room

**Navbar listens to:**
- `unread-count-updated` → Updates badge automatically

## Testing the Integration

### Step 1: Open Two Browsers
```
Browser 1: http://localhost:3000/messages (User A)
Browser 2: http://localhost:3000/messages (User B)
```

### Step 2: Watch Console
Open DevTools → Console

Expected messages:
```
✅ Incoming call listener registered
✅ Call answered listener registered
✅ Unread count listener registered
📬 Unread count updated: {unreadCount: 1}
```

### Step 3: Send Message from Browser 1 to Browser 2
1. Select conversation in Browser 1
2. Type message and send
3. Watch Browser 2:
   - Message appears in Messenger
   - Unread badge appears in Navbar (if not in that conversation)
   - Badge increases in real-time

### Step 4: Verify Updates
- ✅ Unread count increases immediately
- ✅ Badge color/style appropriate
- ✅ No page refresh needed
- ✅ Works across multiple browser windows

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │      Navbar      │      │    Messenger     │        │
│  ├──────────────────┤      ├──────────────────┤        │
│  │ • Shows Messages │      │ • Displays chats │        │
│  │   link           │      │ • Sends messages │        │
│  │ • Unread badge   │      │ • Receives msgs  │        │
│  │ • Real-time      │      │                  │        │
│  │   updates        │      │                  │        │
│  └──────────────────┘      └──────────────────┘        │
│        ↑                            ↑                   │
│        │                            │                  │
│        └────────┬────────────────────┘                  │
│                 │                                       │
│              Socket.io Client                          │
│                 │                                       │
│        ┌────────┴──────────┐                           │
│        │                   │                            │
│     Listen for:         Listen for:                     │
│  • unread-count-    • message-received              │
│     updated         • incoming-call                 │
│                     • call-answered                 │
│                     • ice-candidate                 │
│                     • etc.                          │
└─────────────────────────────────────────────────────────┘
                     ↕ Socket.io
┌─────────────────────────────────────────────────────────┐
│                  Node.js Server                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  socket.on('send-message') {                           │
│    // Forward to conversation room                     │
│    io.to(`conversation:${id}`).emit('message-received')│
│                                                          │
│    // Update unread count in recipient's navbar        │
│    io.to(`user:${recipientId}`).emit(                 │
│      'unread-count-updated',                          │
│      {unreadCount: newCount}                          │
│    )                                                    │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

## Key Benefits

1. **Real-Time Updates** - Unread badge updates instantly
2. **Consistent Experience** - Navbar reflects current state
3. **Fallback Support** - Polling ensures updates arrive
4. **User Awareness** - No need to refresh to see new messages
5. **Scalable Design** - Easy to add more real-time features

## Environment Variables Required

Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```

## Files Modified

| File | Changes |
|------|---------|
| client/src/lib/socket.js | Added `onUnreadCountUpdated` listener |
| client/src/components/Navbar.jsx | Added socket initialization and listener |
| server/src/index.js | Added unread count broadcast on message |

## Next Steps

1. ✅ Socket listener added to client
2. ✅ Navbar setup for real-time updates
3. ✅ Server broadcasts unread count updates
4. ⏭️ Test the integration (see Testing section above)
5. ⏭️ Optionally create AppLayout wrapper for all pages

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Badge not updating | Check DevTools Console for socket events |
| Socket not connecting | Verify server is running on port 5050 |
| Unread count wrong | Check backend API returns correct count |
| Badge not visible | Verify currentUser is loaded before socket init |

---

**Status:** ✅ Ready for testing - Navbar now shows real-time unread message count!
