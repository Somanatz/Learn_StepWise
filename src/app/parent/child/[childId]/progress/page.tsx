
// src/app/parent/child/[childId]/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, BookOpen, Target, CheckCircle2, Activity, CalendarClock, Loader2, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { api } from '@/lib/api';
import type { User, StudentProfileData, UserLessonProgress, UserQuizAttempt } from '@/interfaces'; // Assuming you have these
import { Skeleton } from '@/components/ui/skeleton';

interface SubjectProgress {
  name: string;
  progress: number; // Percentage
  lastActivity: string;
  grade: string; // e.g., "B+"
  color?: string; // For chart
}

interface Goal {
  id: string;
  description: string;
  status: "In Progress" | "Completed" | "Pending";
}

interface RecentActivityItem {
  id: string;
  date: string;
  description: string;
  score?: string | null;
}

interface ChildProgressData {
  studentId: string;
  name: string;
  avatarUrl?: string;
  classLevel: number | string;
  overallProgress: number;
  subjects: SubjectProgress[];
  recentActivities: RecentActivityItem[];
  attendance: number; // percentage
  goals: Goal[];
}


const subjectProgressChartConfig = {
  progress: { label: "Progress (%)" },
} satisfies ChartConfig;


export default function ChildProgressPage() {
  const params = useParams();
  const childId = params.childId as string;
  
  const [childData, setChildData] = useState<ChildProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildProgress = async () => {
      if (!childId) return;
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Implement these API endpoints on the backend
        // const studentProfile = await api.get<User>(`/users/${childId}/`); // Assuming this returns student profile
        // const lessonProgress = await api.get<UserLessonProgress[]>(`/userprogress/?user=${childId}`);
        // const quizAttempts = await api.get<UserQuizAttempt[]>(`/quizattempts/?user=${childId}`);
        
        // Simulating fetched data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Replace with actual data transformation once APIs are ready
        const mockStudentData = { // Keep for structure if API fails/not ready
            studentId: childId,
            name: `Child ${childId} Name (Fetched)`, // studentProfile.student_profile?.full_name || studentProfile.username
            avatarUrl: `https://placehold.co/100x100.png?text=C${childId}`, // studentProfile.student_profile?.profile_picture_url
            classLevel: `Class ${Math.floor(Math.random() * 5) + 1}`, // studentProfile.student_profile?.enrolled_class_name
            overallProgress: Math.floor(Math.random() * 60) + 40,
            subjects: [
                { name: "Mathematics", progress: Math.floor(Math.random() * 50) + 50, lastActivity: "Completed Fractions Quiz", grade: "B+", color: "hsl(var(--chart-1))" },
                { name: "Science", progress: Math.floor(Math.random() * 50) + 50, lastActivity: "Watched 'Cell Structures'", grade: "B-", color: "hsl(var(--chart-2))" },
            ],
            recentActivities: [
                {id: "ra1", date: "2024-07-20", description: "Completed Math Topic: Decimals", score: "8/10" },
            ],
            attendance: Math.floor(Math.random() * 10) + 90,
            goals: [
                { id: "g1", description: "Improve Science grade", status: "In Progress" },
            ]
        };
        setChildData(mockStudentData);
        setError("Child progress API not yet fully implemented. Displaying placeholder structure with some mocked details.");

      } catch (err) {
        console.error("Failed to fetch child progress:", err);
        setError(err instanceof Error ? err.message : "Could not load child's progress data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildProgress();
  }, [childId]);


  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-12 w-1/2 rounded" />
        <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !childData) { // Only show full error if no data could be even placeholder-loaded
    return (
         <Card className="text-center py-10 bg-destructive/10 border-destructive rounded-xl shadow-lg">
            <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><CardTitle>Error Loading Progress</CardTitle></CardHeader>
            <CardContent><CardDescription className="text-destructive-foreground">{error}</CardDescription></CardContent>
        </Card>
    );
  }
  
  if (!childData) { // Should be caught by error state usually
      return <p>No progress data available for this child.</p>;
  }

  const chartData = childData.subjects.map(subject => ({
    name: subject.name,
    progress: subject.progress,
    fill: subject.color || `hsl(var(--chart-${(childData.subjects.indexOf(subject) % 5) + 1}))`
  }));

  return (
    <div className="space-y-8">
      {error && childData && ( // Show non-blocking error if data is at least placeholder
         <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary-foreground">
              <AvatarImage src={childData.avatarUrl} alt={childData.name} data-ai-hint="child avatar"/>
              <AvatarFallback>{childData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold">{childData.name}'s Progress</CardTitle>
              <CardDescription className="text-primary-foreground/80">Class {childData.classLevel} - Detailed Learning Journey</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><TrendingUp className="mr-2 text-accent"/>Overall Progress: {childData.overallProgress}%</CardTitle>
            </CardHeader>
            <CardContent>
               <Progress value={childData.overallProgress} aria-label={`${childData.name}'s overall progress`} className="h-4" />
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BookOpen className="mr-2 text-primary"/>Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                    <ChartContainer config={subjectProgressChartConfig} className="w-full h-full">
                    <BarChart data={chartData} layout="vertical" accessibilityLayer>
                        <CartesianGrid horizontal={false}/>
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} className="text-xs"/>
                        <XAxis type="number" dataKey="progress" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="progress" radius={5}>
                            {chartData.map((entry) => (
                                <rect key={entry.name} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                    </ChartContainer>
                ) : <p className="text-sm text-muted-foreground">No subject progress data available.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Target className="mr-2 text-primary"/>Active Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {childData.goals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/30">
                    <p className="text-sm">{goal.description}</p>
                    <Badge variant={goal.status === "Completed" ? "default" : "outline"} 
                           className={goal.status === "Completed" ? "bg-green-500 text-white" : ""}>
                      {goal.status}
                    </Badge>
                  </div>
                ))}
                {childData.goals.length === 0 && <p className="text-sm text-muted-foreground">No active goals set.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Activity className="mr-2 text-primary"/>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Outcome/Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childData.recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{activity.description}</TableCell>
                        <TableCell className="text-right">{activity.score || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                    {childData.recentActivities.length === 0 && 
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No recent activities.</TableCell></TableRow>
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><CalendarClock className="mr-2 text-primary"/>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Progress value={childData.attendance} aria-label="Attendance" className="h-3 flex-1" />
                    <span className="font-semibold text-lg text-primary">{childData.attendance}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">School attendance for the current term.</p>
            </CardContent>
          </Card>


        </CardContent>
      </Card>
    </div>
  );
}
