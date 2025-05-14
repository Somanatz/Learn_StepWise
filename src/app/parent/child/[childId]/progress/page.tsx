// src/app/parent/child/[childId]/progress/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, BookOpen, Target, CheckCircle2, Activity, CalendarClock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

// Mock data - in a real app, fetch this based on childId
const mockChildData = {
  child1: {
    name: "Alex Johnson",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 5,
    overallProgress: 75,
    subjects: [
      { name: "Mathematics", progress: 85, lastActivity: "Completed Fractions Quiz (90%)", grade: "B+" },
      { name: "Science", progress: 70, lastActivity: "Watched 'Cell Structures' video", grade: "B-" },
      { name: "English", progress: 65, lastActivity: "Read Chapter 5 of 'Wonder'", grade: "C+" },
      { name: "History", progress: 80, lastActivity: "Ancient Rome lesson test (75%)", grade: "B" },
    ],
    recentActivities: [
      { date: "2024-07-15", description: "Completed Math Quiz - Topic: Decimals", score: "8/10" },
      { date: "2024-07-14", description: "Started Science Lesson - 'Photosynthesis'", score: null },
      { date: "2024-07-12", description: "Submitted English Essay - 'My Summer Vacation'", score: "Graded" },
    ],
    attendance: 95, // percentage
    goals: [
      { id: "g1", description: "Improve Science grade to B+", status: "In Progress" },
      { id: "g2", description: "Complete 10 Math practice exercises this week", status: "Completed" },
    ]
  },
  child2: {
    name: "Mia Williams",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 3,
    overallProgress: 60,
     subjects: [
      { name: "Phonics", progress: 70, lastActivity: "Alphabet Sounds practice", grade: "B" },
      { name: "Basic Math", progress: 55, lastActivity: "Counting to 100 exercise", grade: "C" },
      { name: "Reading", progress: 60, lastActivity: "Finished 'Green Eggs and Ham'", grade: "C+" },
    ],
    recentActivities: [
      { date: "2024-07-15", description: "Practiced sight words list 2", score: null },
      { date: "2024-07-13", description: "Counting game - Numbers 1-50", score: "Achieved!" },
    ],
    attendance: 92,
    goals: [
      { id: "g1", description: "Read 3 new story books this month", status: "In Progress" },
    ]
  }
  // ... other children
};

const subjectProgressChartConfig = {
  progress: { label: "Progress (%)" },
} satisfies ChartConfig;


export default function ChildProgressPage() {
  const params = useParams();
  const childId = params.childId as keyof typeof mockChildData | undefined;
  
  // Fallback if childId is not a string or not in mockChildData
  const child = childId && typeof childId === 'string' && mockChildData[childId] ? mockChildData[childId] : mockChildData['child1'];


  const chartData = child.subjects.map(subject => ({
    name: subject.name,
    progress: subject.progress,
    fill: `hsl(var(--chart-${(child.subjects.indexOf(subject) % 5) + 1}))` // Cycle through chart colors
  }));

  return (
    <div className="space-y-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary-foreground">
              <AvatarImage src={child.avatarUrl} alt={child.name} data-ai-hint="child avatar"/>
              <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold">{child.name}'s Progress</CardTitle>
              <CardDescription className="text-primary-foreground/80">Class {child.classLevel} - Detailed Learning Journey</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><TrendingUp className="mr-2 text-accent"/>Overall Progress: {child.overallProgress}%</CardTitle>
            </CardHeader>
            <CardContent>
               <Progress value={child.overallProgress} aria-label={`${child.name}'s overall progress`} className="h-4" />
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BookOpen className="mr-2 text-primary"/>Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Target className="mr-2 text-primary"/>Active Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {child.goals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/30">
                    <p className="text-sm">{goal.description}</p>
                    <Badge variant={goal.status === "Completed" ? "default" : "outline"} 
                           className={goal.status === "Completed" ? "bg-green-500 text-white" : ""}>
                      {goal.status}
                    </Badge>
                  </div>
                ))}
                {child.goals.length === 0 && <p className="text-sm text-muted-foreground">No active goals set.</p>}
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
                    {child.recentActivities.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{activity.date}</TableCell>
                        <TableCell className="font-medium">{activity.description}</TableCell>
                        <TableCell className="text-right">{activity.score || "N/A"}</TableCell>
                      </TableRow>
                    ))}
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
                    <Progress value={child.attendance} aria-label="Attendance" className="h-3 flex-1" />
                    <span className="font-semibold text-lg text-primary">{child.attendance}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">School attendance for the current term.</p>
            </CardContent>
          </Card>


        </CardContent>
      </Card>
    </div>
  );
}
