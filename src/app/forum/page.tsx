// src/app/forum/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Users, ThumbsUp, MessageCircle as MessageIcon, PlusCircle } from "lucide-react";
import Link from "next/link";

interface ForumThread {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastPost: string;
  category: string;
  tags: string[];
}

const mockThreads: ForumThread[] = [
  { id: "t1", title: "Struggling with Advanced Algebra - Need Help!", author: "StudentAlex", replies: 12, views: 150, lastPost: "TeacherEmily - 2h ago", category: "Subject Help", tags: ["math", "algebra"] },
  { id: "t2", title: "Tips for Preparing for the Science Fair", author: "ScienceGeek99", replies: 5, views: 89, lastPost: "ParentSarah - 1d ago", category: "General Discussion", tags: ["science", "projects"] },
  { id: "t3", title: "Announcement: Upcoming Parent-Teacher Meetings", author: "AdminStepWise", replies: 0, views: 250, lastPost: "AdminStepWise - 3d ago", category: "Announcements", tags: ["school", "meetings"] },
  { id: "t4", title: "Favorite Historical Period and Why?", author: "HistoryLover", replies: 25, views: 302, lastPost: "StudentMaria - 5m ago", category: "General Discussion", tags: ["history", "discussion"] },
  { id: "t5", title: "Clarification on English Essay Submission", author: "BookwormBen", replies: 2, views: 45, lastPost: "TeacherDavid - 1h ago", category: "Subject Help", tags: ["english", "essay"] },
];

export default function ForumPage() {
  return (
    <div className="space-y-8">
      <header className="py-10 bg-gradient-to-r from-accent to-blue-600 text-center rounded-xl shadow-xl">
        <MessageSquare className="mx-auto h-16 w-16 text-primary-foreground mb-4" />
        <h1 className="text-4xl font-bold text-primary-foreground">StepWise Community Forum</h1>
        <p className="text-lg mt-2 text-primary-foreground/90 max-w-2xl mx-auto">
          Connect, discuss, and learn together. Ask questions, share insights, and help fellow StepWise users.
        </p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input type="search" placeholder="Search forum threads..." className="pl-10 h-10 text-base" />
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Start New Thread
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="all">All Threads</TabsTrigger>
          <TabsTrigger value="general">General Discussion</TabsTrigger>
          <TabsTrigger value="help">Subject Help</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ThreadList threads={mockThreads} />
        </TabsContent>
        <TabsContent value="general">
          <ThreadList threads={mockThreads.filter(t => t.category === "General Discussion")} />
        </TabsContent>
        <TabsContent value="help">
          <ThreadList threads={mockThreads.filter(t => t.category === "Subject Help")} />
        </TabsContent>
        <TabsContent value="announcements">
          <ThreadList threads={mockThreads.filter(t => t.category === "Announcements")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ThreadListProps {
  threads: ForumThread[];
}

const ThreadList: React.FC<ThreadListProps> = ({ threads }) => {
  if (threads.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No threads found in this category.</p>;
  }
  return (
    <div className="space-y-4">
      {threads.map(thread => (
        <Card key={thread.id} className="hover:shadow-lg transition-shadow rounded-lg">
          <CardHeader className="pb-3">
            <Link href={`/forum/thread/${thread.id}`} legacyBehavior passHref>
              <a className="hover:text-primary">
                <CardTitle className="text-lg font-semibold">{thread.title}</CardTitle>
              </a>
            </Link>
            <CardDescription className="text-xs">
              Started by <span className="font-medium text-accent">{thread.author}</span> in <span className="font-medium">{thread.category}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center text-xs text-muted-foreground pb-3">
            <div className="flex gap-3">
              <span><MessageIcon className="inline mr-1 h-4 w-4" />{thread.replies} Replies</span>
              <span><Users className="inline mr-1 h-4 w-4" />{thread.views} Views</span>
            </div>
            <div>Last post by <span className="font-medium text-foreground">{thread.lastPost.split(' - ')[0]}</span> ({thread.lastPost.split(' - ')[1]})</div>
          </CardContent>
          <CardFooter className="pb-3 pt-0">
            <div className="flex gap-2">
              {thread.tags.map(tag => (
                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
