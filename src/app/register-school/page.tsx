
// src/app/register-school/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import Link from 'next/link';
import { SchoolIcon, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const schoolRegistrationSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  school_id_code: z.string().min(1, 'School ID code is required'),
  license_number: z.string().optional(),
  official_email: z.string().email('Invalid official email address'),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  principal_full_name: z.string().optional(),
  principal_contact_number: z.string().optional(),
  principal_email: z.string().email({ message: "Invalid principal email" }).optional().or(z.literal('')),
});

type SchoolRegistrationFormValues = z.infer<typeof schoolRegistrationSchema>;

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SchoolRegistrationFormValues>({
    resolver: zodResolver(schoolRegistrationSchema),
    defaultValues: {
      name: '',
      school_id_code: '',
      license_number: '',
      official_email: '',
      phone_number: '',
      address: '',
      principal_full_name: '',
      principal_contact_number: '',
      principal_email: '',
    },
  });

  const onSubmit = async (data: SchoolRegistrationFormValues) => {
    setIsLoading(true);
    try {
      const newSchool = await api.post('/schools/', data);
      toast({
        title: "School Registration Successful!",
        description: `${newSchool.name} has been registered. You might be contacted for verification.`,
      });
      // TODO: Redirect to a school admin dashboard or a pending verification page
      router.push('/'); // For now, redirect to homepage
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
            errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : value)}`).join('; ');
        } else if (errorData.detail) {
            errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "School Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <SchoolIcon className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">Register Your School</CardTitle>
          <CardDescription>Join the Learn-StepWise platform and empower your students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Oakwood Academy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="school_id_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School ID Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Unique school identifier" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="official_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official School Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., admin@oakwoodacademy.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School License Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="For verification" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +1-555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full school address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <h3 className="text-lg font-semibold pt-4 border-t">Principal's Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="principal_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal's Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="principal_contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal's Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +1-555-987-6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="principal_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal's Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., principal@oakwoodacademy.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isLoading ? 'Submitting...' : 'Register School'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already registered or need to login?{' '}
            <Link href="/login" legacyBehavior>
              <a className="font-medium text-primary hover:underline">Login</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
