
// src/app/teacher/calendar/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TeacherCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-2xl font-bold">
                <CalendarDays className="mr-3 h-7 w-7 text-primary" /> Academic Calendar
              </CardTitle>
              <CardDescription>
                Manage and view school events, exam schedules, and deadlines for your classes.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => alert("Open 'Add Event' dialog - TBI")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="mt-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Events for {date ? date.toLocaleDateString() : 'selected date'}:</h3>
            {/* TODO: Fetch and display events for the selected date/month, specific to teacher's school/classes */}
            <p className="text-sm text-muted-foreground">Event details will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
