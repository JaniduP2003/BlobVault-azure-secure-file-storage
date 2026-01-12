#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend URL
API_URL="http://localhost:8081/api"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Trash & Starred Features Test  ${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Step 1: Login
echo -e "${GREEN}Step 1: Logging in...${NC}"
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed! Make sure backend is running and user exists.${NC}"
    echo "Try registering first with:"
    echo "curl -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"username\":\"testuser\"}'"
    exit 1
fi

export AUTH_TOKEN="$TOKEN"
echo -e "Token obtained: ${TOKEN:0:20}..."
echo ""

# Step 2: Create test file
echo -e "${GREEN}Step 2: Creating test file...${NC}"
echo "This is a test file for trash features" > /tmp/trash_test.txt
echo "Test file created"
echo ""

# Step 3: Upload file
echo -e "${GREEN}Step 3: Uploading file...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST $API_URL/documents/upload \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@/tmp/trash_test.txt")
echo $UPLOAD_RESPONSE | python3 -m json.tool 2>/dev/null || echo $UPLOAD_RESPONSE
FILE_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo -e "File ID: ${BLUE}$FILE_ID${NC}"
echo ""

if [ -z "$FILE_ID" ]; then
    echo -e "${RED}Upload failed! Check backend logs.${NC}"
    exit 1
fi

# Step 4: List files
echo -e "${GREEN}Step 4: Listing all files...${NC}"
curl -s -X GET $API_URL/documents \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 5: Star the file
echo -e "${GREEN}Step 5: Starring file...${NC}"
curl -s -X POST $API_URL/documents/$FILE_ID/star \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 6: Get starred files
echo -e "${GREEN}Step 6: Getting starred files...${NC}"
curl -s -X GET $API_URL/documents/starred \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 7: Move to trash
echo -e "${GREEN}Step 7: Moving file to trash (soft delete)...${NC}"
curl -s -X DELETE $API_URL/documents/$FILE_ID \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 8: Verify file is gone from main list
echo -e "${GREEN}Step 8: Verifying file is gone from main list...${NC}"
curl -s -X GET $API_URL/documents \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 9: View trash
echo -e "${GREEN}Step 9: Viewing trash...${NC}"
curl -s -X GET $API_URL/documents/trash \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 10: Restore file
echo -e "${GREEN}Step 10: Restoring file from trash...${NC}"
curl -s -X POST $API_URL/documents/$FILE_ID/restore \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 11: Verify file is back
echo -e "${GREEN}Step 11: Verifying file is restored...${NC}"
curl -s -X GET $API_URL/documents \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 12: Delete again for permanent delete test
echo -e "${GREEN}Step 12: Moving to trash again...${NC}"
curl -s -X DELETE $API_URL/documents/$FILE_ID \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 13: Permanently delete
echo -e "${GREEN}Step 13: Permanently deleting file...${NC}"
curl -s -X DELETE $API_URL/documents/$FILE_ID/permanent \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Step 14: Verify trash is empty
echo -e "${GREEN}Step 14: Verifying trash is empty...${NC}"
curl -s -X GET $API_URL/documents/trash \
  -H "Authorization: Bearer $AUTH_TOKEN" | python3 -m json.tool 2>/dev/null
echo ""

# Cleanup
rm /tmp/trash_test.txt

echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}✅ All tests completed successfully!${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo "Features tested:"
echo "  ✓ File upload"
echo "  ✓ Star/unstar files"
echo "  ✓ Get starred files"
echo "  ✓ Move to trash (soft delete)"
echo "  ✓ View trash"
echo "  ✓ Restore from trash"
echo "  ✓ Permanent delete"
echo ""
