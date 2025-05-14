// src/components/dashboard/TeacherDashboard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenText, BarChartBig, CalendarCheck2, PlusCircle, FileText } from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Total Students", value: "125", icon: Users, color: "text-primary" },
  { title: "Active Courses", value: "8", icon: BookOpenText, color: "text-accent" },
  { title: "Pending Reviews", value: "12", icon: CalendarCheck2, color: "text-orange-500" },
  { title: "Overall Performance", value: "85%", icon: BarChartBig, color: "text-green-500" },
];

const recentActivities = [
  { student: "Alex Johnson", action: "submitted Math Quiz 3.", time: "10m ago" },
  { student: "Maria Garcia", action: "asked a question in Science forum.", time: "45m ago" },
  { student: "David Lee", action: "completed History Lesson 5.", time: "2h ago" },
  { student: "Sarah Miller", action: "achieved 'Top Learner' badge.", time: "5h ago" },
];

const quickLinks = [
    { href: "/teacher/students", label: "Manage Students" },
    { href: "/teacher/report-card", label: "Generate Report Cards" },
    { href: "/teacher/reports", label: "View Legacy Reports" },
    { href: "/teacher/content", label: "Create Content" },
    { href: "/teacher/communication", label: "Send Announcements" },
];

export default function TeacherDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. Emily Carter! Manage your classes and students efficiently.</p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Assignment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {stat.title === "Overall Performance" ? "+5% from last month" : "View Details"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent student submissions and interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentActivities.map((activity, index) => (
                <li key={index} className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-md">
                  <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      <span className="font-semibold text-accent">{activity.student}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
             <Button variant="outline" className="mt-6 w-full">View All Activities</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access your most used tools and sections.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map(link => (
                <Button variant="outline" asChild key={link.href} className="h-16 text-base hover:bg-accent/10 hover:border-primary">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
