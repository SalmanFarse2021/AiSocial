# Quick Debugging Commands for Message Loading

Copy and paste these into your browser console (F12 → Console tab) to debug message loading:

## 1. Check Authentication
```javascript
// Check if you're logged in
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
if (!token) console.error('❌ NOT LOGGED IN - Token is missing!');
else console.log('✅ Token found:', token.substring(0, 20) + '...');
```

## 2. Check Current User
```javascript
// Fetch current user info
const token = localStorage.getItem('token');
fetch('http://localhost:5050/api/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Current User:', d.user?.username || d.username);
  console.log('User ID:', d.user?._id || d._id);
});
```

## 3. Check Available Conversations
```javascript
// Get all conversations for this user
const token = localStorage.getItem('token');
fetch('http://localhost:5050/api/messages/conversations?limit=50', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Conversations found:', d.conversations?.length ?? 0);
  d.conversations?.forEach((c, i) => {
    console.log(`${i+1}. ${c.name || 'Direct'} - ID: ${c._id}`);
  });
});
```

## 4. Load Messages from Specific Conversation
```javascript
// Replace CONVERSATION_ID with an actual ID
const conversationId = 'CONVERSATION_ID';
const token = localStorage.getItem('token');

fetch(`http://localhost:5050/api/messages/conversations/${conversationId}/messages?limit=50&skip=0`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Response Status:', r.status);
  return r.json();
})
.then(d => {
  console.log('✅ Messages loaded:', d.messages?.length ?? 0);
  d.messages?.forEach((m, i) => {
    console.log(`${i+1}. [${m.sender?.username}] ${m.content?.substring(0, 50)}`);
  });
})
.catch(e => console.error('❌ Error:', e.message));
```

## 5. Full Status Check (All-in-One)
```javascript
// Complete diagnostic
(async () => {
  console.log('🔍 Starting message loading diagnostic...\n');
  
  // Check auth
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ NO TOKEN - Not logged in!');
    return;
  }
  console.log('✅ Token found');
  
  // Get user
  const userRes = await fetch('http://localhost:5050/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const userData = await userRes.json();
  const userId = userData.user?._id || userData._id;
  console.log('✅ User:', userData.user?.username || userData.username);
  
  // Get conversations
  const convRes = await fetch('http://localhost:5050/api/messages/conversations?limit=50', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const convData = await convRes.json();
  console.log('✅ Conversations found:', convData.conversations?.length ?? 0);
  
  if (!convData.conversations?.length) {
    console.warn('⚠️  No conversations found. Create one first!');
    return;
  }
  
  // Try to load messages from first conversation
  const firstConv = convData.conversations[0];
  console.log(`\n📤 Loading messages from: "${firstConv.name || 'Direct'}"`);
  
  const msgRes = await fetch(
    `http://localhost:5050/api/messages/conversations/${firstConv._id}/messages?limit=50&skip=0`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!msgRes.ok) {
    console.error('❌ Failed to load messages - Status:', msgRes.status);
    const error = await msgRes.json();
    console.error('Error:', error.message);
    return;
  }
  
  const msgData = await msgRes.json();
  console.log('✅ Messages loaded:', msgData.messages?.length ?? 0);
  
  if (msgData.messages?.length > 0) {
    console.log('\n📨 Sample messages:');
    msgData.messages.slice(0, 3).forEach((m, i) => {
      console.log(`${i+1}. [${m.sender?.username}] ${m.content?.substring(0, 60)}`);
    });
  }
  
  console.log('\n✅ DIAGNOSTIC COMPLETE - System is working!');
})();
```

## 6. Monitor Message Loading in Real-Time
```javascript
// Watch what happens when you select a conversation
const originalLog = console.log;
let requestCount = 0;

window.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/messages/conversations')) {
    requestCount++;
    console.log(`📤 Request #${requestCount}:`, e.request.url);
  }
});

console.log('👀 Now select a conversation in the chat app');
console.log('Watch for API requests to appear above...');
```

## 7. Check Browser Network Tab Manually
1. Open DevTools (F12)
2. Click "Network" tab
3. Select a conversation
4. Look for request like: `conversations/[ID]/messages`
5. Click it and check:
   - **Status**: Should be 200
   - **Headers**: Should have `Authorization: Bearer [token]`
   - **Response**: Should show `{ "messages": [...] }`

## 8. Check for Console Errors
```javascript
// See any errors
console.error()  // This will show all errors since page load
```

## 9. Test Timeout Issue
```javascript
// If messages take too long to load
console.time('messageLoad');

const token = localStorage.getItem('token');
const convId = '507f1f77bcf86cd799439011'; // Use real ID

fetch(`http://localhost:5050/api/messages/conversations/${convId}/messages?limit=50&skip=0`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => {
  console.timeEnd('messageLoad');
  console.log('✅ Loaded', d.messages?.length, 'messages');
})
.catch(e => {
  console.timeEnd('messageLoad');
  console.error('❌ Error:', e);
});
```

## 10. Reset and Try Again
```javascript
// Clear session cache and try again
sessionStorage.removeItem('conversations_cache');
sessionStorage.removeItem('conversations_cache_time');
console.log('✅ Cache cleared. Now refresh and try again.');
```

---

## Common Outputs and What They Mean

### ✅ Success
```
✅ Token found
✅ User: john_doe
✅ Conversations found: 5
✅ Messages loaded: 42
```

### ❌ Not Logged In
```
❌ NO TOKEN - Not logged in!
→ Solution: Log in first
```

### ❌ No Conversations
```
⚠️ No conversations found. Create one first!
→ Solution: Start a conversation with someone
```

### ❌ API Error (403)
```
❌ Failed to load messages - Status: 403
Error: Not authorized to view this conversation
→ Solution: Check if you're a participant
```

### ❌ API Error (404)
```
❌ Failed to load messages - Status: 404
Error: Conversation not found
→ Solution: Conversation was deleted
```

### ❌ API Error (500)
```
❌ Failed to load messages - Status: 500
Error: Internal server error
→ Solution: Backend crashed, restart server
```

---

## Quick Copy-Paste for Common Tasks

**Just check if everything works:**
```javascript
const t = localStorage.getItem('token');
fetch('http://localhost:5050/api/users/me', {headers:{Authorization:`Bearer ${t}`}})
.then(r=>r.json()).then(d=>console.log('User:', d.user?.username));
```

**See all conversations:**
```javascript
const t = localStorage.getItem('token');
fetch('http://localhost:5050/api/messages/conversations', {headers:{Authorization:`Bearer ${t}`}})
.then(r=>r.json()).then(d=>d.conversations.forEach(c=>console.log(c.name||'Direct')));
```

**Load messages from first conversation:**
```javascript
const t = localStorage.getItem('token');
fetch('http://localhost:5050/api/messages/conversations', {headers:{Authorization:`Bearer ${t}`}})
.then(r=>r.json()).then(d=>d.conversations[0]._id)
.then(id=>fetch(`http://localhost:5050/api/messages/conversations/${id}/messages`, {headers:{Authorization:`Bearer ${t}`}}))
.then(r=>r.json()).then(d=>console.log(d.messages.length + ' messages'));
```

---

**Pro Tip**: Save this as a bookmark with JavaScript:
1. Right-click bookmark bar
2. Add new bookmark
3. Name: "Debug Messages"
4. URL: Paste any of the commands above

**Need help?** Look at the output and check the "Common Outputs" section above!
