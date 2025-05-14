import type { LucideIcon } from 'lucide-react';

export interface Subject {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  lessonsCount: number;
  bgColor?: string; // Optional: for card background variety
  textColor?: string; // Optional: for text color on card
  href: string;
}

export interface ClassLevel {
  level: number;
  title: string;
  subjects: Subject[];
}

export interface TestScore {
  subject: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface Student {
  name: string;
  classLevel: number;
}

export type UserRole = 'student' | 'teacher' | 'parent';
