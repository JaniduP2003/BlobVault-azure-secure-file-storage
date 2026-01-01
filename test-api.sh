#!/bin/zsh

# API Testing Script for BlobVault

BASE_URL="http://localhost:8081"

echo "=== 1. Register User ==="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","email":"test2@example.com","password":"Password123!"}')
echo "$REGISTER_RESPONSE"

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "\nExtracted Token: $TOKEN\n"

echo "\n=== 2. List Documents (should be empty) ==="
curl -s -X GET "$BASE_URL/api/documents" \
  -H "Authorization: Bearer $TOKEN"

echo "\n\n=== 3. Upload a file ==="
curl -s -X POST "$BASE_URL/api/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/home/janidu/Downloads/grn1.jpg"

echo "\n\n=== 4. List Documents again ==="
curl -s -X GET "$BASE_URL/api/documents" \
  -H "Authorization: Bearer $TOKEN"

echo "\n\n=== Done ==="
