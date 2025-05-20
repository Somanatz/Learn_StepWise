
// src/app/teacher/page.tsx
'use client';
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { currentUser, isLoadingAuth, needsProfileCompletion } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'Teacher') {
        router.push('/login');
      } else if (needsProfileCompletion) {
        router.push('/teacher/complete-profile');
      }
    }
  }, [isLoadingAuth, currentUser, needsProfileCompletion, router]);

  if (isLoadingAuth || (!currentUser && !needsProfileCompletion) || (currentUser && currentUser.role === 'Teacher' && needsProfileCompletion)) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Teacher Dashboard...</p>
      </div>
    );
  }

  if (currentUser && currentUser.role === 'Teacher' && !needsProfileCompletion) {
    return <TeacherDashboard />;
  }
  
  return null;
}
