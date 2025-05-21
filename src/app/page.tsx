// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, BookOpen, Lightbulb, HelpCircle, TrendingUp, Award, BarChart3, MessageSquare as MessageIcon, FileText, CalendarDays, ClipboardEdit, Users, GraduationCap, Megaphone, Building, User, School as SchoolIconLucide, Users2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import ContactSalesForm from '@/components/shared/ContactSalesForm';
import { Button } from '@/components/ui/button';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  animationDelay?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon, title, description, iconColor = "text-primary", animationDelay
}) => {
  return (
    <Card className={cn(
      "transform-gpu shadow-lg hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 rounded-xl flex flex-col bg-card/70 backdrop-blur-md border-border/50 h-full",
      "opacity-0 animate-fade-in-up",
      animationDelay
    )}>
      <CardHeader className="flex-row items-center gap-4 pb-3 pt-6">
        <Icon size={32} className={cn(iconColor, "flex-shrink-0")} />
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pb-6">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const studentFeatures: Omit<FeatureCardProps, 'animationDelay'>[] = [
  { icon: BookOpen, title: "Interactive Lessons", description: "Engage with rich multimedia content, including videos, audio, and interactive elements designed for effective learning." },
  { icon: Lightbulb, title: "AI Note Taker", description: "Automatically summarize key points from your lessons, helping you focus and revise efficiently." },
  { icon: HelpCircle, title: "Personalized Quizzes", description: "Test your understanding with quizzes tailored to each lesson, reinforcing concepts and identifying areas for improvement." },
  { icon: TrendingUp, title: "Progress Tracking", description: "Monitor your learning journey, see how far you've come, and stay motivated with clear progress indicators." },
  { icon: Award, title: "Rewards & Badges", description: "Earn badges and unlock achievements as you complete lessons and master new skills, making learning fun." },
];

const parentFeatures: Omit<FeatureCardProps, 'animationDelay'>[] = [
  { icon: BarChart3, title: "Child Progress Monitoring", description: "Stay informed about your child's academic journey with detailed progress reports and performance insights." },
  { icon: MessageIcon, title: "Direct Communication", description: "Easily connect with teachers to discuss your child's learning, ask questions, and collaborate effectively." },
  { icon: FileText, title: "Report Card Access", description: "View and download your child's report cards digitally, keeping all academic records organized and accessible." },
  { icon: CalendarDays, title: "School Event Calendar", description: "Keep track of important school dates, holidays, exams, and meetings with a synchronized calendar." },
];

const teacherSchoolFeatures: Omit<FeatureCardProps, 'animationDelay'>[] = [
  { icon: ClipboardEdit, title: "Content Management", description: "Easily create, organize, and update lessons, quizzes, and supplementary materials for your students." },
  { icon: Users2, title: "Student & Class Management", description: "Oversee student profiles, track class performance, and manage enrollments efficiently." },
  { icon: GraduationCap, title: "AI-Powered Report Generation", description: "Generate comprehensive student report cards with insights, saving time and enhancing feedback." },
  { icon: Megaphone, title: "School-Wide Announcements", description: "Communicate important updates, events, and news to students, parents, and staff seamlessly." },
  { icon: Building, title: "School Administration Portal", description: "Manage school settings, user accounts, and access platform-wide analytics for institutional improvement." },
];

const FixedBackground = () => (
  <div 
    id="fixed-background-container" 
    className="fixed inset-0 z-[-10] overflow-hidden" // Added overflow-hidden
  >
    <video
      autoPlay
      loop
      muted
      playsInline // Important for iOS autoplay
      className="absolute top-0 left-0 w-full h-full object-cover"
      poster="https://placehold.co/1920x1080.png?text=GenAI+Campus+Loading..." // Optional: poster image
      data-ai-hint="educational abstract technology" // Added poster data-ai-hint
    >
      <source src="/videos/educational-bg.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div> {/* Overlay for readability */}
  </div>
);

const HeroSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const imageBaseClasses = "absolute rounded-full overflow-hidden shadow-xl border-4 border-background/30";
  const textBaseClasses = "opacity-0 animate-fade-in-up";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center p-4 overflow-hidden">
      {/* Background decorative circles/images */}
      <div className="relative w-full max-w-4xl mx-auto">
        {isMounted && (
          <>
            <div className={cn(imageBaseClasses, "w-40 h-40 md:w-56 md:h-56 top-10 left-5 md:left-10 opacity-80 animation-delay-200")}>
              <Image src="https://placehold.co/300x300.png" alt="Happy child learning 1" layout="fill" objectFit="cover" data-ai-hint="happy child learning"/>
            </div>
            <div className={cn(imageBaseClasses, "w-32 h-32 md:w-48 md:h-48 bottom-10 right-5 md:right-10 opacity-70 animation-delay-400")}>
              <Image src="https://placehold.co/250x250.png" alt="Students collaborating" layout="fill" objectFit="cover" data-ai-hint="students collaboration"/>
            </div>
            <div className={cn(imageBaseClasses, "w-24 h-24 md:w-36 md:h-36 top-1/4 right-1/4 md:top-1/3 md:right-1/3 opacity-90 animation-delay-600")}>
              <Image src="https://placehold.co/200x200.png" alt="Teacher with tablet" layout="fill" objectFit="cover" data-ai-hint="teacher tablet"/>
            </div>
            <div className={cn(imageBaseClasses, "hidden md:block w-28 h-28 bottom-1/3 left-1/4 opacity-60 animation-delay-800")}>
              <Image src="https://placehold.co/180x180.png" alt="Diverse children studying" layout="fill" objectFit="cover" data-ai-hint="diverse children study"/>
            </div>
          </>
        )}
      </div>

      {/* Foreground Text Content */}
      <div className={cn("relative z-10 max-w-3xl mx-auto p-6 sm:p-8", isMounted ? textBaseClasses : 'opacity-0')} style={{ animationDelay: '0.1s' }}>
        <h1
          className={cn(
            "font-extrabold mb-6",
            "text-4xl sm:text-5xl md:text-6xl",
            "leading-tight text-gray-100", // Ensures white text in dark mode
            "[text-shadow:_3px_3px_6px_rgb(0_0_0_/_0.7)]"
          )}
        >
          Empowering Every <span className="text-accent">Learner's</span> Journey!
        </h1>
        <p
          className={cn(
            "text-base sm:text-xl text-gray-200", // Ensures light gray text
            "font-medium",
            "[text-shadow:_2px_2px_4px_rgb(0_0_0_/_0.6)]",
            isMounted ? 'animation-delay-300' : ''
          )}
          style={{ animationDelay: isMounted ? '0.3s' : undefined }}
        >
          GenAI-Campus provides a playful and engaging platform with personalized learning paths, AI-powered tools, and robust support for students, parents, and educators.
        </p>
      </div>
    </section>
  );
};

const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative z-0 bg-background/80 backdrop-blur-sm"> {/* Semi-transparent background for scrolling content */}
    {children}
  </div>
);

export default function UnifiedDashboardPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
        if (currentUser.role === 'Student') router.push('/student');
        else if (currentUser.role === 'Teacher') router.push('/teacher');
        else if (currentUser.role === 'Parent') router.push('/parent');
        else if (currentUser.role === 'Admin' && currentUser.is_school_admin && currentUser.administered_school) {
          router.push(`/school-admin/${currentUser.administered_school.id}`);
        }
    }
  }, [isLoadingAuth, currentUser, router]);


  if (isLoadingAuth) {
    return ( 
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/Genai.png" alt="GenAI-Campus Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparing Your GenAI-Campus Experience...</p>
      </div>
    );
  }

  if (!currentUser && !isLoadingAuth) {
    const animationDelayClasses = ['animation-delay-100', 'animation-delay-200', 'animation-delay-300', 'animation-delay-400', 'animation-delay-500', 'animation-delay-700'];
    return (
      <div className="w-full">
        <FixedBackground />
        <HeroSection />
        
        <ContentWrapper>
          <div className="space-y-16 py-16 md:py-24 container mx-auto px-4">
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Students</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {studentFeatures.map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    iconColor="text-emerald-400"
                    animationDelay={animationDelayClasses[index % animationDelayClasses.length]}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Parents</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {parentFeatures.map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    iconColor="text-sky-400"
                    animationDelay={animationDelayClasses[index % animationDelayClasses.length]}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Schools & Teachers</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {teacherSchoolFeatures.map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    iconColor="text-amber-400"
                    animationDelay={animationDelayClasses[index % animationDelayClasses.length]}
                  />
                ))}
              </div>
            </section>

            <section className="py-12 bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/50">
              <div className="container mx-auto px-4">
                   <ContactSalesForm />
              </div>
            </section>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  // Fallback for authenticated users before redirection logic fully kicks in, or if role is unrecognized by redirect logic
  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image src="/images/Genai.png" alt="GenAI-Campus Logo" width={280} height={77} priority className="mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparing Your Dashboard...</p>
    </div>
  );
}
