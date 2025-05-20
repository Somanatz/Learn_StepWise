
// src/app/student/page.tsx
'use client';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function StudentPortalPage() {
  const { currentUser, isLoadingAuth, needsProfileCompletion } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'Student') {
        router.push('/login'); // Or a generic access denied page
      } else if (needsProfileCompletion) {
        router.push('/student/complete-profile');
      }
    }
  }, [isLoadingAuth, currentUser, needsProfileCompletion, router]);

  if (isLoadingAuth || (!currentUser && !needsProfileCompletion) || (currentUser && currentUser.role === 'Student' && needsProfileCompletion) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Student Dashboard...</p>
      </div>
    );
  }
  
  if (currentUser && currentUser.role === 'Student' && !needsProfileCompletion) {
    return <StudentDashboard />;
  }

  // Fallback or if conditions are not met (e.g. role mismatch but somehow landed here)
  return null; 
}
