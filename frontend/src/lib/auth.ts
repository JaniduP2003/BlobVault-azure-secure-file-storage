// Auth utility functions

const API_BASE_URL = "http://localhost:8081";

/**
 * Check if user is authenticated and token is valid
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return false;
  }

  try {
    // Try to fetch user's files to validate token
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // If token is valid, we'll get a 200 response
    if (response.ok) {
      return true;
    }

    // If 401, token is invalid or expired
    if (response.status === 401) {
      clearAuth();
      return false;
    }

    // Other errors - assume token might be valid but server issue
    return true;
  } catch (error) {
    // Network error - can't validate, assume token is ok
    console.error("Cannot validate token:", error);
    return true;
  }
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
}

/**
 * Get stored token
 */
export function getToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Get user info
 */
export function getUserInfo() {
  return {
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    token: localStorage.getItem("token"),
  };
}

/**
 * Check if token exists (doesn't validate it)
 */
export function hasToken(): boolean {
  return !!localStorage.getItem("token");
}
