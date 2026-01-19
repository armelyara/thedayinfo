'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle } from 'lucide-react';

export function SubscriptionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          preferences: {
            frequency: 'immediate',
            categories: ['all']
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'abonnement');
      }

      setIsSuccess(true);

      // Store subscriber email in localStorage for comment validation
      localStorage.setItem('subscriber-email', email.trim().toLowerCase());

      toast({
        title: 'Abonnement réussi !',
        description: 'Vous pouvez maintenant commenter les articles !',
      });

      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setEmail('');
      }, 2000);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          S'abonner
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Abonnement Newsletter</DialogTitle>
              <DialogDescription>
                Votre abonnement vous permettra de ne recevoir que les mails de notification 
                d'un nouvel article publié ou de la modification d'un ancien article déjà publié. 
                Si vous êtes d'accord, veuillez inscrire votre email dans le champ ci-dessous.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Abonnement en cours...' : 'S\'abonner'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Abonnement réussi !</h3>
              <p className="text-muted-foreground">
                Vous recevrez désormais les notifications par email.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}