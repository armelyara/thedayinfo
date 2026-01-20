
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/layout/main-layout';
import { SiteHeader } from '@/components/layout/site-header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { headers } from 'next/headers';
import { ThemeProvider } from '@/components/layout/theme-provider';

export const metadata: Metadata = {
  title: 'The Day Info',
  description: "Résoudre des problèmes par la technologie. Promoteur du dev.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};


// Layout pour les pages publiques sans sidebar (accueil, projets, etc.)
function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || '';

  // Détermine quel layout utiliser en fonction de la route
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/login' || pathname.includes('/admin') || pathname.includes('/login');
  const isBlogRoute = pathname.startsWith('/blog') || pathname.includes('/blog');

  let layout;
  if (isAdminRoute) {
    // Le layout de l'admin gère sa propre structure (pas de header/footer global)
    layout = <div>{children}</div>;
  } else if (isBlogRoute) {
    // Le layout du blog inclut la sidebar et son propre footer (dans MainLayout)
    layout = <MainLayout>{children}</MainLayout>;
  } else {
    // Le reste du site utilise le layout public simple avec le header horizontal
    layout = <SiteLayout>{children}</SiteLayout>;
  }

  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          'font-body'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {layout}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
