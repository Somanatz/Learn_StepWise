
// src/app/student/progress/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function StudentProgressPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold">
            <BarChart3 className="mr-3 h-7 w-7 text-primary" /> My Progress
          </CardTitle>
          <CardDescription>
            Track your learning journey, completed lessons, quiz scores, and overall achievements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed progress reports, charts, and statistics will be displayed here.
          </p>
          {/* TODO: Fetch and display student's progress data, quiz attempts, lesson completions etc. */}
        </CardContent>
      </Card>
    </div>
  );
}
