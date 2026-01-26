// Remplace src/components/layout/site-header.tsx

'use client';

import { Link } from '@/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';

const navLinks = [
  { href: '/', label: 'home' },
  { href: '/projets', label: 'projects' },
  { href: '/blog', label: 'blog' },
  { href: '/about', label: 'about' },
];

export function SiteHeader() {
  const t = useTranslations('Navigation');
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
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Utilise width et height au lieu de className pour la taille */}
          <LogoIcon width={28} height={28} />
          <span className="hidden font-bold sm:inline-block">TheDayInfo</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-6 text-sm">
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
              {t(link.label)}
            </Link>
          ))}
          <LanguageToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}