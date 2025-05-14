// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X, LogIn, UserPlus, LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo'; 
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/interfaces';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[]; 
  authRequired?: boolean; // True if link requires authentication
  guestOnly?: boolean; // True if link is only for guests (not logged in)
}

const allNavLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', authRequired: true },
  { href: '/rewards', label: 'Rewards', roles: ['Student'], authRequired: true },
  { href: '/forum', label: 'Forum', authRequired: true },
  { href: '/recommendations', label: 'Suggestions', roles: ['Student'], authRequired: true },
  { href: '/teacher', label: 'Teacher Portal', roles: ['Teacher'], authRequired: true },
  { href: '/parent', label: 'Parent Portal', roles: ['Parent'], authRequired: true },
  // Guest links - these are handled by the auth block now
  // { href: '/login', label: 'Login', guestOnly: true },
  // { href: '/signup', label: 'Sign Up', guestOnly: true },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { currentUser, currentUserRole, isLoadingAuth, logout } = useAuth(); 

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login'); // Redirect to login after logout
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const visibleNavLinks = allNavLinks.filter(link => {
    if (isLoadingAuth) return false; 
    
    if (currentUser) { // User is logged in
      if (link.guestOnly) return false; // Hide guest-only links
      if (!link.roles) return true; // Show if no specific roles are defined for auth'd user
      return link.roles.includes(currentUser.role as UserRole); // Ensure currentUser.role is treated as UserRole
    } else { // User is not logged in (guest)
      return !link.authRequired || link.guestOnly;
    }
  });

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2" style={{ minHeight: '48px' }}>
            <Skeleton className="h-7 w-7 rounded-md" /> 
            <Skeleton className="h-6 w-28" /> 
          </div>
          {/* This is the section for nav links placeholder - simplified classes */}
          {!isAuthPage && (
            <div className="flex items-center space-x-2"> {/* Removed 'hidden md:flex' */}
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            {!isAuthPage && <Skeleton className="h-9 w-24 rounded-md" /> } {/* Placeholder for search */}
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Placeholder for user icon/buttons */}
            <Skeleton className="h-8 w-8 rounded-full md:hidden" /> {/* Placeholder for menu toggle */}
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
              ? "block w-full text-left px-4 py-3 text-base rounded-md"
              : "px-4 py-2 text-sm rounded-lg", 
            pathname === link.href
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted/50 hover:text-primary", 
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
        
        {!isAuthPage && (
            <nav className="hidden md:flex items-center space-x-2">
            {!isLoadingAuth && <NavItems />}
            </nav>
        )}

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!isAuthPage && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-10 h-9 w-[100px] lg:w-[200px]" />
            </div>
          )}

          {isLoadingAuth ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User Profile">
                   <UserCircle className="h-6 w-6 text-accent" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account ({currentUser.username})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              {pathname !== '/login' && (
                <Button variant="ghost" asChild>
                  <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                </Button>
              )}
              {pathname !== '/signup' && (
                <Button variant="default" asChild>
                  <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
                </Button>
              )}
            </div>
          )}
          
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
                {!isAuthPage && (
                    <nav className="flex flex-col space-y-1 p-4">
                    {!isLoadingAuth && <NavItems isMobile={true} />}
                    </nav>
                )}
                <div className={cn("mt-auto p-4 border-t space-y-4", isAuthPage && "mt-0")}>
                  {!isAuthPage && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search..." className="pl-10 h-9 w-full" />
                    </div>
                  )}
                  {isLoadingAuth ? (
                     <Skeleton className="h-10 w-full rounded-md" />
                  ) : currentUser ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}> <UserCircle className="mr-2 h-5 w-5 text-accent" /> Profile</Link>
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                        <LogOutIcon className="mr-2 h-5 w-5" /> Logout
                      </Button>
                    </>
                  ) : (
                    <>
                       {pathname !== '/login' && (
                        <SheetClose asChild>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                            </Button>
                        </SheetClose>
                       )}
                       {pathname !== '/signup' && (
                        <SheetClose asChild>
                            <Button variant="default" size="sm" className="w-full" asChild>
                            <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
                            </Button>
                        </SheetClose>
                       )}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

