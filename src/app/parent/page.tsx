
// src/app/parent/page.tsx
'use client';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ParentPortalPage() {
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

    if (currentUser.role !== 'Parent') {
      if (pathname !== '/') router.push('/'); // Wrong role for this dashboard
      return;
    }

    // At this point, currentUser is loaded and has the 'Parent' role.
    // Check the specific parent_profile's completion status.
    // The profile object should exist if user signed up (empty profile created by backend UserSignupSerializer)
    // Its profile_completed flag should be false initially.
    const isProfileActuallyIncomplete = !currentUser.parent_profile || currentUser.parent_profile.profile_completed === false;

    if (isProfileActuallyIncomplete) {
      const completeProfilePath = '/parent/complete-profile';
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
        <p className="mt-4 text-muted-foreground">Loading Parent Portal...</p>
      </div>
    );
  }

  // If currentUser exists, but their role-specific profile indicates incomplete,
  // show loader while useEffect handles redirection.
  let isProfileStillMarkedIncomplete = false;
  if (currentUser.role === 'Parent') {
    isProfileStillMarkedIncomplete = !currentUser.parent_profile || currentUser.parent_profile.profile_completed === false;
  }

  if (isProfileStillMarkedIncomplete && currentUser.role === 'Parent') {
    // The useEffect above should be redirecting. Show a loader in the meantime.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking profile status...</p>
      </div>
    );
  }
  
  // If all checks pass (correct role, profile is complete), render the dashboard
  if (currentUser.role === 'Parent' && currentUser.parent_profile?.profile_completed === true) {
     return <ParentDashboard />;
  }

  // Fallback, should ideally not be reached if logic above is correct
  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
  );
}
