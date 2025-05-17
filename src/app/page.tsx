
// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

  // This useEffect handles redirection for logged-in users.
  // It must be called unconditionally at the top of the component.
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      if (currentUserRole === 'Student') router.push('/student');
      else if (currentUserRole === 'Teacher') router.push('/teacher');
      else if (currentUserRole === 'Parent') router.push('/parent');
      // else if (currentUserRole === 'Admin') router.push('/admin-dashboard'); // Example for Admin
      // A default redirect if role is somehow not covered or if user.role is not yet populated
      // else router.push('/some-default-logged-in-page');
    }
  }, [isLoadingAuth, currentUser, currentUserRole, router]);


  // Animation trigger for welcome message, also called unconditionally
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      const timer = setTimeout(() => setIsWelcomeVisible(true), 100); 
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, currentUser]);


  if (isLoadingAuth) {
    return ( 
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/StepWise.png" alt="Learn-StepWise Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Your Experience...</p>
      </div>
    );
  }
  
  if (!currentUser && !isLoadingAuth) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://placehold.co/1920x1080.png?text=StepWise+Loading..."
          data-ai-hint="loading screen educational"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>
        
        <div className={`
            max-w-3xl p-6 sm:p-8 z-20 text-center
            transition-all duration-1000 ease-out
            ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            <h1
              className={`
                font-extrabold mb-6 text-primary-foreground
                text-4xl sm:text-5xl md:text-6xl 
                leading-tight 
                [text-shadow:_3px_3px_6px_rgb(0_0_0_/_0.7)]
                animate-pulse-subtle 
                transition-opacity duration-[1400ms] ease-out delay-300
                ${isWelcomeVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              Welcome to<br />Learn-StepWise!
            </h1>
            <p
              className={`
                text-base sm:text-xl text-gray-200 mb-8
                font-medium
                [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.6)]
                animate-pulse-subtle animation-delay-300 
                transition-opacity duration-[1400ms] ease-out delay-600
                ${isWelcomeVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              Your personalized learning journey starts here. Access your dashboard by logging in or signing up.
            </p>
        </div>
      </div>
    );
  }

  // Fallback for recognized roles or if redirection hasn't happened yet.
  // This indicates that the user is logged in, but redirection is pending or role is not yet determined.
  // This state should be brief.
  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/StepWise.png" alt="Learn-StepWise Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparing Your Dashboard...</p>
    </div>
  );
}
