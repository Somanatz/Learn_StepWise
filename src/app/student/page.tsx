// src/app/student/page.tsx
'use client';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function StudentPortalPage() {
  const { currentUser, isLoadingAuth } = useAuth(); // Removed needsProfileCompletion as we'll use direct profile check
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    if (isLoadingAuth) {
      return; // Wait until auth status is known
    }

    if (!currentUser) {
      if (pathname !== '/login') router.push('/login'); // Not logged in
      return;
    }

    if (currentUser.role !== 'Student') {
      if (pathname !== '/') router.push('/'); // Wrong role for this dashboard
      return;
    }

    // At this point, currentUser exists and has the 'Student' role.
    // Check the specific student_profile's completion status.
    const isProfileActuallyIncomplete = !currentUser.student_profile || currentUser.student_profile.profile_completed === false;

    if (isProfileActuallyIncomplete) {
      const completeProfilePath = '/student/complete-profile';
      if (pathname !== completeProfilePath) {
        router.push(completeProfilePath);
      }
    }
    // If profile is complete, no redirect needed from here, page will render dashboard.
  }, [isLoadingAuth, currentUser, router, pathname]);

  // Loading state while auth is being checked or redirection is pending
  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Student Portal...</p>
      </div>
    );
  }

  // If current user is a student but their profile is incomplete, show loader
  // as the useEffect above should be redirecting them.
  if (currentUser.role === 'Student' && (!currentUser.student_profile || currentUser.student_profile.profile_completed === false)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking profile status...</p>
      </div>
    );
  }
  
  // If user is Student and profile is complete
  if (currentUser.role === 'Student' && currentUser.student_profile?.profile_completed === true) {
    return <StudentDashboard />;
  }

  // Fallback, should ideally not be reached if logic above is correct
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
    </div>
  );
}
