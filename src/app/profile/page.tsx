
// src/app/profile/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, Edit3, Shield, LogOut, Mail, Briefcase, BookUser, Star, Languages, Loader2, Building, CalendarClock, Droplets, HeartPulse, Gamepad2, Leaf, Upload } from "lucide-react";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole, StudentProfileData, TeacherProfileData, ParentProfileData, School as SchoolInterface, Class as ClassInterface, Subject as SubjectInterface } from '@/interfaces';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


// Schemas for different profile types
const baseProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  profile_picture: z.any().optional(), // For file upload
});

const studentSpecificSchema = z.object({
  full_name: z.string().optional(),
  school_id: z.string().optional(),
  enrolled_class_id: z.string().optional(),
  preferred_language: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  place_of_birth: z.string().optional(),
  date_of_birth: z.string().optional(),
  blood_group: z.string().optional(),
  needs_assistant_teacher: z.boolean().optional(),
  admission_number: z.string().optional(),
  parent_email_for_linking: z.string().email({ message: "Invalid parent email" }).optional().or(z.literal('')),
  parent_mobile_for_linking: z.string().optional(),
  hobbies: z.string().optional(),
  favorite_sports: z.string().optional(),
  interested_in_gardening_farming: z.boolean().optional(),
});

const teacherSpecificSchema = z.object({
  full_name: z.string().optional(),
  school_id: z.string().optional(),
  assigned_classes_ids: z.array(z.string()).optional(),
  subject_expertise_ids: z.array(z.string()).optional(),
  interested_in_tuition: z.boolean().optional(),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
});

const parentSpecificSchema = z.object({
  full_name: z.string().optional(),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
});

const profileSchema = baseProfileSchema.merge(studentSpecificSchema).merge(teacherSpecificSchema).merge(parentSpecificSchema)
.refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, isLoadingAuth, setCurrentUser, logout } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);


  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [classes, setClasses] = useState<ClassInterface[]>([]);
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', email: '' } 
  });
  
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [schoolData, subjectData] = await Promise.all([
          api.get<SchoolInterface[]>('/schools/'),
          api.get<SubjectInterface[]>('/subjects/') 
        ]);
        setSchools(schoolData);
        setSubjects(subjectData);
      } catch (error) {
        toast({ title: "Error", description: "Could not load data for dropdowns.", variant: "destructive" });
      }
    };
    fetchDropdownData();
  }, [toast]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (selectedSchoolId) {
        try {
          const classData = await api.get<ClassInterface[]>(`/classes/?school=${selectedSchoolId}`);
          setClasses(classData);
        } catch (error) {
          setClasses([]);
          toast({ title: "Error", description: "Could not load classes for the selected school.", variant: "destructive" });
        }
      } else {
        setClasses([]);
      }
    };
    fetchClasses();
  }, [selectedSchoolId, toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      const defaultValues: Partial<ProfileFormValues> = {
        username: currentUser.username || '',
        email: currentUser.email || '',
      };
      let currentProfilePictureUrl: string | null = null;

      if (currentUser.role === 'Student' && currentUser.student_profile) {
        const sp = currentUser.student_profile;
        defaultValues.full_name = sp.full_name;
        defaultValues.school_id = String(sp.school || '');
        if (sp.school) setSelectedSchoolId(String(sp.school));
        defaultValues.enrolled_class_id = String(sp.enrolled_class || '');
        defaultValues.preferred_language = sp.preferred_language;
        defaultValues.father_name = sp.father_name;
        defaultValues.mother_name = sp.mother_name;
        defaultValues.place_of_birth = sp.place_of_birth;
        defaultValues.date_of_birth = sp.date_of_birth ? sp.date_of_birth.split('T')[0] : '';
        defaultValues.blood_group = sp.blood_group;
        defaultValues.needs_assistant_teacher = sp.needs_assistant_teacher;
        defaultValues.admission_number = sp.admission_number;
        defaultValues.parent_email_for_linking = sp.parent_email_for_linking;
        defaultValues.parent_mobile_for_linking = sp.parent_mobile_for_linking;
        defaultValues.hobbies = sp.hobbies;
        defaultValues.favorite_sports = sp.favorite_sports;
        defaultValues.interested_in_gardening_farming = sp.interested_in_gardening_farming;
        currentProfilePictureUrl = (sp as any).profile_picture_url || null; // Access assuming serializer provides it
      } else if (currentUser.role === 'Teacher' && currentUser.teacher_profile) {
        const tp = currentUser.teacher_profile;
        defaultValues.full_name = tp.full_name;
        defaultValues.school_id = String(tp.school || '');
        if (tp.school) setSelectedSchoolId(String(tp.school));
        defaultValues.assigned_classes_ids = tp.assigned_classes?.map(String) || [];
        defaultValues.subject_expertise_ids = tp.subject_expertise?.map(String) || [];
        defaultValues.interested_in_tuition = tp.interested_in_tuition;
        defaultValues.mobile_number = tp.mobile_number;
        defaultValues.address = tp.address;
        currentProfilePictureUrl = (tp as any).profile_picture_url || null;
      } else if (currentUser.role === 'Parent' && currentUser.parent_profile) {
        const pp = currentUser.parent_profile;
        defaultValues.full_name = pp.full_name;
        defaultValues.mobile_number = pp.mobile_number;
        defaultValues.address = pp.address;
        currentProfilePictureUrl = (pp as any).profile_picture_url || null;
      }
      form.reset(defaultValues);
      if (currentProfilePictureUrl) {
        setPreviewProfilePicture(currentProfilePictureUrl);
      }
      setIsPageLoading(false);
    } else if (!isLoadingAuth && !currentUser) {
      setIsPageLoading(false); 
    }
  }, [currentUser, isLoadingAuth, form, toast]);

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedProfilePicture(file);
      setPreviewProfilePicture(URL.createObjectURL(file));
      form.setValue('profile_picture', file); // For RHF validation if needed, actual upload is via FormData
    }
  };


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) return;
    setIsSubmitting(true);

    const formData = new FormData();

    // Append core user fields if changed
    if (data.username && data.username !== currentUser.username) formData.append('username', data.username);
    if (data.email && data.email !== currentUser.email) formData.append('email', data.email);
    if (data.newPassword && data.currentPassword) {
      // Backend needs to handle current password verification
      formData.append('password', data.newPassword); 
    }

    // Append profile-specific fields
    if (currentUser.role === 'Student') {
      data.full_name !== undefined && formData.append('full_name', data.full_name);
      data.school_id !== undefined && formData.append('school_id', data.school_id);
      data.enrolled_class_id !== undefined && formData.append('enrolled_class_id', data.enrolled_class_id);
      // ... (append other student fields similarly, checking if they are defined)
      if (data.date_of_birth) formData.append('date_of_birth', new Date(data.date_of_birth).toISOString().split('T')[0]);
      Object.keys(studentSpecificSchema.shape).forEach(key => {
        const K = key as keyof typeof studentSpecificSchema.shape;
        if (data[K] !== undefined && data[K] !== null && key !== 'date_of_birth' && key !== 'school_id' && key !== 'enrolled_class_id' ) {
             if (typeof data[K] === 'boolean') {
                formData.append(key, String(data[K]));
            } else if (data[K] !== '') { // Don't append empty strings unless intended
                 formData.append(key, data[K] as string);
            }
        }
      });
    } else if (currentUser.role === 'Teacher') {
      data.full_name !== undefined && formData.append('full_name', data.full_name);
      data.school_id !== undefined && formData.append('school_id', data.school_id);
      // ... (append other teacher fields)
      Object.keys(teacherSpecificSchema.shape).forEach(key => {
        const K = key as keyof typeof teacherSpecificSchema.shape;
        if (data[K] !== undefined && data[K] !== null && key !== 'school_id' && key !== 'assigned_classes_ids' && key !== 'subject_expertise_ids' ) {
            if (typeof data[K] === 'boolean') {
                formData.append(key, String(data[K]));
            } else if (data[K] !== '') {
                 formData.append(key, data[K] as string);
            }
        }
      });
      if (data.assigned_classes_ids) data.assigned_classes_ids.forEach(id => formData.append('assigned_classes_ids', id));
      if (data.subject_expertise_ids) data.subject_expertise_ids.forEach(id => formData.append('subject_expertise_ids', id));

    } else if (currentUser.role === 'Parent') {
      data.full_name !== undefined && formData.append('full_name', data.full_name);
      // ... (append other parent fields)
       Object.keys(parentSpecificSchema.shape).forEach(key => {
        const K = key as keyof typeof parentSpecificSchema.shape;
        if (data[K] !== undefined && data[K] !== null) {
            if (data[K] !== '') formData.append(key, data[K] as string);
        }
      });
    }
    
    if (selectedProfilePicture) {
        formData.append('profile_picture', selectedProfilePicture);
    }

    try {
      const updatedUser = await api.patch<any>(`/users/${currentUser.id}/profile/`, formData, true); // true for FormData
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser, 
        student_profile: updatedUser.student_profile || prev.student_profile,
        teacher_profile: updatedUser.teacher_profile || prev.teacher_profile,
        parent_profile: updatedUser.parent_profile || prev.parent_profile,
      } : null);
      toast({ title: "Profile Updated", description: "Your profile information has been successfully updated." });
      if (updatedUser.student_profile?.profile_picture_url) setPreviewProfilePicture(updatedUser.student_profile.profile_picture_url);
      if (updatedUser.teacher_profile?.profile_picture_url) setPreviewProfilePicture(updatedUser.teacher_profile.profile_picture_url);
      if (updatedUser.parent_profile?.profile_picture_url) setPreviewProfilePicture(updatedUser.parent_profile.profile_picture_url);
      setSelectedProfilePicture(null); // Reset selected file

    } catch (error: any) {
        let errorMessage = "Could not update profile.";
        if (error.response && error.response.data) {
            const errorData = error.response.data;
             if (typeof errorData === 'object' && errorData !== null) {
                errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`).join('; ');
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
      toast({ title: "Update Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => { logout(); };

  if (isPageLoading || isLoadingAuth) {
    return <div className="max-w-3xl mx-auto space-y-8 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (!currentUser) {
    return <div className="max-w-3xl mx-auto text-center py-10"><p>Please log in to view your profile.</p><Button onClick={() => window.location.href = '/login'} className="mt-4">Login</Button></div>;
  }

  const defaultAvatarText = (currentUser.username || 'U').charAt(0).toUpperCase();
  const avatarSrc = previewProfilePicture || `https://placehold.co/150x150.png?text=${defaultAvatarText}`;


  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-0">
      <header className="text-center py-8">
        <UserCircle className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold">My Profile</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-xl rounded-xl">
            <CardHeader className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={avatarSrc} alt={currentUser.username} data-ai-hint="profile avatar"/>
                    <AvatarFallback>{defaultAvatarText}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="profile-picture-upload" 
                           className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full cursor-pointer">
                        <Upload size={24} />
                    </label>
                    <Input 
                        id="profile-picture-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                    />
                </div>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-2xl">{form.watch('username') || currentUser.username}</CardTitle>
                  <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1"><Mail className="h-4 w-4" /> {form.watch('email') || currentUser.email}</CardDescription>
                  <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1"><Briefcase className="h-4 w-4" /> Role: <span className="capitalize font-medium text-primary">{currentUser.role}</span></CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center"><Edit3 className="mr-2 h-5 w-5 text-accent" /> Basic Information</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
              
              {currentUser.role === 'Student' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><BookUser className="mr-2 h-5 w-5 text-accent" /> Student Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="school_id" render={({ field }) => (
                            <FormItem><FormLabel>School</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} value={field.value ?? ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger></FormControl>
                                <SelectContent>{schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>)} />
                        <FormField control={form.control} name="enrolled_class_id" render={({ field }) => (
                            <FormItem><FormLabel>Enrolled Class</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={!selectedSchoolId || classes.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>)} />
                        <FormField control={form.control} name="admission_number" render={({ field }) => (<FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="date_of_birth" render={({ field }) => (<FormItem><FormLabel><CalendarClock className="inline mr-1 h-4 w-4"/>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="preferred_language" render={({ field }) => (<FormItem><FormLabel><Languages className="inline mr-1 h-4 w-4"/>Preferred Language</FormLabel><FormControl><Input {...field} placeholder="e.g., en, es" value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="father_name" render={({ field }) => (<FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="mother_name" render={({ field }) => (<FormItem><FormLabel>Mother's Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="place_of_birth" render={({ field }) => (<FormItem><FormLabel>Place of Birth</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="blood_group" render={({ field }) => (<FormItem><FormLabel><Droplets className="inline mr-1 h-4 w-4"/>Blood Group</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="parent_email_for_linking" render={({ field }) => (<FormItem><FormLabel>Parent's Email (for linking)</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="parent_mobile_for_linking" render={({ field }) => (<FormItem><FormLabel>Parent's Mobile (for linking)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="hobbies" render={({ field }) => (<FormItem className="mt-4"><FormLabel><Gamepad2 className="inline mr-1 h-4 w-4"/>Hobbies</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="favorite_sports" render={({ field }) => (<FormItem className="mt-4"><FormLabel><HeartPulse className="inline mr-1 h-4 w-4"/>Favorite Sports</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <FormField control={form.control} name="needs_assistant_teacher" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Needs Assistant Teacher</FormLabel><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="interested_in_gardening_farming" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel><Leaf className="inline mr-1 h-4 w-4"/>Interested in Gardening/Farming</FormLabel><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                </>
              )}

              {currentUser.role === 'Teacher' && (
                 <>
                  <Separator />
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><Star className="mr-2 h-5 w-5 text-accent" /> Teacher Details</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="school_id" render={({ field }) => (
                            <FormItem><FormLabel>School</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); }} value={field.value ?? ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger></FormControl>
                                <SelectContent>{schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>)} />
                        <FormField control={form.control} name="mobile_number" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                     </div>
                     <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="mt-4"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                     
                     <FormItem className="mt-4"><FormLabel>Classes You Teach</FormLabel>
                        {classes.length > 0 ? classes.map(cls => (
                          <FormField key={cls.id} control={form.control} name="assigned_classes_ids"
                              render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(String(cls.id))} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), String(cls.id)]) : field.onChange((field.value || []).filter(v => v !== String(cls.id)))}} /></FormControl><FormLabel className="font-normal">{cls.name}</FormLabel></FormItem>)}/>
                        )) : <p className="text-xs text-muted-foreground">Select a school to see classes.</p>}
                     </FormItem>

                     <FormItem className="mt-4"><FormLabel>Subjects You Specialize In</FormLabel>
                        {subjects.length > 0 ? subjects.map(sub => (
                          <FormField key={sub.id} control={form.control} name="subject_expertise_ids"
                              render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(String(sub.id))} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), String(sub.id)]) : field.onChange((field.value || []).filter(v => v !== String(sub.id)))}} /></FormControl><FormLabel className="font-normal">{sub.name} {sub.class_obj_name ? `(${sub.class_obj_name})` : ''}</FormLabel></FormItem>)}/>
                        )) : <p className="text-xs text-muted-foreground">Loading subjects...</p>}
                     </FormItem>

                     <FormField control={form.control} name="interested_in_tuition" render={({ field }) => (<FormItem className="flex items-center space-x-2 mt-4"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Interested in Private Tuition</FormLabel><FormMessage /></FormItem>)} />
                  </div>
                </>
              )}

              {currentUser.role === 'Parent' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-accent" /> Parent Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="mobile_number" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="mt-4"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </>
              )}

              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center"><Shield className="mr-2 h-5 w-5 text-accent" /> Security (Password Change)</h3>
                <p className="text-sm text-muted-foreground mb-4">To change your password, fill current and new password fields. Leave blank if not changing.</p>
                <div className="space-y-4">
                   <FormField control={form.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" placeholder="Enter current password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="Enter new password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="Confirm new password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
              <Button variant="destructive" onClick={handleLogout} disabled={isSubmitting}>
                <LogOut className="mr-2 h-5 w-5" /> Log Out
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
