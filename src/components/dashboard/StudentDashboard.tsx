
// src/components/dashboard/StudentDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import ClassSection from '@/components/dashboard/ClassSection';
import type { Class as ClassInterfaceFull, Subject as SubjectInterfaceFull, Book as BookInterface, Event as EventInterface } from '@/interfaces'; // Renamed for clarity
import { BookOpen, Calculator, FlaskConical, Globe, Library, CalendarDays, Loader2, AlertTriangle, FileText, Music, Palette, Brain, Users, Award, Lightbulb, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

// Helper to map subject names to icons
const subjectIconMap: Record<string, LucideIcon> = {
  default: BookOpen, math: Calculator, mathematics: Calculator, english: BookOpen,
  science: FlaskConical, history: Globe, geography: Globe, physics: Brain,
  chemistry: FlaskConical, biology: Users, art: Palette, music: Music,
};
const getIconForSubject = (subjectName: string): LucideIcon => {
  const nameLower = subjectName.toLowerCase();
  for (const key in subjectIconMap) {
    if (nameLower.includes(key)) { return subjectIconMap[key]; }
  }
  return subjectIconMap.default;
};

// Interface for the transformed ClassLevel data structure used by ClassSection
interface ClassLevelDisplay {
  level: number;
  title: string;
  subjects: SubjectDisplay[];
}
interface SubjectDisplay {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
    lessonsCount: number;
    href: string;
    is_locked?: boolean;
    bgColor?: string;
    textColor?: string;
}


// API response interfaces
interface ApiLesson { id: string | number; title: string; is_locked?: boolean; lesson_order?: number; }
interface ApiSubject {
  id: string | number; name: string; description: string;
  lessons: ApiLesson[]; class_obj_name?: string; class_obj: string | number;
}
interface ApiClass {
  id: string | number; name: string; description?: string;
  subjects: ApiSubject[]; school_name?: string; school: string | number;
}


export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [classData, setClassData] = useState<ClassLevelDisplay[]>([]);
  const [books, setBooks] = useState<BookInterface[]>([]);
  const [events, setEvents] = useState<EventInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setIsLoadingBooks(true);
      setIsLoadingEvents(true);
      setError(null);
      
      let classesUrl = '/classes/';
      // Example: If student is enrolled, fetch only their class or classes from their school
      // This logic needs to be refined based on how currentUser.student_profile is structured
      // and if enrolled_class or school ID is directly available and singular.
      if (currentUser?.student_profile?.enrolled_class) {
         // If a student is enrolled in ONE specific class, fetch that.
         // This might require the API to support fetching a single class with its subjects and lessons.
         // classesUrl = `/classes/${currentUser.student_profile.enrolled_class}/`; // Assuming API supports this
         // For now, let's assume if enrolled_class exists, it's an ID and we filter client-side or fetch specific class's school classes
         // Or if your API supports /classes/?id=X, use that.
         // A more robust approach would be to have an endpoint like /students/me/dashboard-data/
      } else if (currentUser?.student_profile?.school) {
        classesUrl = `/classes/?school=${currentUser.student_profile.school}`;
      }


      try {
        const [apiClasses, apiBooks, apiEvents] = await Promise.all([
          api.get<ApiClass[]>(classesUrl).finally(() => setIsLoading(false)),
          api.get<BookInterface[]>('/books/').finally(() => setIsLoadingBooks(false)),
          api.get<EventInterface[]>('/events/?ordering=date').finally(() => setIsLoadingEvents(false))
        ]);
        
        const transformedClassData: ClassLevelDisplay[] = apiClasses
        .filter(apiClass => {
            // If student is enrolled in a specific class, only show that class
            if (currentUser?.student_profile?.enrolled_class) {
                return String(apiClass.id) === String(currentUser.student_profile.enrolled_class);
            }
            // Otherwise, if enrolled in a school, show all classes from that school (already filtered by API if school_id was in URL)
            // Or if no specific enrollment, show all fetched (might be too broad depending on classesUrl)
            return true; 
        })
        .map(apiClass => {
          const levelMatch = apiClass.name.match(/\d+/);
          const level = levelMatch ? parseInt(levelMatch[0], 10) : 0; // Default to 0 if no number
          const subjects: SubjectDisplay[] = (apiClass.subjects || []).map((apiSub: ApiSubject) => ({
            id: String(apiSub.id), name: apiSub.name, icon: getIconForSubject(apiSub.name),
            description: apiSub.description, 
            lessonsCount: apiSub.lessons?.length || 0,
            href: `/student/learn/class/${apiClass.id}/subject/${apiSub.id}`,
            is_locked: apiSub.lessons?.some(l => l.is_locked), // Example: subject locked if any lesson is
            bgColor: "bg-primary", textColor: "text-primary-foreground",
          }));
          return { 
            level: level, 
            title: `${apiClass.name} ${apiClass.school_name ? '('+apiClass.school_name+')' : ''}`, 
            subjects: subjects 
          };
        });
        setClassData(transformedClassData);
        setBooks(apiBooks.slice(0, 3)); 
        setEvents(apiEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch student dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false); // Ensure loading is false on error
        setIsLoadingBooks(false);
        setIsLoadingEvents(false);
      }
    };
    if (currentUser) fetchDashboardData(); else {
      setIsLoading(false);
      setIsLoadingBooks(false);
      setIsLoadingEvents(false);
    }
  }, [currentUser]);

  if (isLoading && !error) { // Main content loading
    return (
      <div className="space-y-12 p-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        {[1, 2].map(i => (
          <section key={i} className="mb-12">
            <Skeleton className="h-10 w-1/3 mb-6 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-64 w-full rounded-xl" />)}
            </div>
          </section>
        ))}
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-48 w-full rounded-xl" /> 
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500 bg-red-50 p-6 rounded-lg shadow-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h2>
        <p className="mb-4">Error loading dashboard: {error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-gradient-to-r from-primary to-emerald-600 rounded-xl shadow-xl">
        <h1 className="text-4xl font-poppins font-extrabold mb-4 text-primary-foreground">Welcome, {currentUser?.username || 'Student'}!</h1>
        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
          Your personalized journey to academic excellence starts here. Explore subjects, track progress, and unlock your potential.
        </p>
      </section>

      {classData.length === 0 && !isLoading && (
         <Card className="text-center py-10 shadow-md rounded-lg">
            <CardHeader><CardTitle>No Classes Found</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You are not enrolled in any classes yet, or no classes are available. Please complete your profile or contact your school.</p>
            <Button asChild className="mt-4"><Link href="/profile">Complete Your Profile</Link></Button>
            </CardContent>
         </Card>
      )}

      {classData.map((classLevel) => (
        <ClassSection key={`${classLevel.level}-${classLevel.title}`} classLevelData={classLevel} />
      ))}
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Library className="mr-3 text-primary"/> Resource Library</CardTitle>
            <CardDescription>Explore additional books and materials.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBooks ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : books.length > 0 ? (
              <ul className="space-y-3">
                {books.map(book => (
                  <li key={book.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-xs text-muted-foreground"> {book.author && `By ${book.author} `} {book.subject_name && `(${book.subject_name})`}</p>
                    {book.file_url && <Button variant="link" size="sm" asChild className="p-0 h-auto"><a href={book.file_url} target="_blank" rel="noopener noreferrer">View Book</a></Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No books available in the library yet.</p>}
             <Button variant="outline" size="sm" className="w-full mt-4" asChild><Link href="/student/library">View Full Library</Link></Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-3 text-primary"/> Upcoming Events</CardTitle>
            <CardDescription>Stay informed about important dates.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
               <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : eventsError ? (
                 <p className="text-red-500 text-sm"><AlertTriangle className="inline mr-1 h-4 w-4" /> Error: {eventsError}</p>
            ) : events.length > 0 ? (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{event.title} <span className="text-xs font-normal text-muted-foreground">({event.type})</span></h4>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>}
            <Button variant="outline" size="sm" className="w-full mt-4" asChild><Link href="/student/calendar">View Full Calendar</Link></Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-16 p-8 bg-secondary rounded-xl shadow-lg">
        <h2 className="text-3xl font-poppins font-semibold text-secondary-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="bg-background hover:bg-muted h-20 text-base" asChild><Link href="/student/rewards"><Award className="mr-2"/>My Rewards</Link></Button>
          <Button variant="outline" className="bg-background hover:bg-muted h-20 text-base" asChild><Link href="/student/recommendations"><Lightbulb className="mr-2"/>AI Suggestions</Link></Button>
          <Button variant="outline" className="bg-background hover:bg-muted h-20 text-base" asChild><Link href="/student/view-my-report"><FileText className="mr-2"/>My Reports</Link></Button>
          <Button variant="outline" className="bg-background hover:bg-muted h-20 text-base" asChild><Link href="/forum"><MessageSquare className="mr-2"/>Community Forum</Link></Button>
        </div>
      </section>
    </div>
  );
}

