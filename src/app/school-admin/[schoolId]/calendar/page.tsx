
// src/app/school-admin/[schoolId]/calendar/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { useState } from "react";

export default function SchoolAdminCalendarPage() {
  const params = useParams();
  const schoolId = params.schoolId;
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
            <CalendarDays className="mr-3 text-primary" /> Manage School Calendar (ID: {schoolId})
        </h1>
         <Button onClick={() => alert("Open 'Add Event' dialog - TBI")}>
            <PlusCircle className="mr-2 h-4 w-4"/> Add New Event
        </Button>
      </div>
      <Card className="shadow-xl rounded-xl">
        <CardHeader className="p-6">
          <CardTitle>School Event Calendar</CardTitle>
          <CardDescription>Add, edit, and manage school-wide events, holidays, and exam schedules.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-4 md:p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow-sm bg-card" // Added bg-card
          />
          <div className="mt-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Events for {date ? date.toLocaleDateString() : 'selected date'}:</h3>
            {/* TODO: Fetch and display events for this schoolId */}
            <p className="text-sm text-muted-foreground">Event details for the school will appear here.</p>
             {/* Example Event Item */}
            <div className="mt-2 p-3 border rounded-md bg-secondary/50">
                <h4 className="font-semibold">Annual Sports Day</h4>
                <p className="text-xs text-muted-foreground">9:00 AM - 2:00 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
