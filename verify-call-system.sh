#!/bin/bash

# Audio/Video Call System Verification Script
# Run this to verify all components are ready

echo "🧪 Starting Audio/Video Call System Verification..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Backend Running
echo "1️⃣  Checking Backend Server (Port 5050)..."
if lsof -ti:5050 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Run: cd server && npm run dev"
    exit 1
fi
echo ""

# Check 2: Frontend Running
echo "2️⃣  Checking Frontend Server (Port 3000)..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Run: cd client && npm run dev"
    exit 1
fi
echo ""

# Check 3: CallContext exists
echo "3️⃣  Checking CallContext implementation..."
if [ -f "client/src/contexts/CallContext.jsx" ]; then
    lines=$(wc -l < "client/src/contexts/CallContext.jsx")
    echo -e "${GREEN}✅ CallContext exists ($lines lines)${NC}"
else
    echo -e "${RED}❌ CallContext missing${NC}"
    exit 1
fi
echo ""

# Check 4: CallWindow exists
echo "4️⃣  Checking CallWindow component..."
if [ -f "client/src/components/CallWindow.jsx" ]; then
    echo -e "${GREEN}✅ CallWindow exists${NC}"
else
    echo -e "${RED}❌ CallWindow missing${NC}"
    exit 1
fi
echo ""

# Check 5: IncomingCall exists
echo "5️⃣  Checking IncomingCall component..."
if [ -f "client/src/components/IncomingCall.jsx" ]; then
    echo -e "${GREEN}✅ IncomingCall exists${NC}"
else
    echo -e "${RED}❌ IncomingCall missing${NC}"
    exit 1
fi
echo ""

# Check 6: Socket.io setup
echo "6️⃣  Checking Socket.io client..."
if [ -f "client/src/lib/socket.js" ]; then
    echo -e "${GREEN}✅ Socket client exists${NC}"
else
    echo -e "${RED}❌ Socket client missing${NC}"
    exit 1
fi
echo ""

# Check 7: Backend socket handlers
echo "7️⃣  Checking backend socket handlers..."
if grep -q "call-user" "server/src/index.js"; then
    echo -e "${GREEN}✅ Call socket events implemented${NC}"
else
    echo -e "${RED}❌ Call socket events missing${NC}"
    exit 1
fi
echo ""

# Check 8: Call model
echo "8️⃣  Checking Call database model..."
if [ -f "server/src/models/Call.js" ]; then
    echo -e "${GREEN}✅ Call model exists${NC}"
else
    echo -e "${RED}❌ Call model missing${NC}"
    exit 1
fi
echo ""

# Check 9: Test page
echo "9️⃣  Checking test page..."
if [ -f "client/src/app/call-test/page.js" ]; then
    echo -e "${GREEN}✅ Test page exists${NC}"
else
    echo -e "${YELLOW}⚠️  Test page missing (optional)${NC}"
fi
echo ""

# Check 10: VoiceRecorder (optional)
echo "🔟 Checking optional components..."
if [ -f "client/src/components/VoiceRecorder.jsx" ]; then
    echo -e "${GREEN}✅ VoiceRecorder exists (not integrated yet)${NC}"
fi
if [ -f "client/src/components/VoiceMessage.jsx" ]; then
    echo -e "${GREEN}✅ VoiceMessage exists (not integrated yet)${NC}"
fi
if [ -f "client/src/components/MessageReactions.jsx" ]; then
    echo -e "${GREEN}✅ MessageReactions exists (not integrated yet)${NC}"
fi
echo ""

# Final Summary
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ All Core Components Verified!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:3000/call-test"
echo "   2. Login with User A"
echo "   3. Open incognito/another browser"
echo "   4. Login with User B"
echo "   5. Copy User B's ID from test page"
echo "   6. Update testUserId in call-test/page.js"
echo "   7. Click 'Test Audio Call' in Browser 1"
echo "   8. Answer the call in Browser 2"
echo ""
echo "📚 Full Testing Guide: CALL_TESTING_GUIDE.md"
echo ""
