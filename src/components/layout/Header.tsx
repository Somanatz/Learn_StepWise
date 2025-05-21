// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X, LogIn, UserPlus, LogOutIcon, School as SchoolIconLucide, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { User, UserRole } from '@/interfaces'; // Added User type
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from '@/components/shared/Logo';

const allNavLinks: NavLink[] = [
  { href: '/student/rewards', label: 'Rewards', roles: ['Student'], authRequired: true },
  { href: '/forum', label: 'Forum', authRequired: true },
  { href: '/student/recommendations', label: 'Suggestions', roles: ['Student'], authRequired: true },
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

  const isAuthPage = pathname === '/login' ||
                     pathname === '/signup' ||
                     pathname === '/register-school';

  const isProfileCompletionPage = pathname.startsWith('/student/complete-profile') ||
                                 pathname.startsWith('/parent/complete-profile') ||
                                 pathname.startsWith('/teacher/complete-profile');

  const isUnauthenticatedHomepage = pathname === '/' && !currentUser && !isLoadingAuth;
  const shouldHideMainHeaderElements = isAuthPage || isProfileCompletionPage || isUnauthenticatedHomepage;


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

  const getDashboardPath = (user: User | null): string => {
    if (!user) return '/';
    switch (user.role) {
      case 'Student':
        return '/student';
      case 'Teacher':
        return '/teacher';
      case 'Parent':
        return '/parent';
      case 'Admin':
        if (user.is_school_admin && user.administered_school?.id) {
          return `/school-admin/${user.administered_school.id}`;
        }
        return '/'; // Platform admin stays on root
      default:
        return '/';
    }
  };

  const dashboardPath = getDashboardPath(currentUser);

  const visibleNavLinks = allNavLinks.filter(link => {
    if (isLoadingAuth) return false;
    if (currentUser) {
      if (link.guestOnly) return false;
      if (link.authRequired === false) return true;
      if (!link.roles && link.authRequired) return true;
      return link.roles && link.roles.includes(currentUser.role as UserRole);
    } else {
      return !link.authRequired || link.guestOnly;
    }
  });

  if (!mounted) {
    // Simplified SSR/Initial Client Render Placeholder
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          {/* Logo Placeholder */}
          <div style={{ width: '218px', height: '60px', minHeight: '60px' }} className="bg-muted rounded animate-pulse opacity-70"></div>

          <div className="flex-grow"></div> {/* Spacer */}

          {/* Right side placeholders */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse opacity-70"></div> {/* Theme/User placeholder */}
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse opacity-70 md:hidden"></div> {/* Mobile menu placeholder */}
          </div>
        </div>
      </header>
    );
  }

  const DashboardLink = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (!currentUser || shouldHideMainHeaderElements) return null;
    return (
      <Link
        href={dashboardPath}
        className={cn(
          "font-medium transition-all duration-150 ease-in-out flex items-center gap-2",
          isMobile
            ? "block w-full text-left px-4 py-3 text-base rounded-md"
            : "px-4 py-2 text-sm rounded-lg",
          (pathname === dashboardPath || (dashboardPath !== '/' && pathname.startsWith(dashboardPath)))
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-primary",
          !isMobile && (pathname === dashboardPath || (dashboardPath !== '/' && pathname.startsWith(dashboardPath))) && "ring-1 ring-primary/20"
        )}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
    );
  };

  const NavItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {visibleNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "font-medium transition-all duration-150 ease-in-out flex items-center",
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
        <div className="flex items-center gap-4">
          <Logo />
          {/* Theme toggle button is now in settings pages */}
        </div>

        {!shouldHideMainHeaderElements && (
          <nav className="hidden md:flex items-center space-x-2">
            {!isLoadingAuth && <DashboardLink />}
            {!isLoadingAuth && <NavItems />}
            {isLoadingAuth && (
              <>
                <Skeleton className="h-8 w-24 rounded-md" /> {/* Dashboard Link Skeleton */}
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </>
            )}
          </nav>
        )}

        {isUnauthenticatedHomepage && (
            <div className="relative hidden sm:block">
              <SchoolIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Find a School..." className="pl-10 h-9 w-[150px] lg:w-[250px]" />
            </div>
        )}


        <div className="flex items-center space-x-2 sm:space-x-4">
          {!isUnauthenticatedHomepage && !isAuthPage && !isProfileCompletionPage && (
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
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              {!isAuthPage && pathname !== '/register-school' && (
                 <Button variant="outline" asChild>
                    <Link href="/register-school"><SchoolIconLucide className="mr-2 h-4 w-4" />Register School</Link>
                 </Button>
              )}
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
                 <SheetHeader className="p-4 border-b">
                  <SheetTitle className="sr-only">Main Menu</SheetTitle> {/* For accessibility */}
                  <Logo />
                </SheetHeader>

                <nav className="flex flex-col space-y-1 p-4">
                  {!isLoadingAuth && <DashboardLink isMobile={true} />}
                  {!isLoadingAuth && <NavItems isMobile={true} />}
                   {isLoadingAuth && (
                      <>
                        <Skeleton className="h-10 w-full rounded-md mb-1" /> {/* Dashboard Link Skeleton */}
                        <Skeleton className="h-10 w-full rounded-md mb-1" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </>
                  )}
                </nav>

                <div className={cn("mt-auto p-4 border-t space-y-4", (isLoadingAuth || shouldHideMainHeaderElements) && "pt-4")}>
                  {isUnauthenticatedHomepage && (
                     <div className="relative">
                        <SchoolIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Find a School..." className="pl-10 h-9 w-full" />
                    </div>
                  )}
                  {!isUnauthenticatedHomepage && !isAuthPage && !isProfileCompletionPage && (
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
                     {!isAuthPage && pathname !== '/register-school' && (
                        <Button variant="outline" size="sm" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                           <Link href="/register-school"><SchoolIconLucide className="mr-2 h-4 w-4" />Register School</Link>
                        </Button>
                      )}
                      {pathname !== '/login' && (
                        <Button variant="outline" size="sm" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
                        </Button>
                      )}
                      {pathname !== '/signup' && (
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
