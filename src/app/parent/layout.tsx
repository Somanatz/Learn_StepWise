
// src/app/parent/layout.tsx
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
import { ParentSidebarNav } from '@/components/layout/ParentSidebarNav';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
   const { logout } = useAuth();
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 border-b border-sidebar-border h-[65px] flex items-center justify-end">
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2 overflow-y-auto">
          <ParentSidebarNav />
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
