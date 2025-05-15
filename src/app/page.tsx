// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Card, CardHeader, CardTitle, CardDescription are removed as per request

export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      // Only redirect if not on login or signup page already to avoid redirect loops
      // This page is '/', so it's safe to redirect from here.
      // router.push('/login');
      // For now, let's keep the public view for student as a fallback
    }
  }, [isLoadingAuth, currentUser, router]);

  // Animation trigger for welcome message
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      const timer = setTimeout(() => setIsWelcomeVisible(true), 100); // Short delay for effect
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, currentUser]);


  if (isLoadingAuth) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!currentUser) {
    // Show a public landing page with video background
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://placehold.co/1920x1080.png?text=StepWise+Loading..." // Added poster
          data-ai-hint="loading screen"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"></div> {/* Slightly less opaque overlay */}
        
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
                sm:text-xl text-gray-200
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

  // User is authenticated, show role-based dashboard
  switch (currentUserRole) {
    case 'Student':
      return <StudentDashboard />;
    case 'Teacher':
      return <TeacherDashboard />;
    case 'Parent':
      return <ParentDashboard />;
    default:
      return (
        <div>
          <p>Welcome! Your role is currently not recognized or set. Displaying default student view.</p>
          <StudentDashboard />
        </div>
      );
  }
}
