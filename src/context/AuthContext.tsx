
// src/context/AuthContext.tsx
'use client';

import type { UserRole, StudentProfileData, TeacherProfileData, ParentProfileData } from '@/interfaces';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser, logoutUser as apiLogout } from '@/lib/api'; 

// Extended User interface to include profile completion status
interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_school_admin?: boolean;
  administered_school?: { id: number; name: string; school_id_code: string; } | null;
  student_profile?: StudentProfileData & { profile_completed?: boolean } | null;
  teacher_profile?: TeacherProfileData & { profile_completed?: boolean } | null;
  parent_profile?: ParentProfileData & { profile_completed?: boolean } | null;
  // A derived or directly fetched flag indicating if the role-specific profile is complete
  // This will be determined after fetching the user.
  profile_completed?: boolean; 
}

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  currentUserRole: UserRole | null; 
  isLoadingAuth: boolean; 
  login: (token: string) => Promise<void>;
  logout: () => void;
  needsProfileCompletion: boolean; // New state to signal redirection
  setNeedsProfileCompletion: Dispatch<SetStateAction<boolean>>; // To update after profile completion
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // This derived state is for convenience, actual role comes from currentUser
  const currentUserRole = currentUser?.role || null; 

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      setNeedsProfileCompletion(false); // Reset on init
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await fetchCurrentUser(); 
          if (userData) {
            let profileCompleted = true; // Assume true unless a profile exists and says otherwise
            if (userData.role === 'Student' && userData.student_profile) {
              profileCompleted = userData.student_profile.profile_completed ?? false;
            } else if (userData.role === 'Teacher' && userData.teacher_profile) {
              profileCompleted = userData.teacher_profile.profile_completed ?? false;
            } else if (userData.role === 'Parent' && userData.parent_profile) {
              profileCompleted = userData.parent_profile.profile_completed ?? false;
            }
            
            setCurrentUser({ ...userData, profile_completed: profileCompleted } as User);
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
    setNeedsProfileCompletion(false); // Reset on login
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
        setCurrentUser({ ...userData, profile_completed: profileCompleted } as User);
        setNeedsProfileCompletion(!profileCompleted);
      } else {
        throw new Error("Failed to fetch user data after login.");
      }
    } catch (error) {
        console.error("Login error:", error);
        apiLogout(); 
        setCurrentUser(null);
    } finally {
        setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setIsLoadingAuth(true);
    apiLogout();
    setCurrentUser(null);
    setNeedsProfileCompletion(false); 
    setIsLoadingAuth(false);
  };


  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      currentUserRole, 
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
