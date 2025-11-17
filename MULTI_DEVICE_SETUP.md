# 📱 Multi-Device Video Call Setup Guide

## Overview
This guide explains how to set up AiSocial video calling to work between two different devices on different WiFi networks.

---

## ✅ What's Been Done (Changes Made)

### Server Changes
```
✅ CORS configured to accept connections from any origin
✅ Server binds to 0.0.0.0 (all network interfaces)
✅ Socket.io accepts external connections
✅ Port: 5050 (must be accessible from outside)
```

### Configuration Files Modified
```
/server/src/index.js
├─ Lines 26-39: CORS configuration updated
├─ Lines 71-74: Socket.io with flexible CORS
└─ Lines 424: Server binds to 0.0.0.0:5050
```

---

## 🚀 Setup Steps

### Step 1: Start Your Server Machine

**On your main Mac (where server is running):**

```bash
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/server
npm run dev
```

Expected output:
```
API listening on http://0.0.0.0:5050
For external connections, use your machine IP (e.g., http://192.168.x.x:5050)
```

### Step 2: Find Your Server IP Address

**Option A: Run the script (automatic)**
```bash
bash /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/GET_SERVER_IP.sh
```

**Option B: Manual method**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for output like:
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
        ↑ Use this IP
```

**Example IP: `192.168.1.100`**

### Step 3: Verify Network Access

Test that your server is accessible from outside:

```bash
# From another machine on the same network
curl http://192.168.1.100:5050

# Expected response:
# {"name":"AiSocial API","status":"ok"}
```

---

## 📋 Device Setup

### Device 1 (Server + First Client)

**On your main Mac:**

```bash
# Terminal 1: Start the server
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/server
npm run dev

# Terminal 2: Start the client
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/client
npm run dev
```

**Access:** http://localhost:3000 (local only)

**OR** Access from same machine using IP:
- Update `.env.local` to: `NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:5050`
- Access: http://192.168.1.100:3000

---

### Device 2 (Second Client - Different WiFi)

**On your second device (laptop, phone, tablet):**

#### Via Laptop/Desktop

1. **Clone or copy the client code:**
   ```bash
   # Option 1: Clone from git (recommended)
   git clone <your-repo-url>
   cd AiSocial/client
   
   # Option 2: Copy manually
   scp -r /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/client \
       username@other-device:/path/to/destination/
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create/Update `.env.local`:**
   ```bash
   cat > .env.local << EOF
   NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:5050
   EOF
   ```
   
   Replace `192.168.1.100` with your actual server IP from Step 2.

4. **Start the client:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   ```
   http://localhost:3000
   ```

#### Via Mobile Device (iOS/Android)

1. **On mobile browser:**
   ```
   http://192.168.1.100:3000
   ```
   
   Replace `192.168.1.100` with your server IP.

2. **Configure in-app:**
   - The app will automatically use `NEXT_PUBLIC_API_BASE_URL` from the server response
   - Make sure you're on the same WiFi network

---

## ⚠️ Important Requirements

### Network Requirements
```
✅ Both devices must be on the same WiFi network OR
✅ Both devices must be able to reach the server IP
✅ Firewall must allow port 5050 traffic
✅ Network latency < 500ms for good video quality
```

### Firewall Configuration

**macOS - Allow port 5050:**
```bash
# Check if port is accessible
sudo lsof -i :5050

# If blocked, enable in System Preferences:
# System Preferences > Security & Privacy > Firewall
# Add Node.js to allowed apps
```

**Other Network Issues:**
- Check WiFi is 2.4GHz or 5GHz (consistent between devices)
- Some corporate networks block P2P - use personal WiFi
- Disable VPN temporarily for testing

---

## 🧪 Testing Multi-Device Calls

### Test Scenario: Device 1 → Device 2

**Device 1 (Server Machine):**
1. Login/Create account
2. Go to Messages or Profile
3. Click Video Call Button
4. Initiate call to a user

**Device 2 (Other Device):**
1. Login/Create account (different user or same)
2. Should see incoming call notification
3. Accept the call
4. Video should start

### Expected Results

```
✅ Incoming call notification appears on Device 2
✅ Accept button works on Device 2
✅ Video streams in both directions
✅ Audio transmits in both directions
✅ Controls work on both devices
✅ Network stats display real-time
✅ Disconnect properly ends call
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem: "Cannot connect" or "Connection refused"**
```
Solution:
1. Verify server is running: curl http://192.168.1.100:5050
2. Check .env.local has correct IP
3. Verify firewall allows port 5050
4. Restart both client and server
5. Check network latency: ping 192.168.1.100
```

**Problem: "Socket connection timeout"**
```
Solution:
1. Check CORS configuration in server (should be ✅)
2. Verify both devices on same network
3. Check for proxy/VPN interference
4. Try a wired connection if WiFi is unstable
```

**Problem: "CORS error" or "403 Forbidden"**
```
Solution:
1. Verify /server/src/index.js has flexible CORS
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private mode
4. Restart server
```

### Call Quality Issues

**Problem: "Video not showing"**
```
Solution:
1. Check device camera permissions
2. Try: Device Settings > Privacy > Camera > Allow
3. Switch between front/back camera (F key)
4. Restart the call
```

**Problem: "Audio not working"**
```
Solution:
1. Check microphone permissions
2. Unmute: M key or button
3. Check device volume
4. Test mic separately: Mac Settings > Sound > Input
```

**Problem: "Laggy or choppy video"**
```
Solution:
1. Check network quality indicator (should be 🟢 green)
2. Get closer to WiFi router
3. Disconnect other devices using bandwidth
4. Switch to 5GHz WiFi if available
5. Check bitrate in Network Quality stats
```

---

## 🔧 Environment Variables

### Server Environment (`.env`)

```bash
PORT=5050
CLIENT_ORIGIN=* # Accepts any origin (for development)
DATABASE_URL=your_mongo_url
# ... other variables
```

### Client Environment (`.env.local`)

**For Local Testing:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```

**For Multi-Device Testing:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:5050
```

Replace `192.168.1.100` with your actual server IP address.

---

## 📊 Network Quality Indicators

The app displays real-time network stats:

```
🟢 Excellent (Bitrate > 2000 kbps)
  ├─ Bitrate: 2500 kbps
  ├─ FPS: 30
  ├─ Packet Loss: < 0.5%
  └─ Latency: < 50ms

🟡 Good (Bitrate 800-2000 kbps)
  ├─ Bitrate: 1200 kbps
  ├─ FPS: 24
  ├─ Packet Loss: 1-3%
  └─ Latency: 50-150ms

🟠 Poor (Bitrate 300-800 kbps)
  ├─ Bitrate: 500 kbps
  ├─ FPS: 12
  ├─ Packet Loss: 3-10%
  └─ Latency: 150-300ms

🔴 Very Poor (Bitrate < 300 kbps)
  ├─ Bitrate: 100 kbps
  ├─ FPS: 6
  ├─ Packet Loss: > 10%
  └─ Latency: > 300ms
```

If showing 🔴 red, check:
1. Network connection quality
2. WiFi signal strength
3. ISP bandwidth
4. Background network usage

---

## 🌐 Production Deployment Notes

**For production with different networks/internet:**

1. **Use TURN servers** instead of STUN only
2. **Add secure authentication** for CORS
3. **Implement IP whitelisting** instead of accept-all
4. **Use SSL/TLS** (https://)
5. **Set specific CLIENT_ORIGIN** instead of wildcard

Example production config:
```javascript
// In server/src/index.js
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'https://aisocial.app',
  credentials: true,
};
```

---

## ✅ Verification Checklist

- [ ] Server running on 0.0.0.0:5050
- [ ] Found server IP address
- [ ] Verified port 5050 accessible from other device
- [ ] .env.local updated on second device
- [ ] Both devices on same network
- [ ] Can access http://server-ip:3000 from second device
- [ ] Both users logged in
- [ ] Can initiate call from Device 1
- [ ] Call notification appears on Device 2
- [ ] Can accept call
- [ ] Video streams in both directions
- [ ] Audio works both ways
- [ ] Network stats display correctly
- [ ] Can disconnect call cleanly

---

## 📞 Common Commands

```bash
# Get server IP
bash GET_SERVER_IP.sh

# Check if port is open
sudo lsof -i :5050

# Check network connectivity
ping 192.168.1.100

# Check API response
curl http://192.168.1.100:5050

# Restart everything
pkill -f "npm run dev"
npm run dev

# Check logs
tail -f server.log
```

---

## 🎉 Ready to Test!

You're now ready to test video calling between multiple devices.

**Quick Start:**
1. Run `bash GET_SERVER_IP.sh` to get your server IP
2. Start server: `npm run dev` (in server folder)
3. Update `.env.local` on second device with server IP
4. Start clients on both devices
5. Login with different accounts
6. Try calling each other!

---

## Need Help?

Check these files for more details:
- `/server/src/index.js` - Server configuration
- `/client/src/lib/socket.js` - Socket connection
- `/client/src/contexts/CallContext.jsx` - Call management

---

*Last Updated: November 14, 2025*  
*Multi-Device Setup - AiSocial Video Calling*
