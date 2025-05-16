
// src/app/parent/complete-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserCheck, Link2 } from 'lucide-react';

const parentProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
  // For linking child
  student_admission_number: z.string().optional(),
  student_school_id_code: z.string().optional(),
});

type ParentProfileFormValues = z.infer<typeof parentProfileSchema>;

export default function CompleteParentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkingChild, setIsLinkingChild] = useState(false);

  const form = useForm<ParentProfileFormValues>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: { full_name: '' },
  });

  const onSubmitProfile = async (data: ParentProfileFormValues) => {
    if (!currentUser || currentUser.role !== 'Parent') return;
    setIsLoading(true);
    try {
      const profileData = {
        full_name: data.full_name,
        mobile_number: data.mobile_number,
        address: data.address,
      };
      await api.patch(`/users/${currentUser.id}/profile/`, profileData);
      toast({ title: "Profile Updated!", description: "Your parent profile has been saved." });
      // router.push('/parent'); // Or stay on page if they want to link child
    } catch (error: any) {
      toast({ title: "Profile Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onLinkChild = async () => {
    if (!currentUser) return;
    const { student_admission_number, student_school_id_code } = form.getValues();
    if (!student_admission_number || !student_school_id_code) {
        toast({title: "Missing Info", description: "Student admission number and school ID code are required to link.", variant: "default"});
        return;
    }
    setIsLinkingChild(true);
    try {
        const linkData = {
            admission_number: student_admission_number,
            school_id_code: student_school_id_code,
            // Parent email is implicitly current user's email on backend for verification
        };
        // This endpoint needs to be created: /api/parent-student-links/link-child-by-admission/
        const response = await api.post('/parent-student-links/link-child-by-admission/', linkData);
        toast({ title: "Child Linked Successfully!", description: `Student ${response.student_username} is now linked.` });
        form.resetField("student_admission_number");
        form.resetField("student_school_id_code");
    } catch (error: any) {
        toast({ title: "Child Linking Failed", description: error.message || "Could not link child.", variant: "destructive" });
    } finally {
        setIsLinkingChild(false);
    }
  };
  
  if (isLoadingAuth) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (!currentUser) { router.push('/login'); return null; }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Parent Profile</CardTitle>
          <CardDescription className="text-center">Provide your details and link your children.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mobile_number" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Save Profile Information
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">Link Your Child</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Enter your child's admission number and their school's ID code. Your email ({currentUser.email}) will be used for verification against the student's record.
                </p>
                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <FormField control={form.control} name="student_admission_number" render={({ field }) => (
                        <FormItem><FormLabel>Child's Admission Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="student_school_id_code" render={({ field }) => (
                        <FormItem><FormLabel>Child's School ID Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <Button onClick={onLinkChild} className="w-full" variant="outline" disabled={isLinkingChild}>
                    {isLinkingChild ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                    Link Child Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">You can link more children from your dashboard later.</p>
            </div>
            <Button onClick={() => router.push('/parent')} className="mt-6 w-full" variant="secondary">
                Go to Parent Dashboard
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
