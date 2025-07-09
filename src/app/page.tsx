
// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, BookOpen, Lightbulb, TrendingUp, Award, BarChart3, Users, GraduationCap, Megaphone, Building, User, School as SchoolIconLucide, Users2, HeartHandshake, Sigma, ClipboardEdit, PlayCircle, Lock, CheckCircle2, AlertTriangle, ChevronLeft, FileText, MessageSquare, CalendarDays, Palette, Library, FlaskConical, Globe, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import ContactSalesForm from '@/components/shared/ContactSalesForm';
import Logo from '@/components/shared/Logo';
import Player from 'lottie-react';

interface FeatureCardProps {
  animationUrl: string;
  title: string;
  description: string;
  animationDelay?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  animationUrl, title, description, animationDelay
}) => {
  return (
    <Card className={cn(
      "transform-gpu shadow-lg hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 rounded-xl flex flex-col bg-card/70 backdrop-blur-md border-border/50 h-full",
      "opacity-0 animate-fade-in-up",
      animationDelay
    )}>
      <CardHeader className="flex flex-col items-center text-center gap-2 pb-3 pt-6">
        <div className="h-32 w-32">
          <Player
            src={animationUrl}
            className="w-full h-full"
            autoplay
            loop
          />
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pb-6 text-center">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const studentFeatures: FeatureCardProps[] = [
  { animationUrl: "https://lottie.host/57530869-38e5-4a55-835c-457c5e2d137b/l8A5h2jIqL.json", title: "Interactive Lessons", description: "Engage with rich multimedia content, including videos, audio, and interactive elements designed for effective learning.", animationDelay:"animation-delay-100" },
  { animationUrl: "https://lottie.host/59c77d91-3c94-47aa-85b4-3a5f0e2b4f9f/7Q5uJ8g6k4.json", title: "AI Note Taker", description: "Automatically summarize key points from your lessons, helping you focus and revise efficiently.", animationDelay:"animation-delay-200" },
  { animationUrl: "https://lottie.host/790135d5-8f69-4a94-b15a-277121b65e9b/yF0I2VzW9g.json", title: "Personalized Quizzes", description: "Test your understanding with quizzes tailored to each lesson, reinforcing concepts and identifying areas for improvement.", animationDelay:"animation-delay-300" },
  { animationUrl: "https://lottie.host/a60c9164-3c66-4148-a003-888f4e92a874/a9Q3g1J0hP.json", title: "Progress Tracking", description: "Monitor your learning journey, see how far you've come, and stay motivated with clear progress indicators.", animationDelay:"animation-delay-400" },
  { animationUrl: "https://lottie.host/bf340c21-ab10-4835-a13a-237c95e1c841/Tq7Z2u3y4x.json", title: "Rewards & Badges", description: "Earn badges and unlock achievements as you complete lessons and master new skills, making learning fun.", animationDelay:"animation-delay-500" },
];

const parentFeatures: FeatureCardProps[] = [
  { animationUrl: "https://lottie.host/a60c9164-3c66-4148-a003-888f4e92a874/a9Q3g1J0hP.json", title: "Child Progress Monitoring", description: "Stay informed about your child's academic journey with detailed progress reports and performance insights.", animationDelay:"animation-delay-100" },
  { animationUrl: "https://lottie.host/9e0a2c09-5b7d-4c9f-8a0b-1d2e3f4a5b6c/m1N2o3P4q5.json", title: "Direct Communication", description: "Easily connect with teachers to discuss your child's learning, ask questions, and collaborate effectively.", animationDelay:"animation-delay-200" },
  { animationUrl: "https://lottie.host/d19318b2-132d-4d7a-9a8b-98f5da7e6e5f/1p2o3i4u5y.json", title: "Report Card Access", description: "View and download your child's report cards digitally, keeping all academic records organized and accessible.", animationDelay:"animation-delay-300" },
  { animationUrl: "https://lottie.host/b09a65f1-3d5e-4c7a-8b1b-2c3d4e5f6a7b/c3R4t5Y6u7.json", title: "School Event Calendar", description: "Keep track of important school dates, holidays, exams, and meetings with a synchronized calendar.", animationDelay:"animation-delay-400" },
];

const schoolTeacherFeatures: FeatureCardProps[] = [
  { animationUrl: "https://lottie.host/e8c8f8b8-3e4d-4b8a-8b1a-2c3d4e5f6a7b/m2n3b4v5c6.json", title: "Content Management", description: "Easily create, organize, and update lessons, quizzes, and supplementary materials for your students.", animationDelay:"animation-delay-100" },
  { animationUrl: "https://lottie.host/f9e8d7c6-5b4a-3e2d-1c0b-9a8b7c6d5e4f/x1Y2z3A4b5.json", title: "Student & Class Management", description: "Oversee student profiles, track class performance, and manage enrollments efficiently.", animationDelay:"animation-delay-200" },
  { animationUrl: "https://lottie.host/a0b1c2d3-e4f5-a6b7-8c9d-0e1f2a3b4c5d/o4p5q6r7s8.json", title: "AI-Powered Report Generation", description: "Generate comprehensive student report cards with insights, saving time and enhancing feedback.", animationDelay:"animation-delay-300" },
  { animationUrl: "https://lottie.host/63a56b63-14e3-4d43-9a3c-53c847e3a9f0/Vn5xH6y7z8.json", title: "School-Wide Announcements", description: "Communicate important updates, events, and news to students, parents, and staff seamlessly.", animationDelay:"animation-delay-400" },
  { animationUrl: "https://lottie.host/80261ca2-2598-4a6c-9c98-12d8a3a0e377/2eW6i8P3nQ.json", title: "School Administration Portal", description: "Manage school settings, user accounts, and access platform-wide analytics for institutional improvement.", animationDelay:"animation-delay-500" },
];

const FixedBackground = () => (
  <div
    id="fixed-background-container"
    className="fixed inset-0 z-[-10] overflow-hidden"
  >
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute top-0 left-0 w-full h-full object-cover"
      poster="https://placehold.co/1920x1080.png?text=GenAI+Campus+Loading..."
      data-ai-hint="educational abstract technology"
    >
      <source src="/videos/educational-bg.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
  </div>
);

const HeroSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-180px)] flex flex-col items-center justify-center text-center p-4 overflow-hidden">
       <div className={cn(
          "relative z-10 flex flex-col items-center justify-center max-w-3xl mx-auto p-6 sm:p-8",
          isMounted ? "opacity-0 animate-fade-in-up" : 'opacity-0'
        )} style={{ animationDelay: isMounted ? '0.1s' : undefined }}
      >
        <div className="mb-8">
             <Logo imageWidth={436} imageHeight={120} />
        </div>
        <h1
          className={cn(
            "font-extrabold mb-10 animate-text-pulse",
            "text-4xl sm:text-5xl md:text-6xl text-primary",
            "leading-tight",
            "[text-shadow:_1px_1px_3px_rgb(0_0_0_/_0.3)]"
          )}
        >
          Empowering Every <span className="text-primary">Learner's</span> Journey!
        </h1>
        <p
          className={cn(
            "text-base sm:text-xl text-accent",
            "font-medium animate-text-pulse",
            "[text-shadow:_1px_1px_2px_rgb(0_0_0_/_0.3)]",
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
  <div className="relative z-0 bg-card/80 backdrop-blur-sm">
    {children}
  </div>
);

export default function UnifiedDashboardPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (isLoadingAuth) {
      setIsRedirecting(true);
      return;
    }

    if (currentUser) {
      let targetPath: string | null = null;

      if (currentUser.role === 'Student') targetPath = '/student';
      else if (currentUser.role === 'Teacher') targetPath = '/teacher';
      else if (currentUser.role === 'Parent') targetPath = '/parent';
      else if (currentUser.role === 'Admin') {
        if (currentUser.is_school_admin && currentUser.administered_school?.id) {
          targetPath = `/school-admin/${currentUser.administered_school.id}`;
        } else {
          // Platform Admin stays on '/', no redirect
          targetPath = null;
        }
      }

      if (targetPath && pathname !== targetPath) {
        setIsRedirecting(true);
        router.push(targetPath);
      } else {
        setIsRedirecting(false);
      }
    } else {
      setIsRedirecting(false); // No current user, show public page
    }
  }, [isLoadingAuth, currentUser, router, pathname]);


  if (isLoadingAuth || isRedirecting) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
        <Image src="/images/Genai.png" alt="GenAI-Campus Logo Loading" width={280} height={77} priority className="mb-8" />
        <div className="flex space-x-3 sm:space-x-4 md:space-x-6 mb-8">
            <Sigma className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-100")} />
            <GraduationCap className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-200")} />
            <SchoolIconLucide className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-300")} />
            <Users className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-400")} />
            <HeartHandshake className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-500")} />
            <ClipboardEdit className={cn("h-10 w-10 md:h-12 md:w-12 text-primary", "animation-delay-700")} />
        </div>
        <p className="text-lg md:text-xl text-muted-foreground">
            Loading Your GenAI-Campus Experience...
        </p>
      </div>
    );
  }

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
                  animationUrl={feature.animationUrl}
                  title={feature.title}
                  description={feature.description}
                  animationDelay={cn('animation-delay-100', `md:animation-delay-${(index + 1) * 100}`)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Parents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 xl:gap-8">
              {parentFeatures.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  animationUrl={feature.animationUrl}
                  title={feature.title}
                  description={feature.description}
                  animationDelay={cn('animation-delay-100', `md:animation-delay-${(index + 1) * 100}`)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Schools & Teachers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              {schoolTeacherFeatures.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  animationUrl={feature.animationUrl}
                  title={feature.title}
                  description={feature.description}
                  animationDelay={cn('animation-delay-100', `md:animation-delay-${(index + 1) * 100}`)}
                />
              ))}
            </div>
          </section>

          <section className="py-12 bg-card rounded-xl shadow-lg border border-border/50">
            <div className="container mx-auto px-4">
                 <ContactSalesForm />
            </div>
          </section>
        </div>
      </ContentWrapper>
    </div>
  );
}
