// src/context/AuthContext.tsx
'use client';

import type { UserRole } from '@/interfaces';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser, logoutUser as apiLogout } from '@/lib/api'; // Import your API functions

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  // Add other user properties you might want to store
}

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  currentUserRole: UserRole | null; // Can be null if not logged in or role unknown
  setCurrentUserRole: Dispatch<SetStateAction<UserRole | null>>; // Allow setting to null
  isLoadingAuth: boolean; // Renamed from isLoadingRole for clarity
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await fetchCurrentUser(); // Fetches from /api/users/me/
          if (userData) {
            setCurrentUser(userData as User); // Cast if UserData is slightly different from User
            setCurrentUserRole(userData.role);
            localStorage.setItem('currentUserRole', userData.role); // Keep localStorage in sync
          } else {
            // Token might be invalid or expired
            apiLogout(); // Clears localStorage token
            setCurrentUser(null);
            setCurrentUserRole(null);
          }
        } catch (error) {
          console.error("Initialization auth error:", error);
          apiLogout();
          setCurrentUser(null);
          setCurrentUserRole(null);
        }
      } else {
         // No token, attempt to load role from localStorage for non-logged-in state (e.g. theme preference)
        const storedRole = localStorage.getItem('currentUserRole') as UserRole | null;
        if (storedRole) {
            setCurrentUserRole(storedRole);
        } else {
            setCurrentUserRole('student'); // Default if nothing stored
            localStorage.setItem('currentUserRole', 'student');
        }
      }
      setIsLoadingAuth(false);
    };
    initializeAuth();
  }, []);

  // Persist role changes to localStorage if user is not logged in (simulating role switch)
  // If user is logged in, role is derived from currentUser
  useEffect(() => {
    if (!currentUser && currentUserRole) {
      localStorage.setItem('currentUserRole', currentUserRole);
    }
  }, [currentUserRole, currentUser]);


  const login = async (token: string) => {
    setIsLoadingAuth(true);
    localStorage.setItem('authToken', token);
    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData as User);
        setCurrentUserRole(userData.role);
        localStorage.setItem('currentUserRole', userData.role);
      } else {
        // Should not happen if token is valid
        throw new Error("Failed to fetch user data after login.");
      }
    } catch (error) {
        console.error("Login error:", error);
        apiLogout(); // Clear token if user fetch fails
        setCurrentUser(null);
        setCurrentUserRole(null);
    } finally {
        setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setIsLoadingAuth(true);
    apiLogout();
    setCurrentUser(null);
    setCurrentUserRole('student'); // Reset to default or last known non-auth role preference
    localStorage.setItem('currentUserRole', 'student'); // Persist default for next non-auth visit
    setIsLoadingAuth(false);
    // Potentially redirect to login page via router if needed
  };


  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      currentUserRole: currentUser ? currentUser.role : currentUserRole, // Prioritize logged-in user's role
      setCurrentUserRole, 
      isLoadingAuth,
      login,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
