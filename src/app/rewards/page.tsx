// src/app/rewards/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Star, Trophy, Zap, ShieldCheck, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  achieved: boolean;
}

const mockRewards: Reward[] = [
  { id: "r1", title: "Math Magician", description: "Completed all basic math modules.", icon: Award, iconColor: "text-amber-500", bgColor: "bg-amber-50", achieved: true },
  { id: "r2", title: "Science Explorer", description: "Passed 5 science quizzes with 90% accuracy.", icon: Zap, iconColor: "text-sky-500", bgColor: "bg-sky-50", achieved: true },
  { id: "r3", title: "History Buff", description: "Read 10 historical articles.", icon: Trophy, iconColor: "text-lime-500", bgColor: "bg-lime-50", achieved: false },
  { id: "r4", title: "Top Learner", description: "Maintained a 7-day learning streak.", icon: Star, iconColor: "text-rose-500", bgColor: "bg-rose-50", achieved: true },
  { id: "r5", title: "Quiz Master", description: "Achieved a perfect score on 3 quizzes.", icon: ShieldCheck, iconColor: "text-indigo-500", bgColor: "bg-indigo-50", achieved: false },
  { id: "r6", title: "Fast Learner", description: "Completed a subject module in record time.", icon: Rocket, iconColor: "text-teal-500", bgColor: "bg-teal-50", achieved: true },
];

export default function RewardsPage() {
  return (
    <div className="space-y-8">
      <header className="py-8 bg-gradient-to-r from-primary to-emerald-600 text-center rounded-xl shadow-xl">
        <Trophy className="mx-auto h-16 w-16 text-primary-foreground mb-4" />
        <h1 className="text-4xl font-bold text-primary-foreground">My Rewards & Achievements</h1>
        <p className="text-lg mt-2 text-primary-foreground/90">Keep learning to unlock more amazing badges!</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Unlocked Badges ({mockRewards.filter(r => r.achieved).length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRewards.filter(r => r.achieved).map(reward => (
            <Card key={reward.id} className={`shadow-lg rounded-xl border-2 border-green-500 ${reward.bgColor}`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <reward.icon size={40} className={reward.iconColor} />
                <CardTitle className="text-xl">{reward.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-foreground/80">{reward.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Keep Going! ({mockRewards.filter(r => !r.achieved).length} more to unlock)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRewards.filter(r => !r.achieved).map(reward => (
            <Card key={reward.id} className={`shadow-md rounded-xl opacity-70 hover:opacity-100 transition-opacity ${reward.bgColor}`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <reward.icon size={40} className={`${reward.iconColor} opacity-50`} />
                <CardTitle className="text-xl text-muted-foreground">{reward.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">{reward.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
