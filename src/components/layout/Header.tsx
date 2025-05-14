// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo'; // Import the actual Logo component
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/interfaces';
import { Skeleton } from '@/components/ui/skeleton';

interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[]; // Optional: show link only for these roles
}

const allNavLinks: NavLink[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/rewards', label: 'Rewards', roles: ['student'] },
  { href: '/forum', label: 'Forum' },
  { href: '/recommendations', label: 'Suggestions', roles: ['student'] },
  { href: '/teacher', label: 'Teacher Portal', roles: ['teacher'] },
  { href: '/parent', label: 'Parent Portal', roles: ['parent'] },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { currentUserRole, isLoadingRole } = useAuth(); 

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const visibleNavLinks = allNavLinks.filter(link => {
    if (isLoadingRole) return false; // Don't show links until role is loaded
    if (!link.roles) return true; // Show if no specific roles are defined
    return link.roles.includes(currentUserRole);
  });

  if (!mounted) {
    // Render a minimal header or placeholder during server render / hydration mismatch prevention
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          {/* Logo placeholder */}
          <div className="flex items-center gap-2" style={{ minHeight: '48px' }}>
            <Skeleton className="h-7 w-7 rounded-md" /> 
            <Skeleton className="h-6 w-28" /> 
          </div>
          {/* This is the section for nav links placeholder - simplified classes */}
          <div className="flex items-center space-x-2"> {/* Removed 'hidden md:flex' */}
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <div className="flex items-center space-x-2">
            {/* Search icon placeholder - Simplified */}
            <Skeleton className="h-8 w-8 rounded-full" /> 
            {/* User/Menu icon placeholder */}
            <Skeleton className="h-8 w-8 rounded-full" /> 
          </div>
        </div>
      </header>
    );
  }

  const NavItems = ({isMobile = false}: {isMobile?: boolean}) => (
    <>
      {visibleNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "font-medium transition-all duration-150 ease-in-out",
            isMobile 
              ? "block w-full text-left px-4 py-3 text-base rounded-md" // Mobile base styles
              : "px-4 py-2 text-sm rounded-lg", // Desktop base styles
            pathname === link.href
              ? "bg-primary/10 text-primary" // Active for both (subtle background)
              : "text-muted-foreground hover:bg-muted/50 hover:text-primary", // Default & hover for both
            !isMobile && pathname === link.href && "ring-1 ring-primary/20" 
          )}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-2">
          {!isLoadingRole && <NavItems />}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-10 h-9 w-[100px] lg:w-[200px]" />
          </div>
          <Button variant="ghost" size="icon" aria-label="User Profile" className="hidden sm:inline-flex" asChild>
            <Link href="/profile"><UserCircle className="h-6 w-6 text-accent" /></Link>
          </Button>
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
                <div className="p-4 border-b">
                  <Logo />
                </div>
                <nav className="flex flex-col space-y-1 p-4">
                  {!isLoadingRole && <NavItems isMobile={true} />}
                </nav>
                <div className="mt-auto p-4 border-t space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-10 h-9 w-full" />
                  </div>
                   <Button variant="outline" size="sm" className="w-full" asChild>
                     <Link href="/profile"> <UserCircle className="mr-2 h-5 w-5 text-accent" /> Profile</Link>
                   </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
