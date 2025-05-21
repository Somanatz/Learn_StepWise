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
import { SchoolIcon, PlusCircle, Loader2, UserCog, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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

  admin_username: z.string().min(3, "Admin username must be at least 3 characters"),
  admin_email: z.string().email("Invalid admin email address"),
  admin_password: z.string().min(8, "Admin password must be at least 8 characters"),
  admin_confirm_password: z.string(),
}).refine(data => data.admin_password === data.admin_confirm_password, {
  message: "Admin passwords don't match",
  path: ["admin_confirm_password"],
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
      admin_username: '',
      admin_email: '',
      admin_password: '',
      admin_confirm_password: '',
    },
  });

  const onSubmit = async (data: SchoolRegistrationFormValues) => {
    setIsLoading(true);
    const { admin_confirm_password, ...payload } = data;
    try {
      const newSchool = await api.post('/schools/', payload);
      toast({
        title: "School Registration Successful!",
        description: `${newSchool.name} has been registered. The initial admin account (${payload.admin_username}) has been created. Please log in.`,
      });
      router.push('/login');
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
            errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`).join('; ');
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
    <div className="flex items-center justify-center min-h-screen bg-muted p-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <SchoolIcon className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">Register Your School</CardTitle>
          <CardDescription>Join GenAI-Campus and create an admin account for your institution.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <h3 className="text-lg font-semibold flex items-center"><SchoolIcon className="mr-2 h-5 w-5 text-accent"/> School Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input placeholder="e.g., Oakwood Academy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="school_id_code" render={({ field }) => (<FormItem><FormLabel>School ID Code</FormLabel><FormControl><Input placeholder="Unique school identifier" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="official_email" render={({ field }) => (<FormItem><FormLabel>Official School Email</FormLabel><FormControl><Input type="email" placeholder="e.g., admin@oakwoodacademy.edu" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="license_number" render={({ field }) => (<FormItem><FormLabel>School License Number (Optional)</FormLabel><FormControl><Input placeholder="For verification" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem><FormLabel>School Phone Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., +1-555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>School Address (Optional)</FormLabel><FormControl><Textarea placeholder="Full school address" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <Separator className="my-6" />
              <h3 className="text-lg font-semibold flex items-center"><UserCog className="mr-2 h-5 w-5 text-accent"/> Principal's Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="principal_full_name" render={({ field }) => (<FormItem><FormLabel>Principal's Full Name</FormLabel><FormControl><Input placeholder="e.g., Dr. Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="principal_contact_number" render={({ field }) => (<FormItem><FormLabel>Principal's Contact Number</FormLabel><FormControl><Input placeholder="e.g., +1-555-987-6543" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="principal_email" render={({ field }) => (<FormItem><FormLabel>Principal's Email</FormLabel><FormControl><Input type="email" placeholder="e.g., principal@oakwoodacademy.edu" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <Separator className="my-6" />
              <h3 className="text-lg font-semibold flex items-center"><Lock className="mr-2 h-5 w-5 text-accent"/> Initial School Admin Account</h3>
               <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="admin_username" render={({ field }) => (<FormItem><FormLabel>Admin Username</FormLabel><FormControl><Input placeholder="Choose an admin username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="admin_email" render={({ field }) => (<FormItem><FormLabel>Admin Email</FormLabel><FormControl><Input type="email" placeholder="Admin's email address" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="admin_password" render={({ field }) => (<FormItem><FormLabel>Admin Password</FormLabel><FormControl><Input type="password" placeholder="Create a strong password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="admin_confirm_password" render={({ field }) => (<FormItem><FormLabel>Confirm Admin Password</FormLabel><FormControl><Input type="password" placeholder="Confirm admin password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isLoading ? 'Registering School...' : 'Register School & Create Admin'}
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
