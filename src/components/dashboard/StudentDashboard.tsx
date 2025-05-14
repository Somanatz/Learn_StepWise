// src/components/dashboard/StudentDashboard.tsx
'use client';

import ClassSection from '@/components/dashboard/ClassSection';
import type { ClassLevel } from '@/interfaces';
import { BookOpen, Calculator, FlaskConical, Globe, ScrollText, Brain, Palette, Music, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

// Mock data for subjects and classes
const MOCK_CLASS_DATA: ClassLevel[] = [
  {
    level: 1,
    title: "Foundational Year",
    subjects: [
      { id: "eng1", name: "English Basics", icon: BookOpen, description: "Learn alphabets, phonics, and basic sentence construction.", lessonsCount: 20, href: "/learn/english-basics", bgColor: "bg-emerald-500", textColor: "text-white" },
      { id: "math1", name: "Fun with Numbers", icon: Calculator, description: "Introduction to numbers, counting, addition, and subtraction.", lessonsCount: 25, href: "/learn/fun-with-numbers", bgColor: "bg-sky-500", textColor: "text-white"},
      { id: "art1", name: "Creative Canvas", icon: Palette, description: "Explore colors, shapes, and unleash your inner artist.", lessonsCount: 15, href: "/learn/creative-canvas", bgColor: "bg-amber-500", textColor: "text-white" },
    ],
  },
  {
    level: 5,
    title: "Middle School Explorers",
    subjects: [
      { id: "sci5", name: "Science Wonders", icon: FlaskConical, description: "Discover the wonders of physics, chemistry, and biology around you.", lessonsCount: 30, href: "/learn/science-wonders", bgColor: "bg-indigo-500", textColor: "text-white" },
      { id: "hist5", name: "Journey Through Time", icon: ScrollText, description: "Explore ancient civilizations and pivotal historical events.", lessonsCount: 22, href: "/learn/journey-through-time", bgColor: "bg-orange-500", textColor: "text-white" },
      { id: "geo5", name: "Our Planet Earth", icon: Globe, description: "Learn about continents, oceans, climates, and maps.", lessonsCount: 18, href: "/learn/our-planet-earth", bgColor: "bg-teal-500", textColor: "text-white" },
      { id: "eng5", name: "Advanced English", icon: BookOpen, description: "Grammar, comprehension, and creative writing skills.", lessonsCount: 28, href: "/learn/advanced-english", bgColor: "bg-rose-500", textColor: "text-white" },
    ],
  },
  {
    level: 10,
    title: "High School Achievers",
    subjects: [
      { id: "phy10", name: "Physics", icon: Brain, description: "Delve into mechanics, electricity, magnetism, and modern physics.", lessonsCount: 40, href: "/learn/physics", bgColor: "bg-purple-600", textColor: "text-white" },
      { id: "chem10", name: "Chemistry", icon: FlaskConical, description: "Understand chemical reactions, periodic table, and organic chemistry.", lessonsCount: 38, href: "/learn/chemistry", bgColor: "bg-cyan-600", textColor: "text-white" },
      { id: "bio10", name: "Biology", icon: Users, description: "Study genetics, evolution, ecology, and human physiology.", lessonsCount: 35, href: "/learn/biology", bgColor: "bg-lime-600", textColor: "text-white" },
      { id: "math10", name: "Advanced Mathematics", icon: Calculator, description: "Calculus, algebra, trigonometry, and statistics.", lessonsCount: 45, href: "/learn/advanced-mathematics", bgColor: "bg-red-600", textColor: "text-white" },
    ],
  },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-gradient-to-r from-primary to-emerald-600 rounded-xl shadow-xl">
        <h1 className="text-4xl font-poppins font-extrabold mb-4 text-primary-foreground">Welcome Student to StepWise!</h1>
        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
          Your personalized journey to academic excellence starts here. Explore subjects, track progress, and unlock your potential.
        </p>
      </section>

      {MOCK_CLASS_DATA.map((classLevel) => (
        <ClassSection key={classLevel.level} classLevelData={classLevel} />
      ))}
      
      <section className="mt-12 p-6 bg-card rounded-xl shadow-lg">
        <h2 className="text-2xl font-poppins font-semibold text-foreground mb-4 flex items-center">
          <FileText className="mr-3 text-primary" />
          My Academic Reports
        </h2>
        <p className="text-muted-foreground mb-6">
          Access your latest report cards and academic summaries here.
        </p>
        <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
          <Link href="/student/view-my-report">View My Latest Report</Link>
        </Button>
      </section>

      <section className="mt-16 p-8 bg-secondary rounded-xl shadow-lg">
        <h2 className="text-3xl font-poppins font-semibold text-secondary-foreground mb-4">Stay Motivated!</h2>
        <p className="text-muted-foreground mb-6">
          Complete lessons, take quizzes, and earn badges to climb the leaderboard. Learning is an adventure!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Music size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Daily Streaks</h3>
            <p className="text-sm text-muted-foreground">Keep your learning streak alive for bonus rewards!</p>
          </div>
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Palette size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Unlock Badges</h3>
            <p className="text-sm text-muted-foreground">Show off your achievements with cool badges.</p>
          </div>
          <div className="p-6 bg-background rounded-lg shadow-md text-center">
            <Brain size={48} className="mx-auto text-accent mb-3" />
            <h3 className="font-poppins font-semibold text-xl mb-1">Challenge Friends</h3>
            <p className="text-sm text-muted-foreground">Compete in quizzes and learn together.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
