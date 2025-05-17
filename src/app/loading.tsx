// src/app/loading.tsx
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background fixed inset-0 z-[100]">
      <div className="relative w-[50vw] h-[50vh] max-w-[400px] max-h-[150px] flex items-center justify-center">
        <Image
          src="/images/StepWise.png" // Ensure this path is correct
          alt="Learn-StepWise Logo Loading"
          fill // Use fill to adapt to the parent div's size
          style={{ objectFit: "contain" }} // Maintain aspect ratio and fit within bounds
          priority // Important for LCP on loading screens
          className="animate-pulse" // Subtle pulse animation
        />
      </div>
      <p className="mt-6 text-lg text-muted-foreground animate-pulse">
        Preparing Your StepWise Experience...
      </p>
    </div>
  );
}
