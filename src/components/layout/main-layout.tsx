// src/components/layout/main-layout.tsx
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Footer } from './footer';

type Category = {
  name: string;
  slug: string;
};

// Categories are static, so they can be defined here to avoid importing from data.ts
export const categories: Category[] = [
  { name: 'Technologie', slug: 'technologie' },
  { name: 'Actualité', slug: 'actualite' },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar categories={categories} />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <a href="/" className="hidden md:block">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </a>
          </div>
          <div className="flex-1 flex justify-end">
            {/* The Sign In button will be added back later with appropriate logic */}
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
        <Footer />
          
      </SidebarInset>
    </SidebarProvider>
  );
}
