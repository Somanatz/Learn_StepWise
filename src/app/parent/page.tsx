
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
    if (!isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'Parent') {
        router.push('/login');
      } else if (needsProfileCompletion && 
                 (!currentUser.parent_profile || currentUser.parent_profile.profile_completed === false)) {
        // Only redirect to complete-profile if needsProfileCompletion is true AND
        // the actual parent_profile.profile_completed flag is false.
        // This helps prevent redirect loops if context updates are slightly delayed.
        router.push('/parent/complete-profile');
      }
    }
  }, [isLoadingAuth, currentUser, needsProfileCompletion, router]);

  if (isLoadingAuth || 
      (!currentUser && !needsProfileCompletion) || 
      (currentUser && currentUser.role === 'Parent' && needsProfileCompletion && (!currentUser.parent_profile || currentUser.parent_profile.profile_completed === false))
     ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Parent Dashboard...</p>
      </div>
    );
  }

  if (currentUser && currentUser.role === 'Parent' && 
      (!needsProfileCompletion || (currentUser.parent_profile && currentUser.parent_profile.profile_completed === true))) {
    return <ParentDashboard />;
  }

  return null;
}
