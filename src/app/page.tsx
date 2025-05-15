// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Button and Link removed as they are no longer used in this unauthenticated view
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
// LogIn icon removed
// import { LogIn } from 'lucide-react';

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
          poster="/images/video-poster.jpg" // Add a poster image for when the video is loading
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"></div> {/* Slightly less opaque overlay */}
        
        <Card className={`
            // Welcome Card - Modified for transparency and animation
            max-w-2xl p-6 sm:p-8 shadow-2xl z-20 {/* Increased max-width and shadow */}
            bg-transparent border-none 
            transition-all duration-1000 ease-out
            ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
          <CardHeader className="text-center space-y-6"> {/* Increased vertical space */}
            <CardTitle
              className={`
                font-extrabold mb-4 text-white {/* Changed to white for better contrast */}
                text-5xl sm:text-6xl md:text-7xl {/* Larger text */}
                leading-tight {/* Removed tracking-tight to increase letter spacing to normal */}
                [text-shadow:_3px_3px_6px_rgb(0_0_0_/_0.7)] {/* Stronger text shadow */}
                transition-all duration-[1400ms] ease-out delay-300 {/* Adjusted animation */}
                ${isWelcomeVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'} {/* Added scale animation */}
              `}
            >
              Welcome to<br />Learn-StepWise!
            </CardTitle>
            <CardDescription
              className={`
                sm:text-xl text-gray-200 {/* Slightly larger and lighter text */}
                font-medium {/* Medium font weight */}
                [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.6)] {/* Adjusted text shadow */}
                transition-all duration-[1400ms] ease-out delay-600 {/* Adjusted animation */}
                ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
            >
              Your personalized learning journey starts here. Access your dashboard by logging in or signing up.
            </CardDescription>
            {/* Removed Login/Signup buttons from the card */}
          </CardHeader>
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
