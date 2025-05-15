// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X, LogIn, UserPlus, LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo'; // Ensure this path is correct
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

interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[];
  authRequired?: boolean;
  guestOnly?: boolean;
}

const allNavLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', authRequired: true },
  { href: '/rewards', label: 'Rewards', roles: ['Student'], authRequired: true },
  { href: '/forum', label: 'Forum', authRequired: true },
  { href: '/recommendations', label: 'Suggestions', roles: ['Student'], authRequired: true },
  { href: '/teacher', label: 'Teacher Portal', roles: ['Teacher'], authRequired: true },
  { href: '/parent', label: 'Parent Portal', roles: ['Parent'], authRequired: true },
];


export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { currentUser, isLoadingAuth, logout } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isUnauthenticatedHomepage = pathname === '/' && !currentUser && !isLoadingAuth; // Check !isLoadingAuth
  const shouldHideMainHeaderElements = isAuthPage || isUnauthenticatedHomepage;


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false); // Close mobile menu on route change
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleNavLinks = allNavLinks.filter(link => {
    if (isLoadingAuth) return false;
    if (currentUser) {
      if (link.guestOnly) return false;
      if (!link.roles) return true;
      return link.roles.includes(currentUser.role as UserRole);
    } else {
      return !link.authRequired || link.guestOnly;
    }
  });
  
  if (!mounted) {
    // Static placeholder for SSR and initial client render to avoid hydration mismatch
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          {/* Simplified Logo Placeholder - reflecting an image */}
          <div className="animate-pulse bg-muted rounded" style={{ width: '174px', height: '48px', minHeight: '48px' }}></div>
          
          <div className="flex-grow"></div> {/* Occupy space for nav links */}

          {/* Simplified Right Icons Placeholder */}
          <div className="flex items-center space-x-2">
            <div className="h-9 w-24 rounded-md bg-muted animate-pulse hidden sm:block"></div> {/* Search placeholder */}
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div> {/* User icon placeholder */}
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse md:hidden"></div> {/* Menu toggle placeholder */}
          </div>
        </div>
      </header>
    );
  }


  // Actual component rendering after client-side mount
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!shouldHideMainHeaderElements && (
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
                 <Button variant="ghost" size="icon" aria-label="User Profile" asChild>
                  <Link href="/profile">
                    <UserCircle className="h-6 w-6 text-accent" />
                  </Link>
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
                {!shouldHideMainHeaderElements && (
                  <nav className="flex flex-col space-y-1 p-4">
                    {!isLoadingAuth && <NavItems isMobile={true} />}
                     {isLoadingAuth && ( 
                        <>
                            <Skeleton className="h-10 w-full rounded-md mb-1" />
                            <Skeleton className="h-10 w-full rounded-md mb-1" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </>
                    )}
                  </nav>
                )}
                <div className={cn("mt-auto p-4 border-t space-y-4", (isLoadingAuth || shouldHideMainHeaderElements) && "pt-4")}>
                  {!shouldHideMainHeaderElements && (
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
