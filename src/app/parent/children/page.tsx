// src/app/parent/children/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, FileText, PlusCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  schoolName: string;
  overallProgress: number;
  lastActivity?: string; 
}

const mockChildrenData: Child[] = [
  {
    id: "child1",
    name: "Alex Johnson",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 5,
    schoolName: "Oakwood Elementary",
    overallProgress: 75,
    lastActivity: "Math Quiz (85%)",
  },
  {
    id: "child2",
    name: "Mia Williams",
    classLevel: 3,
    schoolName: "Willow Creek Academy",
    overallProgress: 60,
    lastActivity: "English Reading",
  },
  {
    id: "child3",
    name: "Samuel Green",
    avatarUrl: "https://placehold.co/100x100.png",
    classLevel: 7,
    schoolName: "Northwood Middle School",
    overallProgress: 82,
    lastActivity: "Science Project",
  },
];

export default function MyChildrenPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 text-primary" /> My Children</h1>
          <p className="text-muted-foreground">Manage your children's profiles and access their learning information.</p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Link Another Child
        </Button>
      </div>

      {mockChildrenData.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {mockChildrenData.map(child => (
            <Card key={child.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-xl flex flex-col">
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={child.avatarUrl} alt={child.name} data-ai-hint="child avatar"/>
                  <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{child.name}</CardTitle>
                  <CardDescription>Class {child.classLevel} - {child.schoolName}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-bold text-primary">{child.overallProgress}%</span>
                  </div>
                  <Progress value={child.overallProgress} aria-label={`${child.name}'s overall progress`} />
                </div>
                {child.lastActivity && (
                  <p className="text-sm text-muted-foreground"><strong className="font-medium text-foreground">Recent Activity:</strong> {child.lastActivity}</p>
                )}
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
                <Button variant="default" asChild className="w-full">
                  <Link href={`/parent/child/${child.id}/progress`}><TrendingUp className="mr-2 h-4 w-4" />View Progress</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                   <Link href={`/parent/reports/${child.id}`}><FileText className="mr-2 h-4 w-4" />View Report</Link>
                </Button>
                <Button variant="secondary" asChild className="w-full col-span-2">
                   <Link href={`/parent/communication?child=${child.id}`}><MessageSquare className="mr-2 h-4 w-4" />Contact Teacher</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10 rounded-xl shadow-md">
          <CardHeader>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Children Linked</CardTitle>
            <CardDescription>It looks like you haven't linked any children to your account yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Link Your Child
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
