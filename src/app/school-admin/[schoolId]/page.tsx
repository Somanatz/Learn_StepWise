
// src/app/school-admin/[schoolId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Briefcase, Users2, BarChart3, Megaphone, CalendarDays, Brain, MessageSquare, Loader2, AlertTriangle, PlusCircle, School as SchoolIcon, CalendarIcon } from "lucide-react";
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { School, Event as EventInterface, CustomUser } from '@/interfaces'; // Assuming CustomUser for teacher/student lists
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const eventSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  type: z.enum(['Holiday', 'Exam', 'Meeting', 'Activity', 'Deadline', 'General']),
});
type EventFormValues = z.infer<typeof eventSchema>;

export default function SchoolAdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAuth();
  const schoolId = params.schoolId as string;

  const [schoolDetails, setSchoolDetails] = useState<School | null>(null);
  const [students, setStudents] = useState<CustomUser[]>([]);
  const [teachers, setTeachers] = useState<CustomUser[]>([]);
  const [events, setEvents] = useState<EventInterface[]>([]);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true); // For students, teachers, events
  const [error, setError] = useState<string | null>(null);

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: 'General' },
  });

  useEffect(() => {
    if (!schoolId) return;
    setIsLoadingSchool(true);
    api.get<School>(`/schools/${schoolId}/`)
      .then(setSchoolDetails)
      .catch(err => {
        console.error("Failed to fetch school details:", err);
        setError("Could not load school information.");
      })
      .finally(() => setIsLoadingSchool(false));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !currentUser || currentUser.administered_school?.id !== parseInt(schoolId)) {
        if(!isLoadingAuth && currentUser) { // Only redirect if auth is resolved and user is not admin of this school
           // router.push('/'); // Or to an error page
           console.warn("User is not admin of this school or schoolId mismatch");
        }
        return;
    }

    setIsLoadingData(true);
    Promise.all([
      api.get<CustomUser[]>(`/users/?school=${schoolId}&role=Student`),
      api.get<CustomUser[]>(`/users/?school=${schoolId}&role=Teacher`),
      api.get<EventInterface[]>(`/events/?school=${schoolId}&ordering=date`)
    ]).then(([studentsData, teachersData, eventsData]) => {
      setStudents(studentsData.slice(0, 10)); // Mock top 10
      setTeachers(teachersData.sort((a,b) => (a.teacher_profile?.full_name || "").localeCompare(b.teacher_profile?.full_name || "")).slice(0, 10)); // Mock senior/sorted
      setEvents(eventsData);
    }).catch(err => {
      console.error("Failed to load dashboard data:", err);
      setError("Could not load school dashboard data.");
    }).finally(() => setIsLoadingData(false));

  }, [schoolId, currentUser, isLoadingAuth, router]);


  const onEventSubmit = async (data: EventFormValues) => {
    if (!schoolId) return;
    try {
      const payload = { ...data, school: schoolId, date: format(data.date, "yyyy-MM-dd") };
      const newEvent = await api.post<EventInterface>('/events/', payload);
      setEvents(prev => [newEvent, ...prev].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() ));
      toast({ title: "Event Created", description: `${newEvent.title} has been added to the calendar.` });
      eventForm.reset();
    } catch (err: any) {
      toast({ title: "Error Creating Event", description: err.message || "Could not create event.", variant: "destructive" });
    }
  };

  if (isLoadingAuth || isLoadingSchool) {
    return <div className="p-6"><Skeleton className="h-24 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!currentUser || currentUser.role !== 'Admin' || !currentUser.is_school_admin || currentUser.administered_school?.id !== parseInt(schoolId)) {
    return <Card className="m-6 p-6 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" /><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this school's admin dashboard.</CardDescription><Button onClick={() => router.push('/')} className="mt-4">Go to My Dashboard</Button></Card>;
  }
  if (error) {
    return <Card className="m-6 p-6 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" /><CardTitle>Error</CardTitle><CardDescription>{error}</CardDescription></Card>;
  }


  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card className="shadow-xl rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground">
        <CardHeader>
          <div className="flex items-center gap-4">
             <SchoolIcon size={40}/>
            <div>
                <CardTitle className="text-3xl font-bold">{schoolDetails?.name || 'School Admin Dashboard'}</CardTitle>
                <CardDescription className="text-primary-foreground/80">Manage your school, students, staff, and communications.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={students.length || 0} icon={Users} />
        <StatCard title="Total Staff" value={teachers.length || 0} icon={Briefcase} />
        {/* Placeholders for more complex stats */}
        <StatCard title="Avg. Performance" value="82%" icon={BarChart3} note="+2% this term" />
        <StatCard title="Upcoming Events" value={events.filter(e => new Date(e.date) >= new Date()).length} icon={CalendarDays} />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-md rounded-xl">
          <CardHeader><CardTitle className="flex items-center"><Megaphone className="mr-2 text-accent"/>Announcements / Event Creation</CardTitle></CardHeader>
          <CardContent>
            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
                <FormField control={eventForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="e.g., Mid-term Exams" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={eventForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Details about the event" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={eventForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                            <Popover><PopoverTrigger asChild>
                                <FormControl><Button variant="outline" className="pl-3 text-left font-normal">{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover><FormMessage/>
                        </FormItem>
                    )} />
                    <FormField control={eventForm.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger></FormControl>
                            <SelectContent>{['Holiday', 'Exam', 'Meeting', 'Activity', 'Deadline', 'General'].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                </div>
                <Button type="submit" disabled={eventForm.formState.isSubmitting}>
                  {eventForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create Event
                </Button>
              </form>
            </Form>
            <h4 className="font-semibold mt-6 mb-2">Current School Events:</h4>
            {isLoadingData ? <Skeleton className="h-20 w-full"/> : events.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {events.map(event => (
                        <div key={event.id} className="p-2 border rounded-md text-sm bg-secondary/50">
                            <strong>{event.title}</strong> ({event.type}) - {format(new Date(event.date), "PPP")}
                            {event.target_class_name && <span className="text-xs text-muted-foreground"> (For: {event.target_class_name})</span>}
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">No events scheduled for this school yet.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader><CardTitle  className="flex items-center"><Brain className="mr-2 text-accent"/>AI Management Tool</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Get suggestions or chat with the AI assistant for school management insights.</p>
            <Textarea placeholder="Ask the AI about school performance, resource allocation, etc..." className="mb-2" />
            <Button variant="outline" className="w-full">Send to AI Assistant</Button>
             <p className="text-xs text-muted-foreground mt-1">Feature coming soon.</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder sections for other requested data */}
       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Performing Students (Placeholder)</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Data for top students per class will be shown here.</p></CardContent>
        </Card>
         <Card>
          <CardHeader><CardTitle>Senior Teachers (Placeholder)</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">List of most senior teachers will be displayed here.</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>School Performance Metrics (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Charts and data on school's yearly progress will appear here.</p></CardContent>
      </Card>


    </div>
  );
}

interface StatCardProps { title: string; value: string | number; icon: React.ElementType; note?: string; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, note }) => (
  <Card className="shadow-sm rounded-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {note && <p className="text-xs text-muted-foreground pt-1">{note}</p>}
    </CardContent>
  </Card>
);

