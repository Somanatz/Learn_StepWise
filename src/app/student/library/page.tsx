
// src/app/student/library/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Library } from "lucide-react";

export default function StudentLibraryPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold">
            <Library className="mr-3 h-7 w-7 text-primary" /> Resource Library
          </CardTitle>
          <CardDescription>
            Access additional learning materials, books, and resources for your subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A list of available books, documents, and other resources will be displayed here, filterable by subject or class.
          </p>
          {/* TODO: Fetch and display books and other resources */}
        </CardContent>
      </Card>
    </div>
  );
}
