# 🔧 Call System Troubleshooting - Step by Step

## What I Just Fixed:

1. ✅ Added `/api/calls` route to server
2. ✅ Fixed socket listener setup with proper cleanup
3. ✅ Improved error handling for API calls
4. ✅ Added extensive console logging for debugging
5. ✅ Fixed call button to pass full user object

## 🧪 Testing Steps (Follow Exactly):

### Step 1: Restart Everything

1. **Stop the backend server** (in terminal where `npm start` is running, press `Ctrl+C`)
2. **Restart the backend**:
   ```bash
   cd server
   npm start
   ```
3. **Wait for**: `MongoDB Connected` and `Server running on port 5050`

4. **Refresh your browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+F5)

### Step 2: Open Browser Console

1. Open Chrome DevTools: Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
2. Click the **Console** tab
3. Clear console: Click the 🚫 icon or press `Cmd+K` (Mac) / `Ctrl+L` (Windows)

### Step 3: Check Initial Setup

In the console, you should see:
```
Socket connected: [some-socket-id]
✅ Setting up call socket listeners
```

If you **DON'T** see these, the issue is socket connection. Solution:
- Make sure you're logged in
- Refresh the page
- Check if backend is running: `lsof -i :5050`

### Step 4: Navigate to Messages

1. Go to http://localhost:3000/messages
2. Select a conversation with another user
3. You should see the chat interface with Phone 📞 and Video 🎥 icons in the top-right

### Step 5: Click the Phone Icon

When you click the phone icon, watch the console. You should see:

```
📞 Audio call button clicked
   - Conversation: [conversation-id]
   - Other participant: {_id: '...', username: '...', profilePic: '...'}
   - Current user: [your-user-id]
   - Calling initiateCall with: [user-id] audio {...}
🎬 Initiating audio call to: [user-id] User: [username]
   - User object: {...}
   - Call type: audio
   - Socket exists: true
   - Socket connected: true
✅ Socket is connected, proceeding with call...
📞 Call status set to calling, remote user: [username]
🎤 Requesting user media with constraints: {...}
```

### Step 6: Grant Permissions

**Browser will ask**: "Allow localhost to use your microphone?"
- Click **"Allow"**

After allowing, you should see:
```
✅ Got local stream with 1 tracks
➕ Adding track to peer connection: audio
📝 Creating offer...
✅ Offer created and set as local description
✅ Call record created: [call-id]
📤 Sending call to user: [user-id] from: [your-username]
```

### Step 7: Check Call Interface

You should now see:
- Full-screen call interface
- "Calling [Username]..." text
- User's profile picture
- Ringtone playing
- Hang up button (red)

## ❌ Common Errors & Solutions:

### Error 1: "📞 Audio call button clicked" but nothing else
**Problem**: initiateCall function isn't being called
**Solution**: 
- Check if `useCall()` hook is working
- Verify CallProvider is wrapping the app
- Check console for React errors

### Error 2: "❌ Socket not connected"
**Problem**: Socket.io not initialized
**Solution**:
```bash
# In browser console, paste:
localStorage.getItem('user')
# Should return user object with _id

# If null, you need to log in first
```

### Error 3: "❌ No other participant found!"
**Problem**: Conversation doesn't have participants loaded
**Solution**:
- Refresh the page
- Make sure the conversation has messages
- Check if conversation is properly selected

### Error 4: Permission denied (NotAllowedError)
**Problem**: Browser blocked camera/microphone
**Solution**:
1. Click the 🔒 or 🎥 icon in address bar
2. Change Microphone to "Allow"
3. Refresh page
4. Try again

### Error 5: "Unexpected token '<', "<!DOCTYPE"... is not valid JSON"
**Problem**: API endpoint not found (this is now fixed)
**Solution**: 
- Restart backend server
- Should now work

### Error 6: Browser asks for permission every time
**Problem**: Using HTTP (not HTTPS)
**Solution**: 
- This is normal for localhost
- Production should use HTTPS

## 📊 What to Check If Still Broken:

### Check 1: Backend Running?
```bash
lsof -i :5050 | grep LISTEN
```
Should show: `node [PID] ... TCP *:mmcc (LISTEN)`

### Check 2: Frontend Running?
```bash
lsof -i :3000 | grep LISTEN
```
Should show: `node [PID] ... TCP *:hbci (LISTEN)`

### Check 3: Socket Connected?
In browser console:
```javascript
// Paste this:
const socket = require('@/lib/socket').getSocket();
console.log('Socket connected:', socket?.connected);
```

### Check 4: Call Routes Registered?
```bash
curl -H "Authorization: Bearer fake-token" http://localhost:5050/api/calls/history
```
Should return: 401 Unauthorized (means route exists but needs auth)

### Check 5: Test getUserMedia Directly
In browser console:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone works!'))
  .catch(e => console.error('❌', e.name, e.message));
```

## 🎯 Expected Complete Flow:

### Caller (User A):
1. Clicks phone icon → Console shows all logs
2. Grants microphone permission
3. Sees "Calling User B..." screen
4. Hears ringtone
5. Waits for User B to answer

### Receiver (User B - Different Browser):
1. Sees incoming call popup
2. Shows User A's name and photo
3. "Accept" and "Decline" buttons
4. Clicks "Accept"
5. Grants microphone permission
6. Call connects

### After Connection (Both):
1. Ringtone stops
2. Call timer starts: "00:01", "00:02", etc.
3. Can hear each other
4. Mute button works
5. Hang up button ends call

## 💡 Pro Tips:

1. **Keep Console Open**: All debug info is there
2. **Check Both Windows**: Open console in both browser windows
3. **Look for Red Errors**: React errors appear in red
4. **Socket Events**: Look for 📞 🎬 ✅ emojis in logs
5. **Network Tab**: Check if API calls are failing (404, 500, etc.)

## 🆘 If Nothing Works:

1. **Clear browser cache**: Settings → Privacy → Clear browsing data
2. **Try incognito mode**: Rules out extension issues
3. **Try different browser**: Firefox or Edge
4. **Check firewall**: Make sure ports 3000 and 5050 aren't blocked
5. **Restart computer**: Classic but sometimes necessary

## ✅ Success Indicators:

You'll know it's working when you see:
- ✅ Socket connected log
- ✅ Call button click logs
- ✅ "Initiating call" logs
- ✅ "Got local stream" log
- ✅ "Call record created" log
- ✅ Call interface appears
- ✅ Other user sees incoming call popup

---

**After following these steps, copy/paste the console output here if it still doesn't work!**
