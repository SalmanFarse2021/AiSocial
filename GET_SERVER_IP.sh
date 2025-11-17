#!/bin/bash

# Get local IP address for multi-device testing
# This script helps you find your server IP for connecting from different devices

echo "🔍 Finding your server IP address..."
echo ""

# Get the local IP address (for macOS)
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
  echo "❌ Could not automatically find IP address"
  echo "Manual method:"
  echo "  1. Open System Preferences > Network"
  echo "  2. Select WiFi"
  echo "  3. Click 'Advanced'"
  echo "  4. Go to TCP/IP tab"
  echo "  5. Copy the IPv4 Address"
  exit 1
fi

echo "✅ Your server IP address is: $IP"
echo ""
echo "📱 On other devices, use:"
echo "   http://$IP:5050"
echo ""
echo "📝 Update the .env.local file on other devices with:"
echo "   NEXT_PUBLIC_API_BASE_URL=http://$IP:5050"
echo ""
echo "⚠️  Make sure both devices are on the same WiFi network!"
