'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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
    )
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    async function init() {
        await initializeFirebaseClient();
        setFirebaseInitialized(true);
    }
    init();
  }, []);

  // ✅ Fonction pour vérifier la session avec retry
  const checkSession = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth-check', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (res.ok) {
        const { authenticated } = await res.json();
        return authenticated;
      }
      
      // Si 401, la session a expiré
      if (res.status === 401) {
        return false;
      }
      
      // Pour d'autres erreurs, retry jusqu'à 2 fois
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkSession(retryCount + 1);
      }
      
      return false;
    } catch (error) {
      console.error('Session check error:', error);
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkSession(retryCount + 1);
      }
      return false;
    }
  }, []);

  // ✅ Rafraîchir la session périodiquement (toutes les 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const intervalId = setInterval(async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        try {
          // Forcer le rafraîchissement du token
          await user.getIdToken(true);
          
          // Vérifier la session côté serveur
          const sessionValid = await checkSession();
          
          if (!sessionValid) {
            toast({
              variant: 'destructive',
              title: 'Session expirée',
              description: 'Veuillez vous reconnecter.',
            });
            router.push('/login');
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkSession, router, toast]);

  useEffect(() => {
    if (!firebaseInitialized) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setIsAuthenticated(false);
          router.push('/login');
          return;
        }
        
        // Vérifier la session côté serveur
        const sessionValid = await checkSession();
        
        if (sessionValid) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          
          toast({
            variant: 'destructive',
            title: 'Session invalide',
            description: 'Veuillez vous reconnecter.',
          });
          
          router.push('/login');
        }
    });

    return () => unsubscribe();
  }, [firebaseInitialized, router, checkSession, toast]);
  
  if (isAuthenticated === null || !firebaseInitialized) {
      return (
          <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <p className="text-lg">Vérification de l'authentification...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Si cela prend trop de temps, essayez de vous reconnecter.
                </p>
              </div>
          </div>
      )
  }

  if (!isAuthenticated) {
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