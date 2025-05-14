// src/app/teacher/content/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCopy, ListChecks, UploadCloud, PlusCircle, Edit2, Trash2 } from "lucide-react";

interface ContentItem {
  id: string;
  type: "lesson" | "quiz" | "resource";
  title: string;
  description: string;
  dateCreated: string;
  status: "published" | "draft";
}

const mockContent: ContentItem[] = [
  { id: "c1", type: "lesson", title: "Introduction to Algebra", description: "Covers basic algebraic concepts, variables, and equations.", dateCreated: "2024-06-10", status: "published" },
  { id: "c2", type: "quiz", title: "Algebra Basics Quiz", description: "Assesses understanding of introductory algebra.", dateCreated: "2024-06-15", status: "published" },
  { id: "c3", type: "resource", title: "Periodic Table Poster", description: "A high-resolution printable periodic table.", dateCreated: "2024-05-20", status: "draft" },
  { id: "c4", type: "lesson", title: "The Renaissance Period", description: "An overview of key figures and events of the Renaissance.", dateCreated: "2024-07-01", status: "published" },
];

export default function ContentManagementPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><BookCopy className="mr-3 text-primary" /> Content Management</h1>
          <p className="text-muted-foreground">Create, organize, and manage your educational lessons, quizzes, and resources.</p>
        </div>
         <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Content
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <CardHeader className="flex-row items-center gap-4">
            <BookCopy className="h-10 w-10 text-primary" />
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>Manage interactive lessons.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create engaging lessons with text, images, videos, and interactive elements.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Manage Lessons</Button>
          </CardFooter>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <CardHeader className="flex-row items-center gap-4">
            <ListChecks className="h-10 w-10 text-accent" />
            <div>
              <CardTitle>Quizzes & Assessments</CardTitle>
              <CardDescription>Build and assign quizzes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Design quizzes with various question types to assess student understanding.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Manage Quizzes</Button>
          </CardFooter>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
          <CardHeader className="flex-row items-center gap-4">
            <UploadCloud className="h-10 w-10 text-green-500" />
            <div>
              <CardTitle>Resources & Files</CardTitle>
              <CardDescription>Upload and share materials.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Share documents, presentations, videos, and other learning materials.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Manage Resources</Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Recently Created Content</CardTitle>
          <CardDescription>Overview of your latest lessons, quizzes, and resources.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockContent.length > 0 ? (
            <div className="space-y-4">
              {mockContent.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {item.type === "lesson" && <BookCopy className="h-6 w-6 text-primary flex-shrink-0" />}
                    {item.type === "quiz" && <ListChecks className="h-6 w-6 text-accent flex-shrink-0" />}
                    {item.type === "resource" && <UploadCloud className="h-6 w-6 text-green-500 flex-shrink-0" />}
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.description.substring(0, 70)}...</p>
                      <p className="text-xs text-muted-foreground">Created: {item.dateCreated} - 
                        <span className={`ml-1 font-medium ${item.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No content created yet. Start by clicking "Create New Content".</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
