// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated and auth is not loading
  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      // Only redirect if not on login or signup page already to avoid redirect loops
      // This page is '/', so it's safe to redirect from here.
      // router.push('/login');
      // For now, let's keep the public view for student as a fallback
    }
  }, [isLoadingAuth, currentUser, router]);


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
    // Show a generic landing/welcome page or redirect to login
    // For now, let's show a public welcome and link to login/signup.
    // Or, if the desired behavior is to always show StudentDashboard for guests:
    // return <StudentDashboard />;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Card className="max-w-lg p-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold mb-4">Welcome to Learn-StepWise!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Your personalized learning journey starts here. Please log in or sign up to access your dashboard and start learning.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button asChild size="lg">
              <Link href="/login"><LogIn className="mr-2"/>Log In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  // User is authenticated, show role-based dashboard
  switch (currentUserRole) {
    case 'Student': // Match the roles from Django ('Student', 'Teacher', 'Parent')
      return <StudentDashboard />;
    case 'Teacher':
      return <TeacherDashboard />;
    case 'Parent':
      return <ParentDashboard />;
    default:
      // Fallback: could be an error page or redirect to login if role is unrecognized
      // For now, default to student dashboard or a generic welcome
      return (
        <div>
          <p>Welcome! Your role is currently not recognized or set. Displaying default student view.</p>
          <StudentDashboard />
        </div>
      );
  }
}
