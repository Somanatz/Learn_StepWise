
// src/app/signup/page.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import Link from 'next/link';
import { UserPlus, Loader2, Upload, School as SchoolIcon, CalendarClock, Droplets, HeartPulse, Gamepad2, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, School as SchoolInterface, Class as ClassInterface, Subject as SubjectInterface } from '@/interfaces';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const baseSignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['Student', 'Teacher', 'Parent'], { required_error: 'Please select a role' }),
  profile_picture: z.any().optional(), // For file upload
});

// Student specific fields (all optional for the schema, requiredness handled by UI/backend)
const studentSchema = z.object({
  full_name: z.string().optional(),
  school_id: z.string().optional(),
  enrolled_class_id: z.string().optional(),
  admission_number: z.string().optional(),
  nickname: z.string().optional(),
  preferred_language: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  place_of_birth: z.string().optional(),
  date_of_birth: z.string().optional(),
  blood_group: z.string().optional(),
  needs_assistant_teacher: z.boolean().optional(),
  parent_email_for_linking: z.string().email({message: "Invalid parent email"}).optional().or(z.literal('')),
  parent_mobile_for_linking: z.string().optional(),
  parent_occupation: z.string().optional(),
  hobbies: z.string().optional(),
  favorite_sports: z.string().optional(),
  interested_in_gardening_farming: z.boolean().optional(),
});

// Teacher specific fields
const teacherSchema = z.object({
  full_name: z.string().optional(),
  school_id: z.string().optional(),
  assigned_classes_ids: z.array(z.string()).optional(),
  subject_expertise_ids: z.array(z.string()).optional(),
  interested_in_tuition: z.boolean().optional(),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
});

// Parent specific fields
const parentSchema = z.object({
  full_name: z.string().optional(),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
});

// Combine schemas
const signupSchema = baseSignupSchema
  .merge(studentSchema)
  .merge(teacherSchema)
  .merge(parentSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [classes, setClasses] = useState<ClassInterface[]>([]);
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(undefined);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '', email: '', password: '', confirmPassword: '',
      role: undefined, // User must select a role
      // Initialize optional fields
      full_name: '', school_id: '', enrolled_class_id: '', admission_number: '', nickname: '',
      preferred_language: 'en', father_name: '', mother_name: '', place_of_birth: '', date_of_birth: '',
      blood_group: '', needs_assistant_teacher: false, parent_email_for_linking: '', parent_mobile_for_linking: '',
      parent_occupation: '', hobbies: '', favorite_sports: '', interested_in_gardening_farming: false,
      assigned_classes_ids: [], subject_expertise_ids: [], interested_in_tuition: false,
      mobile_number: '', address: '',
    },
  });

  // Fetch schools on mount
  useEffect(() => {
    api.get<SchoolInterface[]>('/schools/')
      .then(data => setSchools(Array.isArray(data) ? data : []))
      .catch(err => {
        toast({ title: "Error loading schools", description: err.message, variant: "destructive" });
        setSchools([]);
      });
    api.get<SubjectInterface[]>('/subjects/')
      .then(data => setSubjects(Array.isArray(data) ? data : []))
      .catch(err => {
        toast({ title: "Error loading subjects", description: err.message, variant: "destructive" });
        setSubjects([]);
      });
  }, [toast]);

  // Fetch classes when school_id changes
  useEffect(() => {
    if (selectedSchoolId && (selectedRole === 'Student' || selectedRole === 'Teacher')) {
      api.get<ClassInterface[]>(`/classes/?school=${selectedSchoolId}`)
        .then(data => setClasses(Array.isArray(data) ? data : []))
        .catch(err => {
          toast({ title: "Error loading classes", description: err.message, variant: "destructive" });
          setClasses([]);
        });
    } else {
      setClasses([]);
    }
  }, [selectedSchoolId, selectedRole, toast]);


  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedProfilePictureFile(file);
      setPreviewProfilePicture(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    
    // Append base user fields
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('role', data.role);
    if (selectedProfilePictureFile) {
      formData.append('profile_picture', selectedProfilePictureFile);
    }

    // Conditionally append profile-specific fields
    if (data.role === 'Student') {
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.school_id) formData.append('school', data.school_id); // Backend serializer expects 'school'
      if (data.enrolled_class_id) formData.append('enrolled_class', data.enrolled_class_id);
      if (data.admission_number) formData.append('admission_number', data.admission_number);
      if (data.nickname) formData.append('nickname', data.nickname);
      if (data.preferred_language) formData.append('preferred_language', data.preferred_language);
      if (data.father_name) formData.append('father_name', data.father_name);
      if (data.mother_name) formData.append('mother_name', data.mother_name);
      if (data.place_of_birth) formData.append('place_of_birth', data.place_of_birth);
      if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
      if (data.blood_group) formData.append('blood_group', data.blood_group);
      formData.append('needs_assistant_teacher', String(data.needs_assistant_teacher || false));
      if (data.parent_email_for_linking) formData.append('parent_email_for_linking', data.parent_email_for_linking);
      if (data.parent_mobile_for_linking) formData.append('parent_mobile_for_linking', data.parent_mobile_for_linking);
      if (data.parent_occupation) formData.append('parent_occupation', data.parent_occupation);
      if (data.hobbies) formData.append('hobbies', data.hobbies);
      if (data.favorite_sports) formData.append('favorite_sports', data.favorite_sports);
      formData.append('interested_in_gardening_farming', String(data.interested_in_gardening_farming || false));
    } else if (data.role === 'Teacher') {
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.school_id) formData.append('school', data.school_id);
      if (data.address) formData.append('address', data.address);
      if (data.mobile_number) formData.append('mobile_number', data.mobile_number);
      formData.append('interested_in_tuition', String(data.interested_in_tuition || false));
      (data.assigned_classes_ids || []).forEach(id => formData.append('assigned_classes', id));
      (data.subject_expertise_ids || []).forEach(id => formData.append('subject_expertise', id));
    } else if (data.role === 'Parent') {
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.address) formData.append('address', data.address);
      if (data.mobile_number) formData.append('mobile_number', data.mobile_number);
    }
    
    try {
      await api.post('/signup/', formData, true); 
      toast({
        title: "Signup Successful!",
        description: "Your account has been created. Please log in.",
      });
      router.push('/login'); 
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center min-h-screen overflow-hidden p-4 py-10">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/videos/educational-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>
      
      <div className="relative z-20 flex flex-col md:flex-row w-full max-w-5xl xl:max-w-6xl mx-auto items-start md:space-x-10 lg:space-x-16">
        <div className="w-full md:w-2/5 flex-shrink-0 mb-12 md:mb-0 text-center md:text-left pt-10">
          <h1 className="text-5xl lg:text-6xl font-poppins font-extrabold text-primary-foreground [text-shadow:_3px_3px_8px_rgb(0_0_0_/_0.6)] animation-delay-100">
            GenAI-Campus
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/80 mt-4 [text-shadow:_2px_2px_6px_rgb(0_0_0_/_0.5)] animation-delay-300">
            Join Our Community of Learners and Educators.
          </p>
        </div>

        <div className="w-full md:w-3/5 flex justify-center md:justify-start lg:justify-center">
          <Card className="w-full max-w-lg shadow-xl bg-card/80 backdrop-blur-md border-border/50 animate-slide-in-from-right animation-delay-200">
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-10 w-10 text-primary mb-3" />
              <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
              <CardDescription>Fill in your details to get started with GenAI-Campus.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Base Fields */}
                  <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="Choose a username" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Enter your email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Create a password" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="Confirm your password" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); setSelectedRole(value as UserRole | ''); }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="Parent">Parent</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Picture Upload */}
                  {selectedRole && (
                    <div className="flex flex-col items-center space-y-2 pt-2">
                      <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={previewProfilePicture || `https://placehold.co/100x100.png?text=${selectedRole.charAt(0)}`} alt="Profile preview" data-ai-hint="profile avatar"/>
                        <AvatarFallback>{selectedRole.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <FormField control={form.control} name="profile_picture" render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="profile-picture-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                            <Upload size={16}/> Upload Profile Picture (Optional)
                          </FormLabel>
                          <FormControl><Input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {/* Student Specific Fields */}
                  {selectedRole === 'Student' && (
                    <>
                      <h3 className="text-md font-semibold pt-2 border-t mt-4">Student Details</h3>
                      <FormField control={form.control} name="full_name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="school_id" render={({ field }) => (
                          <FormItem><FormLabel><SchoolIcon className="inline mr-1 h-4 w-4"/>School</FormLabel>
                              <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); form.setValue('enrolled_class_id', ''); }} value={field.value ?? ''}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger></FormControl>
                                  <SelectContent>{Array.isArray(schools) && schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                          </FormItem>)} />
                      <FormField control={form.control} name="enrolled_class_id" render={({ field }) => (
                          <FormItem><FormLabel>Class to Enroll In</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedSchoolId || !Array.isArray(classes) || classes.length === 0}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                                  <SelectContent>{Array.isArray(classes) && classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                          </FormItem>)} />
                      <FormField control={form.control} name="admission_number" render={({ field }) => ( <FormItem><FormLabel>Admission Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="nickname" render={({ field }) => ( <FormItem><FormLabel>Nickname (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="date_of_birth" render={({ field }) => ( <FormItem><FormLabel><CalendarClock className="inline mr-1 h-4 w-4"/>Date of Birth (Optional)</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="preferred_language" render={({ field }) => ( <FormItem><FormLabel>Preferred Language (e.g., en)</FormLabel><FormControl><Input {...field} value={field.value ?? "en"} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="father_name" render={({ field }) => ( <FormItem><FormLabel>Father's Name (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="mother_name" render={({ field }) => ( <FormItem><FormLabel>Mother's Name (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="parent_occupation" render={({ field }) => ( <FormItem><FormLabel>Parent's Occupation (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="place_of_birth" render={({ field }) => ( <FormItem><FormLabel>Place of Birth (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="blood_group" render={({ field }) => ( <FormItem><FormLabel><Droplets className="inline mr-1 h-4 w-4"/>Blood Group (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="parent_email_for_linking" render={({ field }) => ( <FormItem><FormLabel>Parent's Email for Linking (Optional)</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="parent_mobile_for_linking" render={({ field }) => ( <FormItem><FormLabel>Parent's Mobile for Linking (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="hobbies" render={({ field }) => ( <FormItem><FormLabel><Gamepad2 className="inline mr-1 h-4 w-4"/>Hobbies (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="favorite_sports" render={({ field }) => ( <FormItem><FormLabel><HeartPulse className="inline mr-1 h-4 w-4"/>Favorite Sports (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="needs_assistant_teacher" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Needs Assistant Teacher</FormLabel><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="interested_in_gardening_farming" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel><Leaf className="inline mr-1 h-4 w-4"/>Interested in Gardening/Farming</FormLabel><FormMessage /></FormItem> )}/>
                    </>
                  )}

                  {/* Teacher Specific Fields */}
                  {selectedRole === 'Teacher' && (
                    <>
                      <h3 className="text-md font-semibold pt-2 border-t mt-4">Teacher Details</h3>
                      <FormField control={form.control} name="full_name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="school_id" render={({ field }) => (
                          <FormItem><FormLabel><SchoolIcon className="inline mr-1 h-4 w-4"/>School</FormLabel>
                              <Select onValueChange={(value) => { field.onChange(value); setSelectedSchoolId(value); form.setValue('assigned_classes_ids', []); }} value={field.value ?? ''}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger></FormControl>
                                  <SelectContent>{Array.isArray(schools) && schools.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                              </Select><FormMessage />
                          </FormItem>)} />
                      <FormField control={form.control} name="mobile_number" render={({ field }) => ( <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormItem><FormLabel>Classes You Teach (Optional)</FormLabel>
                          {Array.isArray(classes) && classes.length > 0 ? classes.map(cls => (
                            <FormField key={cls.id} control={form.control} name="assigned_classes_ids"
                                render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(String(cls.id))} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), String(cls.id)]) : field.onChange((field.value || []).filter(v => v !== String(cls.id)))}} /></FormControl><FormLabel className="font-normal">{cls.name}</FormLabel></FormItem>)}/>
                          )) : <p className="text-xs text-muted-foreground">Select a school to see classes.</p>}
                      </FormItem>
                      <FormItem><FormLabel>Subjects You Specialize In (Optional)</FormLabel>
                          {Array.isArray(subjects) && subjects.length > 0 ? subjects.map(sub => (
                            <FormField key={sub.id} control={form.control} name="subject_expertise_ids"
                                render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(String(sub.id))} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), String(sub.id)]) : field.onChange((field.value || []).filter(v => v !== String(sub.id)))}} /></FormControl><FormLabel className="font-normal">{sub.name} {sub.class_obj_name ? `(${sub.class_obj_name})` : ''}</FormLabel></FormItem>)}/>
                          )) : <p className="text-xs text-muted-foreground">Loading subjects...</p>}
                      </FormItem>
                      <FormField control={form.control} name="interested_in_tuition" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Interested in Private Tuition</FormLabel><FormMessage /></FormItem> )}/>
                    </>
                  )}

                  {/* Parent Specific Fields */}
                  {selectedRole === 'Parent' && (
                    <>
                      <h3 className="text-md font-semibold pt-2 border-t mt-4">Parent Details</h3>
                      <FormField control={form.control} name="full_name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="mobile_number" render={({ field }) => ( <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )}/>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedRole}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" legacyBehavior>
                  <a className="font-medium text-primary hover:underline">Log in</a>
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

