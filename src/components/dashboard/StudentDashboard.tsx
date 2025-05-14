// src/components/dashboard/StudentDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import ClassSection from '@/components/dashboard/ClassSection';
import type { ClassLevel as ClassLevelInterface, Subject as SubjectInterface } from '@/interfaces';
import { BookOpen, Calculator, FlaskConical, Globe, ScrollText, Brain, Palette, Music, Users, FileText, LucideIcon, History, Languages, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to map subject names to icons (extend as needed)
const subjectIconMap: Record<string, LucideIcon> = {
  default: BookOpen,
  math: Calculator,
  mathematics: Calculator,
  english: Languages, // Using Languages icon for English
  science: FlaskConical,
  history: Landmark, // Using Landmark for History
  geography: Globe,
  physics: Brain,
  chemistry: FlaskConical,
  biology: Users, // Users icon could represent study of life/people
  art: Palette,
  music: Music,
  // Add more mappings here
};

const getIconForSubject = (subjectName: string): LucideIcon => {
  const nameLower = subjectName.toLowerCase();
  for (const key in subjectIconMap) {
    if (nameLower.includes(key)) {
      return subjectIconMap[key];
    }
  }
  return subjectIconMap.default;
};

// Define the expected structure from the backend API
interface ApiSubject {
  id: string | number;
  name: string;
  description: string;
  lessons: { id: string | number; title: string }[]; // Assuming lessons have at least an id and title
  // Add other fields if your API returns them, like bgColor, textColor
}

interface ApiClass {
  id: string | number;
  name: string; // e.g., "Class 1", "Class 5", "Foundational Year"
  description?: string;
  subjects: ApiSubject[];
}


export default function StudentDashboard() {
  const [classData, setClassData] = useState<ClassLevelInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch classes
        const apiClasses: ApiClass[] = await api.get<ApiClass[]>('/classes/');
        
        const transformedClassData: ClassLevelInterface[] = await Promise.all(
          apiClasses.map(async (apiClass) => {
            // Extract level from class name if possible, e.g., "Class 5" -> 5
            // This is a simple parsing, might need adjustment based on actual class names
            const levelMatch = apiClass.name.match(/\d+/);
            const level = levelMatch ? parseInt(levelMatch[0], 10) : 1; // Default to 1 if no number found

            // Fetch subjects for each class
            // The API structure might be /subjects/?class_obj=<class_id>
            // Or if subjects are nested in class data, this fetch might not be needed or different.
            // For now, assuming subjects are directly in apiClass.subjects as per the interface.
            
            const subjects: SubjectInterface[] = apiClass.subjects.map((apiSub: ApiSubject) => ({
              id: String(apiSub.id),
              name: apiSub.name,
              icon: getIconForSubject(apiSub.name),
              description: apiSub.description,
              lessonsCount: apiSub.lessons?.length || 0, // Count lessons
              href: `/learn/class/${apiClass.id}/subject/${apiSub.id}`, // Example dynamic href
              // Assuming default bg/text colors or you can add logic to assign them
              bgColor: "bg-primary", // Placeholder
              textColor: "text-primary-foreground", // Placeholder
            }));

            return {
              level: level,
              title: apiClass.name, // Use the class name from API as title
              subjects: subjects,
            };
          })
        );
        setClassData(transformedClassData);
      } catch (err) {
        console.error("Failed to fetch student dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-12">
        <Skeleton className="h-40 w-full rounded-xl" />
        {[1, 2].map(i => (
          <section key={i} className="mb-12">
            <Skeleton className="h-10 w-1/3 mb-6 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-64 w-full rounded-xl" />)}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Error loading dashboard: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  if (classData.length === 0 && !isLoading) {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold mb-4">No Classes Assigned Yet</h1>
        <p className="text-muted-foreground">Please check back later or contact your teacher if you believe this is an error.</p>
      </div>
    );
  }


  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-gradient-to-r from-primary to-emerald-600 rounded-xl shadow-xl">
        <h1 className="text-4xl font-poppins font-extrabold mb-4 text-primary-foreground">Welcome Student to StepWise!</h1>
        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
          Your personalized journey to academic excellence starts here. Explore subjects, track progress, and unlock your potential.
        </p>
      </section>

      {classData.map((classLevel) => (
        <ClassSection key={classLevel.level + classLevel.title} classLevelData={classLevel} />
      ))}
      
      <section className="mt-12 p-6 bg-card rounded-xl shadow-lg">
        <h2 className="text-2xl font-poppins font-semibold text-foreground mb-4 flex items-center">
          <FileText className="mr-3 text-primary" />
          My Academic Reports
        </h2>
        <p className="text-muted-foreground mb-6">
          Access your latest report cards and academic summaries here.
        </p>
        <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
          <Link href="/student/view-my-report">View My Latest Report</Link>
        </Button>
      </section>

      <section className="mt-16 p-8 bg-secondary rounded-xl shadow-lg">
        <h2 className="text-3xl font-poppins font-semibold text-secondary-foreground mb-4">Stay Motivated!</h2>
        <p className="text-muted-foreground mb-6">
          Complete lessons, take quizzes, and earn badges to climb the leaderboard. Learning is an adventure!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Music size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Daily Streaks</h3>
            <p className="text-sm text-muted-foreground">Keep your learning streak alive for bonus rewards!</p>
          </div>
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Palette size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Unlock Badges</h3>
            <p className="text-sm text-muted-foreground">Show off your achievements with cool badges.</p>
          </div>
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Brain size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Challenge Friends</h3>
            <p className="text-sm text-muted-foreground">Compete in quizzes and learn together.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
