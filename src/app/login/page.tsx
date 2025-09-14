'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useTransition } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({
    message: 'Veuillez entrer une adresse e-mail valide.',
  }),
  password: z.string().min(6, {
    message: 'Le mot de passe doit comporter au moins 6 caractères.',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const auth = getAuth(app);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    startTransition(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const idToken = await userCredential.user.getIdToken();
        
        // Call the API route to set the session cookie
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
            router.push('/admin');
        } else {
            const result = await response.json();
            const errorMessage = result.error || 'Échec de la création de la session.';
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Échec de la Connexion',
                description: errorMessage,
            });
        }
      } catch (e: any) {
          let errorMessage = 'Une erreur inattendue est survenue.';
          // See https://firebase.google.com/docs/auth/admin/errors
          switch (e.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = 'Email ou mot de passe invalide.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'L\'adresse e-mail n\'est pas valide.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'Ce compte utilisateur a été désactivé.';
              break;
            default:
              errorMessage = `Une erreur s'est produite: ${e.message}`;
              break;
          }
          setError(errorMessage);
          toast({
              variant: 'destructive',
              title: 'Échec de la Connexion',
              description: errorMessage,
          });
      }
    });
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion Administrateur</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder au tableau de bord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Connexion en cours...' : 'Se Connecter'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
