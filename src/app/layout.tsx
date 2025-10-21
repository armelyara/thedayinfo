
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/layout/main-layout';
import { SiteHeader } from '@/components/layout/site-header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'The Day Info',
  description: "Résoudre des problèmes par la technologie. Promoteur du dev.",
};

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
  
  const isBlogRoute = pathname.startsWith('/blog');
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/login';

  let layout;
  if (isAdminRoute) {
    layout = <div>{children}</div>;
  } else if (isBlogRoute) {
    layout = <MainLayout>{children}</MainLayout>;
  } else {
    layout = <SiteLayout>{children}</SiteLayout>;
  }
  
  return (
    <html lang="fr" suppressHydrationWarning>
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
        {layout}
        <Toaster />
      </body>
    </html>
  );
}
