// src/components/shared/ContactSalesForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';

const contactSalesSchema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  contactPerson: z.string().min(1, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').optional(),
});

type ContactSalesFormValues = z.infer<typeof contactSalesSchema>;

export default function ContactSalesForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactSalesFormValues>({
    resolver: zodResolver(contactSalesSchema),
    defaultValues: {
      schoolName: '',
      contactPerson: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactSalesFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Contact Sales Data:', data);
    toast({
      title: 'Inquiry Sent!',
      description: 'Thank you for your interest. Our sales team will contact you shortly.',
    });
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">Interested in Learn-StepWise for Your School?</h3>
      <p className="text-sm text-secondary-foreground/80 mb-4">
        Fill out the form below, and our sales team will get in touch to discuss how we can tailor our platform to your needs.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-secondary-foreground/90">School Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your School's Name" {...field} className="bg-background/80 placeholder:text-muted-foreground/70" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-secondary-foreground/90">Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} className="bg-background/80 placeholder:text-muted-foreground/70" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-secondary-foreground/90">Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} className="bg-background/80 placeholder:text-muted-foreground/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-secondary-foreground/90">Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell us a bit about your school or any specific questions..." {...field} className="bg-background/80 placeholder:text-muted-foreground/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Inquiry
          </Button>
        </form>
      </Form>
    </div>
  );
}
