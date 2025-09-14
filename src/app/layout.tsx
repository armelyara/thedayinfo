
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';
import { headers } from 'next/headers';
import LoginPage from './login/page';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'The Day Info',
  description: 'Votre dose quotidienne d\'information.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('host');
  const isAdmin = host?.startsWith('admin.');

  // This is a placeholder for a real authentication check
  const isAuthenticated = false; 

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
        <Suspense>
          {isAdmin ? (
            isAuthenticated ? (
              <>{children}</>
            ) : (
              <MainLayout>
                <LoginPage />
              </MainLayout>
            )
          ) : (
            <MainLayout>{children}</MainLayout>
          )}
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
