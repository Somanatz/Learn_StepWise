
// src/lib/api.ts
import type { UserRole } from '@/interfaces';

let API_BASE_URL_ENV = process.env.NEXT_PUBLIC_API_URL;
let API_BASE_URL: string;
let API_ENDPOINT_BASE: string;

if (!API_BASE_URL_ENV) {
  console.warn(
    "WARNING: NEXT_PUBLIC_API_URL environment variable is not set. " +
    "Defaulting to http://127.0.0.1:8000. " +
    "Ensure your Django backend is running there, or set the variable in a .env.local file."
  );
  API_BASE_URL = 'http://127.0.0.1:8000';
} else {
  API_BASE_URL = API_BASE_URL_ENV;
}
API_ENDPOINT_BASE = `${API_BASE_URL}/api`;


interface ApiError {
  message: string;
  details?: Record<string, any>;
}

// User interface should match backend CustomUserSerializer including profiles
interface UserData {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_school_admin?: boolean;
  administered_school?: { id: number; name: string; school_id_code: string } | null;
  student_profile?: any | null; // Replace 'any' with actual StudentProfileData
  teacher_profile?: any | null; // Replace 'any' with actual TeacherProfileData
  parent_profile?: any | null; // Replace 'any' with actual ParentProfileData
  profile_completed?: boolean;
}


async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  isFormData: boolean = false,
  useApiPrefix: boolean = true, // Default to true
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
  
  const baseUrlToUse = useApiPrefix ? API_ENDPOINT_BASE : API_BASE_URL;
  const fullUrl = `${baseUrlToUse}${endpoint}`;
  console.log(`Attempting to fetch: ${method} ${fullUrl}`);


  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorData;
      let errorMessage = `HTTP error ${response.status}`;
      try {
        errorData = await response.json();
        if (errorData?.detail) {
            errorMessage = errorData.detail;
        } else if (typeof errorData === 'object' && errorData !== null) {
            const fieldErrors = Object.entries(errorData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
                .join('; ');
            if (fieldErrors) errorMessage = fieldErrors;
        }
      } catch (e) {
        errorMessage = response.statusText || `HTTP error ${response.status} (non-JSON response)`;
      }
      console.error(`API Error (${response.status}) on ${method} ${fullUrl}:`, errorMessage, errorData || '(No JSON error data)');
      throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return undefined as T; 
    }

    const responseData = await response.json();
    if (method === 'GET' && responseData && typeof responseData === 'object' && 'results' in responseData && Array.isArray(responseData.results)) {
        return responseData.results as T; 
    }
    return responseData as T;
  } catch (error) {
    console.error(`Network or other error on ${method} ${fullUrl}:`, error);
    throw error; 
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'POST', body, isFormData),
  put: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'PUT', body, isFormData),
  patch: <T>(endpoint: string, body: any, isFormData: boolean = false) => request<T>(endpoint, 'PATCH', body, isFormData),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};

export const loginUser = async (credentials: any) => {
  // Changed the last argument (useApiPrefix) from false to true
  const response = await request<{ token: string }>('/token-auth/', 'POST', credentials, false, true); 
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  return response;
};

export const signupUser = async (userData: FormData) => { // Expect FormData now
  return request<UserData>('/signup/', 'POST', userData, true);
};

export const fetchCurrentUser = async (): Promise<UserData | null> => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const userData = await request<UserData>('/users/me/', 'GET', undefined, false, true);
    return userData;
  } catch (error) {
    console.error("Error fetching current user, possibly invalid token:", error);
    localStorage.removeItem('authToken'); 
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
};
