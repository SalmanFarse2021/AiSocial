# 🎥 WebRTC Setup & Installation Guide

## ✅ What You Need

### System Requirements
- Node.js 14+ installed
- npm or yarn package manager
- Modern browser (Chrome, Firefox, Safari, Edge)
- Camera & microphone (for testing calls)
- Internet connection

### Already Installed
✅ Socket.io - Already in project
✅ Express.js - Already in project
✅ Next.js - Already in project
✅ WebRTC API - Built into browser (no install needed!)

---

## 📦 Installation Steps

### Step 1: Verify Backend Is Running
```bash
cd server
npm run dev
```

Expected output:
```
API listening on http://localhost:5050
Socket.io server ready
```

### Step 2: Verify Frontend Is Running
```bash
cd client
npm run dev
```

Expected output:
```
Ready in X.XXs
Local: http://localhost:3000
```

### Step 3: Check Socket.io Connection
1. Open browser console: F12 or Cmd+Option+I
2. Go to Network tab
3. Look for WebSocket connection to `/socket.io`
4. Should show "Connected" status

---

## 🧪 Testing the Feature

### Test Scenario 1: Local Testing (Same Computer)

**Step 1: Open Two Browser Tabs**
- Tab 1: http://localhost:3000 → Login as User A
- Tab 2: http://localhost:3000 → Login as User B

**Step 2: Create Conversation**
- User A searches for User B
- Opens conversation

**Step 3: Initiate Call**
- User A clicks [📞] button
- Click "📞 Start Call"

**Step 4: Accept Call**
- User B sees incoming call notification
- Click "✓ Accept"

**Step 5: Verify Call**
- Both users see each other's video
- Audio and video working
- Try mute/camera buttons

**Step 6: End Call**
- Click "☎️ End Call"
- Verify UI closes properly

---

### Test Scenario 2: Local Network Testing

**Step 1: Get Your IP Address**
```bash
# macOS/Linux
ifconfig | grep "inet " 

# Windows
ipconfig
```

Example output: `192.168.1.100`

**Step 2: Update Backend URL**
- On second device: http://192.168.1.100:5050
- On second device frontend: Update `.env.local`

**Step 3: Test Connection**
- Device 1 and Device 2 on same WiFi
- Follow Test Scenario 1 steps

---

## 🔍 Verifying Installation

### Check Socket.io Events

Open browser console (F12) and look for messages like:
```
Socket connected: abc123xyz...
```

### Check WebRTC Connection

In browser console, run:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('✅ Media access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Media error:', err));
```

Expected output:
```
✅ Media access granted
```

### Check STUN Server Connectivity

The application automatically uses Google's STUN servers. No action needed.

---

## 🐛 Troubleshooting Installation

### Issue: "Cannot find module webrtc"
**Solution:** WebRTC is built-in, no module needed. Remove any import errors.

### Issue: "Socket not connected"
**Check:**
1. Backend running? (`npm run dev` in server folder)
2. Frontend can reach backend? Check Network tab
3. Firewall blocking WebSocket? Allow port 5050

### Issue: "Camera/microphone denied"
**Solution:**
1. Check browser permissions (top-right corner)
2. Click "Allow" or "Manage" → Allow camera/mic
3. Restart browser and try again

### Issue: "getUserMedia not available"
**Check:**
1. Browser supports WebRTC? Use Chrome, Firefox, Safari, or Edge
2. Using HTTPS in production? (required for media access)
3. Running on localhost? OK for development

---

## 📋 Pre-Flight Checklist

Before using video calls:

- [ ] Backend running (`node src/index.js` or `npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Both users logged in
- [ ] Conversation created between users
- [ ] Camera & microphone connected
- [ ] Browser permissions granted (check first time)
- [ ] Internet connection stable
- [ ] Port 5050 accessible (check firewall)

---

## 🚀 Quick Start Commands

### Terminal 1: Start Backend
```bash
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/server
npm run dev
```

### Terminal 2: Start Frontend
```bash
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/client
npm run dev
```

### Terminal 3: Open Browser
```bash
open http://localhost:3000
```

---

## 🔧 Configuration

### Environment Variables

**Backend (`server/.env`)**
```env
PORT=5050
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
```

**Frontend (`client/.env.local`)**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```

### Optional: Add TURN Server (Production)

In `client/src/lib/webrtc.js`, update ICE_SERVERS:

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN server for production
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ],
};
```

---

## 📱 Mobile Testing

### iOS (Safari)
- Minimum iOS 11.0
- Grant camera & microphone permissions
- Works with iPhoneX and newer

### Android (Chrome)
- Chrome 71+
- Grant permissions in settings
- Works with most Android devices

### Testing Steps
1. Get backend URL: `http://YOUR_IP:5050`
2. Open http://YOUR_IP:3000 on mobile
3. Login and start call

---

## 🔐 Security Checklist

For production deployment:

- [ ] Use HTTPS (not HTTP)
- [ ] Use WSS (not WS) for WebSockets
- [ ] Verify JWT tokens on backend
- [ ] Validate socket.io user connections
- [ ] Add CORS restrictions
- [ ] Enable rate limiting
- [ ] Monitor socket connections
- [ ] Log all call attempts
- [ ] Backup MongoDB data

---

## 📊 Performance Tips

### For Better Call Quality

1. **Network**
   - Use wired Ethernet if possible
   - Minimum 2.5 Mbps for HD video
   - WiFi: 5GHz preferred over 2.4GHz

2. **Device**
   - Close other browser tabs
   - Close bandwidth-heavy apps
   - Use modern browser (Chrome/Firefox latest)

3. **Environment**
   - Good lighting for video quality
   - Quiet room for audio quality
   - Stable room temperature

---

## 🆘 Getting Help

### Check Logs

**Browser Console (F12)**
```
Look for WebRTC or Socket.io errors
```

**Backend Console**
```
Look for socket connection/disconnection messages
```

### Debugging Commands

```javascript
// Check Socket.io connection
console.log(window.io);

// Check WebRTC support
console.log(RTCPeerConnection ? '✅' : '❌');

// Check media device access
navigator.mediaDevices.enumerateDevices()
  .then(devices => console.log(devices));
```

---

## ✨ Next Steps

After installation:

1. **Test locally** - Follow Test Scenario 1
2. **Test on network** - Follow Test Scenario 2
3. **Read documentation** - Check WEBRTC_IMPLEMENTATION.md
4. **Deploy** - Push to production
5. **Monitor** - Watch for errors in console/logs

---

## 📞 Support Resources

- 📖 Full docs: `WEBRTC_IMPLEMENTATION.md`
- 📋 Quick ref: `WEBRTC_QUICK_REFERENCE.md`
- 📝 Summary: `PHASE_5_COMPLETE.md`
- 🐛 Issues: Check browser console F12

---

## ✅ Verification Checklist

Run through this after setup:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login to application
- [ ] Can create message conversation
- [ ] Call button [📞] appears in header
- [ ] Can start a call
- [ ] Can accept incoming call
- [ ] Video displays on both sides
- [ ] Audio working (test with unmute)
- [ ] Can toggle mute button
- [ ] Can toggle camera button
- [ ] Can end call successfully
- [ ] No console errors

---

## 🎉 You're Ready!

Everything is set up and ready to use!

- Start backend: `npm run dev` (in server folder)
- Start frontend: `npm run dev` (in client folder)
- Open http://localhost:3000
- Make a test call!

**Enjoy video calling! 📞🎥**
