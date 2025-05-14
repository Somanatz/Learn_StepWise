// src/app/parent/communication/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Inbox, Users, Mail } from "lucide-react";

interface Message {
  id: string;
  subject: string;
  sender: string; // Or 'You'
  recipient?: string; // For sent messages
  avatarUrl?: string;
  date: string;
  snippet: string;
  read: boolean;
  childName?: string; // Relevant child for the message
}

const mockInboxMessages: Message[] = [
  { id: "m1", subject: "Update on Alex's Math Progress", sender: "Dr. Emily Carter (Math Teacher)", avatarUrl: "https://placehold.co/40x40.png?text=EC", date: "2024-07-14", snippet: "Alex did wonderfully on the recent fractions test...", read: false, childName: "Alex Johnson" },
  { id: "m2", subject: "Parent-Teacher Meeting Scheduled", sender: "Oakwood Elementary Admin", avatarUrl: "https://placehold.co/40x40.png?text=OA", date: "2024-07-12", snippet: "Dear Parents, PTM is scheduled for July 25th...", read: true, childName: "Alex Johnson" },
  { id: "m3", subject: "Mia's Reading Log Reminder", sender: "Ms. Sarah Davis (Class Teacher)", avatarUrl: "https://placehold.co/40x40.png?text=SD", date: "2024-07-10", snippet: "Just a friendly reminder to submit Mia's reading log...", read: true, childName: "Mia Williams" },
];

const mockSentMessages: Message[] = [
  { id: "s1", subject: "Re: Alex's Math Progress", recipient: "Dr. Emily Carter", date: "2024-07-15", snippet: "Thank you for the update, Dr. Carter! We're so pleased...", read: true, childName: "Alex Johnson", sender: "You" },
  { id: "s2", subject: "Question about Science Fair", recipient: "Oakwood Elementary Admin", date: "2024-07-11", snippet: "Could you please clarify the submission deadline for the science fair?", read: true, childName: "Alex Johnson", sender: "You" },
];

export default function ParentCommunicationPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><MessageSquare className="mr-3 text-primary" /> Communication Hub</h1>
          <p className="text-muted-foreground">Stay connected with teachers and school administration.</p>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="inbox"><Inbox className="mr-2 h-4 w-4" />Inbox ({mockInboxMessages.filter(m => !m.read).length} unread)</TabsTrigger>
          <TabsTrigger value="sent"><Send className="mr-2 h-4 w-4" />Sent</TabsTrigger>
          <TabsTrigger value="compose" className="col-span-2 md:col-span-1"><Mail className="mr-2 h-4 w-4" />Compose Message</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <MessageList messages={mockInboxMessages} type="inbox" />
        </TabsContent>
        <TabsContent value="sent">
          <MessageList messages={mockSentMessages} type="sent" />
        </TabsContent>
        <TabsContent value="compose">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Compose New Message</CardTitle>
              <CardDescription>Send a message to a teacher or school staff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Select>
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select teacher or staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carter_e">Dr. Emily Carter (Alex's Math Teacher)</SelectItem>
                    <SelectItem value="davis_s">Ms. Sarah Davis (Mia's Class Teacher)</SelectItem>
                    <SelectItem value="oakwood_admin">Oakwood Elementary Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="child-context">Regarding (Child)</Label>
                <Select>
                  <SelectTrigger id="child-context">
                    <SelectValue placeholder="Select child (if applicable)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alex_j">Alex Johnson</SelectItem>
                    <SelectItem value="mia_w">Mia Williams</SelectItem>
                     <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Enter message subject" />
              </div>
              <div>
                <Label htmlFor="message-body">Message</Label>
                <Textarea id="message-body" placeholder="Type your message here..." rows={5} />
              </div>
              <Button className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  type: "inbox" | "sent";
}

const MessageList: React.FC<MessageListProps> = ({ messages, type }) => {
  if (messages.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No messages in your {type} box.</p>;
  }
  return (
    <Card className="shadow-md rounded-xl">
      <CardContent className="p-0">
        <div className="space-y-0">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-secondary/30 ${!msg.read && type === "inbox" ? "bg-primary/5" : ""}`}>
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage src={msg.avatarUrl} alt={type === "inbox" ? msg.sender : msg.recipient} data-ai-hint="user avatar"/>
                <AvatarFallback>{(type === "inbox" ? msg.sender : msg.recipient || "U").substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className={`font-semibold ${!msg.read && type === "inbox" ? "text-primary" : ""}`}>
                    {type === "inbox" ? msg.sender : `To: ${msg.recipient}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{msg.date}</p>
                </div>
                <p className={`text-sm font-medium ${!msg.read && type === "inbox" ? "text-foreground" : "text-muted-foreground"}`}>{msg.subject}</p>
                <p className="text-xs text-muted-foreground truncate max-w-md">{msg.snippet}</p>
                {msg.childName && <p className="text-xs text-accent mt-1">Regarding: {msg.childName}</p>}
              </div>
               {!msg.read && type === "inbox" && (
                  <div className="h-2.5 w-2.5 bg-primary rounded-full self-center" title="Unread"></div>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

