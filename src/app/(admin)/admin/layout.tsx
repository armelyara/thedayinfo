'use client';

import * as React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

async function logout() {
  const response = await fetch('/api/logout', { method: 'POST' });
  if (response.ok) {
    window.location.href = '/login';
  } else {
    console.error('Logout failed');
  }
}

function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Déconnexion
      </Button>
    </form>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Initialize Firebase in the background — does NOT block rendering.
  // The server-side layout already verified the session cookie,
  // so we can render the admin UI immediately without waiting.
  useEffect(() => {
    async function init() {
      await initializeFirebaseClient();
      setFirebaseInitialized(true);
    }
    init();
  }, []);

  // Refresh the session cookie every 5 minutes to prevent mid-session expiry
  useEffect(() => {
    if (!firebaseInitialized) return;

    const intervalId = setInterval(async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        const idToken = await user.getIdToken(true);
        await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [firebaseInitialized]);

  // Watch for unexpected Firebase sign-out (e.g., account disabled remotely)
  useEffect(() => {
    if (!firebaseInitialized) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter.',
        });
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [firebaseInitialized, router, toast]);

  return (
    <Suspense>
      <div className="min-h-screen">
        <header className="flex justify-between items-center gap-2 p-4 border-b">
          <h1 className="text-lg sm:text-xl font-bold truncate">Admin Panel</h1>
          <LogoutButton />
        </header>
        <main>
          {children}
        </main>
      </div>
    </Suspense>
  );
}