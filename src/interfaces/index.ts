
import type { LucideIcon } from 'lucide-react';

export interface School {
  id: string | number;
  name: string;
  school_id_code: string;
  license_number?: string;
  official_email: string;
  phone_number?: string;
  address?: string;
  principal_full_name?: string;
  principal_contact_number?: string;
  principal_email?: string;
  // Add other fields from your School model
}

export interface Subject {
  id: string | number; // Changed from string to allow number from API
  name: string;
  icon: LucideIcon; // This will remain frontend specific for now
  description: string;
  lessonsCount: number;
  bgColor?: string; 
  textColor?: string; 
  href: string;
  is_locked?: boolean;
  class_obj_name?: string; // If subject serializer provides class name
}

export interface Class {
  id: string | number; // Changed from number to allow string from API sometimes
  name: string;
  description?: string;
  subjects: Subject[]; // Array of Subject objects/IDs
  school?: string | number; // School ID
  school_name?: string;
  // Any other class-specific fields
}

// User roles should match backend choices
export type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

// Interface for user object from backend, especially after login /users/me/
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_school_admin?: boolean;
  // Profile data can be nested or fetched separately
  student_profile?: StudentProfileData;
  teacher_profile?: TeacherProfileData;
  parent_profile?: ParentProfileData;
  // assigned_class_name and other direct fields are removed as they are now in profiles
}

export interface StudentProfileData {
    id?: number;
    full_name?: string;
    school?: string | number; // School ID
    school_name?: string; // For display
    enrolled_class?: string | number; // Class ID
    enrolled_class_name?: string; // For display
    preferred_language?: string;
    father_name?: string;
    mother_name?: string;
    place_of_birth?: string;
    date_of_birth?: string; // ISO date string
    blood_group?: string;
    needs_assistant_teacher?: boolean;
    admission_number?: string;
    parent_email_for_linking?: string;
    parent_mobile_for_linking?: string;
    hobbies?: string;
    favorite_sports?: string;
    interested_in_gardening_farming?: boolean;
}

export interface TeacherProfileData {
    id?: number;
    full_name?: string;
    school?: string | number; // School ID
    school_name?: string;
    assigned_classes?: (string | number)[]; // Array of Class IDs
    assigned_classes_details?: { id: string | number, name: string }[]; // For display
    subject_expertise?: (string | number)[]; // Array of Subject IDs
    subject_expertise_details?: { id: string | number, name: string }[]; // For display
    interested_in_tuition?: boolean;
    mobile_number?: string;
    address?: string;
}

export interface ParentProfileData {
    id?: number;
    full_name?: string;
    mobile_number?: string;
    address?: string;
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
    school?: number;
    school_name?: string;
    target_class?: number;
    target_class_name?: string;
}

// Interface for Lesson for StudentDashboard/SubjectCard, might differ from API Lesson
export interface LessonSummary {
  id: string | number;
  title: string;
  is_locked?: boolean;
}
