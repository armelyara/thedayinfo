'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email requis',
        description: 'Veuillez saisir votre adresse email.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Ici vous pourriez ajouter une API route pour gérer le désabonnement
      // Pour l'instant, on simule le processus
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        description: 'Une erreur est survenue lors du désabonnement.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Désabonnement</h1>
          <p className="text-muted-foreground">
            Nous sommes désolés de vous voir partir. Entrez votre email pour vous désabonner.
          </p>
        </div>

        {status === 'idle' && (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Désabonnement...' : 'Me désabonner'}
            </Button>
          </form>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <h2 className="text-xl font-semibold">Désabonnement réussi</h2>
              <p className="text-muted-foreground mt-2">
                Vous ne recevrez plus de notifications par email de notre part.
              </p>
            </div>
            <Button onClick={() => window.location.href = '/'}>
              Retourner à l'accueil
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <div>
              <h2 className="text-xl font-semibold">Erreur</h2>
              <p className="text-muted-foreground mt-2">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            </div>
            <Button onClick={() => setStatus('idle')}>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}