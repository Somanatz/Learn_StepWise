
// src/app/parent/complete-profile/page.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserCheck, Link2, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { User, StudentProfileData } from '@/interfaces';


const parentProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').trim(),
  mobile_number: z.string().optional().transform(val => val ? val.trim() : undefined),
  address: z.string().optional().transform(val => val ? val.trim() : undefined),
  profile_picture: z.any().optional(),
  student_admission_number: z.string().optional().transform(val => val ? val.trim() : undefined),
  student_school_id_code: z.string().optional().transform(val => val ? val.trim() : undefined),
});

type ParentProfileFormValues = z.infer<typeof parentProfileSchema>;

interface StudentForConfirmation {
    link_id: string | number;
    message: string;
    student_details: StudentProfileData;
}


export default function CompleteParentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth, setCurrentUser, setNeedsProfileCompletion, needsProfileCompletion } = useAuth();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isLinkingChild, setIsLinkingChild] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);
  const [studentToConfirm, setStudentToConfirm] = useState<StudentForConfirmation | null>(null);
  const [linkingError, setLinkingError] = useState<string | null>(null);


  const form = useForm<ParentProfileFormValues>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: {
      full_name: '',
      student_admission_number: '',
      student_school_id_code: '',
      mobile_number: '',
      address: '',
    },
  });

   useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser) {
        setIsRedirecting(true);
        router.push('/login');
      } else if (currentUser.role !== 'Parent') {
        setIsRedirecting(true);
        router.push('/');
      } else if (currentUser.profile_completed && currentUser.parent_profile?.profile_completed) {
        setIsRedirecting(true); 
        router.push('/parent');
      }
    }
  }, [isLoadingAuth, currentUser, router]);

   useEffect(() => {
    if (currentUser?.parent_profile) {
        form.reset({
            full_name: currentUser.parent_profile.full_name || '',
            mobile_number: currentUser.parent_profile.mobile_number || '',
            address: currentUser.parent_profile.address || '',
            student_admission_number: '', 
            student_school_id_code: '',
        });
        if (currentUser.parent_profile.profile_picture_url) {
            setPreviewProfilePicture(currentUser.parent_profile.profile_picture_url);
        }
    } else if (currentUser) {
         form.reset({
            full_name: '',
            student_admission_number: '',
            student_school_id_code: '',
            mobile_number: '',
            address: '',
        });
    }
  }, [currentUser, form, isLoadingAuth]);

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedProfilePictureFile(file);
      setPreviewProfilePicture(URL.createObjectURL(file));
    }
  };

  const onSubmitProfile = async (data: ParentProfileFormValues) => {
    if (!currentUser || currentUser.role !== 'Parent') return;
    setIsSubmittingProfile(true);
    const formData = new FormData();

    if (data.full_name && data.full_name !== currentUser.parent_profile?.full_name) formData.append('full_name', data.full_name);
    if (data.mobile_number && data.mobile_number !== currentUser.parent_profile?.mobile_number) formData.append('mobile_number', data.mobile_number);
    if (data.address && data.address !== currentUser.parent_profile?.address) formData.append('address', data.address);
    if (selectedProfilePictureFile) {
      formData.append('profile_picture', selectedProfilePictureFile);
    }
    
    let hasUpdates = false;
    for (const _ of formData.keys()) {
        hasUpdates = true;
        break;
    }

    if (!hasUpdates && !selectedProfilePictureFile) {
        toast({ title: "No Changes", description: "No changes detected in your profile information."});
        setIsSubmittingProfile(false);
        // Check if profile is actually complete and redirect if no child linking is pending
        const { student_admission_number, student_school_id_code } = form.getValues();
        if (currentUser.profile_completed && !student_admission_number && !student_school_id_code && !studentToConfirm) {
             router.push('/parent');
        }
        return;
    }

    try {
      const updatedUserResponse = await api.patch<User>(`/users/${currentUser.id}/profile/`, formData, true);
      setCurrentUser(updatedUserResponse); // Update context with full fresh user data
      if (updatedUserResponse.profile_completed) {
        setNeedsProfileCompletion(false);
      }
      toast({ title: "Profile Updated!", description: "Your parent profile has been saved." });

      // Redirect only if profile is complete AND no child linking fields are active
      const { student_admission_number, student_school_id_code } = form.getValues();
      if (updatedUserResponse.profile_completed && !student_admission_number && !student_school_id_code && !studentToConfirm) {
        router.push('/parent');
      }
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
      setIsSubmittingProfile(false);
    }
  };

  const handleVerifyChild = async () => {
    if (!currentUser) return;
    setLinkingError(null);
    setStudentToConfirm(null);
    const { student_admission_number, student_school_id_code } = form.getValues();
    if (!student_admission_number || !student_school_id_code) {
        toast({title: "Missing Info", description: "Student admission number and school ID code are required to verify.", variant: "default"});
        return;
    }
    setIsLinkingChild(true);
    try {
        const linkData = {
            admission_number: student_admission_number,
            school_id_code: student_school_id_code,
        };
        const response = await api.post<StudentForConfirmation>('/parent-student-links/link-child-by-admission/', linkData);
        setStudentToConfirm(response);
        toast({ title: "Child Linked Successfully!", description: `${response.student_details?.full_name || 'Child'} is now linked. ${response.message}` });
        form.resetField("student_admission_number");
        form.resetField("student_school_id_code");

    } catch (error: any) {
        let errMsg = "Could not link child. Ensure admission number, school ID code are correct, and your email matches the student's parent contact email on record.";
        if (error.response && error.response.data && (error.response.data.error || error.response.data.detail)) {
            errMsg = error.response.data.error || error.response.data.detail;
        } else if (error.message) {
            errMsg = error.message;
        }
        setLinkingError(errMsg);
        toast({ title: "Child Linking Failed", description: errMsg, variant: "destructive" });
    } finally {
        setIsLinkingChild(false);
    }
  };

  if (isLoadingAuth || isRedirecting || (!isLoadingAuth && !currentUser)) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
   // Additional check, in case context hasn't updated fast enough but currentUser.profile_completed is true
  if (currentUser && currentUser.profile_completed && currentUser.parent_profile?.profile_completed && !isRedirecting) {
     // This case might indicate a brief moment before redirect, or if needsProfileCompletion from context is stale
     // If we are not already redirecting and profile is complete, consider pushing to dashboard directly.
     // However, this component is specifically for profile completion. So, this if might mean they landed here by mistake.
     // The useEffect above should handle redirecting them away if profile_completed is true.
  }


  const defaultAvatarText = (currentUser?.username || 'P').charAt(0).toUpperCase();

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
             <div className="flex flex-col items-center space-y-3 mb-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={previewProfilePicture || `https://placehold.co/150x150.png?text=${defaultAvatarText}`} alt={currentUser?.username} data-ai-hint="profile parent"/>
                  <AvatarFallback>{defaultAvatarText}</AvatarFallback>
                </Avatar>
                <FormField control={form.control} name="profile_picture" render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-picture-upload-parent" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload size={16}/> Change Profile Picture
                    </FormLabel>
                    <FormControl><Input id="profile-picture-upload-parent" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mobile_number" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Save Profile Information
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">Link Your Child</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Enter your child's Admission Number and their School ID Code. Your email ({currentUser?.email}) must match the parent email on the student's record for verification.
                </p>
                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <FormField control={form.control} name="student_admission_number" render={({ field }) => (
                        <FormItem><FormLabel>Child's Admission Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="student_school_id_code" render={({ field }) => (
                        <FormItem><FormLabel>Child's School ID Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <Button onClick={handleVerifyChild} className="w-full" variant="outline" disabled={isLinkingChild || isSubmittingProfile}>
                    {isLinkingChild ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                    Verify & Link Child
                </Button>
                {linkingError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Linking Error</AlertTitle>
                        <AlertDescription>{linkingError}</AlertDescription>
                    </Alert>
                )}
                 {studentToConfirm && studentToConfirm.student_details && (
                    <Alert className="mt-4 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
                        <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-700 dark:text-green-300">Child Linked Successfully!</AlertTitle>
                        <AlertDescription className="text-green-600 dark:text-green-400 space-y-1">
                            <p><strong>Name:</strong> {studentToConfirm.student_details.full_name || 'N/A'}</p>
                            {studentToConfirm.student_details.school_name && <p><strong>School:</strong> {studentToConfirm.student_details.school_name}</p>}
                            {studentToConfirm.student_details.enrolled_class_name && <p><strong>Class:</strong> {studentToConfirm.student_details.enrolled_class_name}</p>}
                            {studentToConfirm.message && <p className="mt-1">{studentToConfirm.message}</p>}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-muted-foreground mt-2">You can link more children from your dashboard settings later.</p>
            </div>
            <Button onClick={() => {
                 if (form.formState.isDirty && !isSubmittingProfile) {
                    toast({title: "Unsaved Changes", description: "Please save your profile information before proceeding.", variant: "default"});
                 } else if ((form.getValues("student_admission_number") || form.getValues("student_school_id_code")) && !studentToConfirm) {
                     toast({title: "Link Child", description: "Please verify and link your child if you've entered their details, or clear the fields.", variant: "default"});
                 }
                 else if (!needsProfileCompletion && currentUser?.profile_completed) { // Check context and direct current user state
                    router.push('/parent');
                 } else {
                    toast({title: "Profile Incomplete", description: "Please complete and save your profile. If child linking details are entered, verify them or clear the fields.", variant: "default"});
                 }
            }} className="mt-6 w-full" variant="secondary" disabled={isSubmittingProfile || isLinkingChild}>
                Go to Parent Dashboard
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
