// src/app/profile/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, Edit3, Shield, LogOut, Mail, Briefcase } from "lucide-react";

export default function ProfilePage() {
  const { currentUserRole, isLoadingRole } = useAuth();

  const userDetails = {
    name: "Demo User",
    email: "demo.user@stepwise.com",
    avatarUrl: "https://placehold.co/150x150.png",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center py-8">
        <UserCircle className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold">My Profile</h1>
        <p className="text-lg text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </header>

      <Card className="shadow-xl rounded-xl">
        <CardHeader className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={userDetails.avatarUrl} alt={userDetails.name} data-ai-hint="profile picture" />
              <AvatarFallback>{userDetails.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{userDetails.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" /> {userDetails.email}
              </CardDescription>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Role: 
                {isLoadingRole ? "Loading..." : <span className="capitalize font-medium text-primary">{currentUserRole}</span>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center"><Edit3 className="mr-2 h-5 w-5 text-accent" /> Personal Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={userDetails.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={userDetails.email} className="mt-1" />
              </div>
              <Button>Update Information</Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center"><Shield className="mr-2 h-5 w-5 text-accent" /> Security</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="********" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="********" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" placeholder="********" className="mt-1" />
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t">
          <Button variant="destructive" className="ml-auto">
            <LogOut className="mr-2 h-5 w-5" /> Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
