'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
          token: token // ← Envoyer le token
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
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        
        {status === 'idle' && (
          <>
            <h1 className="text-2xl font-bold mb-2">Désabonnement en cours...</h1>
            <p className="text-muted-foreground">
              Veuillez patienter pendant que nous traitons votre demande.
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">Désabonnement réussi</h1>
            <p className="text-muted-foreground">
              Vous ne recevrez plus d'emails de notre part. Vous pouvez fermer cette page.
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Erreur</h1>
            <p className="text-muted-foreground mb-4">
              Une erreur est survenue lors du désabonnement. Le lien est peut-être invalide ou expiré.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Retour à l'accueil
            </Button>
          </>
        )}
      </div>
    </div>
  );
}