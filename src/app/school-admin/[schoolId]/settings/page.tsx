
// src/app/school-admin/[schoolId]/settings/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function SchoolAdminSettingsPage() {
  const params = useParams();
  const schoolId = params.schoolId;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold flex items-center">
        <Settings className="mr-3 text-primary" /> School Settings (ID: {schoolId})
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>School Configuration</CardTitle>
          <CardDescription>Manage general settings, academic years, and integration options for your school.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">School setting options will be available here.</p>
          {/* TODO: Form to update school details, manage academic terms, etc. */}
          <Button className="mt-4">Save School Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
