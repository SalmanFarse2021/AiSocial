╔════════════════════════════════════════════════════════════════╗
║                  MESSENGER + NAVBAR QUICK REFERENCE           ║
╚════════════════════════════════════════════════════════════════╝

📱 HOW TO USE
═════════════════════════════════════════════════════════════════

1. Open http://localhost:3000
2. You see navbar on LEFT side
3. Click "Messages" link
4. Go to messages page
5. Send/receive messages
6. See unread badge

---

🎯 NAVBAR LINKS
═════════════════════════════════════════════════════════════════

Icon    Link              Action
─────────────────────────────────────
🏠     Home              Go to home page
🔍     Search            Placeholder
🔭     Explore           Placeholder
🎬     Reels             Placeholder
💬     Messages       🔴 Go to messages (badge shows unread)
🔔     Notifications     Placeholder
➕     Create            Placeholder
👤     Profile           Placeholder

---

✨ FEATURES
═════════════════════════════════════════════════════════════════

Navbar:
✅ Professional design
✅ Active page highlighting
✅ Unread message badge
✅ Dark mode support
✅ Smooth navigation
✅ Sticky position
✅ Responsive layout

Messenger:
✅ Send messages
✅ Real-time updates
✅ Emoji reactions
✅ Delete messages
✅ Typing indicators
✅ Message timestamps
✅ Conversation list
✅ Search friends

---

🔴 UNREAD BADGE
═════════════════════════════════════════════════════════════════

What it shows:
- Number of unread messages (1-99)
- "99+" for more than 99
- Only appears when unread > 0
- Red color with white number
- Updates every 5 seconds

Where it appears:
- Next to "Messages" in navbar
- Only on Messages nav item

---

🎨 STYLING
═════════════════════════════════════════════════════════════════

Active Page:
- Background: Light gray (gray-100) or dark (gray-900)
- Text: Sky blue (sky-600)
- Font: Bold/semibold

Unread Badge:
- Background: Red (red-500)
- Text: White, small, bold
- Shape: Circle
- Size: 20x20px

---

📁 FILES
═════════════════════════════════════════════════════════════════

NEW:
→ /client/src/components/Navbar.jsx

UPDATED:
→ /client/src/app/home/page.js
→ /client/src/app/messages/page.js

---

🚀 START
═════════════════════════════════════════════════════════════════

Terminal 1:
$ cd server
$ npm run dev

Terminal 2:
$ cd client
$ npm run dev

Browser:
http://localhost:3000

---

🧪 TEST CHECKLIST
═════════════════════════════════════════════════════════════════

□ Navbar visible on left
□ Can click Messages link
□ Navigate to /messages
□ Navbar stays visible
□ Messenger UI shows
□ Can send message
□ Message appears instantly
□ Unread badge shows count
□ Badge updates every 5 seconds
□ Can click Home link
□ Navigate back to home
□ Messages link highlights
□ Badge disappears at 0

---

⚙️ COMPONENTS
═════════════════════════════════════════════════════════════════

Navbar Component:
├─ Navigation links
├─ Icon system
├─ Unread badge
├─ Active highlighting
└─ Dark mode support

Integration:
├─ Home page uses Navbar
├─ Messages page uses Navbar
├─ Layout: Navbar + Content
└─ Flex layout for responsive

---

🔐 AUTH
═════════════════════════════════════════════════════════════════

✅ JWT token in localStorage
✅ Token sent in all API calls
✅ Unread count requires token
✅ Messages require token
✅ Secure WebSocket

---

📊 API ENDPOINTS
═════════════════════════════════════════════════════════════════

GET /api/messages/unread-count
- Returns: { unreadCount: number }
- Headers: Authorization: Bearer {token}
- Called every 5 seconds

POST/GET /api/messages/conversations
- Returns: { conversations: [...] }
- Headers: Authorization: Bearer {token}

---

💻 CODE SNIPPETS
═════════════════════════════════════════════════════════════════

Import Navbar:
import Navbar from '@/components/Navbar';

Use in Layout:
<div className="flex">
  <Navbar />
  <main className="flex-1">Content</main>
</div>

Unread Badge:
{unreadCount > 0 && (
  <span className="bg-red-500 text-white">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}

---

🎯 NAVIGATION FLOW
═════════════════════════════════════════════════════════════════

Home Page:
/home → Navbar visible → Feed shows

Messages Page:
/messages → Navbar visible → Messenger shows

Back to Home:
Click "Home" → /home → Same navbar

Any Page:
Navbar always accessible → Click any link

---

🌙 DARK MODE
═════════════════════════════════════════════════════════════════

Navbar supports dark mode:
- Light: White background
- Dark: Black background
- Adapts to system theme
- Smooth transitions

---

📱 RESPONSIVE
═════════════════════════════════════════════════════════════════

Desktop (md+):
- Navbar visible (w-64)
- Side-by-side layout
- Full functionality

Tablet/Mobile:
- Navbar hidden by default
- Can add menu toggle
- Full-screen content

---

❌ TROUBLESHOOTING
═════════════════════════════════════════════════════════════════

Navbar not showing:
→ Check component import
→ Check file path
→ Restart dev server

Badge not updating:
→ Check API endpoint
→ Check token
→ Check console errors

Messages not sending:
→ Check Socket.io
→ Check backend running
→ Check API endpoint

---

✅ PRODUCTION CHECKLIST
═════════════════════════════════════════════════════════════════

□ All servers running
□ Database connected
□ Socket.io working
□ API endpoints working
□ Authentication working
□ Navigation working
□ Messaging working
□ Badge updating
□ No console errors
□ Styling correct

---

🎉 YOU'RE READY!

Click "Messages" in navbar and start messaging! 💬

---

Quick Links:
Home: http://localhost:3000/home
Messages: http://localhost:3000/messages
Direct Message: Click in navbar

Status: ✅ READY TO USE
Updated: November 12, 2025
