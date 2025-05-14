// src/app/teacher/communication/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Users, User, Bell } from "lucide-react";

const mockClasses = [
  { id: "class5A", name: "Class 5A" },
  { id: "class5B", name: "Class 5B" },
  { id: "class4All", name: "All Class 4 Students" },
];

const mockRecentAnnouncements = [
  { id: "a1", title: "Upcoming Math Test - Chapter 3", recipients: "Class 5A, Class 5B", date: "2024-07-10" },
  { id: "a2", title: "Science Fair Project Submission Reminder", recipients: "All Class 4 Students", date: "2024-07-08" },
  { id: "a3", title: "Parent-Teacher Meeting Schedule", recipients: "All Parents", date: "2024-07-05" },
];

export default function TeacherCommunicationPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><MessageSquare className="mr-3 text-primary" /> Communication Center</h1>
          <p className="text-muted-foreground">Send announcements, messages, and manage communication with students and parents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><Send className="mr-2 text-accent" /> Send New Announcement</CardTitle>
            <CardDescription>Compose and send important updates to students or parents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input id="announcement-title" placeholder="e.g., Upcoming Holiday Schedule" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-recipients">Recipients</Label>
              <Select>
                <SelectTrigger id="announcement-recipients">
                  <SelectValue placeholder="Select recipients (e.g., All Students, Class 5A)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-students"><Users className="mr-2 h-4 w-4 inline-block" />All Students</SelectItem>
                  <SelectItem value="all-parents"><User className="mr-2 h-4 w-4 inline-block" />All Parents</SelectItem>
                  {mockClasses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea id="announcement-message" placeholder="Type your announcement here..." rows={6} />
            </div>
            <Button size="lg" className="w-full sm:w-auto">
              <Send className="mr-2 h-5 w-5" /> Send Announcement
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><Bell className="mr-2 text-primary" /> Recent Announcements</CardTitle>
            <CardDescription>Overview of recently sent communications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecentAnnouncements.length > 0 ? (
              mockRecentAnnouncements.map(ann => (
                <div key={ann.id} className="p-3 border rounded-md bg-secondary/50">
                  <h4 className="font-semibold text-sm">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground">To: {ann.recipients}</p>
                  <p className="text-xs text-muted-foreground">Date: {ann.date}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent announcements.</p>
            )}
             <Button variant="outline" className="w-full mt-4">View All Announcements</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
