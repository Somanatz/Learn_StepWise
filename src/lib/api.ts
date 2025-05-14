// src/lib/api.ts
import type { UserRole } from '@/interfaces';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface ApiError {
  message: string;
  details?: Record<string, any>;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  // Add other fields your /api/users/me/ endpoint returns
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  isFormData: boolean = false,
): Promise<T> {
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use status text
        errorData = { message: response.statusText };
      }
      const errorMessage = errorData?.detail || errorData?.message || `HTTP error ${response.status}`;
      console.error(`API Error (${response.status}) on ${method} ${endpoint}:`, errorMessage, errorData);
      throw new Error(errorMessage);
    }
    
    // Handle cases where response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
        return undefined as T; // Or handle as needed, e.g., return a specific success object
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Network or other error on ${method} ${endpoint}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'POST', body, isFormData),
  put: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'PUT', body, isFormData),
  patch: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'PATCH', body, isFormData),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};

// Specific auth functions
export const loginUser = async (credentials: any) => {
  // Django's obtain_auth_token expects 'username' and 'password'
  const response = await api.post<{ token: string }>('/token-auth/', credentials); // Ensure this matches your Django URL for token auth
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  return response;
};

export const signupUser = async (userData: any) => {
  return api.post<UserData>('/signup/', userData);
};

export const fetchCurrentUser = async (): Promise<UserData | null> => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    return await api.get<UserData>('/users/me/');
  } catch (error) {
    console.error("Error fetching current user, possibly invalid token:", error);
    localStorage.removeItem('authToken'); // Clear invalid token
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUserRole'); // Also clear role if stored separately
  // Optionally: call a backend logout endpoint if it exists (to invalidate token server-side)
  // await api.post('/logout/', {});
};
