import type { LucideIcon } from 'lucide-react';

export interface Subject {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  lessonsCount: number;
  bgColor?: string; 
  textColor?: string; 
  href: string;
  is_locked?: boolean; // Added to reflect lesson locking status at subject level if needed
}

export interface ClassLevel {
  level: number; // e.g., 5 for Class 5
  title: string; // e.g., "Class 5", "Primary School Year 3"
  subjects: Subject[];
}

export interface TestScore {
  subject: string;
  score: number;
  maxScore: number;
  date: string;
}

// This is a simplified student model for some contexts
export interface Student {
  name: string;
  classLevel: number;
}

// User roles should match backend choices
export type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

// Interface for user object from backend, especially after login /users/me/
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  preferred_language?: string; // Student
  subject_expertise?: string; // Teacher
  assigned_class?: string | number; // Teacher (ID of the class)
  assigned_class_name?: string; // Teacher (Name of the class for display)
  // any other fields from your CustomUser model
}

// Interface for Book model (from content.Book)
export interface Book {
    id: number;
    title: string;
    author?: string;
    file?: string; // URL to the file
    file_url?: string; // Full URL if provided by serializer
    subject?: number; // Subject ID
    subject_name?: string;
    class_obj?: number; // Class ID
    class_name?: string;
}

// Interface for Event model (from notifications.Event)
export interface Event {
    id: number;
    title: string;
    description?: string;
    date: string; // ISO date string
    end_date?: string; // ISO date string, optional
    type: 'Holiday' | 'Exam' | 'Meeting' | 'Activity' | 'Deadline' | 'General';
    created_by_username?: string;
}
