
// src/app/forum/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Users, ThumbsUp, MessageCircle as MessageIcon, PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api"; // Assuming you have this for API calls
import { Skeleton } from "@/components/ui/skeleton";

interface ForumThread { // Assuming this structure for fetched threads
  id: string;
  title: string;
  author_username: string; // Assuming backend sends author's username
  reply_count: number;
  view_count: number;
  last_activity_by: string; // e.g., "Username - 2h ago"
  category_name: string;
  tags: string[]; // Assuming tags are simple strings
}

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const fetchThreads = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API endpoint for forum threads
        // const response = await api.get<ForumThread[]>(`/forum/threads/?category=${activeTab === 'all' ? '' : activeTab}`);
        // For now, simulating an empty response as backend is not ready
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        setThreads([]); 
        // setError("Forum API endpoint not yet implemented. Showing empty state.");
      } catch (err) {
        console.error("Failed to fetch forum threads:", err);
        setError(err instanceof Error ? err.message : "Could not load forum threads.");
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <header className="py-10 bg-gradient-to-r from-accent to-blue-600 text-center rounded-xl shadow-xl">
          <MessageSquare className="mx-auto h-16 w-16 text-primary-foreground mb-4" />
          <h1 className="text-4xl font-bold text-primary-foreground">GenAI-Campus Community Forum</h1>
          <p className="text-lg mt-2 text-primary-foreground/90 max-w-2xl mx-auto">
            Connect, discuss, and learn together. Ask questions, share insights, and help fellow GenAI-Campus users.
          </p>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search forum threads..." className="pl-10 h-10 text-base" />
          </div>
          <Button size="lg" onClick={() => alert("Create new thread - TBI")}>
            <PlusCircle className="mr-2 h-5 w-5" /> Start New Thread
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="all">All Threads</TabsTrigger>
            <TabsTrigger value="general">General Discussion</TabsTrigger>
            <TabsTrigger value="help">Subject Help</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ThreadList threads={threads} isLoading={isLoading} error={error} />
          </TabsContent>
          <TabsContent value="general">
            <ThreadList threads={threads.filter(t => t.category_name === "General Discussion")} isLoading={isLoading} error={error} />
          </TabsContent>
          <TabsContent value="help">
            <ThreadList threads={threads.filter(t => t.category_name === "Subject Help")} isLoading={isLoading} error={error} />
          </TabsContent>
          <TabsContent value="announcements">
            <ThreadList threads={threads.filter(t => t.category_name === "Announcements")} isLoading={isLoading} error={error} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ThreadListProps {
  threads: ForumThread[];
  isLoading: boolean;
  error: string | null;
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
        <Card className="text-center py-10 bg-destructive/10 border-destructive rounded-xl shadow-lg">
            <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><CardTitle>Error Loading Threads</CardTitle></CardHeader>
            <CardContent><CardDescription className="text-destructive-foreground">{error}</CardDescription></CardContent>
        </Card>
    );
  }

  if (threads.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No threads found in this category. (Forum API TBI)</p>;
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
              Started by <span className="font-medium text-accent">{thread.author_username}</span> in <span className="font-medium">{thread.category_name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center text-xs text-muted-foreground pb-3">
            <div className="flex gap-3">
              <span><MessageIcon className="inline mr-1 h-4 w-4" />{thread.reply_count} Replies</span>
              <span><Users className="inline mr-1 h-4 w-4" />{thread.view_count} Views</span>
            </div>
            <div>Last post by <span className="font-medium text-foreground">{thread.last_activity_by.split(' - ')[0]}</span> ({thread.last_activity_by.split(' - ')[1]})</div>
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
