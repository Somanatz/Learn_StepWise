
// src/app/teacher/complete-profile/page.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserCheck } from 'lucide-react';
import type { School as SchoolInterface, Class as ClassInterface, Subject as SubjectInterface } from '@/interfaces';

const teacherProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  school_id: z.string().min(1, "School selection is required"),
  assigned_classes_ids: z.array(z.string()).optional(), // Array of class IDs
  subject_expertise_ids: z.array(z.string()).optional(), // Array of subject IDs
  interested_in_tuition: z.boolean().default(false),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
});

type TeacherProfileFormValues = z.infer<typeof teacherProfileSchema>;

export default function CompleteTeacherProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]); // Classes for selected school
  const [subjects, setSubjects] = useState<any[]>([]); // Subjects for selected school/classes
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);


  const form = useForm<TeacherProfileFormValues>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      full_name: '',
      interested_in_tuition: false,
      assigned_classes_ids: [],
      subject_expertise_ids: [],
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const schoolData = await api.get<SchoolInterface[]>('/schools/');
            setSchools(schoolData);
            // Fetch all subjects initially, or filter later based on school
            const subjectData = await api.get<SubjectInterface[]>('/subjects/');
            setSubjects(subjectData);
        } catch (error) {
            toast({ title: "Error", description: "Could not load initial data for profile.", variant: "destructive" });
        }
    };
    fetchInitialData();
  }, [toast]);

  useEffect(() => {
    const fetchClassesForSchool = async (schoolId: string) => {
        if (!schoolId) {
            setClasses([]);
            form.resetField("assigned_classes_ids");
            return;
        }
        try {
            const classData = await api.get<ClassInterface[]>(`/classes/?school=${schoolId}`);
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


  const onSubmit = async (data: TeacherProfileFormValues) => {
    if (!currentUser || currentUser.role !== 'Teacher') return;
    setIsLoading(true);
    try {
      const payload = {
          ...data,
          school: data.school_id,
          assigned_classes: data.assigned_classes_ids,
          subject_expertise: data.subject_expertise_ids,
      };
      delete payload.school_id;
      delete payload.assigned_classes_ids;
      delete payload.subject_expertise_ids;

      await api.patch(`/users/${currentUser.id}/profile/`, payload);
      toast({ title: "Profile Completed!", description: "Your teacher profile has been updated." });
      router.push('/teacher');
    } catch (error: any) {
      toast({ title: "Profile Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingAuth) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (!currentUser) { router.push('/login'); return null; }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Teacher Profile</CardTitle>
          <CardDescription className="text-center">Set up your teaching preferences and details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="school_id" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Your School</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger></FormControl>
                          <SelectContent>
                              {schools.map(school => <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )} />

              <FormField control={form.control} name="assigned_classes_ids" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Classes You Teach (Optional)</FormLabel>
                      {classes.length > 0 ? classes.map(cls => (
                          <FormField key={cls.id} control={form.control} name="assigned_classes_ids"
                              render={({ field: itemField }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                              checked={itemField.value?.includes(String(cls.id))}
                                              onCheckedChange={(checked) => {
                                                  return checked
                                                      ? itemField.onChange([...(itemField.value || []), String(cls.id)])
                                                      : itemField.onChange( (itemField.value || []).filter( (value) => value !== String(cls.id) ) );
                                              }} />
                                      </FormControl>
                                      <FormLabel className="font-normal">{cls.name}</FormLabel>
                                  </FormItem>
                              )}
                          />
                      )) : <p className="text-xs text-muted-foreground">Select a school to see available classes.</p>}
                      <FormMessage />
                  </FormItem>
              )} />
              
               <FormField control={form.control} name="subject_expertise_ids" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Subjects You Specialize In (Optional)</FormLabel>
                       {subjects.length > 0 ? subjects.map(sub => (
                          <FormField key={sub.id} control={form.control} name="subject_expertise_ids"
                              render={({ field: itemField }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                              checked={itemField.value?.includes(String(sub.id))}
                                              onCheckedChange={(checked) => {
                                                  return checked
                                                      ? itemField.onChange([...(itemField.value || []), String(sub.id)])
                                                      : itemField.onChange( (itemField.value || []).filter( (value) => value !== String(sub.id) ) );
                                              }} />
                                      </FormControl>
                                      <FormLabel className="font-normal">{sub.name} {sub.class_obj_name ? `(${sub.class_obj_name})` : ''}</FormLabel>
                                  </FormItem>
                              )}
                          />
                      )) : <p className="text-xs text-muted-foreground">Loading subjects...</p>}
                      <FormMessage />
                  </FormItem>
              )} />


              <FormField control={form.control} name="mobile_number" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="interested_in_tuition" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Interested in providing private tuition?</FormLabel>
                </FormItem>
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

