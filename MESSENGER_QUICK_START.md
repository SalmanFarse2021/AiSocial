# 🚀 Quick Start - Messenger App

## Step 1: Start the Server

```bash
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/server
npm run dev
```

✅ You should see:
```
API listening on http://localhost:5000
```

## Step 2: Start the Client

Open a new terminal:

```bash
cd /Users/mdsalmanfarse/Documents/Files/My\ Projects/AiSocial/client
npm run dev
```

✅ You should see:
```
> ready - started server on 0.0.0.0:3000
```

## Step 3: Test the Messenger

1. Open http://localhost:3000 in your browser
2. Navigate to Messages section
3. Select a conversation or search for a friend
4. Send a message
5. ✅ Message should appear in real-time

## Step 4: Test Real-Time (Optional)

Open a second browser tab with http://localhost:3000:
1. Send a message from first tab
2. Second tab should receive it instantly (via Socket.io)

## Verify Everything Works

### Server Terminal
Look for logs like:
```
New user connected: abc123
Message sent in conversation: xyz789
```

### Browser Console
Look for logs like:
```
Socket connected: abc123xyz
Message received: {content: "Hello", sender: "..."}
```

## If Something Doesn't Work

### 1. Check Ports
```bash
# Server should be on 5000
lsof -i :5000

# Client should be on 3000
lsof -i :3000
```

### 2. Check MongoDB Connection
In server terminal, you should see connection logs

### 3. Check Environment Variables
- Server: `.env` file in server directory
- Client: `.env.local` file in client directory

### 4. Check Socket.io Connection
- Open browser DevTools
- Go to Network tab
- Look for WebSocket connections
- Should see messages flowing in real-time

## Next: Try These Features

✅ Send a text message
✅ Add emoji reaction to a message
✅ Delete your own message
✅ Search for a friend and message them
✅ Access messenger from friend's profile

## Documentation

Full documentation: `MESSENGER_COMPLETE_GUIDE.md`

---

**Status**: ✅ READY TO USE

The messenger app is fully functional and ready for testing!
