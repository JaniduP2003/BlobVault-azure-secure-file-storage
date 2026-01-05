#!/bin/bash

# Test script for BlobVault backend API
# This tests the upload functionality

echo "🧪 Testing BlobVault Backend API"
echo "=================================="

# Step 1: Register a test user
echo ""
echo "📝 Step 1: Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Password123!"}')

echo "Response: $REGISTER_RESPONSE"

# Extract token from response
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token from registration"
    echo "Trying to login instead..."
    
    # Try login
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","password":"Password123!"}')
    
    echo "Login Response: $LOGIN_RESPONSE"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to authenticate"
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."

# Step 2: Create a test file
echo ""
echo "📄 Step 2: Creating test file..."
echo "This is a test file for BlobVault" > /tmp/test-upload.txt

# Step 3: Upload the file
echo ""
echo "⬆️  Step 3: Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8081/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-upload.txt" \
  -w "\nHTTP_CODE:%{http_code}")

echo "Upload Response: $UPLOAD_RESPONSE"

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q "HTTP_CODE:200"; then
    echo "✅ Upload successful!"
else
    echo "❌ Upload failed!"
    echo "Check backend logs with: docker-compose logs backend"
fi

# Step 4: List files
echo ""
echo "📋 Step 4: Listing files..."
LIST_RESPONSE=$(curl -s -X GET http://localhost:8081/api/documents \
  -H "Authorization: Bearer $TOKEN")

echo "Files: $LIST_RESPONSE"

# Cleanup
rm /tmp/test-upload.txt

echo ""
echo "=================================="
echo "✅ Test complete!"
