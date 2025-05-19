
// src/app/student/subjects/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function StudentSubjectsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold">
            <BookOpen className="mr-3 h-7 w-7 text-primary" /> My Subjects
          </CardTitle>
          <CardDescription>
            Explore all subjects you are enrolled in. Click on a subject to view lessons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Subject listing content will be displayed here. This page will show a more detailed view or alternative organization of your subjects compared to the dashboard.
          </p>
          {/* TODO: Fetch and display list of enrolled subjects, potentially with links to their detail pages */}
        </CardContent>
      </Card>
    </div>
  );
}
