// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signupUser } from '@/lib/api';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['Student', 'Teacher', 'Parent'], { required_error: 'Please select a role' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const roleToSend = data.role.charAt(0).toUpperCase() + data.role.slice(1) as 'Student' | 'Teacher' | 'Parent';
      const { confirmPassword, ...signupData } = data;
      const payload = { ...signupData, role: roleToSend };
      
      await signupUser(payload);
      toast({
        title: "Signup Successful!",
        description: "Your account has been created. Please log in.",
      });
      router.push('/login');
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.username) errorMessage = `Username: ${errorData.username.join(', ')}`;
        else if (errorData.email) errorMessage = `Email: ${errorData.email.join(', ')}`;
        else if (errorData.password) errorMessage = `Password: ${errorData.password.join(', ')}`;
        else if (typeof errorData === 'string') errorMessage = errorData;
        else if (errorData.detail) errorMessage = errorData.detail;
        else errorMessage = JSON.stringify(errorData);
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center min-h-screen overflow-hidden p-4">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/educational-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>

      {/* Content Wrapper */}
      <div className="relative z-20 flex flex-col md:flex-row w-full max-w-5xl xl:max-w-6xl mx-auto items-center md:space-x-10 lg:space-x-16">
        {/* Left Side: Tool Name & Tagline */}
        <div className="w-full md:w-2/5 flex-shrink-0 mb-12 md:mb-0 text-center md:text-left">
           <h1 className="text-5xl lg:text-6xl font-poppins font-extrabold text-primary-foreground animate-pulse-subtle [text-shadow:_3px_3px_8px_rgb(0_0_0_/_0.6)]">
            Learn-StepWise
          </h1>
          <p className="text-xl lg:text-2xl text-primary-foreground/80 mt-4 animate-pulse-subtle animation-delay-300 [text-shadow:_2px_2px_6px_rgb(0_0_0_/_0.5)]">
            Join Our Community of Learners and Educators.
          </p>
        </div>

        {/* Right Side: Signup Card */}
        <div className="w-full md:w-3/5 flex justify-center md:justify-start lg:justify-center">
          <Card className="w-full max-w-sm shadow-xl bg-card/80 backdrop-blur-md border-border/50 animate-slide-in-from-right animation-delay-200">
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-10 w-10 text-primary mb-3" />
              <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
              <CardDescription>Join Learn-StepWise today!</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="Parent">Parent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
