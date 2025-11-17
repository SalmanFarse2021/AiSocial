# 🧪 Audio/Video Call Testing Guide

## Prerequisites

✅ Backend running on port 5050  
✅ Frontend running on port 3000  
✅ Two user accounts (or two browsers/devices)  
✅ Microphone and camera permissions allowed

---

## Quick Test Steps

### 1. **Open Test Page**
Navigate to: `http://localhost:3000/call-test`

### 2. **Login Two Users**
- **Browser 1**: Login as User A
- **Browser 2**: Login as User B (incognito/different browser)

### 3. **Get User IDs**
On the test page, you'll see your current user info including the User ID.

**Important**: Copy User B's ID from Browser 2.

### 4. **Update Test User ID**
In Browser 1:
- Open `/client/src/app/call-test/page.js`
- Find line 92 and 108: `const testUserId = '673f84f6ddfd3ceafe91e39a';`
- Replace with User B's actual ID
- Save the file (hot reload will update)

### 5. **Run Permission Tests**
Click these buttons in order:
1. ✅ **Test Microphone** - Should show "Microphone access granted"
2. ✅ **Test Camera** - Should show "Camera access granted"
3. ✅ **Test Socket** - Should show socket is connected

### 6. **Initiate Audio Call**
In Browser 1:
- Click **"Test Audio Call"**
- Watch the status log for:
  - `📞 Initiating test audio call...`
  - `✅ Audio call initiated`
  
In Browser 2:
- You should see **IncomingCall popup** appear
- Ringtone should play
- Shows caller's name

### 7. **Answer the Call**
In Browser 2:
- Click **"Answer"** button on the incoming call popup
- Call window should open
- Both users should see call timer starting

### 8. **Test Audio**
- Speak in Browser 1 → Should hear in Browser 2
- Speak in Browser 2 → Should hear in Browser 1

### 9. **Test Controls**
During the call, test:
- 🔇 **Mute/Unmute** - Should silence your mic
- 📹 **Video On** - Should start video (if audio call)
- ⏸️ **Minimize** - Should minimize call window
- 📴 **End Call** - Should close the call

---

## Troubleshooting

### Socket Not Connecting

**Check Browser Console:**
```
✅ Socket connected: [socket-id]
```

**If you see:**
```
❌ Socket is null
❌ Socket not connected
```

**Solutions:**
1. Refresh both browsers
2. Check backend is running: `lsof -ti:5050`
3. Check socket initialization in `/client/src/lib/socket.js`

---

### Call Not Ringing

**Check Browser 2 Console for:**
```
📞 Incoming call from: [username]
```

**If missing:**
1. Verify socket connection on both sides
2. Check backend logs: User IDs must match
3. Ensure CallContext listeners are setup

**Check Backend Terminal:**
```
📞 Call from [userId1] to [userId2]
```

---

### No Audio/Video

**Check Browser Console:**
```
🎤 Local stream obtained
📹 Remote stream received
```

**If missing:**
1. Check browser permissions (camera/mic icon in address bar)
2. Try: `navigator.mediaDevices.getUserMedia({ audio: true, video: true })`
3. Look for ICE candidate exchange logs: `🧊 Received ICE candidate`

---

### ICE Connection Failed

**Check Console:**
```
❄️ ICE connection state: checking → connected
```

**If stuck on "checking":**
1. Check STUN servers are accessible
2. Verify both browsers are on same network (for testing)
3. Check firewall settings
4. Add TURN server if behind strict NAT

---

## Console Log Checklist

### Browser 1 (Caller) Should Show:
```
✅ Logged in as: [username]
✅ Socket connected: [socket-id]
🎬 Initiating audio call to: [userId]
🎙️ Creating peer connection for: [userId]
❄️ ICE connection state: checking
🧊 Generated ICE candidate
❄️ ICE connection state: connected
✅ Audio call initiated
```

### Browser 2 (Receiver) Should Show:
```
✅ Logged in as: [username]
✅ Socket connected: [socket-id]
📞 Incoming call from: [username]
🔔 Playing incoming call ringtone
📞 Answering call
🎙️ Creating peer connection for: [userId]
❄️ ICE connection state: checking
🧊 Generated ICE candidate
📹 Remote stream received
❄️ ICE connection state: connected
```

---

## Advanced Testing

### Test Video Call
1. Click **"Test Video Call"** instead
2. Answer in Browser 2
3. Both should see video feeds
4. Test camera flip, video toggle

### Test Call Switching
During an audio call:
1. Click **"Switch to Video"**
2. Both users should see video start
3. Click **"Switch to Audio"**
4. Video should stop, audio continues

### Test Call Rejection
1. Initiate call from Browser 1
2. Click **"Reject"** in Browser 2
3. Browser 1 should show "Call was declined"
4. Both should cleanup properly

---

## Common Issues & Fixes

### Issue: "Socket not connected"
**Fix:** Wait 2-3 seconds after login, then try again

### Issue: "Microphone/Camera error"
**Fix:** 
1. Check browser address bar for blocked permissions
2. Allow camera/mic access
3. Refresh page

### Issue: "No incoming call popup"
**Fix:**
1. Verify both users are logged in
2. Check User ID is correct
3. Refresh both browsers
4. Check backend logs for call event

### Issue: "Can't hear audio"
**Fix:**
1. Check both users unmuted
2. Check system volume
3. Try different browser
4. Check audio output device

### Issue: "Video black screen"
**Fix:**
1. Check camera not used by another app
2. Try toggling video off/on
3. Check camera permissions
4. Switch camera if available

---

## Testing on Different Devices

### Same WiFi Network:
1. Find local IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. Access from phone: `http://[IP]:3000`
3. Both devices should be able to call each other

### Different Networks:
- Requires TURN server for NAT traversal
- Update TURN servers in `/client/src/contexts/CallContext.jsx` lines 39-48

---

## Success Criteria

✅ Socket connects on both sides  
✅ Call initiation triggers incoming call  
✅ Ringtone plays  
✅ Answer button works  
✅ Audio/video streams connect  
✅ Can hear/see each other  
✅ Mute/unmute works  
✅ Video toggle works  
✅ Call timer shows  
✅ End call cleans up properly  

---

## Next Steps After Basic Calling Works

1. **Integrate Voice Messages**
   - Add VoiceRecorder to Messenger
   - Add VoiceMessage player to chat

2. **Integrate Reactions**
   - Add MessageReactions to message bubbles
   - Connect to backend API

3. **Production Setup**
   - Add TURN servers for production
   - Set up call notifications
   - Add busy/unavailable states
   - Network quality indicator

---

## Need Help?

Check these files:
- `/client/src/contexts/CallContext.jsx` - Main call logic
- `/client/src/components/CallWindow.jsx` - Call UI
- `/client/src/components/IncomingCall.jsx` - Incoming call UI
- `/server/src/index.js` - Socket events (lines 95-165)

**Important Logs:**
- Browser Console: WebRTC connection state
- Backend Terminal: Socket event forwarding
- Network Tab: Socket.io connection
