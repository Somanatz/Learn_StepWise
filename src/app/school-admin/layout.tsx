
// src/app/school-admin/layout.tsx
'use client'; 

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import Logo from '@/components/shared/Logo';
// Create SchoolAdminSidebarNav if specific navigation is needed
// import { SchoolAdminSidebarNav } from '@/components/layout/SchoolAdminSidebarNav';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Settings, LayoutDashboard, Users, FileText, BarChart3, BookCopy, MessageSquare, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

// Define nav items directly here or import if it gets complex
const getNavItems = (schoolId?: string | number | null) => [
  { href: schoolId ? `/school-admin/${schoolId}` : '/teacher', label: 'Dashboard', icon: LayoutDashboard }, // Default to teacher if no schoolId
  { href: schoolId ? `/school-admin/${schoolId}/students` : '#', label: 'Students', icon: Users },
  { href: schoolId ? `/school-admin/${schoolId}/teachers` : '#', label: 'Teachers', icon: Users2 },
  { href: schoolId ? `/school-admin/${schoolId}/content` : '#', label: 'Content Overview', icon: BookCopy },
  { href: schoolId ? `/school-admin/${schoolId}/reports` : '#', label: 'School Reports', icon: FileText },
  { href: schoolId ? `/school-admin/${schoolId}/analytics` : '#', label: 'Analytics', icon: BarChart3 },
  { href: schoolId ? `/school-admin/${schoolId}/calendar` : '#', label: 'School Calendar', icon: CalendarDays },
  { href: schoolId ? `/school-admin/${schoolId}/communication` : '#', label: 'Communication', icon: MessageSquare },
  { href: schoolId ? `/school-admin/${schoolId}/settings` : '#', label: 'School Settings', icon: Settings },
];


export default function SchoolAdminLayout({
  children,
  params, // Next.js passes route params here for layouts of dynamic segments
}: {
  children: React.ReactNode;
  params: { schoolId?: string };
}) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const navItems = getNavItems(params.schoolId || currentUser?.administered_school?.id);


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Logo textSize="text-xl" iconSize={24} />
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2 overflow-y-auto">
           {/* <SchoolAdminSidebarNav schoolId={params.schoolId} /> */}
            <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                    className={cn(
                        "w-full justify-start",
                        pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                    >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <Link href="/profile" legacyBehavior passHref>
             <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center mb-2">
                <UserCircle className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">Profile</span>
              </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-2 md:p-6 bg-background min-h-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
