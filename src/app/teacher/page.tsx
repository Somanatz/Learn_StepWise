
// src/app/teacher/page.tsx
'use client';
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoadingAuth) {
      return; // Wait until auth status is known
    }

    if (!currentUser) {
      if (pathname !== '/login') router.push('/login'); // Not logged in
      return;
    }

    if (currentUser.role !== 'Teacher') {
      if (pathname !== '/') router.push('/'); // Wrong role for this dashboard
      return;
    }

    // At this point, currentUser is loaded and has the 'Teacher' role.
    // Check the specific teacher_profile's completion status.
    // The profile object should exist if user signed up (empty profile created by backend UserSignupSerializer)
    // Its profile_completed flag should be false initially.
    const isProfileActuallyIncomplete = !currentUser.teacher_profile || currentUser.teacher_profile.profile_completed === false;

    if (isProfileActuallyIncomplete) {
      const completeProfilePath = '/teacher/complete-profile';
      if (pathname !== completeProfilePath) {
        router.push(completeProfilePath);
      }
    }
    // If isProfileActuallyIncomplete is false, then the profile is considered complete, and no redirect happens.
    // The page will proceed to render the dashboard content.

  }, [isLoadingAuth, currentUser, router, pathname]);

  // Guard at the top of the component function
  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Teacher Portal...</p>
      </div>
    );
  }

  // If currentUser exists, but their role-specific profile indicates incomplete,
  // show loader while useEffect handles redirection.
  let isProfileStillMarkedIncomplete = false;
  if (currentUser.role === 'Teacher') {
    isProfileStillMarkedIncomplete = !currentUser.teacher_profile || currentUser.teacher_profile.profile_completed === false;
  }

  if (isProfileStillMarkedIncomplete && currentUser.role === 'Teacher') {
    // The useEffect above should be redirecting. Show a loader in the meantime.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking profile status...</p>
      </div>
    );
  }
  
  // If all checks pass (correct role, profile is complete), render the dashboard
  if (currentUser.role === 'Teacher' && currentUser.teacher_profile?.profile_completed === true) {
    return <TeacherDashboard />;
  }

  // Fallback, should ideally not be reached if logic above is correct
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
    </div>
  );
}
