# Call System Testing Guide

## Quick Start Testing

### Test Environment Setup

1. **Start Backend**
   ```zsh
   cd server
   npm install  # if needed
   npm start
   ```
   Expected: Server running on `localhost:5050`

2. **Start Frontend**
   ```zsh
   cd client
   npm install  # if needed
   npm run dev
   ```
   Expected: App running on `localhost:3000`

3. **Open Two Browser Instances**
   - Browser 1 (Caller): `http://localhost:3000`
   - Browser 2 (Recipient): `http://localhost:3000`
   - Sign in different users in each browser

---

## Test Case 1: Basic Call Flow

### Steps:
1. In Browser 1 (Caller), navigate to Messages
2. Select a conversation with Browser 2's user (Recipient)
3. Click "Start Call" button
4. **Expected**: Recipient sees incoming call notification with:
   - Caller's name
   - Caller's profile picture
   - Two buttons: "Accept" and "Reject"

5. Recipient clicks "Accept"
6. **Expected**:
   - Both sides see video streams
   - Video quality is good
   - Both have control buttons

---

## Test Case 2: Media Controls

### Once Call is Connected:

**Test Mute**
1. Click Mute button in your video
2. **Expected**: Mute button highlights/changes state
3. Speak - other user should NOT hear you
4. Click Mute again - they should hear you again

**Test Camera Toggle**
1. Click Camera Off button
2. **Expected**: Your video freezes or shows "Camera Off" state
3. Click Camera On - your video resumes

**Test End Call**
1. Click "End Call" button
2. **Expected**: Both users' videos stop
3. Both return to chat interface

---

## Test Case 3: Reject Call

### Steps:
1. In Browser 1 (Caller), click "Start Call"
2. In Browser 2 (Recipient), click "Reject"
3. **Expected**:
   - Recipient sees "Call rejected" notification
   - Caller's video disappears
   - Both return to chat

---

## Test Case 4: Sequential Calls

### After Test Case 1-3 Complete:

1. Make another call (different direction - Recipient calls Caller)
2. **Expected**: Call works normally without state issues
3. Repeat 3-4 times
4. **Expected**: No degradation, each call works identically

---

## Browser DevTools Debugging

### Console Logs to Watch For

**Successful Call Flow Should Show**:
```
🚀 Initiating call to: [recipient_id]
📝 Offer created: [offer_object]
📞 Call sent to: [recipient_id]

[On recipient side]
🔔 Incoming call received from: [caller_id]
📞 Accepting call...
✅ Answer created: [answer_object]
📤 Answer sent to: [caller_id]

[Back on caller side]
Answer received from: [recipient_id]
✅ Remote answer set successfully
🧊 ICE candidate received from: [recipient_id]
✅ ICE candidate added successfully
🎬 Remote stream received: [stream_object]
🔌 Connection state: connected
```

### Error Logs to Watch For (These Mean Issues)

❌ `Answer or peer connection missing` - Peer connection not initialized
❌ `Failed to set remote answer` - Answer handling failed
❌ `Failed to add ICE candidate` - ICE candidate handling failed
❌ `Cannot access 'endCurrentCall' before initialization` - Old error, should not see
❌ `pc is undefined` - Closure issue, should not see

---

## Network Inspector Check

### In Chrome DevTools → Network tab:

1. Make a call
2. Look for WebSocket connection to `localhost:5050`
3. Filter messages:
   - `call-user` - should see when making call
   - `answer-call` - should see when accepting call
   - `ice-candidate` - should see multiple (ICE candidates exchanged)
   - `end-call` - should see when ending

**Expected Flow**:
```
call-user (from caller to server)
  ↓
incoming-call (server to recipient)
  ↓
answer-call (from recipient to server)
  ↓
call-answered (server to caller)
  ↓
ice-candidate × N (both ways, multiple times)
```

---

## Common Issues & Solutions

### Issue: "Call not working at all"
**Check**:
1. Both users logged in? ✓
2. Browser console shows errors? → Note them
3. Backend running? `curl http://localhost:5050` should respond
4. WebSocket connected? → Check Network tab for ws:// connection

### Issue: "One-way audio/video"
**Check**:
1. Both have media permissions granted?
2. Both cameras/mics actually working?
3. Try refreshing page and calling again

### Issue: "Video stuck/no streams"
**Check**:
1. Check console for `Remote stream received` log
2. Verify ICE candidates being exchanged
3. Try different browsers (Chrome, Firefox, Safari)

### Issue: "Call disconnects randomly"
**Check**:
1. Check connection state logs
2. Verify network stability
3. Check if too many browser tabs open (resource issue)

---

## Success Criteria

✅ All tests pass when:
- [ ] Caller can initiate call
- [ ] Recipient receives notification with accept/reject
- [ ] Video appears on both sides after accept
- [ ] Audio works in both directions
- [ ] Mute toggles on and off
- [ ] Camera toggle works
- [ ] End call works for both users
- [ ] Can make multiple sequential calls
- [ ] No console errors (only info/debug logs)
- [ ] No memory leaks (DevTools → Memory)

---

## Performance Check

### Memory Usage
1. Open DevTools → Memory tab
2. Make a call, end it
3. Take heap snapshot
4. Make another call, end it
5. Take another snapshot
6. Compare: Memory should return to ~similar levels (no leak)

### CPU Usage
1. Make a call
2. Watch Activity Monitor (Mac) or Task Manager (Windows)
3. Expected: Tab uses 20-40% CPU while streaming
4. Should drop significantly when call ends

---

## Debug Commands

If issues persist, run these in browser console while testing:

```javascript
// Check if peer connection exists
console.log(window.peerConnectionRef?.current)

// Check socket connection
console.log(io().connected)

// Check current user
console.log(window.currentUser)

// Force end call (emergency)
window.endCurrentCall?.()
```

---

## Final Notes

If everything works, the critical peer connection race condition is **FIXED**! 

If issues remain, check:
1. Browser console for specific error messages
2. Network tab for Socket.io events
3. Server console for any issues
4. Device permissions for camera/microphone

Reach out with any errors or test results!
