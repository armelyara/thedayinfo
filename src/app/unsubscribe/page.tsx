'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Récupérer email et token depuis l'URL
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // Si email et token sont présents dans l'URL, désabonner automatiquement
    if (email && token) {
      handleUnsubscribe();
    } else {
      // Si pas d'email/token, afficher une erreur
      setStatus('error');
    }
  }, [email, token]);

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      toast({
        variant: 'destructive',
        title: 'Lien invalide',
        description: 'Le lien de désabonnement est invalide ou a expiré.',
      });
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch(`/api/subscribers/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'unsubscribed',
          token: token
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du désabonnement');
      }

      setStatus('success');
      toast({
        title: 'Désabonnement réussi',
        description: 'Vous ne recevrez plus de notifications par email.',
      });
      
    } catch (error) {
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header avec bouton Home */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Retour à l'accueil</span>
              <span className="sm:hidden">Accueil</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium hidden sm:inline">The Day Info</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          
          {/* État: En cours */}
          {status === 'idle' && isSubmitting && (
            <div className="text-center">
              <div className="relative">
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
                </div>
              </div>
              <h1 className="text-2xl font-headline font-bold mb-2">Désabonnement en cours...</h1>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous traitons votre demande.
              </p>
            </div>
          )}
          
          {/* État: Succès */}
          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold text-green-600 dark:text-green-400">
                  Désabonnement réussi !
                </h1>
                <p className="text-lg text-muted-foreground">
                  Vous ne recevrez plus d'emails de notre part.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p>
                  Si vous changez d'avis, vous pouvez toujours vous réabonner depuis notre site.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Retour à l'accueil
                  </Button>
                </Link>
                <Link href="/category/actualite" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Parcourir les articles
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* État: Erreur */}
          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-bold text-red-600 dark:text-red-400">
                  Erreur de désabonnement
                </h1>
                <p className="text-lg text-muted-foreground">
                  Une erreur est survenue lors du traitement de votre demande.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">Causes possibles :</p>
                <ul className="text-left list-disc list-inside text-muted-foreground space-y-1">
                  <li>Le lien de désabonnement a expiré</li>
                  <li>Le lien est invalide ou incomplet</li>
                  <li>Vous êtes déjà désabonné</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Retour à l'accueil
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer simple */}
      <footer className="border-t py-6 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} The Day Info. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}