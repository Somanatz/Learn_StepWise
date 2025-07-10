
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

interface FeatureCardProps {
  videoUrl: string;
  title: string;
  description: string;
  animationDelay?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  videoUrl, title, description, animationDelay
}) => {
  return (
    <Card className={cn(
      "relative group overflow-hidden rounded-xl aspect-video flex flex-col justify-end items-center text-center p-8",
      "transform-gpu shadow-lg hover:shadow-2xl transition-all duration-300",
      "opacity-0 animate-fade-in-up",
      animationDelay
    )}>
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-110"
        poster="https://placehold.co/600x400.png"
        data-ai-hint="feature animation"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 z-10"></div>
      
      <div className="relative z-20 max-w-3xl text-white transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
        <h3 className="text-4xl font-bold mb-4 [text-shadow:_2px_2px_6px_rgb(0_0_0_/_0.6)]">
          {title}
        </h3>
        <p className="text-lg text-white/95 [text-shadow:_1px_1px_4px_rgb(0_0_0_/_0.5)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {description}
        </p>
      </div>
    </Card>
  );
};


const studentFeatures: FeatureCardProps[] = [
    { videoUrl: "/videos/learning.mp4", title: "🎓 Interactive Learning", description: "Dive into dynamic lessons filled with videos, audio clips, and interactive elements. Our AI can simplify complex topics and generate quizzes on the fly to ensure you master every concept before moving on.", animationDelay:"animation-delay-100" },
    { videoUrl: "/videos/ai-notes.mp4", title: "✍️ AI Note Taker & Summarizer", description: "Focus on learning, not just transcription. Our AI assistant takes smart notes for you and provides concise summaries of entire lessons, perfect for quick revisions and exam preparation.", animationDelay:"animation-delay-200" },
    { videoUrl: "/videos/progress-tracking.mp4", title: "📊 Progress & Rewards", description: "Visually track your journey through subjects, monitor your quiz scores, and earn badges for your achievements. Stay motivated by seeing how far you’ve come and what’s next.", animationDelay:"animation-delay-300" },
    { videoUrl: "/videos/rewards.mp4", title: "💡 AI-Powered Suggestions", description: "Receive personalized recommendations for lessons, videos, and quizzes based on your performance. Our AI helps you focus on areas that need improvement, making your study time more effective.", animationDelay:"animation-delay-400" },
];

const parentFeatures: FeatureCardProps[] = [
    { videoUrl: "/videos/child-progress.mp4", title: "📈 Child Progress Monitoring", description: "Get a clear and comprehensive view of your child's academic performance. Track their progress in different subjects, view quiz results, and understand their learning patterns at a glance.", animationDelay:"animation-delay-100" },
    { videoUrl: "/videos/communication.mp4", title: "💬 Secure Communication", description: "Connect directly and securely with your child's teachers. Ask questions, share concerns, and stay aligned on your child's educational journey through our integrated messaging system.", animationDelay:"animation-delay-200" },
    { videoUrl: "/videos/report-cards.mp4", title: "📋 Digital Report Cards", description: "Access your child's official report cards anytime, anywhere. View detailed performance feedback and historical records to support their long-term academic growth.", animationDelay:"animation-delay-300" },
    { videoUrl: "/videos/calendar.mp4", title: "🗓️ Unified Calendar", description: "Never miss an important date. Stay updated with a centralized calendar for school-wide events, holidays, exam schedules, and parent-teacher meetings.", animationDelay:"animation-delay-400" },
];

const schoolTeacherFeatures: FeatureCardProps[] = [
    { videoUrl: "/videos/content-management.mp4", title: "📚 Effortless Content Management", description: "Create, upload, and organize lessons, quizzes, and supplementary materials with ease. Our intuitive tools let you build a rich curriculum for your students.", animationDelay:"animation-delay-100" },
    { videoUrl: "/videos/class-management.mp4", title: "👩‍🏫 Student & Class Oversight", description: "Manage student profiles, track class-wide performance, and monitor engagement from a centralized dashboard. Get the data you need to support every student effectively.", animationDelay:"animation-delay-200" },
    { videoUrl: "/videos/ai-reports.mp4", title: "🤖 AI-Assisted Report Generation", description: "Save hours of administrative work. Our Genkit-powered AI analyzes student performance data to generate insightful and comprehensive report cards automatically.", animationDelay:"animation-delay-300" },
    { videoUrl: "/videos/admin-portal.mp4", title: "📢 School-Wide Communication", description: "Broadcast announcements, share important updates, and manage school events through a powerful administration portal, ensuring everyone in your community stays informed.", animationDelay:"animation-delay-400" },
];

const HeroSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-180px)] flex flex-col items-center justify-center text-center p-4 overflow-hidden rounded-xl shadow-lg my-8">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        poster="https://placehold.co/1920x1080.png"
        data-ai-hint="educational students walking"
      >
        <source src="/videos/educational-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/50 z-0"></div>

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
            "text-4xl sm:text-5xl md:text-6xl text-primary-foreground",
            "leading-tight",
            "[text-shadow:_1px_1px_8px_rgb(0_0_0_/_0.8)]"
          )}
        >
          Empowering Every <span className="text-primary-foreground drop-shadow-lg">Learner's</span> Journey!
        </h1>
        <p
          className={cn(
            "text-base sm:text-xl text-primary-foreground/90",
            "font-medium animate-text-pulse",
            "[text-shadow:_1px_1px_4px_rgb(0_0_0_/_0.7)]",
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
    <div className="w-full bg-background">
      <div className="container mx-auto px-4">
        <HeroSection />
      </div>

      <div className="space-y-16 py-16 md:py-24 container mx-auto px-4">
        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Students</h2>
          <div className="space-y-8">
            {studentFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                videoUrl={feature.videoUrl}
                title={feature.title}
                description={feature.description}
                animationDelay={cn('animation-delay-100', `md:animation-delay-${(index + 1) * 100}`)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Parents</h2>
          <div className="space-y-8">
            {parentFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                videoUrl={feature.videoUrl}
                title={feature.title}
                description={feature.description}
                animationDelay={cn('animation-delay-100', `md:animation-delay-${(index + 1) * 100}`)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-foreground">For Schools & Teachers</h2>
          <div className="space-y-8">
            {schoolTeacherFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                videoUrl={feature.videoUrl}
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
    </div>
  );
}
