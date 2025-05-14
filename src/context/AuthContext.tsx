// src/context/AuthContext.tsx
'use client';

import type { UserRole } from '@/interfaces';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  currentUserRole: UserRole;
  setCurrentUserRole: Dispatch<SetStateAction<UserRole>>;
  isLoadingRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('student');
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    // Simulate fetching role from an API or localStorage
    const storedRole = localStorage.getItem('currentUserRole') as UserRole | null;
    if (storedRole && ['student', 'teacher', 'parent'].includes(storedRole)) {
      setCurrentUserRole(storedRole);
    }
    setIsLoadingRole(false);
  }, []);

  useEffect(() => {
    if (!isLoadingRole) {
      localStorage.setItem('currentUserRole', currentUserRole);
    }
  }, [currentUserRole, isLoadingRole]);

  return (
    <AuthContext.Provider value={{ currentUserRole, setCurrentUserRole, isLoadingRole }}>
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
