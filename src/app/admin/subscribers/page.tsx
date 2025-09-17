// src/app/admin/subscribers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Mail, UserX, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Subscriber = {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    categories: string[];
  };
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les abonnés',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (subscriberId: string, newStatus: 'active' | 'unsubscribed') => {
    try {
      const response = await fetch('/api/subscribers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setSubscribers(prev =>
          prev.map(sub =>
            sub.id === subscriberId ? { ...sub, status: newStatus } : sub
          )
        );
        toast({
          title: 'Mise à jour réussie',
          description: `Statut de l'abonné mis à jour`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
      });
    }
  };

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'Nom', 'Statut', 'Date d\'abonnement', 'Fréquence', 'Catégories'],
      ...subscribers.map(sub => [
        sub.email,
        sub.name || '',
        sub.status,
        format(parseISO(sub.subscribedAt), 'dd/MM/yyyy', { locale: fr }),
        sub.preferences.frequency,
        sub.preferences.categories.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abonnes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const activeSubscribers = subscribers.filter(s => s.status === 'active');
  const unsubscribedCount = subscribers.filter(s => s.status === 'unsubscribed').length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Abonnés Newsletter</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Abonnés Newsletter</h1>
        <Button onClick={exportSubscribers} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubscribers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Désabonnés</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unsubscribedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des abonnés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{subscriber.email}</span>
                    {subscriber.name && (
                      <span className="text-muted-foreground">({subscriber.name})</span>
                    )}
                    <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                      {subscriber.status === 'active' ? 'Actif' : 'Désabonné'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Abonné le {format(parseISO(subscriber.subscribedAt), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p>
                      Fréquence: {subscriber.preferences.frequency} | 
                      Catégories: {subscriber.preferences.categories.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {subscriber.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(subscriber.id, 'unsubscribed')}
                    >
                      Désabonner
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(subscriber.id, 'active')}
                    >
                      Réactiver
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {subscribers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun abonné pour le moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}