# 🎥 WebRTC Video Call - Quick Reference

## 🚀 Quick Start

### Enable Video Calls
1. Backend running on `http://localhost:5050`
2. Frontend running on `http://localhost:3000`
3. Both users logged in and connected to Socket.io

### Making a Call
1. Open messenger conversation with someone
2. Click **📞** phone button in header
3. Click **"📞 Start Call"**
4. Wait for recipient to accept

### Receiving a Call
1. Incoming call notification appears
2. Shows caller's name and photo
3. Click **✓ Accept** or **✕ Reject**

### During Call
| Button | Action |
|--------|--------|
| 🎤 | Toggle microphone (mute/unmute) |
| 📷 | Toggle camera (on/off) |
| ☎️ | End call |

---

## 📁 Files Overview

```
client/src/
├── lib/
│   ├── socket.js ............... Socket.io client + signaling
│   └── webrtc.js ............... WebRTC utilities
├── components/
│   ├── VideoCall.jsx ........... Call UI component
│   └── Messenger.jsx ........... Integrated call button

server/src/
└── index.js .................... Socket.io signaling server
```

---

## 🔌 Socket Events

**Caller → Server → Receiver:**
- `call-user` - Initiate call with offer
- `answer-call` - Accept call with answer
- `ice-candidate` - Exchange network info
- `reject-call` - Decline call
- `end-call` - Terminate call

---

## 🌐 How WebRTC Works

1. **Signaling** (via Socket.io)
   - Exchange user IDs and SDP offers/answers
   - Exchange ICE candidates for NAT traversal

2. **Connection** (direct P2P)
   - Browser 1 connects directly to Browser 2
   - Media (audio/video) streams P2P
   - No server in the middle = low latency

3. **Encryption** (built-in)
   - DTLS protects media
   - No need for manual encryption

---

## ✨ Key Features

✅ **Low Latency** - Direct peer connections
✅ **Secure** - Encrypted end-to-end
✅ **HD Video** - Up to 1080p resolution
✅ **Mobile** - Works on iOS/Android browsers
✅ **Free** - No external paid services

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Camera permission denied" | Allow camera in browser settings |
| "No remote video" | Check internet connection |
| "No sound" | Check microphone is connected |
| "Call drops" | Check WiFi signal strength |

---

## 🎯 Architecture

```
Browser A                    Browser B
┌──────────────┐            ┌──────────────┐
│ VideoCall UI │ ◄─────────► │ VideoCall UI │
│   Component  │  Socket.io  │   Component  │
└──────────────┘            └──────────────┘
      ▲                             ▲
      │ getUserMedia()             │
      │ (Camera & Mic)             │
      ▼                             ▼
┌──────────────┐            ┌──────────────┐
│ RTCPeer      │ ◄─────────► │ RTCPeer      │
│ Connection   │    WebRTC   │ Connection   │
│ (P2P Stream) │  (Direct)   │ (P2P Stream) │
└──────────────┘            └──────────────┘
```

---

## 📊 Configuration

**STUN Servers** (in `client/src/lib/webrtc.js`):
```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // ... more STUN servers for redundancy
  ],
};
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Use HTTPS (not HTTP)
- [ ] Use secure WebSockets (wss://)
- [ ] Add TURN server for NAT scenarios (optional)
- [ ] Test on multiple browsers
- [ ] Monitor call quality metrics
- [ ] Set up error logging

### TURN Server (Optional)
If behind strict NAT/firewall, add:
```javascript
{
  urls: 'turn:your-turn-server.com:3478',
  username: 'user',
  credential: 'pass'
}
```

---

## 📝 Call Flow Diagram

```
1. User A clicks call button
        ↓
2. getUserMedia() → Camera access
        ↓
3. Create RTCPeerConnection
        ↓
4. Create Offer + Send via Socket.io
        ↓
5. User B receives incoming-call
        ↓
6. User B accepts call
        ↓
7. Get User B's media
        ↓
8. Create Answer + Send back
        ↓
9. Exchange ICE candidates
        ↓
10. Direct P2P connection established
        ↓
11. Video/Audio streams flowing
        ↓
12. User ends call → Close connection
```

---

## 💡 Pro Tips

- **Network optimization**: Close other apps using bandwidth
- **Audio quality**: Use headphones with mic for better quality
- **Lighting**: Good lighting improves video quality
- **Connection**: Wired Ethernet > WiFi for stability
- **Bandwidth**: Need ~2.5 Mbps minimum for HD video

---

## 🆘 Support

For issues, check:
1. **Browser console** - F12 → Console tab
2. **Network tab** - Check Socket.io connections
3. **Permissions** - Camera/microphone access
4. **Firewall** - Ensure ports are open

---

**Ready to use!** 🎉

For detailed info, see: `WEBRTC_IMPLEMENTATION.md`
