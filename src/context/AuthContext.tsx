
// src/context/AuthContext.tsx
'use client';

import type { UserRole, StudentProfileData, TeacherProfileData, ParentProfileData, User } from '@/interfaces';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser, logoutUser as apiLogout } from '@/lib/api';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  isLoadingAuth: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  needsProfileCompletion: boolean;
  setNeedsProfileCompletion: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      setNeedsProfileCompletion(false);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await fetchCurrentUser();
          if (userData) {
            let profileCompleted = true;
            if (userData.role === 'Student' && userData.student_profile) {
              profileCompleted = userData.student_profile.profile_completed ?? false;
            } else if (userData.role === 'Teacher' && userData.teacher_profile) {
              profileCompleted = userData.teacher_profile.profile_completed ?? false;
            } else if (userData.role === 'Parent' && userData.parent_profile) {
              profileCompleted = userData.parent_profile.profile_completed ?? false;
            }
            // For Admin users, profile_completed can be considered true if not explicitly tracked
            else if (userData.role === 'Admin') {
              profileCompleted = true; 
            }
            
            setCurrentUser({ ...userData, profile_completed: profileCompleted });
            setNeedsProfileCompletion(!profileCompleted);
          } else {
            apiLogout();
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Initialization auth error:", error);
          apiLogout();
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false);
    };
    initializeAuth();
  }, []);


  const login = async (token: string) => {
    setIsLoadingAuth(true);
    setNeedsProfileCompletion(false);
    localStorage.setItem('authToken', token);
    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        let profileCompleted = true;
        if (userData.role === 'Student' && userData.student_profile) {
          profileCompleted = userData.student_profile.profile_completed ?? false;
        } else if (userData.role === 'Teacher' && userData.teacher_profile) {
          profileCompleted = userData.teacher_profile.profile_completed ?? false;
        } else if (userData.role === 'Parent' && userData.parent_profile) {
          profileCompleted = userData.parent_profile.profile_completed ?? false;
        } 
        // For Admin users, profile_completed can be considered true
        else if (userData.role === 'Admin') {
            profileCompleted = true;
        }

        setCurrentUser({ ...userData, profile_completed: profileCompleted });
        setNeedsProfileCompletion(!profileCompleted);
      } else {
        throw new Error("Failed to fetch user data after login.");
      }
    } catch (error) {
        console.error("Login error:", error);
        apiLogout(); 
        setCurrentUser(null);
        // Re-throw or handle error appropriately for login page
        throw error; 
    } finally {
        setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    apiLogout(); // Clears localStorage token
    setCurrentUser(null);
    setNeedsProfileCompletion(false);
    // Force a hard redirect to login to ensure clean state
    window.location.href = '/login'; 
  };


  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      isLoadingAuth,
      login,
      logout,
      needsProfileCompletion,
      setNeedsProfileCompletion
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
