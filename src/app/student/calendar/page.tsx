
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
      <Card className="shadow-xl rounded-xl">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center text-2xl font-bold">
            <CalendarDays className="mr-3 h-7 w-7 text-primary" /> My Calendar
          </CardTitle>
          <CardDescription>
            View upcoming school events, holidays, exam schedules, and assignment deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-4 md:p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow-sm bg-card" // Added bg-card for better theme integration
          />
          <div className="mt-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Upcoming Events for {date ? date.toLocaleDateString() : 'selected date'}:</h3>
            {/* TODO: Fetch and display events for the selected date or month */}
            <p className="text-sm text-muted-foreground">Event details for the selected date will appear here.</p>
            {/* Example Event Item */}
            <div className="mt-2 p-3 border rounded-md bg-secondary/50">
                <h4 className="font-semibold">Math Quiz 2</h4>
                <p className="text-xs text-muted-foreground">Due: Tomorrow, 10:00 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
