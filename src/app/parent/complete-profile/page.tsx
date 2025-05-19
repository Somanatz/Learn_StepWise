
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

const parentProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  mobile_number: z.string().optional(),
  address: z.string().optional(),
  profile_picture: z.any().optional(),
  // For linking child
  student_admission_number: z.string().optional(),
  student_school_id_code: z.string().optional(),
});

type ParentProfileFormValues = z.infer<typeof parentProfileSchema>;

interface StudentForConfirmation {
    student_id: string;
    student_username: string;
    student_full_name: string;
    student_email: string;
    enrolled_class_name: string;
    link_id: string;
    message: string;
}


export default function CompleteParentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth, setCurrentUser } = useAuth();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isLinkingChild, setIsLinkingChild] = useState(false);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);
  const [studentToConfirm, setStudentToConfirm] = useState<StudentForConfirmation | null>(null);
  const [linkingError, setLinkingError] = useState<string | null>(null);


  const form = useForm<ParentProfileFormValues>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: { full_name: '' },
  });

   useEffect(() => {
    if (currentUser?.parent_profile?.profile_picture_url) {
      setPreviewProfilePicture(currentUser.parent_profile.profile_picture_url);
    }
  }, [currentUser]);

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
    formData.append('full_name', data.full_name);
    if (data.mobile_number) formData.append('mobile_number', data.mobile_number);
    if (data.address) formData.append('address', data.address);
    if (selectedProfilePictureFile) {
      formData.append('profile_picture', selectedProfilePictureFile);
    }

    try {
      const updatedUser = await api.patch<any>(`/users/${currentUser.id}/profile/`, formData, true);
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser, parent_profile: updatedUser.parent_profile || prev.parent_profile } : null);
      toast({ title: "Profile Updated!", description: "Your parent profile has been saved." });
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
        // Backend verifies and returns student data if parent_email_for_linking matches
        const response = await api.post<StudentForConfirmation>('/parent-student-links/link-child-by-admission/', linkData);
        setStudentToConfirm(response); // API now directly creates the link if verified
        toast({ title: "Child Linked Successfully!", description: `${response.student_full_name || response.student_username} is now linked.` });
        form.resetField("student_admission_number");
        form.resetField("student_school_id_code");

    } catch (error: any) {
        let errMsg = "Could not link child.";
        if (error.response && error.response.data && error.response.data.error) {
            errMsg = error.response.data.error;
        } else if (error.message) {
            errMsg = error.message;
        }
        setLinkingError(errMsg);
        toast({ title: "Child Linking Failed", description: errMsg, variant: "destructive" });
    } finally {
        setIsLinkingChild(false);
    }
  };
  
  if (isLoadingAuth) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (!currentUser) { router.push('/login'); return null; }

  const defaultAvatarText = (currentUser.username || 'P').charAt(0).toUpperCase();

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
                  <AvatarImage src={previewProfilePicture || `https://placehold.co/150x150.png?text=${defaultAvatarText}`} alt={currentUser.username} data-ai-hint="profile parent"/>
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
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mobile_number" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Save Profile Information
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">Link Your Child</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Enter your child's admission number and their school's ID code. Your email ({currentUser.email}) must match the parent email on the student's record for verification.
                </p>
                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <FormField control={form.control} name="student_admission_number" render={({ field }) => (
                        <FormItem><FormLabel>Child's Admission Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="student_school_id_code" render={({ field }) => (
                        <FormItem><FormLabel>Child's School ID Code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <Button onClick={handleVerifyChild} className="w-full" variant="outline" disabled={isLinkingChild}>
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
                 {studentToConfirm && (
                    <Alert className="mt-4 bg-green-50 border-green-200">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-700">Child Linked Successfully!</AlertTitle>
                        <AlertDescription>
                            <p><strong>Name:</strong> {studentToConfirm.student_full_name || studentToConfirm.student_username}</p>
                            <p><strong>Email:</strong> {studentToConfirm.student_email}</p>
                            <p><strong>Class:</strong> {studentToConfirm.enrolled_class_name}</p>
                            <p>{studentToConfirm.message}</p>
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-muted-foreground mt-2">You can link more children from your dashboard settings later.</p>
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
