
// src/app/student/calendar/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar
import { useState } from "react";

export default function StudentCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold">
            <CalendarDays className="mr-3 h-7 w-7 text-primary" /> My Calendar
          </CardTitle>
          <CardDescription>
            View upcoming school events, holidays, exam schedules, and assignment deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="mt-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Upcoming Events:</h3>
            {/* TODO: Fetch and display events for the selected date or month */}
            <p className="text-sm text-muted-foreground">Event details for the selected date will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
