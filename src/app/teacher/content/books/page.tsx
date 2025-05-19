
// src/app/teacher/content/books/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, PlusCircle, UploadCloud, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

// Mock data, replace with API call
const mockBooks = [
  { id: "b1", title: "Algebra Made Easy", author: "Dr. Math", subject: "Mathematics", classLevel: "Class 5", dateAdded: "2024-07-01", fileUrl: "#" },
  { id: "b2", title: "Introduction to Photosynthesis", author: "Bio Teach", subject: "Science", classLevel: "Class 4", dateAdded: "2024-06-15", fileUrl: "#" },
  { id: "b3", title: "World History: Ancient Civilizations", author: "H. Istorian", subject: "History", classLevel: "Class 5", dateAdded: "2024-05-20", fileUrl: "#" },
];

export default function ManageBooksPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><FileText className="mr-3 text-primary" /> Manage Books & Resources</h1>
          <p className="text-muted-foreground">Upload, organize, and share supplementary materials with your students.</p>
        </div>
        <Button size="lg" onClick={() => alert("Open 'Upload Book' dialog - TBI")}>
          <UploadCloud className="mr-2 h-5 w-5" /> Upload New Resource
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>Uploaded Resources</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources by title or subject..." 
                className="pl-9" 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Subject</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Class</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBooks.map((book) => (
                  <TableRow key={book.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{book.author}</TableCell>
                    <TableCell className="hidden sm:table-cell">{book.subject}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{book.classLevel}</TableCell>
                    <TableCell>{book.dateAdded}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Edit" asChild>
                        {/* <Link href={`/teacher/content/books/${book.id}/edit`}> <Edit2 className="h-4 w-4" /> </Link> */}
                        <a> <Edit2 className="h-4 w-4" /> </a>
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {mockBooks.length === 0 && <p className="text-muted-foreground text-center py-4">No books or resources uploaded yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
