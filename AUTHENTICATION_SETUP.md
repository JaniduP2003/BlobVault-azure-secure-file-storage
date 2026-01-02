# Authentication System Documentation

## Overview

Successfully implemented a complete authentication system with login and registration pages that integrate with your backend API and redirect to the dashboard.

## Features Implemented

### 1. **Login Page** (`/app/login/page.tsx`)

- ✅ Modern UI matching dashboard theme
- ✅ Username and password fields with icons
- ✅ Client-side form validation
- ✅ Loading states during authentication
- ✅ Error handling with toast notifications
- ✅ Stores JWT token and user info in localStorage
- ✅ Automatic redirect to dashboard on success
- ✅ Link to registration page
- ✅ Background gradient effects matching dashboard

**API Integration:**

- Endpoint: `POST http://localhost:5000/api/auth/login`
- Request body: `{ username, password }`
- Response: `{ token, username, email }`

### 2. **Registration Page** (`/app/register/page.tsx`)

- ✅ Modern UI matching dashboard theme
- ✅ Username, email, and password fields
- ✅ Password confirmation field
- ✅ Client-side password validation (min 6 characters)
- ✅ Password matching validation
- ✅ Loading states during registration
- ✅ Error handling with toast notifications
- ✅ Stores JWT token and user info in localStorage
- ✅ Automatic redirect to dashboard on success
- ✅ Link to login page
- ✅ Background gradient effects matching dashboard

**API Integration:**

- Endpoint: `POST http://localhost:5000/api/auth/register`
- Request body: `{ username, email, password }`
- Response: `{ token, username, email }`

### 3. **Dashboard Page** (`/app/dashboard/page.tsx`)

- ✅ Protected route - redirects to login if not authenticated
- ✅ Displays personalized welcome message with username
- ✅ Shows FileList component
- ✅ Uses DashboardLayout wrapper

### 4. **Home Page** (`/app/page.tsx`)

- ✅ Smart redirect logic:
  - If authenticated → redirects to `/dashboard`
  - If not authenticated → redirects to `/login`

### 5. **Dashboard Layout Updates**

- ✅ Added user profile dropdown in header
- ✅ Displays username and email
- ✅ Logout functionality
- ✅ Clears localStorage on logout
- ✅ Redirects to login after logout
- ✅ Toast notification on logout

## Backend Integration

Your backend (`AuthController.cs`) provides:

- ✅ **Password Hashing**: Uses SHA256 for secure password storage
- ✅ **JWT Tokens**: Generates secure JWT tokens with HS512 algorithm
- ✅ **User Validation**: Checks for duplicate usernames/emails
- ✅ **Secure Login**: Verifies hashed passwords

## Authentication Flow

### Registration Flow:

1. User fills registration form
2. Client validates password (length, matching)
3. POST request to `/api/auth/register`
4. Backend hashes password with SHA256
5. Backend creates user and generates JWT token
6. Client stores token, username, email in localStorage
7. Client redirects to `/dashboard`

### Login Flow:

1. User fills login form
2. POST request to `/api/auth/login`
3. Backend verifies username and hashed password
4. Backend generates JWT token
5. Client stores token, username, email in localStorage
6. Client redirects to `/dashboard`

### Logout Flow:

1. User clicks logout in profile dropdown
2. Client clears localStorage (token, username, email)
3. Toast notification shown
4. Client redirects to `/login`

### Protected Routes:

- Dashboard checks for token in localStorage
- If no token → redirect to login
- If token exists → show dashboard content

## UI/UX Features

### Design Consistency:

- ✅ Matches BLOBDRIVE dashboard theme
- ✅ Primary color scheme throughout
- ✅ Consistent border-radius and shadows
- ✅ Animated background gradients
- ✅ Smooth transitions and hover effects
- ✅ Responsive design (mobile-friendly)

### User Feedback:

- ✅ Loading states with spinner animations
- ✅ Success toast notifications
- ✅ Error toast notifications
- ✅ Form validation messages
- ✅ Disabled states during loading

### Icons:

- ✅ Cloud icon for BLOBDRIVE branding
- ✅ ShieldCheck for security (register)
- ✅ User, Mail, Lock icons for form fields
- ✅ LogOut icon in dropdown

## File Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Smart redirect (home)
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── register/
│   │   └── page.tsx               # Registration page
│   └── dashboard/
│       └── page.tsx               # Protected dashboard
└── src/
    └── components/
        ├── dashboard-layout.tsx    # Layout with logout
        └── file-list.tsx          # File management
```

## Testing Checklist

- [ ] Register a new user
- [ ] Verify redirect to dashboard after registration
- [ ] Logout from dashboard
- [ ] Login with registered credentials
- [ ] Verify redirect to dashboard after login
- [ ] Test invalid credentials
- [ ] Test duplicate username/email
- [ ] Test password mismatch
- [ ] Test short password
- [ ] Verify token storage in localStorage
- [ ] Verify protected route redirects when not authenticated

## Environment Variables

Make sure your backend is running on:

```
http://localhost:5000
```

If using a different URL, update the API endpoints in:

- `/app/login/page.tsx`
- `/app/register/page.tsx`

## Next Steps

1. Start your backend server:

   ```bash
   cd backend
   dotnet run
   ```

2. Start your frontend server:

   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000` and you'll be redirected to login

4. Register a new account or login with existing credentials

5. You'll be automatically redirected to the dashboard!

## Security Notes

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Backend uses SHA256 password hashing (consider bcrypt for production)
- No password strength requirements enforced (add in production)
- No rate limiting on auth endpoints (add in production)
- CORS configuration may be needed for production
