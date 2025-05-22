
// src/app/parent/page.tsx
'use client';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ParentPortalPage() {
  const { currentUser, isLoadingAuth, needsProfileCompletion } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("Parent Dashboard - Auth Check:", { isLoadingAuth, currentUser, needsProfileCompletion }); // DEBUG
    if (!isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'Parent') {
        router.push('/login');
      } else if (currentUser.parent_profile?.profile_completed === false) {
        // Primary check: if the profile model itself says it's not complete via the currentUser object
        console.log("Parent Dashboard: Redirecting to complete-profile because parent_profile.profile_completed is false."); // DEBUG
        router.push('/parent/complete-profile');
      } else if (needsProfileCompletion && !currentUser.parent_profile) {
         // Secondary check: if needsProfileCompletion is true (from context) and there's no parent_profile object at all (e.g., just signed up)
        console.log("Parent Dashboard: Redirecting to complete-profile because needsProfileCompletion is true and no parent_profile exists."); // DEBUG
        router.push('/parent/complete-profile');
      }
      // If currentUser.parent_profile.profile_completed is true, or if !needsProfileCompletion (and profile object exists), stay here.
    }
  }, [isLoadingAuth, currentUser, needsProfileCompletion, router]);

  if (isLoadingAuth || 
      (!currentUser && !needsProfileCompletion) || // Standard loading or not logged in
      (currentUser && currentUser.role === 'Parent' && currentUser.parent_profile?.profile_completed === false) || // Waiting for redirect if profile explicitly incomplete
      (currentUser && currentUser.role === 'Parent' && needsProfileCompletion && !currentUser.parent_profile) // Also waiting if context says completion needed and profile doesn't exist yet
     ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Parent Dashboard...</p>
      </div>
    );
  }

  // Render dashboard if user is a Parent and their profile is considered complete
  if (currentUser && currentUser.role === 'Parent' && 
      (currentUser.parent_profile?.profile_completed === true || (!needsProfileCompletion && currentUser.parent_profile))
     ) {
    return <ParentDashboard />;
  }

  // Fallback if somehow still here, could be a brief moment before redirect or unexpected state
  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying profile status...</p>
      </div>
  );
}
