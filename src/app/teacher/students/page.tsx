// src/app/teacher/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PlusCircle, Search, MoreHorizontal, Eye, Edit, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentFromAPI {
  id: string | number;
  username: string;
  email: string;
  // Add other fields your API might return, e.g., classLevel, overallProgress, lastLogin
  // For now, we'll mock these or derive them if not directly available
  role: string; // Should be 'Student'
  // Mocking these for now, as they might not be directly on the CustomUser model from /api/users/
  classLevel?: number; 
  overallProgress?: number; 
  lastLogin?: string; 
  avatarUrl?: string; // if available
}

interface Student extends StudentFromAPI {
  classLevel: number; // ensure it's number
  overallProgress: number;
  lastLogin: string;
}


export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data: StudentFromAPI[] = await api.get<StudentFromAPI[]>('/users/?role=Student');
        // Transform API data if necessary, e.g., for missing fields like classLevel, progress
        const transformedData = data.map(s => ({
          ...s,
          classLevel: s.classLevel || 0, // Placeholder if not in API response
          overallProgress: s.overallProgress || 0, // Placeholder
          lastLogin: s.lastLogin || 'N/A', // Placeholder
        }));
        setStudents(transformedData);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(err instanceof Error ? err.message : "Failed to load student data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 text-primary" /> Manage Students</h1>
          <p className="text-muted-foreground">View, edit, and manage student profiles and progress.</p>
        </div>
        <Button size="lg" onClick={() => alert("Add New Student - To be implemented")}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>Student Roster</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students by name or email..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : error ? (
             <p className="text-red-500 text-center py-4">{error}</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students found{searchTerm && ' matching your search'}.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Class</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatarUrl} alt={student.username} data-ai-hint="student avatar"/>
                            <AvatarFallback>{student.username.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">{student.classLevel || 'N/A'}</TableCell>
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
                            <DropdownMenuItem onClick={() => alert(`Edit student ${student.id} - TBI`)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert(`Message student ${student.id} - TBI`)}><MessageSquare className="mr-2 h-4 w-4" /> Send Message</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
