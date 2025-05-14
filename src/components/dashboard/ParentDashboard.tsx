// src/components/dashboard/ParentDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Activity, FileText, CalendarDays, MessageCircle, Settings, Users, TrendingUp, ShieldCheck, PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from '@/lib/api'; // Assuming api util is set up
import type { Event } from '@/notifications/models'; // Assuming Event interface

interface Child {
  id: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  overallProgress: number;
  lastActivity: string;
  alerts?: string[];
}

// Mock data for children - in a real app, this would come from API
const mockChildrenData: Child[] = [
  {
    id: "child1", name: "Alex Johnson", avatarUrl: "https://placehold.co/100x100.png", classLevel: 5,
    overallProgress: 75, lastActivity: "Completed Math Quiz (Score: 85%)",
    alerts: ["Upcoming Science Fair on Oct 25th"],
  },
  {
    id: "child2", name: "Mia Williams", classLevel: 3, overallProgress: 60,
    lastActivity: "Read Chapter 3 of 'Magic Treehouse'", alerts: [],
  },
];

interface ApiEvent {
  id: string | number; title: string; date: string; type: string; description?: string;
}


export default function ParentDashboard() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      setEventsError(null);
      try {
        const apiEvents = await api.get<ApiEvent[]>('/events/?ordering=date');
        setEvents(apiEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 5)); // Upcoming 5 events
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEventsError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);


  return (
    <div className="space-y-8">
      <section className="p-6 bg-gradient-to-r from-accent to-blue-600 text-primary-foreground rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="mt-2 text-lg">Welcome! Here’s an overview of your children's learning journey on StepWise.</p>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold flex items-center">
            <Users className="mr-3 text-primary" /> My Children
          </h2>
          <Button variant="outline" asChild>
            <Link href="/parent/children"><PlusCircle className="mr-2 h-4 w-4"/> Manage Children</Link>
          </Button>
        </div>
        {mockChildrenData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {mockChildrenData.map(child => (
                <Card key={child.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-xl">
                <CardHeader className="flex flex-row items-center space-x-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={child.avatarUrl} alt={child.name} data-ai-hint="child portrait" />
                    <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <CardTitle className="text-xl">{child.name}</CardTitle>
                    <CardDescription>Class {child.classLevel}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                        <span className="text-sm font-bold text-primary">{child.overallProgress}%</span>
                    </div>
                    <Progress value={child.overallProgress} aria-label={`${child.name}'s overall progress`} />
                    </div>
                    <div>
                    <p className="text-sm text-muted-foreground"><strong className="font-medium text-foreground">Last Activity:</strong> {child.lastActivity}</p>
                    </div>
                    {child.alerts && child.alerts.length > 0 && (
                    <div className="p-3 bg-warning/10 border-l-4 border-warning rounded-md">
                        <h4 className="font-semibold text-sm text-warning-foreground mb-1">Important Alerts:</h4>
                        <ul className="list-disc list-inside pl-2 text-xs text-warning-foreground">
                        {child.alerts.map((alert, i) => <li key={i}>{alert}</li>)}
                        </ul>
                    </div>
                    )}
                </CardContent>
                <CardFooter className="gap-2">
                    <Button variant="default" size="sm" asChild>
                    <Link href={`/parent/child/${child.id}/progress`}><TrendingUp className="mr-2 h-4 w-4" />View Progress</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                    <Link href={`/parent/reports/${child.id}`}><FileText className="mr-2 h-4 w-4" />View Report Card</Link>
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
            <Card className="p-6 text-center">
                <CardTitle>No Children Linked</CardTitle>
                <CardDescription className="my-2">Link your child's account to monitor their progress.</CardDescription>
                <Button asChild>
                    <Link href="/parent/children"><PlusCircle className="mr-2 h-4 w-4"/> Link Child</Link>
                </Button>
            </Card>
        )}
      </section>

      <Separator />

      <section className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 text-primary"/>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents && <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {eventsError && <p className="text-red-500 text-sm"><AlertTriangle className="inline mr-1 h-4 w-4" /> Error: {eventsError}</p>}
            {!isLoadingEvents && !eventsError && events.length > 0 && (
              <ul className="space-y-2">
                {events.map(event => (
                  <li key={event.id} className="p-2 border-b last:border-b-0">
                    <h4 className="font-semibold text-sm">{event.title} <span className="text-xs font-normal text-muted-foreground">({event.type})</span></h4>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
            {!isLoadingEvents && !eventsError && events.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            )}
             <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/parent/calendar">View Full Calendar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><MessageCircle className="mr-2 text-primary"/>Communication Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Quickly access messages or contact support.</p>
            <Button variant="default" className="w-full sm:w-auto" asChild>
                <Link href="/parent/communication">Messages from Teachers</Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">Contact Support</Button>
          </CardContent>
        </Card>
      </section>
       <section className="p-6 bg-secondary rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-3 text-secondary-foreground flex items-center"><ShieldCheck className="mr-2"/> Account & Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage your account preferences and notification settings.</p>
        <Button variant="outline" className="bg-background hover:bg-muted" asChild>
            <Link href="/parent/settings">
                <Settings className="mr-2 h-4 w-4"/> Go to Settings
            </Link>
        </Button>
      </section>
    </div>
  );
}

