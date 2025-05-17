// src/app/loading.tsx
import Image from 'next/image';
import { GraduationCap, School, Users, HeartHandshake, Presentation, Sigma } from 'lucide-react';

export default function Loading() {
  const iconSize = "h-10 w-10 md:h-12 md:w-12"; // Responsive icon size
  const iconDelayBase = 100; // ms

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background fixed inset-0 z-[100] p-4">
      <div className="relative w-[70vw] h-[35vh] max-w-[650px] max-h-[230px] flex items-center justify-center mb-8">
        <Image
          src="/images/StepWise.png" // Ensure this path is correct
          alt="Learn-StepWise Logo Loading"
          fill 
          style={{ objectFit: "contain" }} 
          priority 
          className="animate-pulse" 
        />
      </div>

      <div className="flex space-x-3 sm:space-x-4 md:space-x-6 mb-8">
        <Sigma 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 1}ms` }}
        />
        <GraduationCap 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 2}ms` }}
        />
        <School 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 3}ms` }}
        />
        <Users 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 4}ms` }}
        />
        <HeartHandshake 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 5}ms` }}
        />
        <Presentation 
          className={`${iconSize} text-primary animate-pulse`} 
          style={{ animationDelay: `${iconDelayBase * 6}ms` }}
        />
      </div>

      <p className="text-lg md:text-xl text-muted-foreground animate-pulse" style={{ animationDelay: `${iconDelayBase * 7}ms` }}>
        Preparing Your StepWise Experience...
      </p>
    </div>
  );
}
