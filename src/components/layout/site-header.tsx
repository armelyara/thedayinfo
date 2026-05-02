'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/projets', label: 'Projets' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'À propos' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        hasScrolled
          ? 'border-b border-border/40 bg-background/80 backdrop-blur-lg'
          : 'border-b border-transparent'
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6">
        <Link href="/" className="mr-3 sm:mr-6 flex items-center space-x-2">
          <LogoIcon width={28} height={28} />
          <span className="hidden font-bold sm:inline-block">The Day Info</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-3 sm:gap-6 text-xs sm:text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors',
                pathname === link.href
                  ? 'text-primary font-semibold'
                  : 'text-foreground/60 hover:text-primary'
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
