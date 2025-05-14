// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Added useState
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Button and Link removed as they are no longer used in this unauthenticated view
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// LogIn icon removed
// import { LogIn } from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false); // For animation

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
    // Show a generic landing/welcome page
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>
        
        {/* Welcome Card - Modified for transparency and animation */}
        <Card className={`
            max-w-xl p-6 sm:p-8 shadow-xl z-20 
            bg-transparent border-none 
            transition-all duration-1000 ease-out
            ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
          <CardHeader className="text-center">
            <CardTitle 
              className={`
                font-bold mb-3 text-primary-foreground 
                text-4xl sm:text-5xl md:text-6xl 
                tracking-tight
                [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.5)]
                transition-all duration-[1200ms] ease-out delay-200
                ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
            >
              Welcome to Learn-StepWise!
            </CardTitle>
            <CardDescription 
              className={`
                sm:text-lg text-primary-foreground/80 
                [text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.5)]
                transition-all duration-[1200ms] ease-out delay-500
                ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
            >
              Your personalized learning journey starts here. Please log in or sign up to access your dashboard and start learning.
            </CardDescription>
          </CardHeader>
          {/* CardContent with Login/Signup buttons removed as per request */}
        </Card>
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
