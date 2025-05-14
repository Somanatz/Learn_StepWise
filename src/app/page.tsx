// src/app/page.tsx
'use client';

import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function UnifiedDashboardPage() {
  const { currentUserRole, isLoadingRole } = useAuth();

  if (isLoadingRole) {
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

  switch (currentUserRole) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      // This renders the TeacherDashboard directly within the main layout for the `/` page.
      // The `/teacher` route provides the dashboard within the specific teacher layout.
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      // Fallback or a generic welcome page if role is unknown
      return <StudentDashboard />; 
  }
}
