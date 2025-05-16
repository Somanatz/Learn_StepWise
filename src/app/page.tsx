
// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation'; // Keep for potential future use, but not actively redirecting
import { useEffect, useState } from 'react';
import Link from 'next/link'; // For Login/Signup links on public page
import { Button } from '@/components/ui/button'; // For Login/Signup buttons
import { LogIn, UserPlus } from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter(); // Keep for potential future use
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

  // Animation trigger for welcome message
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      const timer = setTimeout(() => setIsWelcomeVisible(true), 100); // Short delay for effect
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, currentUser]);


  if (isLoadingAuth) {
    return ( // Consistent full-page skeleton
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 py-2">
            <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-36 rounded-md" /> {/* Logo placeholder */}
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-24 rounded-md" /> {/* Search placeholder */}
                    <Skeleton className="h-8 w-8 rounded-full" /> {/* User icon placeholder */}
                    <Skeleton className="h-8 w-8 rounded-full md:hidden" /> {/* Menu toggle placeholder */}
                </div>
            </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
        </main>
         <footer className="bg-secondary py-6 text-center">
             <Skeleton className="h-4 w-1/3 mx-auto" />
         </footer>
      </div>
    );
  }
  
  // If user is logged in, redirect to their role-specific main dashboard page
  // This simplifies the logic here and keeps student/teacher/parent specific routes clean
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
        if (currentUserRole === 'Student') router.push('/student');
        else if (currentUserRole === 'Teacher') router.push('/teacher');
        else if (currentUserRole === 'Parent') router.push('/parent');
        // else if (currentUserRole === 'Admin' etc.)
        // Default or unrecognized role might stay here or go to a generic dashboard
    }
  }, [isLoadingAuth, currentUser, currentUserRole, router]);


  // Show public welcome page if not logged in and not loading
  if (!currentUser && !isLoadingAuth) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://placehold.co/1920x1080.png?text=StepWise+Loading..."
          data-ai-hint="loading screen"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"></div>
        
        <div className={`
            max-w-3xl p-6 sm:p-8 z-20 text-center
            transition-all duration-1000 ease-out
            ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            <h1
              className={`
                font-extrabold mb-6 text-white
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
            {/* Login/Signup buttons are in the header */}
        </div>
      </div>
    );
  }

  // Fallback for unrecognized roles or if redirection hasn't happened yet
  // This part might not be reached if redirection logic is effective
  return (
     <div className="flex justify-center items-center h-screen">
        <p>Loading your dashboard...</p>
        <Loader2 className="h-8 w-8 animate-spin ml-2" />
    </div>
  );
}
