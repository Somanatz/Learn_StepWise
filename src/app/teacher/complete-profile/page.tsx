
// src/app/teacher/complete-profile/page.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserCheck, Upload, School as SchoolIcon } from 'lucide-react';
import type { School as SchoolInterface, Class as ClassInterface, Subject as SubjectInterface } from '@/interfaces';

const teacherProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  school_id: z.string().min(1, "School selection is required"),
  assigned_classes_ids: z.array(z.string()).optional(), 
  subject_expertise_ids: z.array(z.string()).optional(),
  interested_in_tuition: z.boolean().default(false).optional(),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
  profile_picture: z.any().optional(),
});

type TeacherProfileFormValues = z.infer<typeof teacherProfileSchema>;

export default function CompleteTeacherProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth, setCurrentUser, setNeedsProfileCompletion } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [classes, setClasses] = useState<ClassInterface[]>([]); 
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(undefined);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);

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
    if (!isLoadingAuth && !currentUser) {
      setIsRedirecting(true);
      router.push('/login');
    } else if (currentUser && currentUser.role !== 'Teacher') {
      setIsRedirecting(true);
      router.push('/');
    }
  }, [isLoadingAuth, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
        api.get<SchoolInterface[]>('/schools/').then(setSchools).catch(err => toast({ title: "Error", description: "Could not load schools.", variant: "destructive" }));
        api.get<{results: SubjectInterface[]} | SubjectInterface[]>('/subjects/').then(res => {
            const subjectData = Array.isArray(res) ? res : res.results;
            setSubjects(subjectData);
        }).catch(err => toast({ title: "Error", description: "Could not load subjects.", variant: "destructive" }));
        
        const tp = currentUser.teacher_profile;
        if (tp) {
            form.reset({
                full_name: tp.full_name || '',
                school_id: tp.school ? String(tp.school) : undefined,
                assigned_classes_ids: tp.assigned_classes?.map(String) || [],
                subject_expertise_ids: tp.subject_expertise?.map(String) || [],
                interested_in_tuition: tp.interested_in_tuition || false,
                mobile_number: tp.mobile_number || '',
                address: tp.address || '',
            });
            if (tp.school) setSelectedSchoolId(String(tp.school));
            if (tp.profile_picture_url) setPreviewProfilePicture(tp.profile_picture_url);
        }
    }
  }, [currentUser, form, toast]);

  useEffect(() => {
    const fetchClassesForSchool = async (schoolId: string) => {
        if (!schoolId) {
            setClasses([]);
            form.setValue("assigned_classes_ids", []);
            return;
        }
        try {
            const classResponse = await api.get<{ results: ClassInterface[] } | ClassInterface[]>(`/classes/?school=${schoolId}`);
            const classData = Array.isArray(classResponse) ? classResponse : classResponse.results;
            setClasses(classData);
        } catch (error) {
            toast({ title: "Error", description: "Could not load classes for selected school.", variant: "destructive" });
            setClasses([]);
        }
    };
    if (selectedSchoolId) {
        fetchClassesForSchool(selectedSchoolId);
    } else {
        setClasses([]);
        form.setValue("assigned_classes_ids", []);
    }
  }, [selectedSchoolId, toast, form]);


  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedProfilePictureFile(file);
      setPreviewProfilePicture(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: TeacherProfileFormValues) => {
    if (!currentUser || currentUser.role !== 'Teacher') return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        const K = key as keyof TeacherProfileFormValues;
        if (K === 'profile_picture') return; 
        
        const value = data[K];
        if (K === 'assigned_classes_ids' || K === 'subject_expertise_ids') {
            (value as string[] | undefined)?.forEach(id => formData.append(K, id));
        } else if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                formData.append(key, String(value));
            } else if (typeof value === 'string' && value.trim() !== '') {
                 formData.append(key, value);
            } else if (typeof value === 'number') {
                formData.append(key, String(value));
            }
        }
    });
    formData.append('profile_completed', 'true');

    if (selectedProfilePictureFile) {
      formData.append('profile_picture', selectedProfilePictureFile);
    }

    try {
      const updatedUser = await api.patch<any>(`/users/${currentUser.id}/profile/`, formData, true);
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser, teacher_profile: updatedUser.teacher_profile || prev.teacher_profile, profile_completed: true } : null);
      setNeedsProfileCompletion(false);
      toast({ title: "Profile Completed!", description: "Your teacher profile has been updated." });
      router.push('/teacher');
    } catch (error: any) {
      let errorMessage = "Could not update profile.";
        if (error.response && error.response.data) {
            const errorData = error.response.data;
             if (typeof errorData === 'object' && errorData !== null) {
                errorMessage = Object.entries(errorData).map(([k, v]) => `${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`).join('; ');
            } else { errorMessage = String(errorData); }
        } else if (error.message) { errorMessage = error.message; }
      toast({ title: "Profile Update Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingAuth || isRedirecting || (!isLoadingAuth && !currentUser)) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const defaultAvatarText = (currentUser?.username || 'T').charAt(0).toUpperCase();

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
              <div className="flex flex-col items-center space-y-3 mb-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={previewProfilePicture || `https://placehold.co/150x150.png?text=${defaultAvatarText}`} alt={currentUser?.username} data-ai-hint="profile teacher"/>
                  <AvatarFallback>{defaultAvatarText}</AvatarFallback>
                </Avatar>
                <FormField control={form.control} name="profile_picture" render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-picture-upload-teacher" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload size={16}/> Change Profile Picture
                    </FormLabel>
                    <FormControl><Input id="profile-picture-upload-teacher" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="school_id" render={({ field }) => (
                  <FormItem>
                      <FormLabel><SchoolIcon className="inline mr-1 h-4 w-4"/>Your School</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); form.setValue('assigned_classes_ids', []); }} value={field.value ?? undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger></FormControl>
                          <SelectContent>{schools.map(school => <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                  </FormItem>
              )} />

              <FormField control={form.control} name="assigned_classes_ids" render={() => (
                  <FormItem>
                      <FormLabel>Classes You Teach (Optional)</FormLabel>
                      {classes.length > 0 ? classes.map(cls => (
                          <FormField key={cls.id} control={form.control} name="assigned_classes_ids"
                              render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                              checked={field.value?.includes(String(cls.id))}
                                              onCheckedChange={(checked) => {
                                                  const currentValues = field.value || [];
                                                  return checked
                                                      ? field.onChange([...currentValues, String(cls.id)])
                                                      : field.onChange(currentValues.filter( (value) => value !== String(cls.id) ) );
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
              
               <FormField control={form.control} name="subject_expertise_ids" render={() => (
                  <FormItem>
                      <FormLabel>Subjects You Specialize In (Optional)</FormLabel>
                       {subjects.length > 0 ? subjects.map(sub => (
                          <FormField key={sub.id} control={form.control} name="subject_expertise_ids"
                              render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                              checked={field.value?.includes(String(sub.id))}
                                              onCheckedChange={(checked) => {
                                                  const currentValues = field.value || [];
                                                  return checked
                                                      ? field.onChange([...currentValues, String(sub.id)])
                                                      : field.onChange(currentValues.filter( (value) => value !== String(sub.id) ) );
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
                <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="interested_in_tuition" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                    <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} id="interested_in_tuition"/></FormControl>
                    <FormLabel htmlFor="interested_in_tuition" className="font-normal cursor-pointer">Interested in providing private tuition?</FormLabel>
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Save Profile & Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
