// src/app/teacher/students/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PlusCircle, Search, MoreHorizontal, Eye, Edit, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  email: string;
  overallProgress: number;
  lastLogin: string;
}

const mockStudents: Student[] = [
  { id: "s1", name: "Alex Johnson", avatarUrl: "https://placehold.co/40x40.png?text=AJ", classLevel: 5, email: "alex.j@example.com", overallProgress: 75, lastLogin: "2 hours ago" },
  { id: "s2", name: "Maria Garcia", classLevel: 5, email: "maria.g@example.com", overallProgress: 88, lastLogin: "1 day ago" },
  { id: "s3", name: "David Lee", avatarUrl: "https://placehold.co/40x40.png?text=DL", classLevel: 4, email: "david.l@example.com", overallProgress: 60, lastLogin: "5 hours ago" },
  { id: "s4", name: "Sarah Miller", classLevel: 4, email: "sarah.m@example.com", overallProgress: 92, lastLogin: "15 mins ago" },
  { id: "s5", name: "Chen Wang", avatarUrl: "https://placehold.co/40x40.png?text=CW", classLevel: 5, email: "chen.w@example.com", overallProgress: 70, lastLogin: "3 days ago" },
];

export default function ManageStudentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 text-primary" /> Manage Students</h1>
          <p className="text-muted-foreground">View, edit, and manage student profiles and progress.</p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>Student Roster</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="student avatar"/>
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{student.classLevel}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={student.overallProgress > 70 ? "default" : "secondary"} className={student.overallProgress > 85 ? "bg-green-500 hover:bg-green-600 text-white" : student.overallProgress < 60 ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                        {student.overallProgress}%
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center text-muted-foreground">{student.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/students/${student.id}/view`}><Eye className="mr-2 h-4 w-4" /> View Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                          <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" /> Send Message</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
