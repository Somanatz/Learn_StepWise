// src/app/parent/children/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, FileText, PlusCircle, MessageSquare, Loader2, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ChildFromAPI {
  id: string;
  student: { id: string; username: string; avatarUrl?: string; classLevel?: number; }; // Assuming student is nested
  // Add other fields returned by ParentStudentLink serializer
  student_username: string; // From serializer
}

interface DisplayChild {
  id: string; // This is the ParentStudentLink ID
  studentId: string;
  name: string;
  avatarUrl?: string;
  classLevel: number;
  overallProgress: number; // This might need to be fetched separately or mocked
  lastActivity?: string; // This might need to be fetched separately or mocked
}

const linkChildSchema = z.object({
  student_username_or_email: z.string().min(1, "Student username or email is required"),
});
type LinkChildFormValues = z.infer<typeof linkChildSchema>;

export default function MyChildrenPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [linkedChildren, setLinkedChildren] = useState<DisplayChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinkChildDialogOpen, setIsLinkChildDialogOpen] = useState(false);

  const form = useForm<LinkChildFormValues>({
    resolver: zodResolver(linkChildSchema),
    defaultValues: { student_username_or_email: "" },
  });

  const fetchLinkedChildren = async () => {
    if (!currentUser || currentUser.role !== 'Parent') return;
    setIsLoading(true);
    setError(null);
    try {
      // API returns ParentStudentLink objects. We need student details.
      // The ParentStudentLinkSerializer should provide student_username.
      // For more details like avatar or progress, separate calls or a more detailed endpoint would be needed.
      const links: any[] = await api.get<any[]>(`/parent-student-links/?parent=${currentUser.id}`);
      
      // Mocking progress and activity for now as it's not directly in ParentStudentLink
      const displayChildren: DisplayChild[] = links.map(link => ({
        id: link.id, // ParentStudentLink ID
        studentId: link.student, // Student's actual ID
        name: link.student_username || "Unknown Student",
        avatarUrl: `https://placehold.co/100x100.png?text=${(link.student_username || "U").charAt(0)}`, // Placeholder avatar
        classLevel: 0, // Mocked - needs to come from student's profile
        overallProgress: Math.floor(Math.random() * 50) + 50, // Mocked
        lastActivity: "Mocked Activity", // Mocked
      }));
      setLinkedChildren(displayChildren);
    } catch (err) {
      console.error("Failed to fetch linked children:", err);
      setError(err instanceof Error ? err.message : "Failed to load children data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedChildren();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const onLinkChildSubmit = async (data: LinkChildFormValues) => {
    if (!currentUser) return;
    setIsLinking(true);
    try {
      // Backend needs student ID. We only have username/email.
      // This requires backend to resolve username/email to student ID.
      // For now, assuming backend /parent-student-links/ can accept student_username or student_email
      // and resolve it. Or, the frontend would first query /users/ to find student_id.
      // Let's assume a simplified scenario where backend handles student lookup by username.
      
      // Simplified: Fetch user by username/email to get ID (this should ideally be one backend call)
      let studentToLink = null;
      try {
        const usersByName = await api.get<any[]>(`/users/?username=${data.student_username_or_email}`);
        if (usersByName.length > 0 && usersByName[0].role === 'Student') {
            studentToLink = usersByName[0];
        } else {
            const usersByEmail = await api.get<any[]>(`/users/?email=${data.student_username_or_email}`);
            if (usersByEmail.length > 0 && usersByEmail[0].role === 'Student') {
                studentToLink = usersByEmail[0];
            }
        }
      } catch (findErr) {
        toast({ title: "Error Finding Student", description: "Could not verify student details.", variant: "destructive" });
        setIsLinking(false);
        return;
      }

      if (!studentToLink) {
        toast({ title: "Student Not Found", description: "No student found with that username or email, or user is not a student.", variant: "destructive" });
        setIsLinking(false);
        return;
      }

      await api.post('/parent-student-links/', {
        parent: currentUser.id,
        student: studentToLink.id,
      });
      toast({ title: "Child Linked Successfully!", description: `${studentToLink.username} is now linked.` });
      fetchLinkedChildren(); // Refresh list
      setIsLinkChildDialogOpen(false);
      form.reset();
    } catch (err: any) {
      toast({ title: "Linking Failed", description: err.message || "Could not link child.", variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkChild = async (linkId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unlink ${studentName}?`)) return;
    try {
        await api.delete(`/parent-student-links/${linkId}/`);
        toast({ title: "Child Unlinked", description: `${studentName} has been unlinked.` });
        fetchLinkedChildren(); // Refresh list
    } catch (err:any) {
        toast({ title: "Unlinking Failed", description: err.message || "Could not unlink child.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/3" /> <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
     return <Card className="text-center py-10"><CardContent><AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" /><CardTitle>Error Loading Children</CardTitle><CardDescription>{error}</CardDescription></CardContent></Card>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><Users className="mr-3 text-primary" /> My Children</h1>
          <p className="text-muted-foreground">Manage your children's profiles and access their learning information.</p>
        </div>
        <Dialog open={isLinkChildDialogOpen} onOpenChange={setIsLinkChildDialogOpen}>
            <DialogTrigger asChild>
                <Button size="lg" onClick={() => setIsLinkChildDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Link Another Child
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link a New Child</DialogTitle>
                    <DialogDescription>Enter the username or email of the student you wish to link.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onLinkChildSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="student_username_or_email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Student's Username or Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., student_alex or alex@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsLinkChildDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLinking}>
                                {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Link Child
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      {linkedChildren.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {linkedChildren.map(child => (
            <Card key={child.id} className="shadow-lg hover:shadow-xl transition-shadow rounded-xl flex flex-col">
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage src={child.avatarUrl} alt={child.name} data-ai-hint="child avatar"/>
                  <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{child.name}</CardTitle>
                  <CardDescription>Class {child.classLevel || 'N/A'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-bold text-primary">{child.overallProgress}%</span>
                  </div>
                  <Progress value={child.overallProgress} aria-label={`${child.name}'s overall progress`} />
                </div>
                {child.lastActivity && (
                  <p className="text-sm text-muted-foreground"><strong className="font-medium text-foreground">Recent Activity:</strong> {child.lastActivity}</p>
                )}
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
                <Button variant="default" asChild className="w-full">
                  <Link href={`/parent/child/${child.studentId}/progress`}><TrendingUp className="mr-2 h-4 w-4" />View Progress</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                   <Link href={`/parent/reports/${child.studentId}`}><FileText className="mr-2 h-4 w-4" />View Report</Link>
                </Button>
                <Button variant="ghost" className="w-full col-span-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleUnlinkChild(child.id, child.name)}>
                   <Trash2 className="mr-2 h-4 w-4" /> Unlink Child
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10 rounded-xl shadow-md">
          <CardHeader>
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Children Linked</CardTitle>
            <CardDescription>It looks like you haven't linked any children to your account yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => setIsLinkChildDialogOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Link Your First Child
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
