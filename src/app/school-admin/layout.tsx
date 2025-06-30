
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
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Settings, LayoutDashboard, Users, FileText, BarChart3, BookCopy, MessageSquare, CalendarDays, Users2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

// Define nav items
const getNavItems = (schoolId?: string | null) => {
  if (!schoolId) return []; // Or a default set of links if schoolId is not available
  return [
    { href: `/school-admin/${schoolId}`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/school-admin/${schoolId}/students`, label: 'Students', icon: Users },
    { href: `/school-admin/${schoolId}/teachers`, label: 'Teachers', icon: Users2 },
    { href: `/school-admin/${schoolId}/content`, label: 'Content Overview', icon: BookCopy },
    { href: `/school-admin/${schoolId}/reports`, label: 'School Reports', icon: FileText },
    { href: `/school-admin/${schoolId}/analytics`, label: 'Analytics', icon: BarChart3 },
    { href: `/school-admin/${schoolId}/calendar`, label: 'School Calendar', icon: CalendarDays },
    { href: `/school-admin/${schoolId}/communication`, label: 'Communication', icon: MessageSquare },
    { href: `/school-admin/${schoolId}/settings`, label: 'School Settings', icon: Settings },
  ];
};


export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams(); // Get schoolId from URL params
  const { logout } = useAuth();
  
  const schoolId = params.schoolId as string | undefined;
  const navItems = getNavItems(schoolId);


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 border-b border-sidebar-border h-[65px] flex items-center justify-end">
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2 overflow-y-auto">
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
        <div className="p-4 md:p-8 bg-background min-h-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
