// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X, Users, Briefcase, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/interfaces';

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
  { href: '/report-card', label: 'Report Card', roles: ['student', 'parent'] },
  { href: '/teacher', label: 'Teacher Portal', roles: ['teacher'] },
  { href: '/parent', label: 'Parent Portal', roles: ['parent'] },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { currentUserRole, setCurrentUserRole, isLoadingRole } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleRoleChange = (role: string) => {
    if (['student', 'teacher', 'parent'].includes(role)) {
      setCurrentUserRole(role as UserRole);
    }
  };

  const visibleNavLinks = allNavLinks.filter(link => {
    if (!link.roles) return true; // Show if no specific roles are defined
    return link.roles.includes(currentUserRole);
  });

  if (!mounted) {
    // Render a minimal header or nothing during server render / hydration mismatch prevention
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          <div className="h-6 w-6 animate-pulse bg-muted rounded-full"></div> {/* Placeholder for icons */}
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
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href ? "text-primary" : "text-muted-foreground",
            isMobile && "block py-2 px-4 text-base hover:bg-secondary rounded-md"
          )}
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  const RoleSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {currentUserRole === 'student' && <UserCheck className="h-4 w-4 text-blue-500" />}
          {currentUserRole === 'teacher' && <Briefcase className="h-4 w-4 text-green-500" />}
          {currentUserRole === 'parent' && <Users className="h-4 w-4 text-purple-500" />}
          <span className="capitalize">{currentUserRole}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentUserRole} onValueChange={handleRoleChange}>
          <DropdownMenuRadioItem value="student">
            <UserCheck className="mr-2 h-4 w-4 text-blue-500" /> Student
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="teacher">
            <Briefcase className="mr-2 h-4 w-4 text-green-500" /> Teacher
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="parent">
            <Users className="mr-2 h-4 w-4 text-purple-500" /> Parent
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-4 text-sm">
          <NavItems />
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block">
            {!isLoadingRole && <RoleSwitcher />}
          </div>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-10 h-9 w-[100px] lg:w-[200px]" />
          </div>
          <Button variant="ghost" size="icon" aria-label="User Profile" className="hidden sm:inline-flex">
            <UserCircle className="h-6 w-6 text-accent" />
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
                  <NavItems isMobile={true} />
                </nav>
                <div className="mt-auto p-4 border-t space-y-4">
                  <div className="sm:hidden">
                    {!isLoadingRole && <RoleSwitcher />}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-10 h-9 w-full" />
                  </div>
                   <Button variant="outline" size="sm" className="w-full">
                     <UserCircle className="mr-2 h-5 w-5 text-accent" /> Profile
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
