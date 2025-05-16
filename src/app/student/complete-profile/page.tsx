
// src/app/student/complete-profile/page.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserCheck } from 'lucide-react';
import type { Class, School as SchoolInterface } from '@/interfaces'; // Assuming these are defined for dropdowns

const studentProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  school_id: z.string().min(1, "School selection is required"), // Store as string (ID)
  enrolled_class_id: z.string().min(1, "Class selection is required"), // Store as string (ID)
  preferred_language: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  place_of_birth: z.string().optional(),
  date_of_birth: z.string().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Invalid date" }).optional(),
  blood_group: z.string().optional(),
  needs_assistant_teacher: z.boolean().default(false),
  admission_number: z.string().min(1, 'Admission number is required'),
  parent_email_for_linking: z.string().email({message: "Invalid parent email"}).optional().or(z.literal('')),
  parent_mobile_for_linking: z.string().optional(),
  hobbies: z.string().optional(),
  favorite_sports: z.string().optional(),
  interested_in_gardening_farming: z.boolean().default(false),
});

type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;

export default function CompleteStudentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]); // Using 'any' for now, replace with SchoolInterface
  const [classes, setClasses] = useState<any[]>([]); // Using 'any' for now, replace with Class interface
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);


  const form = useForm<StudentProfileFormValues>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      full_name: '',
      preferred_language: 'en',
      needs_assistant_teacher: false,
      interested_in_gardening_farming: false,
    },
  });
  
  useEffect(() => {
    const fetchSchools = async () => {
        try {
            const schoolData = await api.get<SchoolInterface[]>('/schools/');
            setSchools(schoolData);
        } catch (error) {
            toast({ title: "Error", description: "Could not load schools.", variant: "destructive" });
        }
    };
    fetchSchools();
  }, [toast]);

  useEffect(() => {
    const fetchClassesForSchool = async (schoolId: string) => {
        if (!schoolId) {
            setClasses([]);
            form.resetField("enrolled_class_id"); // Reset class if school changes
            return;
        }
        try {
            // Assuming an endpoint like /classes/?school_id={schoolId}
            const classData = await api.get<Class[]>(`/classes/?school=${schoolId}`);
            setClasses(classData);
        } catch (error) {
            toast({ title: "Error", description: "Could not load classes for the selected school.", variant: "destructive" });
            setClasses([]);
        }
    };

    if (selectedSchoolId) {
        fetchClassesForSchool(selectedSchoolId);
    }
  }, [selectedSchoolId, toast, form]);


  const onSubmit = async (data: StudentProfileFormValues) => {
    if (!currentUser || currentUser.role !== 'Student') {
      toast({ title: "Error", description: "Invalid user role for this profile.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // The API endpoint should update the StudentProfile linked to the currentUser
      // Backend needs CustomUserViewSet -> update_profile action or similar to handle this
      const payload = {
          ...data,
          school: data.school_id, // Send ID
          enrolled_class: data.enrolled_class_id, // Send ID
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : null,
      };
      delete payload.school_id; // Remove temp fields
      delete payload.enrolled_class_id;

      await api.patch(`/users/${currentUser.id}/profile/`, payload);
      toast({ title: "Profile Completed!", description: "Your student profile has been updated." });
      router.push('/student'); // Redirect to student dashboard
    } catch (error: any) {
      toast({ title: "Profile Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingAuth) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (!currentUser) {
      router.push('/login'); // Should not happen if page is protected
      return null;
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Student Profile</CardTitle>
          <CardDescription className="text-center">Tell us a bit more about yourself to personalize your learning experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="school_id" render={({ field }) => (
                  <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger></FormControl>
                          <SelectContent>
                              {schools.map(school => <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )} />

              <FormField control={form.control} name="enrolled_class_id" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Class to Enroll In</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSchoolId || classes.length === 0}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your class" /></SelectTrigger></FormControl>
                          <SelectContent>
                              {classes.map(cls => <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                       {!selectedSchoolId && <FormDescription className="text-xs">Please select a school first.</FormDescription>}
                       {selectedSchoolId && classes.length === 0 && <FormDescription className="text-xs">No classes found for this school or still loading.</FormDescription>}
                  </FormItem>
              )} />

              <FormField control={form.control} name="admission_number" render={({ field }) => (
                <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="parent_email_for_linking" render={({ field }) => (
                <FormItem><FormLabel>Parent's Email for Linking (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              {/* Add other fields similarly: preferred_language, father_name, mother_name, etc. */}
              <FormField control={form.control} name="preferred_language" render={({ field }) => (
                <FormItem><FormLabel>Preferred Language (e.g., en, es)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
