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
import { Loader2, UserCheck, Upload } from 'lucide-react';
import type { User } from '@/interfaces';


const parentProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').trim(),
  mobile_number: z.string().optional().transform(val => val ? val.trim() : undefined),
  address: z.string().optional().transform(val => val ? val.trim() : undefined),
  profile_picture: z.any().optional(),
});

type ParentProfileFormValues = z.infer<typeof parentProfileSchema>;


export default function CompleteParentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, isLoadingAuth, setCurrentUser, setNeedsProfileCompletion } = useAuth();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Added for robust redirect
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);

  const form = useForm<ParentProfileFormValues>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: {
      full_name: '',
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
      } else if (currentUser.parent_profile?.profile_completed === true) {
        // If profile is already marked complete, redirect away
        setIsRedirecting(true);
        setNeedsProfileCompletion(false); // Ensure context flag is also false
        router.push('/parent');
      }
    }
  }, [isLoadingAuth, currentUser, router, setNeedsProfileCompletion]);

   useEffect(() => {
    if (currentUser?.parent_profile) {
        form.reset({
            full_name: currentUser.parent_profile.full_name || '',
            mobile_number: currentUser.parent_profile.mobile_number || '',
            address: currentUser.parent_profile.address || '',
        });
        if (currentUser.parent_profile.profile_picture_url) {
            setPreviewProfilePicture(currentUser.parent_profile.profile_picture_url);
        }
    } else if (currentUser) { // User exists but no profile object yet
         form.reset({
            full_name: '',
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

    // Append fields only if they have changed or are being set for the first time
    if (data.full_name && data.full_name !== currentUser.parent_profile?.full_name) formData.append('full_name', data.full_name);
    if (data.mobile_number !== undefined && data.mobile_number !== currentUser.parent_profile?.mobile_number) formData.append('mobile_number', data.mobile_number || '');
    if (data.address !== undefined && data.address !== currentUser.parent_profile?.address) formData.append('address', data.address || '');
    
    if (selectedProfilePictureFile) {
      formData.append('profile_picture', selectedProfilePictureFile);
    }
    
    // Check if any data is actually being sent to avoid empty PATCH requests
    let hasUpdates = false;
    for (const _ of formData.keys()) {
        hasUpdates = true;
        break;
    }
    if (!hasUpdates && !selectedProfilePictureFile) { // Check if form values are same as initial and no new pic
        const isFormDirty = form.formState.isDirty; // Check if react-hook-form considers it dirty
        if(!isFormDirty) { // If form truly unchanged
            toast({ title: "No Changes", description: "No changes detected in your profile information."});
            // If profile was already complete, allow redirect, otherwise user must make a change or be stuck
            if(currentUser.parent_profile?.profile_completed) {
                router.push('/parent');
            }
            setIsSubmittingProfile(false);
            return;
        }
        // If dirty but no formData, it means fields were cleared but were previously null, so append empty strings.
        // This case is less likely with current logic but good to be aware.
    }


    try {
      const updatedUserResponse = await api.patch<User>(`/users/${currentUser.id}/profile/`, formData, true);
      setCurrentUser(updatedUserResponse); 
      
      if (updatedUserResponse.parent_profile?.profile_completed === true) {
        setNeedsProfileCompletion(false);
        toast({ title: "Profile Saved!", description: "Your parent profile has been saved." });
        router.push('/parent'); // Redirect to parent dashboard
      } else {
        toast({ title: "Profile Updated", description: "Your parent profile has been saved, but might still be incomplete." });
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

  if (isLoadingAuth || isRedirecting || (!isLoadingAuth && !currentUser)) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const defaultAvatarText = (currentUser?.username || 'P').charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Parent Profile</CardTitle>
          <CardDescription className="text-center">Please provide your details. You can link your children from your dashboard later.</CardDescription>
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
                Save Profile & Continue to Dashboard
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
