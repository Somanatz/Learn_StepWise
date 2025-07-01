
// src/components/dashboard/TeacherDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenText, BarChartBig, CalendarCheck2, PlusCircle, FileText, CalendarDays, AlertTriangle, Loader2, MessageSquare, ActivityIcon } from "lucide-react";
import Link from "next/link";
import { api } from '@/lib/api';
import type { Event as EventInterface, User as UserInterface, Subject as SubjectInterface } from '@/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

interface Stat {
    title: string;
    value: string | number | JSX.Element;
    icon: React.ElementType;
    color: string;
    link: string;
    note?: string;
}

interface RecentActivity {
  id: string; // Or number
  description: string; // e.g., "Alex Johnson submitted Math Quiz 3."
  timestamp: string; // e.g., "2024-07-20T10:30:00Z"
  type: 'submission' | 'forum_post' | 'lesson_completion' | 'badge_earned';
  studentName?: string;
  link?: string; // Optional link to the activity
}


const quickLinks = [
    { href: "/teacher/students", label: "Manage Students", icon: Users },
    { href: "/teacher/report-card", label: "Generate Reports", icon: FileText },
    { href: "/teacher/content", label: "Manage Content", icon: BookOpenText },
    { href: "/teacher/communication", label: "Send Announcements", icon: MessageSquare },
];

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<EventInterface[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null); 
  
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser || !currentUser.teacher_profile?.school) {
        setIsLoadingEvents(false);
        setIsLoadingStats(false);
        setStatsError("Teacher profile is not associated with a school.");
        return;
      }
      const schoolId = currentUser.teacher_profile.school;

      // Fetch Events
      setIsLoadingEvents(true);
      setEventsError(null); 
      try {
        const eventResponse = await api.get<EventInterface[]>(`/events/?school=${schoolId}&ordering=date`);
        setEvents(eventResponse.filter(e => new Date(e.date) >= new Date()).slice(0, 5)); 
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEventsError(err instanceof Error ? err.message : "Failed to load events"); 
      } finally {
        setIsLoadingEvents(false);
      }

      // Fetch Stats
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        const [studentCountData, subjectCountData] = await Promise.all([
          api.get<{ count: number }>(`/users/?school=${schoolId}&role=Student&page_size=1`),
          api.get<{ count: number }>(`/subjects/?class_obj__school=${schoolId}&page_size=1`)
        ]);

        const fetchedStats: Stat[] = [
            { title: "Total Students", value: studentCountData.count, icon: Users, color: "text-primary", link: "/teacher/students", note: "In your school" }, 
            { title: "Active Courses", value: subjectCountData.count, icon: BookOpenText, color: "text-accent", link: "/teacher/content", note:"Subjects across all classes"}, 
            { title: "Pending Reviews", value: 0, icon: CalendarCheck2, color: "text-orange-500", link: "#", note:"(Feature in development)"}, 
            { title: "Overall Performance", value: "N/A", icon: BarChartBig, color: "text-green-500", link: "/teacher/analytics", note:"(Feature in development)"}, 
        ];
        setStats(fetchedStats);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStatsError(err instanceof Error ? err.message : "Failed to load dashboard stats.");
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.teacher_profile?.full_name || currentUser?.username}! Manage your classes and students efficiently.</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/teacher/content/lessons/create"> 
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : statsError ? (
            <Card className="lg:col-span-4 p-4 text-center text-destructive bg-destructive/10 border-destructive rounded-xl">
                <AlertTriangle className="inline mr-2"/> Error loading stats: {statsError}
            </Card>
        ) : stats.map((stat) => ( 
          <Link key={stat.title} href={stat.link} passHref legacyBehavior>
            <a className="block">
                <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    {stat.note && <p className="text-xs text-muted-foreground pt-1">{stat.note}</p>}
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><ActivityIcon className="mr-2 text-primary"/>Recent Activity</CardTitle>
            <CardDescription>Overview of recent student submissions and interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">No recent student activities to display. (Feature in development)</p>
            <Button variant="outline" className="mt-6 w-full" disabled>View All Activities</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 text-primary"/>Upcoming School Events</CardTitle>
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
              <ul className="space-y-2">
                {events.map(event => (
                  <li key={event.id} className="p-2 border-b last:border-b-0">
                    <h4 className="font-semibold text-sm">{event.title} <span className="text-xs font-normal text-muted-foreground">({event.type})</span></h4>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming school events.</p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/teacher/calendar">View Full Calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access your most used tools and sections.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map(link => (
                <Button variant="outline" asChild key={link.href} className="h-auto py-6 flex-col items-center justify-center gap-2 text-base hover:bg-accent/10 hover:border-primary transition-all duration-150 ease-in-out group">
                  <Link href={link.href}>
                    <link.icon className="h-8 w-8 mb-1 text-primary group-hover:text-accent transition-colors" />
                    <span className="text-center">{link.label}</span>
                  </Link>
                </Button>
            ))}
          </CardContent>
        </Card>
    </div>
  );
}
