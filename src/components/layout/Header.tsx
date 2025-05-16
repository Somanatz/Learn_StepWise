
// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X, LogIn, UserPlus, LogOutIcon, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
import Logo from '@/components/shared/Logo'; // Moved back

const allNavLinks: NavLink[] = [
  // Main dashboard links are now role-specific, e.g., /student, /teacher, /parent
  // { href: '/', label: 'Dashboard', authRequired: true }, // This will be handled by role redirection from '/'
  { href: '/student/rewards', label: 'Rewards', roles: ['Student'], authRequired: true },
  { href: '/forum', label: 'Forum', authRequired: true },
  { href: '/student/recommendations', label: 'Suggestions', roles: ['Student'], authRequired: true },
  // Teacher and Parent portal links can remain if you want direct access even if their main dashboard is at /teacher or /parent
  // { href: '/teacher', label: 'Teacher Portal', roles: ['Teacher'], authRequired: true },
  // { href: '/parent', label: 'Parent Portal', roles: ['Parent'], authRequired: true },
  { href: '/register-school', label: 'Register School', guestOnly: true } // For unauthenticated users
];

interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[];
  authRequired?: boolean;
  guestOnly?: boolean;
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { currentUser, isLoadingAuth, logout } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/register-school' || 
                     pathname.startsWith('/student/complete-profile') ||
                     pathname.startsWith('/parent/complete-profile') ||
                     pathname.startsWith('/teacher/complete-profile');

  const isUnauthenticatedHomepage = pathname === '/' && !currentUser && !isLoadingAuth;
  const shouldHideMainHeaderElements = isAuthPage || isUnauthenticatedHomepage;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleNavLinks = allNavLinks.filter(link => {
    if (isLoadingAuth) return false;
    if (currentUser) {
      if (link.guestOnly) return false;
      if (link.authRequired === false) return true; // Show if auth not required
      if (!link.roles && link.authRequired) return true;
      return link.roles && link.roles.includes(currentUser.role as UserRole);
    } else { // User is not authenticated
      return !link.authRequired || link.guestOnly;
    }
  });
  
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <div style={{ width: '218px', height: '60px', minHeight: '60px' }} className="animate-pulse bg-muted rounded"></div> {/* Logo placeholder */}
          <div className="flex-grow"></div> {/* Occupy space for nav links */}
          <div className="flex items-center space-x-2">
            <div className="h-9 w-24 rounded-md bg-muted animate-pulse"></div> {/* Search placeholder */}
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div> {/* User icon placeholder */}
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse md:hidden"></div> {/* Menu toggle placeholder */}
          </div>
        </div>
      </header>
    );
  }

  const NavItems = ({ isMobile = false }: { isMobile?: boolean }) => (
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Logo />

        {!shouldHideMainHeaderElements && (
          <nav className="hidden md:flex items-center space-x-2">
            {!isLoadingAuth && <NavItems />}
            {isLoadingAuth && ( 
              <>
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </>
            )}
          </nav>
        )}
        
        {isUnauthenticatedHomepage && (
            <div className="relative hidden sm:block">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Find a School..." className="pl-10 h-9 w-[150px] lg:w-[250px]" />
            </div>
        )}


        <div className="flex items-center space-x-2 sm:space-x-4">
          {!shouldHideMainHeaderElements && !isUnauthenticatedHomepage && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search platform..." className="pl-10 h-9 w-[100px] lg:w-[200px]" />
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
          ) : ( // Not loading, and no current user
            <div className="hidden md:flex items-center space-x-2">
              {pathname !== '/login' && !isAuthPage && (
                <Button variant="ghost" asChild>
                  <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                </Button>
              )}
               {pathname !== '/signup' && !isAuthPage && (
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
                <div className="p-4 border-b"><Logo /></div>
                
                {!shouldHideMainHeaderElements && (
                  <nav className="flex flex-col space-y-1 p-4">
                    {!isLoadingAuth && <NavItems isMobile={true} />}
                     {isLoadingAuth && ( 
                        <> <Skeleton className="h-10 w-full rounded-md mb-1" /> <Skeleton className="h-10 w-full rounded-md mb-1" /> <Skeleton className="h-10 w-full rounded-md" /> </>
                    )}
                  </nav>
                )}

                <div className={cn("mt-auto p-4 border-t space-y-4", (isLoadingAuth || shouldHideMainHeaderElements) && "pt-4")}>
                  {isUnauthenticatedHomepage && (
                     <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Find a School..." className="pl-10 h-9 w-full" />
                    </div>
                  )}
                  {!shouldHideMainHeaderElements && !isUnauthenticatedHomepage && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search platform..." className="pl-10 h-9 w-full" />
                    </div>
                  )}
                  {isLoadingAuth ? (
                    <Skeleton className="h-10 w-full rounded-md" />
                  ) : currentUser ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/profile"> <UserCircle className="mr-2 h-5 w-5 text-accent" /> Profile</Link>
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                        <LogOutIcon className="mr-2 h-5 w-5" /> Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      {pathname !== '/login' && !isAuthPage && (
                        <Button variant="outline" size="sm" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                        </Button>
                      )}
                       {pathname !== '/signup' && !isAuthPage && (
                        <Button variant="default" size="sm" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
                        </Button>
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

