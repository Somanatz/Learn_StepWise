// src/app/loading.tsx
import Image from 'next/image';
import { GraduationCap, School, Users, HeartHandshake, Presentation, Sigma } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Loading() {
  const iconSize = "h-10 w-10 md:h-12 md:w-12";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background fixed inset-0 z-[100] p-4">
      <div className="relative w-[70vw] h-[35vh] max-w-[650px] max-h-[230px] flex items-center justify-center mb-8">
        <Image
          src="/images/StepWise.png" // Ensure this path is correct
          alt="Learn-StepWise Logo Loading"
          fill 
          style={{ objectFit: "contain" }} 
          priority 
        />
      </div>

      <div className="flex space-x-3 sm:space-x-4 md:space-x-6 mb-8">
        <Sigma 
          className={cn(iconSize, "text-primary")} 
        />
        <GraduationCap 
          className={cn(iconSize, "text-primary")}
        />
        <School 
          className={cn(iconSize, "text-primary")}
        />
        <Users 
          className={cn(iconSize, "text-primary")}
        />
        <HeartHandshake 
          className={cn(iconSize, "text-primary")}
        />
        <Presentation 
          className={cn(iconSize, "text-primary")}
        />
      </div>

      <p className={cn("text-lg md:text-xl text-muted-foreground")}>
        Preparing Your StepWise Experience...
      </p>
    </div>
  );
}
