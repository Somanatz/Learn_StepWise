
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
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [booksError, setBooksError] = useState<string | null>(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setIsLoadingBooks(true);
      setIsLoadingEvents(true);
      setError(null);
      setEventsError(null);
      setBooksError(null);
      
      let classesUrl = '/classes/';
      if (currentUser?.student_profile?.enrolled_class) {
        if (currentUser.student_profile.school) {
          classesUrl = `/classes/?school=${currentUser.student_profile.school}`;
        }
      } else if (currentUser?.student_profile?.school) {
        classesUrl = `/classes/?school=${currentUser.student_profile.school}`;
      }


      try {
        // Fetch classes
        const classResponse = await api.get<ApiClass[] | { results: ApiClass[] }>(classesUrl);
        
        let actualApiClasses: ApiClass[];
        if (Array.isArray(classResponse)) {
          actualApiClasses = classResponse;
        } else if (classResponse && Array.isArray(classResponse.results)) {
          actualApiClasses = classResponse.results;
        } else {
          console.error("Unexpected class data format:", classResponse);
          actualApiClasses = []; 
        }

        const transformedClassData: ClassLevelDisplay[] = actualApiClasses
        .filter(apiClass => {
            if (currentUser?.student_profile?.enrolled_class) {
                return String(apiClass.id) === String(currentUser.student_profile.enrolled_class);
            }
            return true; 
        })
        .map(apiClass => {
          const levelMatch = apiClass.name.match(/\d+/);
          const level = levelMatch ? parseInt(levelMatch[0], 10) : 0; 
          const subjects: SubjectDisplay[] = (apiClass.subjects || []).map((apiSub: ApiSubject) => ({
            id: String(apiSub.id), name: apiSub.name, icon: getIconForSubject(apiSub.name),
            description: apiSub.description, 
            lessonsCount: apiSub.lessons?.length || 0,
            href: `/student/learn/class/${apiClass.id}/subject/${apiSub.id}`,
            is_locked: apiSub.lessons?.some(l => l.is_locked), 
            bgColor: "bg-primary", textColor: "text-primary-foreground",
          }));
          return { 
            level: level, 
            title: `${apiClass.name} ${apiClass.school_name ? '('+apiClass.school_name+')' : ''}`, 
            subjects: subjects 
          };
        });
        setClassData(transformedClassData);
        setIsLoading(false);

        // Fetch books
        try {
            const bookResponse = await api.get<BookInterface[] | { results: BookInterface[] }>('/books/');
            let actualApiBooks: BookInterface[];
            if (Array.isArray(bookResponse)) {
              actualApiBooks = bookResponse;
            } else if (bookResponse && Array.isArray(bookResponse.results)) {
              actualApiBooks = bookResponse.results;
            } else {
              console.error("Unexpected book data format:", bookResponse);
              actualApiBooks = [];
            }
            setBooks(actualApiBooks.slice(0, 3)); 
        } catch (bookErr) {
            console.error("Failed to fetch books:", bookErr);
            setBooksError(bookErr instanceof Error ? bookErr.message : "Failed to load books");
        } finally {
            setIsLoadingBooks(false);
        }

        // Fetch events
        try {
            const eventResponse = await api.get<EventInterface[] | { results: EventInterface[] }>('/events/?ordering=date');
            let actualApiEvents: EventInterface[];
            if (Array.isArray(eventResponse)) {
              actualApiEvents = eventResponse;
            } else if (eventResponse && Array.isArray(eventResponse.results)) {
              actualApiEvents = eventResponse.results;
            } else {
              console.error("Unexpected event data format:", eventResponse);
              actualApiEvents = [];
            }
            setEvents(actualApiEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 3));
        } catch (eventErr) {
            console.error("Failed to fetch events:", eventErr);
            setEventsError(eventErr instanceof Error ? eventErr.message : "Failed to load events");
        } finally {
            setIsLoadingEvents(false);
        }

      } catch (err) { 
        console.error("Failed to fetch student dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        setIsLoading(false); 
        setIsLoadingBooks(false); 
        setIsLoadingEvents(false);
      }
    };
    if (currentUser) fetchDashboardData(); else {
      setIsLoading(false);
      setIsLoadingBooks(false);
      setIsLoadingEvents(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (isLoading && !error && !currentUser) { 
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

      {isLoading && classData.length === 0 && ( 
         <div className="space-y-12 p-4">
            <Skeleton className="h-10 w-1/3 mb-6 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-64 w-full rounded-xl" />)}
            </div>
         </div>
      )}

      {!isLoading && classData.length === 0 && (
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
            ) : booksError ? (
                 <p className="text-red-500 text-sm"><AlertTriangle className="inline mr-1 h-4 w-4" /> Error: {booksError}</p>
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
