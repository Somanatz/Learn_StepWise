
// src/app/school-admin/[schoolId]/communication/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SchoolAdminCommunicationPage() {
  const params = useParams();
  const schoolId = params.schoolId;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold flex items-center">
        <MessageSquare className="mr-3 text-primary" /> School Communication (ID: {schoolId})
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Send Announcements</CardTitle>
          <CardDescription>Broadcast messages to all students, teachers, or parents in the school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="announcement-title-school">Title</Label>
            <Input id="announcement-title-school" placeholder="Announcement Title" />
          </div>
           <div>
            <Label htmlFor="announcement-target-school">Target Audience</Label>
            {/* TODO: Add select for All, Students, Teachers, Parents, Specific Classes */}
            <Input id="announcement-target-school" placeholder="e.g., All Parents" />
          </div>
          <div>
            <Label htmlFor="announcement-message-school">Message</Label>
            <Textarea id="announcement-message-school" placeholder="Type your announcement..." rows={5} />
          </div>
          <Button>
            <Send className="mr-2 h-4 w-4" /> Send Announcement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
