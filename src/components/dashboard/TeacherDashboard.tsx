
// src/components/dashboard/TeacherDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenText, BarChartBig, CalendarCheck2, PlusCircle, FileText, CalendarDays, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { api } from '@/lib/api';
import type { Event as EventInterface } from '@/interfaces';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { title: "Total Students", value: "125", icon: Users, color: "text-primary", link: "/teacher/students" }, 
  { title: "Active Courses", value: "8", icon: BookOpenText, color: "text-accent", link: "/teacher/content" }, 
  { title: "Pending Reviews", value: "12", icon: CalendarCheck2, color: "text-orange-500", link: "#" }, 
  { title: "Overall Performance", value: "85%", icon: BarChartBig, color: "text-green-500", link: "/teacher/analytics" }, 
];

const recentActivitiesMock = [
  { student: "Alex Johnson", action: "submitted Math Quiz 3.", time: "10m ago" },
  { student: "Maria Garcia", action: "asked a question in Science forum.", time: "45m ago" },
  { student: "David Lee", action: "completed History Lesson 5.", time: "2h ago" },
  { student: "Sarah Miller", action: "achieved 'Top Learner' badge.", time: "5h ago" },
];

const quickLinks = [
    { href: "/teacher/students", label: "Manage Students", icon: Users },
    { href: "/teacher/report-card", label: "Generate Reports", icon: FileText },
    { href: "/teacher/content", label: "Manage Content", icon: BookOpenText },
    { href: "/teacher/communication", label: "Send Announcements", icon: MessageSquare },
];

export default function TeacherDashboard() {
  const [events, setEvents] = useState<EventInterface[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null); // Declare eventsError state

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      setEventsError(null); // Reset eventsError
      try {
        const apiEvents = await api.get<EventInterface[]>('/events/?ordering=date');
        setEvents(apiEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 5)); 
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEventsError(err instanceof Error ? err.message : "Failed to load events"); // Set eventsError on failure
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your classes and students efficiently.</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/teacher/content/lessons/create"> 
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => ( 
          <Link key={stat.title} href={stat.link} passHref legacyBehavior>
            <a className="block">
                <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground pt-1">
                    {stat.title === "Overall Performance" ? "+5% from last month" : "View Details"}
                    </p>
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent student submissions and interactions. (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivitiesMock.length > 0 ? ( 
            <ul className="space-y-3">
              {recentActivitiesMock.map((activity, index) => (
                <li key={index} className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-md">
                  <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      <span className="font-semibold text-accent">{activity.student}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            ) : (
                 <p className="text-sm text-muted-foreground">No recent student activities.</p>
            )}
             <Button variant="outline" className="mt-6 w-full">View All Activities</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 text-primary"/>Upcoming Events</CardTitle>
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
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
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
                <Button variant="outline" asChild key={link.href} className="h-auto py-4 flex-col items-center justify-center gap-2 text-base hover:bg-accent/10 hover:border-primary transition-all duration-150 ease-in-out group">
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
