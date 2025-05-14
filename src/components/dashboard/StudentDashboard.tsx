// src/components/dashboard/StudentDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import ClassSection from '@/components/dashboard/ClassSection';
import type { ClassLevel as ClassLevelInterface, Subject as SubjectInterface } from '@/interfaces';
import { BookOpen, Calculator, FlaskConical, Globe, ScrollText, Brain, Palette, Music, Users, FileText, LucideIcon, History, Languages, Landmark, Library, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/content/models'; // Assuming Book interface can be imported or defined
import type { Event } from '@/notifications/models'; // Assuming Event interface

// Helper to map subject names to icons (extend as needed)
const subjectIconMap: Record<string, LucideIcon> = {
  default: BookOpen, math: Calculator, mathematics: Calculator, english: Languages,
  science: FlaskConical, history: Landmark, geography: Globe, physics: Brain,
  chemistry: FlaskConical, biology: Users, art: Palette, music: Music,
};

const getIconForSubject = (subjectName: string): LucideIcon => {
  const nameLower = subjectName.toLowerCase();
  for (const key in subjectIconMap) {
    if (nameLower.includes(key)) { return subjectIconMap[key]; }
  }
  return subjectIconMap.default;
};

interface ApiLesson { id: string | number; title: string; is_locked?: boolean; }
interface ApiSubject {
  id: string | number; name: string; description: string;
  lessons: ApiLesson[];
}
interface ApiClass {
  id: string | number; name: string; description?: string;
  subjects: ApiSubject[];
}
interface ApiBook {
  id: string | number; title: string; author?: string; file_url?: string;
  subject_name?: string; class_name?: string;
}
interface ApiEvent {
  id: string | number; title: string; date: string; type: string; description?: string;
}

export default function StudentDashboard() {
  const [classData, setClassData] = useState<ClassLevelInterface[]>([]);
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [apiClasses, apiBooks, apiEvents] = await Promise.all([
          api.get<ApiClass[]>('/classes/'),
          api.get<ApiBook[]>('/books/'), // Fetch books
          api.get<ApiEvent[]>('/events/?ordering=date') // Fetch events, ordered by date
        ]);
        
        const transformedClassData: ClassLevelInterface[] = apiClasses.map(apiClass => {
          const levelMatch = apiClass.name.match(/\d+/);
          const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
          const subjects: SubjectInterface[] = apiClass.subjects.map((apiSub: ApiSubject) => ({
            id: String(apiSub.id), name: apiSub.name, icon: getIconForSubject(apiSub.name),
            description: apiSub.description, lessonsCount: apiSub.lessons?.length || 0,
            href: `/learn/class/${apiClass.id}/subject/${apiSub.id}`,
            is_locked: apiSub.lessons?.some(l => l.is_locked), // Example: subject locked if any lesson is
            bgColor: "bg-primary", textColor: "text-primary-foreground",
          }));
          return { level: level, title: apiClass.name, subjects: subjects };
        });
        setClassData(transformedClassData);
        setBooks(apiBooks.slice(0, 5)); // Display first 5 books for brevity
        setEvents(apiEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 5)); // Display first 5 upcoming events
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
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
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
        <h1 className="text-4xl font-poppins font-extrabold mb-4 text-primary-foreground">Welcome Student to StepWise!</h1>
        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
          Your personalized journey to academic excellence starts here. Explore subjects, track progress, and unlock your potential.
        </p>
      </section>

      {classData.length === 0 && !isLoading && (
         <Card className="text-center py-10 shadow-md rounded-lg">
            <CardHeader>
                <CardTitle>No Classes Assigned Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Please check back later or contact your teacher if you believe this is an error.</p>
            </CardContent>
         </Card>
      )}

      {classData.map((classLevel) => (
        <ClassSection key={classLevel.level + classLevel.title} classLevelData={classLevel} />
      ))}
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Library className="mr-3 text-primary"/> Course Library</CardTitle>
            <CardDescription>Explore additional books and resources.</CardDescription>
          </CardHeader>
          <CardContent>
            {books.length > 0 ? (
              <ul className="space-y-3">
                {books.map(book => (
                  <li key={book.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {book.author && `By ${book.author} `} 
                      {book.subject_name && `(${book.subject_name})`}
                    </p>
                    {book.file_url && <Button variant="link" size="sm" asChild className="p-0 h-auto"><a href={book.file_url} target="_blank" rel="noopener noreferrer">View Book</a></Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No books available in the library yet.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-3 text-primary"/> Upcoming Events</CardTitle>
            <CardDescription>Stay informed about important dates and activities.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <ul className="space-y-3">
                {events.map(event => (
                  <li key={event.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <h4 className="font-semibold">{event.title} <span className="text-xs font-normal text-muted-foreground">({event.type})</span></h4>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {event.description && <p className="text-xs text-muted-foreground mt-1 truncate">{event.description}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>}
          </CardContent>
        </Card>
      </div>

      <section className="mt-12 p-6 bg-card rounded-xl shadow-lg">
        <h2 className="text-2xl font-poppins font-semibold text-foreground mb-4 flex items-center">
          <FileText className="mr-3 text-primary" /> My Academic Reports
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
          <Link href="/rewards" legacyBehavior passHref>
            <a className="block p-6 bg-background rounded-lg shadow-md text-center hover:shadow-xl transition-shadow">
                <Music size={48} className="mx-auto text-accent mb-3" />
                <h3 className="font-poppins font-semibold text-xl mb-1">Daily Streaks</h3>
                <p className="text-sm text-muted-foreground">Keep your learning streak alive for bonus rewards!</p>
            </a>
          </Link>
           <Link href="/rewards" legacyBehavior passHref>
            <a className="block p-6 bg-background rounded-lg shadow-md text-center hover:shadow-xl transition-shadow">
                <Palette size={48} className="mx-auto text-accent mb-3" />
                <h3 className="font-poppins font-semibold text-xl mb-1">Unlock Badges</h3>
                <p className="text-sm text-muted-foreground">Show off your achievements with cool badges.</p>
            </a>
          </Link>
           <Link href="/forum" legacyBehavior passHref>
            <a className="block p-6 bg-background rounded-lg shadow-md text-center hover:shadow-xl transition-shadow">
                <Brain size={48} className="mx-auto text-accent mb-3" />
                <h3 className="font-poppins font-semibold text-xl mb-1">Join Discussions</h3>
                <p className="text-sm text-muted-foreground">Ask questions and learn together in the forum.</p>
            </a>
          </Link>
        </div>
      </section>
    </div>
  );
}
