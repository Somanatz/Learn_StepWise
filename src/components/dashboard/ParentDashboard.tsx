// src/components/dashboard/ParentDashboard.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Activity, FileText, CalendarDays, MessageCircle, Settings, Users, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  overallProgress: number;
  lastActivity: string;
  alerts?: string[];
}

const mockChildrenData: Child[] = [
  {
    id: "child1",
    name: "Alex Johnson",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 5,
    overallProgress: 75,
    lastActivity: "Completed Math Quiz (Score: 85%)",
    alerts: ["Upcoming Science Fair on Oct 25th"],
  },
  {
    id: "child2",
    name: "Mia Williams",
    classLevel: 3,
    overallProgress: 60,
    lastActivity: "Read Chapter 3 of 'Magic Treehouse'",
    alerts: [],
  },
];

export default function ParentDashboard() {
  return (
    <div className="space-y-8">
      <section className="p-6 bg-gradient-to-r from-accent to-blue-600 text-primary-foreground rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="mt-2 text-lg">Welcome! Here’s an overview of your children's learning journey on StepWise.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Users className="mr-3 text-primary" /> My Children
        </h2>
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
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/parent/child/${child.id}/progress`}><TrendingUp className="mr-2 h-4 w-4" />View Progress</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                   <Link href={`/parent/reports/${child.id}`}><FileText className="mr-2 h-4 w-4" />View Report Card</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarDays className="mr-2 text-primary"/>Upcoming Events & Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="font-semibold text-foreground">Oct 20:</span> Parent-Teacher Meeting (Alex)</li>
              <li><span className="font-semibold text-foreground">Oct 25:</span> Science Fair (Alex)</li>
              <li><span className="font-semibold text-foreground">Nov 5:</span> Book Report Due (Mia)</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><MessageCircle className="mr-2 text-primary"/>Communication Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Quickly access messages or contact support.</p>
            <Button variant="default" className="w-full sm:w-auto">Messages from Teachers</Button>
            <Button variant="outline" className="w-full sm:w-auto">Contact Support</Button>
          </CardContent>
        </Card>
      </section>
       <section className="p-6 bg-secondary rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-3 text-secondary-foreground flex items-center"><ShieldCheck className="mr-2"/> Account & Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage your account preferences and notification settings.</p>
        <Button variant="outline" className="bg-background hover:bg-muted">
            <Settings className="mr-2 h-4 w-4"/> Go to Settings
        </Button>
      </section>
    </div>
  );
}
