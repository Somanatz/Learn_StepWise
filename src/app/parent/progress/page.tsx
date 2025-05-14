// src/app/parent/progress/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Users, TrendingUp, Eye, ListFilter } from "lucide-react";
import Link from "next/link";

interface ChildProgressSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  overallProgress: number;
  subjectsBehind?: number; // Number of subjects where progress is < 50%
  subjectsExcelling?: number; // Number of subjects where progress is > 85%
  lastActivity: string;
}

const mockChildrenProgress: ChildProgressSummary[] = [
  {
    id: "child1",
    name: "Alex Johnson",
    avatarUrl: "https://placehold.co/80x80.png",
    classLevel: 5,
    overallProgress: 75,
    subjectsBehind: 1,
    subjectsExcelling: 2,
    lastActivity: "Math Quiz - Decimals (85%)",
  },
  {
    id: "child2",
    name: "Mia Williams",
    avatarUrl: "https://placehold.co/80x80.png",
    classLevel: 3,
    overallProgress: 60,
    subjectsBehind: 2,
    subjectsExcelling: 0,
    lastActivity: "Reading Comprehension - Chapter 3",
  },
   {
    id: "child3",
    name: "Samuel Green",
    avatarUrl: "https://placehold.co/80x80.png",
    classLevel: 7,
    overallProgress: 82,
    subjectsExcelling: 3,
    lastActivity: "Science Project - Phase 1 Submitted",
  },
];

export default function ParentProgressOverviewPage() {
  const totalProgress = mockChildrenProgress.reduce((sum, child) => sum + child.overallProgress, 0);
  const averageProgress = mockChildrenProgress.length > 0 ? Math.round(totalProgress / mockChildrenProgress.length) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><BarChart3 className="mr-3 text-primary" /> Progress Overview</h1>
          <p className="text-muted-foreground">A summary of your children's academic progress on StepWise.</p>
        </div>
         <Button variant="outline"><ListFilter className="mr-2 h-4 w-4"/> Filter by Child/Subject</Button>
      </div>

      <Card className="shadow-lg rounded-xl bg-secondary">
        <CardHeader>
          <CardTitle className="text-2xl text-secondary-foreground">Family Progress Snapshot</CardTitle>
          <CardDescription className="text-secondary-foreground/80">Average progress across all linked children.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={averageProgress} aria-label="Average family progress" className="h-6 flex-1 bg-background" />
            <span className="text-3xl font-bold text-primary">{averageProgress}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{mockChildrenProgress.length} children linked.</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center"><Users className="mr-3 text-accent" />Individual Child Progress</h2>
        {mockChildrenProgress.map(child => (
          <Card key={child.id} className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={child.avatarUrl} alt={child.name} data-ai-hint="child avatar"/>
                  <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{child.name}</CardTitle>
                  <CardDescription>Class {child.classLevel} - Overall: {child.overallProgress}%</CardDescription>
                </div>
              </div>
               <Button asChild variant="default" size="sm">
                <Link href={`/parent/child/${child.id}/progress`}><Eye className="mr-2 h-4 w-4"/>Detailed View</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Progress value={child.overallProgress} aria-label={`${child.name}'s progress`} className="h-3 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-medium text-muted-foreground">Last Activity:</p>
                  <p className="truncate">{child.lastActivity}</p>
                </div>
                {child.subjectsExcelling !== undefined && (
                <div className={`p-2 rounded-md ${child.subjectsExcelling > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                  <p className="font-medium ${child.subjectsExcelling > 0 ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}">Subjects Excelling:</p>
                  <p className={child.subjectsExcelling > 0 ? 'text-green-600 dark:text-green-200 font-semibold' : ''}>{child.subjectsExcelling}</p>
                </div>
                )}
                {child.subjectsBehind !== undefined && (
                <div className={`p-2 rounded-md ${child.subjectsBehind > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-muted'}`}>
                  <p className="font-medium ${child.subjectsBehind > 0 ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}">Needs Focus:</p>
                  <p className={child.subjectsBehind > 0 ? 'text-red-600 dark:text-red-200 font-semibold' : ''}>{child.subjectsBehind} subject(s)</p>
                </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
