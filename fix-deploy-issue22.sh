#!/bin/bash
# Fix deploy Issue #22 - Script for target server
# Run this on the server where Docker is installed

set -e

echo "=== Fix Deploy Issue #22 ==="
echo "Checking current state..."

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found. Run from /opt/ai-team-office"
    exit 1
fi

# Check if agents-api.js exists
if [ ! -f "server/agents-api.js" ]; then
    echo "ERROR: server/agents-api.js not found"
    exit 1
fi

echo ""
echo "1. Checking current file on host..."
ls -la server/agents-api.js
md5sum server/agents-api.js

echo ""
echo "2. Checking current file in container..."
docker exec ai-team-office-server cat /app/agents-api.js | head -20 || echo "Container not running or file not found"

echo ""
echo "3. Verifying Елена emoji in host file..."
grep -n "Еленa" server/agents-api.js || grep -n "emoji.*📚" server/agents-api.js

echo ""
echo "4. Rebuilding container with updated file..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "5. Waiting for container to start..."
sleep 5

echo ""
echo "6. Verifying fix..."
curl -s http://localhost:3001/api/agents/status | grep -o 'Елена[^}]*emoji[^}]*}' || echo "Could not verify via API"

echo ""
echo "7. Checking file in new container..."
docker exec ai-team-office-server cat /app/agents-api.js | grep -A2 "Елена"

echo ""
echo "=== Fix complete ==="
echo ""
echo "To verify manually:"
echo "  curl http://localhost:3001/api/agents/status | grep -o 'Елена.*emoji'"
echo ""
echo "Expected: 📚 (not 🧑‍🎮)"
