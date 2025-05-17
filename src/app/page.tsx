
// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, BookOpen, Lightbulb, HelpCircle, TrendingUp, Award, BarChart3, MessageSquare, FileText, CalendarDays, ClipboardEdit, Users2, GraduationCap, Megaphone, Building, Users } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, iconColor = "text-primary" }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col bg-card/80 backdrop-blur-sm border-border/50 h-full">
      <CardHeader className="flex-row items-center gap-4 pb-3">
        <Icon size={32} className={iconColor} />
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground animate-text-pulse">{description}</p>
      </CardContent>
    </Card>
  );
};

const studentFeatures: FeatureCardProps[] = [
  { icon: BookOpen, title: "Interactive Lessons", description: "Engage with rich multimedia content, including videos, audio, and interactive elements designed for effective learning." },
  { icon: Lightbulb, title: "AI Note Taker", description: "Automatically summarize key points from your lessons, helping you focus and revise efficiently." },
  { icon: HelpCircle, title: "Personalized Quizzes", description: "Test your understanding with quizzes tailored to each lesson, reinforcing concepts and identifying areas for improvement." },
  { icon: TrendingUp, title: "Progress Tracking", description: "Monitor your learning journey, see how far you've come, and stay motivated with clear progress indicators." },
  { icon: Award, title: "Rewards & Badges", description: "Earn badges and unlock achievements as you complete lessons and master new skills, making learning fun." },
];

const parentFeatures: FeatureCardProps[] = [
  { icon: BarChart3, title: "Child Progress Monitoring", description: "Stay informed about your child's academic journey with detailed progress reports and performance insights." },
  { icon: MessageSquare, title: "Direct Communication", description: "Easily connect with teachers to discuss your child's learning, ask questions, and collaborate effectively." },
  { icon: FileText, title: "Report Card Access", description: "View and download your child's report cards digitally, keeping all academic records organized and accessible." },
  { icon: CalendarDays, title: "School Event Calendar", description: "Keep track of important school dates, holidays, exams, and meetings with a synchronized calendar." },
];

const teacherSchoolFeatures: FeatureCardProps[] = [
  { icon: ClipboardEdit, title: "Content Management", description: "Easily create, organize, and update lessons, quizzes, and supplementary materials for your students." },
  { icon: Users, title: "Student & Class Management", description: "Oversee student profiles, track class performance, and manage enrollments efficiently." },
  { icon: GraduationCap, title: "AI-Powered Report Generation", description: "Generate comprehensive student report cards with insights, saving time and enhancing feedback." },
  { icon: Megaphone, title: "School-Wide Announcements", description: "Communicate important updates, events, and news to students, parents, and staff seamlessly." },
  { icon: Building, title: "School Administration Portal", description: "Manage school settings, user accounts, and access platform-wide analytics for institutional improvement." },
];


export default function UnifiedDashboardPage() {
  const { currentUser, currentUserRole, isLoadingAuth } = useAuth();
  const router = useRouter();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      if (currentUserRole === 'Student') router.push('/student');
      else if (currentUserRole === 'Teacher') router.push('/teacher');
      else if (currentUserRole === 'Parent') router.push('/parent');
      // else if (currentUserRole === 'Admin') router.push('/admin-dashboard'); 
    }
  }, [isLoadingAuth, currentUser, currentUserRole, router]);

  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      const timer = setTimeout(() => setIsWelcomeVisible(true), 100); 
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, currentUser]);

  if (isLoadingAuth) {
    return ( 
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/StepWise.png" alt="Learn-StepWise Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Your Experience...</p>
      </div>
    );
  }
  
  if (!currentUser && !isLoadingAuth) {
    return (
      <div className="relative flex flex-col items-center justify-center text-center p-4 overflow-hidden min-h-[calc(100vh-160px)] /* Adjust 160px based on header/footer height */">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://placehold.co/1920x1080.png?text=StepWise+Educational+Background"
          data-ai-hint="education technology"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/educational-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>
        
        <div className="relative z-20 w-full">
          <div className={`
            max-w-3xl mx-auto p-6 sm:p-8 text-center
            transition-all duration-1000 ease-out
            ${isWelcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            <h1
              className={`
                font-extrabold mb-6 text-primary-foreground
                text-4xl sm:text-5xl md:text-6xl 
                leading-tight 
                [text-shadow:_3px_3px_6px_rgb(0_0_0_/_0.7)]
                animate-pulse-subtle 
                transition-opacity duration-[1400ms] ease-out delay-300
                ${isWelcomeVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              Welcome to<br />Learn-StepWise!
            </h1>
            <p
              className={`
                text-base sm:text-xl text-gray-200 mb-12
                font-medium
                [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.6)]
                animate-pulse-subtle animation-delay-300 
                transition-opacity duration-[1400ms] ease-out delay-600
                ${isWelcomeVisible ? 'opacity-100' : 'opacity-0'}
              `}
            >
              Your personalized learning journey starts here. Explore features tailored for every role in education.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-16 py-12">
            {/* Student Features */}
            <section className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-10 text-primary-foreground [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.5)]">For Students</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {studentFeatures.map(feature => <FeatureCard key={feature.title} {...feature} iconColor="text-emerald-400" />)}
              </div>
            </section>

            {/* Parent Features */}
            <section className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-10 text-primary-foreground [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.5)]">For Parents</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {parentFeatures.map(feature => <FeatureCard key={feature.title} {...feature} iconColor="text-sky-400" />)}
              </div>
            </section>

            {/* Teacher & School Features */}
            <section className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-10 text-primary-foreground [text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.5)]">For Teachers & Schools</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {teacherSchoolFeatures.map(feature => <FeatureCard key={feature.title} {...feature} iconColor="text-amber-400" />)}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/StepWise.png" alt="Learn-StepWise Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparing Your Dashboard...</p>
    </div>
  );
}
