#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8081/api"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to print section header
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ ${NC}$1"
}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Folder Endpoints Testing Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Step 1: Register a test user
print_header "Step 1: User Registration"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "foldertest_'$(date +%s)'",
        "email": "foldertest_'$(date +%s)'@example.com",
        "password": "Test@123456"
    }')

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "User registration"
    echo "$REGISTER_BODY" | jq '.'
else
    print_result 1 "User registration (HTTP $HTTP_CODE)"
    echo "$REGISTER_BODY"
fi

# Step 2: Login and get token
print_header "Step 2: User Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "'"$(echo "$REGISTER_BODY" | jq -r '.username')"'",
        "password": "Test@123456"
    }')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token')
    print_result 0 "User login"
    print_info "Token obtained: ${TOKEN:0:20}..."
else
    print_result 1 "User login (HTTP $HTTP_CODE)"
    echo "$LOGIN_BODY"
    exit 1
fi

# Step 3: Get all folders (should be empty initially)
print_header "Step 3: Get All Folders (Empty)"
FOLDERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$FOLDERS_RESPONSE" | tail -n1)
FOLDERS_BODY=$(echo "$FOLDERS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Get all folders (empty)"
    echo "$FOLDERS_BODY" | jq '.'
else
    print_result 1 "Get all folders (HTTP $HTTP_CODE)"
    echo "$FOLDERS_BODY"
fi

# Step 4: Create root folder
print_header "Step 4: Create Root Folder"
CREATE_FOLDER1=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Documents",
        "color": "#3b82f6"
    }')

HTTP_CODE=$(echo "$CREATE_FOLDER1" | tail -n1)
FOLDER1_BODY=$(echo "$CREATE_FOLDER1" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    FOLDER1_ID=$(echo "$FOLDER1_BODY" | jq -r '.id')
    print_result 0 "Create root folder 'Documents'"
    echo "$FOLDER1_BODY" | jq '.'
else
    print_result 1 "Create root folder (HTTP $HTTP_CODE)"
    echo "$FOLDER1_BODY"
fi

# Step 5: Create another root folder
print_header "Step 5: Create Another Root Folder"
CREATE_FOLDER2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Photos",
        "color": "#10b981"
    }')

HTTP_CODE=$(echo "$CREATE_FOLDER2" | tail -n1)
FOLDER2_BODY=$(echo "$CREATE_FOLDER2" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    FOLDER2_ID=$(echo "$FOLDER2_BODY" | jq -r '.id')
    print_result 0 "Create root folder 'Photos'"
    echo "$FOLDER2_BODY" | jq '.'
else
    print_result 1 "Create root folder 'Photos' (HTTP $HTTP_CODE)"
    echo "$FOLDER2_BODY"
fi

# Step 6: Create subfolder
print_header "Step 6: Create Subfolder"
CREATE_SUBFOLDER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Work Documents",
        "parentFolderId": '$FOLDER1_ID',
        "color": "#8b5cf6"
    }')

HTTP_CODE=$(echo "$CREATE_SUBFOLDER" | tail -n1)
SUBFOLDER_BODY=$(echo "$CREATE_SUBFOLDER" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    SUBFOLDER_ID=$(echo "$SUBFOLDER_BODY" | jq -r '.id')
    print_result 0 "Create subfolder 'Work Documents'"
    echo "$SUBFOLDER_BODY" | jq '.'
else
    print_result 1 "Create subfolder (HTTP $HTTP_CODE)"
    echo "$SUBFOLDER_BODY"
fi

# Step 7: Create nested subfolder
print_header "Step 7: Create Nested Subfolder"
CREATE_NESTED=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Projects",
        "parentFolderId": '$SUBFOLDER_ID',
        "color": "#f59e0b"
    }')

HTTP_CODE=$(echo "$CREATE_NESTED" | tail -n1)
NESTED_BODY=$(echo "$CREATE_NESTED" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    NESTED_ID=$(echo "$NESTED_BODY" | jq -r '.id')
    print_result 0 "Create nested subfolder 'Projects'"
    echo "$NESTED_BODY" | jq '.'
else
    print_result 1 "Create nested subfolder (HTTP $HTTP_CODE)"
    echo "$NESTED_BODY"
fi

# Step 8: Get all root folders
print_header "Step 8: Get All Root Folders"
GET_ROOT_FOLDERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GET_ROOT_FOLDERS" | tail -n1)
ROOT_FOLDERS_BODY=$(echo "$GET_ROOT_FOLDERS" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$ROOT_FOLDERS_BODY" | jq '. | length')
    print_result 0 "Get all root folders (found $COUNT folders)"
    echo "$ROOT_FOLDERS_BODY" | jq '.'
else
    print_result 1 "Get all root folders (HTTP $HTTP_CODE)"
    echo "$ROOT_FOLDERS_BODY"
fi

# Step 9: Get specific folder by ID
print_header "Step 9: Get Specific Folder by ID"
GET_FOLDER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders/$FOLDER1_ID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GET_FOLDER" | tail -n1)
GET_FOLDER_BODY=$(echo "$GET_FOLDER" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Get folder by ID"
    echo "$GET_FOLDER_BODY" | jq '.'
else
    print_result 1 "Get folder by ID (HTTP $HTTP_CODE)"
    echo "$GET_FOLDER_BODY"
fi

# Step 10: Get folders with specific parent
print_header "Step 10: Get Subfolders of Parent"
GET_SUBFOLDERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders?parentId=$FOLDER1_ID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GET_SUBFOLDERS" | tail -n1)
SUBFOLDERS_BODY=$(echo "$GET_SUBFOLDERS" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$SUBFOLDERS_BODY" | jq '. | length')
    print_result 0 "Get subfolders (found $COUNT folders)"
    echo "$SUBFOLDERS_BODY" | jq '.'
else
    print_result 1 "Get subfolders (HTTP $HTTP_CODE)"
    echo "$SUBFOLDERS_BODY"
fi

# Step 11: Update folder (rename)
print_header "Step 11: Update Folder - Rename"
UPDATE_FOLDER=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/folders/$FOLDER2_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Images & Photos"
    }')

HTTP_CODE=$(echo "$UPDATE_FOLDER" | tail -n1)
UPDATE_BODY=$(echo "$UPDATE_FOLDER" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Rename folder"
    echo "$UPDATE_BODY" | jq '.'
else
    print_result 1 "Rename folder (HTTP $HTTP_CODE)"
    echo "$UPDATE_BODY"
fi

# Step 12: Update folder (change color)
print_header "Step 12: Update Folder - Change Color"
UPDATE_COLOR=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/folders/$FOLDER2_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "color": "#ef4444"
    }')

HTTP_CODE=$(echo "$UPDATE_COLOR" | tail -n1)
COLOR_BODY=$(echo "$UPDATE_COLOR" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Change folder color"
    echo "$COLOR_BODY" | jq '.'
else
    print_result 1 "Change folder color (HTTP $HTTP_CODE)"
    echo "$COLOR_BODY"
fi

# Step 13: Move folder to different parent
print_header "Step 13: Move Folder to Different Parent"
MOVE_FOLDER=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/folders/$NESTED_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "parentFolderId": '$FOLDER1_ID'
    }')

HTTP_CODE=$(echo "$MOVE_FOLDER" | tail -n1)
MOVE_BODY=$(echo "$MOVE_FOLDER" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Move folder to different parent"
    echo "$MOVE_BODY" | jq '.'
else
    print_result 1 "Move folder (HTTP $HTTP_CODE)"
    echo "$MOVE_BODY"
fi

# Step 14: Try to create duplicate folder name (should fail)
print_header "Step 14: Try Creating Duplicate Folder Name (Should Fail)"
DUPLICATE_FOLDER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Documents",
        "color": "#3b82f6"
    }')

HTTP_CODE=$(echo "$DUPLICATE_FOLDER" | tail -n1)
DUPLICATE_BODY=$(echo "$DUPLICATE_FOLDER" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Duplicate folder name rejected (HTTP 400)"
    echo "$DUPLICATE_BODY" | jq '.'
else
    print_result 1 "Duplicate folder name should be rejected (HTTP $HTTP_CODE)"
    echo "$DUPLICATE_BODY"
fi

# Step 15: Try to move folder into itself (should fail)
print_header "Step 15: Try Moving Folder Into Itself (Should Fail)"
MOVE_INTO_SELF=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/folders/$FOLDER1_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "parentFolderId": '$FOLDER1_ID'
    }')

HTTP_CODE=$(echo "$MOVE_INTO_SELF" | tail -n1)
SELF_BODY=$(echo "$MOVE_INTO_SELF" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Moving folder into itself rejected (HTTP 400)"
    echo "$SELF_BODY" | jq '.'
else
    print_result 1 "Moving folder into itself should be rejected (HTTP $HTTP_CODE)"
    echo "$SELF_BODY"
fi

# Step 16: Try to access non-existent folder (should fail)
print_header "Step 16: Try Accessing Non-Existent Folder (Should Fail)"
GET_NONEXISTENT=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders/99999" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GET_NONEXISTENT" | tail -n1)
NONEXISTENT_BODY=$(echo "$GET_NONEXISTENT" | sed '$d')

if [ "$HTTP_CODE" = "404" ]; then
    print_result 0 "Non-existent folder returns 404"
    echo "$NONEXISTENT_BODY" | jq '.'
else
    print_result 1 "Non-existent folder should return 404 (HTTP $HTTP_CODE)"
    echo "$NONEXISTENT_BODY"
fi

# Step 17: Delete subfolder (files/folders should move to parent)
print_header "Step 17: Delete Subfolder"
DELETE_SUBFOLDER=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/folders/$SUBFOLDER_ID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$DELETE_SUBFOLDER" | tail -n1)
DELETE_BODY=$(echo "$DELETE_SUBFOLDER" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Delete subfolder"
    echo "$DELETE_BODY" | jq '.'
else
    print_result 1 "Delete subfolder (HTTP $HTTP_CODE)"
    echo "$DELETE_BODY"
fi

# Step 18: Verify folder was deleted
print_header "Step 18: Verify Folder Deletion"
VERIFY_DELETE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders/$SUBFOLDER_ID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$VERIFY_DELETE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
    print_result 0 "Folder successfully deleted (404)"
else
    print_result 1 "Folder should be deleted (HTTP $HTTP_CODE)"
fi

# Step 19: Final folder list
print_header "Step 19: Final Folder List"
FINAL_FOLDERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/folders" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$FINAL_FOLDERS" | tail -n1)
FINAL_BODY=$(echo "$FINAL_FOLDERS" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$FINAL_BODY" | jq '. | length')
    print_result 0 "Get final folder list ($COUNT folders)"
    echo "$FINAL_BODY" | jq '.'
else
    print_result 1 "Get final folder list (HTTP $HTTP_CODE)"
    echo "$FINAL_BODY"
fi

# Test Summary
print_header "Test Summary"
echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC} 🎉\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}\n"
    exit 1
fi
