'use client';

import Link from 'next/link';
import { Search, UserCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/shared/Logo';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/forum', label: 'Forum' },
  { href: '/recommendations', label: 'Suggestions' },
  { href: '/report-card', label: 'Report Card' },
  { href: '/teacher', label: 'Teacher Portal' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);


  if (!mounted) {
    return null; 
  }

  const NavItems = ({isMobile = false}: {isMobile?: boolean}) => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href ? "text-primary" : "text-muted-foreground",
            isMobile && "block py-2 px-4 text-base hover:bg-secondary"
          )}
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
        
        <nav className="hidden md:flex items-center space-x-6 text-sm">
          <NavItems />
        </nav>

        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="pl-10 h-9 w-[150px] lg:w-[250px]" />
          </div>
          <Button variant="ghost" size="icon" aria-label="User Profile">
            <UserCircle className="h-6 w-6 text-accent" />
          </Button>
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] p-0">
                <div className="p-4">
                  <Logo />
                </div>
                <nav className="flex flex-col space-y-2 mt-4">
                  <NavItems isMobile={true} />
                </nav>
                 <div className="p-4 mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search..." className="pl-10 h-9 w-full" />
                    </div>
                  </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
