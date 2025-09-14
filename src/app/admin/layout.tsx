
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

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
    )
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const auth = getAuth(app);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
        // We also need to check for the session cookie.
        // A user object existing doesn't mean they have an active admin session.
        fetch('/api/auth-check').then(async res => {
            if(res.ok) {
                const { authenticated } = await res.json();
                if(user && authenticated) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                    router.push('/login');
                }
            } else {
                 setIsAuthenticated(false);
                 router.push('/login');
            }
        });
    });

    return () => unsubscribe();
  }, [auth, router]);
  
  if (isAuthenticated === null) {
      return (
          <div className="flex h-screen items-center justify-center">
              <p>Vérification de l'authentification...</p>
          </div>
      )
  }

  if (!isAuthenticated) {
    // The redirect is handled in the effect, this is a fallback.
    return null;
  }

  return (
    <Suspense>
        <div className="min-h-screen">
            <header className="flex justify-between items-center p-4 border-b">
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <LogoutButton />
            </header>
            <main>
                {children}
            </main>
        </div>
    </Suspense>
  );
}

    