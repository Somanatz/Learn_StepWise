
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
  // Fields for school admin dashboard (potentially aggregated)
  student_count?: number;
  staff_count?: number;
  // senior_teachers?: { name: string, subject: string, years_experience: number }[];
  // performance_history?: { year: number, score: number }[];
}

export interface LessonSummary { // For brief lesson listings
  id: string | number;
  title: string;
  lesson_order?: number;
  is_locked?: boolean; 
  video_url?: string;
  audio_url?: string;
  image_url?: string;
}

export interface Choice {
  id: string | number;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string | number;
  text: string;
  choices: Choice[];
}

export interface Quiz {
  id: string | number;
  title: string;
  description?: string;
  pass_mark_percentage?: number;
  questions: Question[];
  lesson: string | number; 
}


export interface Lesson extends LessonSummary { 
  content: string;
  simplified_content?: string;
  subject?: string | number; 
  subject_name?: string;
  quiz?: Quiz | null; 
  requires_previous_quiz?: boolean;
}


export interface Subject {
  id: string | number; 
  name: string;
  icon: LucideIcon; 
  description: string;
  lessonsCount: number; 
  lessons: LessonSummary[]; 
  bgColor?: string; 
  textColor?: string; 
  href: string; 
  is_locked?: boolean; 
  class_obj?: string | number; 
  class_obj_name?: string; 
}

export interface Class {
  id: string | number; 
  name: string;
  description?: string;
  subjects: Subject[]; 
  school?: string | number; 
  school_name?: string;
}


export type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_school_admin?: boolean;
  school?: string | number | null; 
  school_name?: string | null;
  administered_school?: { id: number; name: string; school_id_code: string; } | null; // For school admins
  student_profile?: StudentProfileData | null;
  teacher_profile?: TeacherProfileData | null;
  parent_profile?: ParentProfileData | null;
}

export interface StudentProfileData {
    id?: number;
    user?: number; 
    full_name?: string | null;
    school?: string | number | null; 
    school_name?: string | null; 
    enrolled_class?: string | number | null; 
    enrolled_class_name?: string | null; 
    nickname?: string | null;
    preferred_language?: string | null;
    father_name?: string | null;
    mother_name?: string | null;
    place_of_birth?: string | null;
    date_of_birth?: string | null; 
    blood_group?: string | null;
    needs_assistant_teacher?: boolean;
    admission_number?: string | null;
    parent_email_for_linking?: string | null;
    parent_mobile_for_linking?: string | null;
    parent_occupation?: string | null;
    hobbies?: string | null;
    favorite_sports?: string | null;
    interested_in_gardening_farming?: boolean;
    profile_picture?: string | null; 
    profile_picture_url?: string | null; 
}

export interface TeacherProfileData {
    id?: number;
    user?: number;
    full_name?: string | null;
    school?: string | number | null; 
    school_name?: string | null;
    assigned_classes?: (string | number)[]; 
    assigned_classes_details?: { id: string | number, name: string }[]; 
    subject_expertise?: (string | number)[]; 
    subject_expertise_details?: { id: string | number, name: string }[]; 
    interested_in_tuition?: boolean;
    mobile_number?: string | null;
    address?: string | null;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
}

export interface ParentProfileData {
    id?: number;
    user?: number;
    full_name?: string | null;
    mobile_number?: string | null;
    address?: string | null;
    profile_picture?: string | null;
    profile_picture_url?: string | null;
}

export interface ParentStudentLinkAPI {
  id: string | number;
  parent: number; 
  student: number; 
  parent_username: string;
  student_username: string;
  student_details?: StudentProfileData; 
}


export interface Book {
    id: number;
    title: string;
    author?: string;
    file?: string; 
    file_url?: string; 
    subject?: number; 
    subject_name?: string;
    class_obj?: number; 
    class_name?: string;
}

export interface Event {
    id: number;
    title: string;
    description?: string;
    date: string; 
    end_date?: string; 
    type: 'Holiday' | 'Exam' | 'Meeting' | 'Activity' | 'Deadline' | 'General';
    created_by_username?: string;
    school?: number | null; // School ID
    school_name?: string | null;
    target_class?: number | null; // Class ID
    target_class_name?: string | null;
}


export interface UserQuizAttempt {
  id: string | number;
  user: number;
  user_username: string;
  quiz: number;
  quiz_title: string;
  lesson_title?: string;
  score: number;
  passed: boolean;
  completed_at: string; 
  answers?: any; 
}

export interface UserLessonProgress {
  id: string | number;
  user: number;
  lesson: number;
  lesson_title: string;
  completed: boolean;
  progress_data?: any; 
  last_updated: string; 
}
