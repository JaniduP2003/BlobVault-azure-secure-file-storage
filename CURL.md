# BlobVault API - cURL Commands Reference

This document contains all the cURL commands to test the BlobVault API endpoints.

## Base URL

```
http://localhost:8081
```

## Table of Contents

1. [Authentication](#authentication)
2. [Document Operations](#document-operations)
3. [Testing Script](#testing-script)

---

## Authentication

### Register a New User

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Password123!"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "username": "testuser",
  "email": "test@example.com"
}
```

### Login

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Password123!"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "username": "testuser",
  "email": "test@example.com"
}
```

### Set Token for Subsequent Requests

After registering or logging in, save the token:

```bash
TOKEN="eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
```

---

## Document Operations

> **Note:** All document operations require authentication. Include the JWT token in the `Authorization` header.

### Upload a File

```bash
curl -X POST http://localhost:8081/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

**Supported File Types:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`, `image/gif`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Max File Size:** 50 MB

**Response:**
```json
{
  "id": 1,
  "fileName": "file.pdf",
  "fileSize": 1234567,
  "contentType": "application/pdf",
  "uploadedAt": "2026-01-01T03:08:10.154175Z",
  "url": "http://azurite:10000/devstoreaccount1/userfiles/1/..."
}
```

### List All Files

```bash
curl -X GET http://localhost:8081/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "fileName": "file.pdf",
    "fileSize": 1234567,
    "contentType": "application/pdf",
    "uploadedAt": "2026-01-01T03:08:10.154175Z",
    "lastAccessedAt": null
  }
]
```

### Download a File

Replace `{id}` with the file ID from the list:

```bash
curl -X GET http://localhost:8081/api/documents/download/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.pdf
```

**Example:**
```bash
curl -X GET http://localhost:8081/api/documents/download/1 \
  -H "Authorization: Bearer $TOKEN" \
  -o myfile.pdf
```

### Delete a File

Replace `{id}` with the file ID:

```bash
curl -X DELETE http://localhost:8081/api/documents/{id} \
  -H "Authorization: Bearer $TOKEN"
```

**Example:**
```bash
curl -X DELETE http://localhost:8081/api/documents/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### Generate Share Link (SAS URL)

Generate a temporary shareable link for a file. Replace `{id}` with the file ID:

```bash
curl -X GET "http://localhost:8081/api/documents/share/{id}?expiryMinutes=15" \
  -H "Authorization: Bearer $TOKEN"
```

**Parameters:**
- `expiryMinutes`: Duration in minutes (1-1440, default: 15)

**Example:**
```bash
curl -X GET "http://localhost:8081/api/documents/share/1?expiryMinutes=60" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "fileName": "file.pdf",
  "shareUrl": "http://azurite:10000/devstoreaccount1/userfiles/1/...?sv=2024-05-04&se=...",
  "expiresAt": "2026-01-01T04:08:10.154175Z"
}
```

---

## Complete Workflow Example

### 1. Register and Get Token

```bash
RESPONSE=$(curl -s -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","email":"myuser@example.com","password":"SecurePass123!"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
```

### 2. Upload a File

```bash
curl -X POST http://localhost:8081/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./myfile.pdf"
```

### 3. List Files

```bash
curl -X GET http://localhost:8081/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Download File

```bash
curl -X GET http://localhost:8081/api/documents/download/1 \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded.pdf
```

### 5. Generate Share Link

```bash
curl -X GET "http://localhost:8081/api/documents/share/1?expiryMinutes=30" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Delete File

```bash
curl -X DELETE http://localhost:8081/api/documents/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing Script

A comprehensive testing script is available at `test-api.sh` in the root directory:

```bash
./test-api.sh
```

This script will:
1. Register a new user
2. Extract the JWT token
3. List documents (empty initially)
4. Upload a test file
5. List documents again (showing the uploaded file)

---

## Error Responses

### 401 Unauthorized
Missing or invalid JWT token.

```json
{
  "message": "Invalid Credentials"
}
```

### 400 Bad Request
Invalid request data (e.g., file too large, invalid file type).

```json
{
  "message": "File size exceeds 50mb limit"
}
```

### 404 Not Found
Resource not found (e.g., file doesn't exist).

```json
{
  "message": "File not found"
}
```

### 500 Internal Server Error
Server-side error.

```json
{
  "message": "Error uploading file"
}
```

---

## Tips

1. **Token Expiry**: JWT tokens expire after 1440 minutes (24 hours). Re-login to get a new token.

2. **Verbose Output**: Add `-v` flag to see detailed request/response information:
   ```bash
   curl -v -X GET http://localhost:8081/api/documents \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Pretty Print JSON**: Pipe the output to `jq` for formatted JSON:
   ```bash
   curl -X GET http://localhost:8081/api/documents \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

4. **Save Response**: Use `-o` to save the response to a file:
   ```bash
   curl -X GET http://localhost:8081/api/documents \
     -H "Authorization: Bearer $TOKEN" -o files.json
   ```

5. **Check HTTP Status**: Add `-w "\n%{http_code}\n"` to see the HTTP status code:
   ```bash
   curl -w "\n%{http_code}\n" -X GET http://localhost:8081/api/documents \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Environment Variables

For convenience, you can set environment variables:

```bash
export API_URL="http://localhost:8081"
export TOKEN="your_jwt_token_here"

# Then use them in commands
curl -X GET "$API_URL/api/documents" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Docker Containers

Make sure all containers are running before testing:

```bash
docker ps
```

You should see:
- `azurite` - Azure Storage Emulator
- `backend` - ASP.NET Core API
- `frontend` - Next.js Frontend

To view backend logs:
```bash
docker logs backend --tail 50 -f
```

To restart backend:
```bash
docker restart backend
```
