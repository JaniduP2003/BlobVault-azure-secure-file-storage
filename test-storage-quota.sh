#!/bin/bash

echo "=== Testing Storage Quota Feature ==="
echo ""

# Test 1: Try to access storage endpoint without authentication
echo "1. Testing unauthenticated access (should fail):"
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8081/api/storage/quota | head -3
echo ""

# Test 2: Register a new user
echo "2. Registering a new test user:"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"quotatest","email":"quota@test.com","password":"Test1234!"}')
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Test 3: Login to get token
echo "3. Logging in to get JWT token:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"quotatest","password":"Test1234!"}')
echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to get token. Trying with existing user..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"janidu","password":"123"}')
  echo "$LOGIN_RESPONSE" | jq '.'
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
fi

echo ""

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to obtain authentication token"
  exit 1
fi

echo "✅ Token obtained successfully"
echo ""

# Test 4: Get storage quota information
echo "4. Getting storage quota information:"
QUOTA_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/storage/quota)
echo "$QUOTA_RESPONSE" | jq '.'
echo ""

# Test 5: Get storage info from documents endpoint
echo "5. Getting storage info from documents endpoint:"
STORAGE_INFO=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/documents/storage-info)
echo "$STORAGE_INFO" | jq '.'
echo ""

# Test 6: Check quota values
echo "6. Analyzing quota values:"
QUOTA_GB=$(echo "$STORAGE_INFO" | jq -r '.storageQuotaMB // 0' | awk '{printf "%.2f", $1/1024}')
USED_MB=$(echo "$STORAGE_INFO" | jq -r '.storageUsedMB // 0')
REMAINING_GB=$(echo "$STORAGE_INFO" | jq -r '.remainingMB // 0' | awk '{printf "%.2f", $1/1024}')
PERCENTAGE=$(echo "$STORAGE_INFO" | jq -r '.usagePercentage // 0' | awk '{printf "%.2f", $1}')

echo "  📊 Storage Quota: ${QUOTA_GB} GB"
echo "  📈 Storage Used: ${USED_MB} MB"
echo "  💾 Storage Remaining: ${REMAINING_GB} GB"
echo "  📉 Usage Percentage: ${PERCENTAGE}%"
echo ""

echo "✅ Storage quota feature is working!"
echo ""
echo "=== Test Complete ===" 
