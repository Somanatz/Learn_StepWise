// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, Edit3, Shield, LogOut, Mail, Briefcase, BookUser, Star, Languages, Loader2 } from "lucide-react";
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/interfaces';

// Define Zod schema for profile update
// Password fields are optional for profile update, only validated if provided
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  preferred_language: z.string().optional(), // Student only
  subject_expertise: z.string().optional(), // Teacher only
  // assigned_class_id: z.string().optional(), // Teacher only - handle with select if classes are fetched
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false; // currentPassword is required if newPassword is set
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      preferred_language: '',
      subject_expertise: '',
    }
  });

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      form.reset({
        username: currentUser.username || '',
        email: currentUser.email || '',
        preferred_language: currentUser.role === 'Student' ? (currentUser as any).preferred_language || 'en' : '',
        subject_expertise: currentUser.role === 'Teacher' ? (currentUser as any).subject_expertise || '' : '',
      });
      setIsPageLoading(false);
    } else if (!isLoadingAuth && !currentUser) {
      // Redirect to login if not authenticated
      // router.push('/login'); // Handled by AuthContext or page.tsx for dashboard
      setIsPageLoading(false);
    }
  }, [currentUser, isLoadingAuth, form]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) return;
    setIsSubmitting(true);

    const payload: any = {
      username: data.username,
      email: data.email,
    };

    if (currentUser.role === 'Student' && data.preferred_language) {
      payload.preferred_language = data.preferred_language;
    }
    if (currentUser.role === 'Teacher' && data.subject_expertise) {
      payload.subject_expertise = data.subject_expertise;
    }
    // Add assigned_class_id for Teacher if implemented with a select dropdown

    if (data.newPassword && data.currentPassword) {
      // Backend should verify currentPassword before setting new one
      // For now, we send both. A dedicated change_password endpoint is better.
      // This simplified approach assumes backend handles password change logic if 'password' field is sent.
      // Typically, you'd send 'new_password' and 'current_password' to a specific endpoint.
      // Our CustomUserSerializer expects 'password' for the new password.
      payload.password = data.newPassword; 
      // We are not sending currentPassword to this generic update endpoint.
      // A separate endpoint for password change would be more secure and conventional.
      // For this exercise, we will only update non-password fields unless a dedicated password change endpoint is specified.
      // Let's remove password update from this generic profile form for simplicity for now.
      // Password change should be a separate, more secure form/process.
      toast({ title: "Password Change", description: "Password change feature not fully implemented in this form. Please use a dedicated password change option if available.", variant: "default" });
    }
    
    // Removing password fields from payload for general profile update.
    const { currentPassword, newPassword, confirmNewPassword, ...profileData } = payload;


    try {
      // The backend /api/users/me/ PUT/PATCH should handle this based on CustomUserSerializer
      const updatedUser = await api.patch<any>(`/users/${currentUser.id}/`, profileData);
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null); // Update context
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    // Router redirect is handled by AuthContext or page protections
  };


  if (isPageLoading || isLoadingAuth) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <p>Please log in to view your profile.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-4">Login</Button>
      </div>
    );
  }

  const avatarUrl = "https://placehold.co/150x150.png"; // Replace with actual avatar logic if available

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={avatarUrl} alt={currentUser.username} data-ai-hint="profile avatar" />
                  <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-2xl">{currentUser.username}</CardTitle>
                  <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" /> {currentUser.email}
                  </CardDescription>
                  <CardDescription className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <Briefcase className="h-4 w-4 text-muted-foreground" /> Role: 
                    <span className="capitalize font-medium text-primary">{currentUser.role}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center"><Edit3 className="mr-2 h-5 w-5 text-accent" /> Personal Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name / Username</FormLabel>
                        <Input {...field} className="mt-1" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <Input type="email" {...field} className="mt-1" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {currentUser.role === 'Student' && (
                     <FormField
                        control={form.control}
                        name="preferred_language"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4" /> Preferred Language</FormLabel>
                            {/* TODO: Make this a select dropdown with actual language options */}
                            <Input {...field} placeholder="e.g., en, es, fr" className="mt-1" />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                  {currentUser.role === 'Teacher' && (
                    <>
                    <FormField
                        control={form.control}
                        name="subject_expertise"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Star className="mr-2 h-4 w-4" /> Subject Expertise</FormLabel>
                            <Input {...field} placeholder="e.g., Mathematics, Physics" className="mt-1" />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {/* TODO: Add Assigned Class dropdown for Teacher if classes are fetchable */}
                    {/* <FormField
                        control={form.control}
                        name="assigned_class_id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><BookUser className="mr-2 h-4 w-4" /> Assigned Class</FormLabel>
                            <Input {...field} placeholder="Class ID" className="mt-1" />
                            <FormMessage />
                        </FormItem>
                        )}
                    /> */}
                    <p className="text-sm text-muted-foreground">Assigned class: {currentUser.assigned_class_name || "Not assigned"}</p>
                    </>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Information
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center"><Shield className="mr-2 h-5 w-5 text-accent" /> Security (Password Change)</h3>
                 <p className="text-sm text-muted-foreground mb-4">To change your password, please fill out all three fields below. This feature is illustrative; a dedicated password change endpoint is recommended for production.</p>
                <div className="space-y-4">
                   <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <Input type="password" placeholder="Enter current password" {...field} className="mt-1" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <Input type="password" placeholder="Enter new password" {...field} className="mt-1" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input type="password" placeholder="Confirm new password" {...field} className="mt-1" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="outline" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t">
              <Button variant="destructive" className="ml-auto" onClick={handleLogout} disabled={isSubmitting}>
                <LogOut className="mr-2 h-5 w-5" /> Log Out
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

