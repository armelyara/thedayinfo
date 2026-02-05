
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
import { useState, useTransition, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      await initializeFirebaseClient();
      setFirebaseInitialized(true);
    }
    init();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firebaseInitialized) {
      toast({
        variant: 'destructive',
        title: 'Initialisation en cours',
        description: 'Veuillez patienter pendant que Firebase est initialisé.',
      });
      return;
    }

    setError(null);
    console.log('🔐 Login attempt started');

    startTransition(async () => {
      try {
        console.log('1️⃣ Getting Firebase Auth instance...');
        const auth = getAuth();

        console.log('2️⃣ Signing in with email and password...');
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        console.log('✅ Firebase Auth successful, user:', userCredential.user.uid);

        console.log('3️⃣ Getting ID token...');
        const idToken = await userCredential.user.getIdToken();
        console.log('✅ ID token obtained');

        // Call the API route to set the session cookie
        console.log('4️⃣ Creating session cookie via /api/login...');
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          console.log('✅ Session cookie created successfully');
          router.push('/admin');
        } else {
          const result = await response.json();
          const errorMessage = result.error || 'Échec de la création de la session.';
          console.error('❌ Session creation failed:', result);
          setError(errorMessage);
          toast({
            variant: 'destructive',
            title: 'Échec de la Connexion',
            description: errorMessage,
          });
        }
      } catch (e: any) {
        console.error('❌ Login error:', e);
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
          case 'auth/invalid-api-key':
            errorMessage = 'Clé d\'API Firebase invalide. La configuration a peut-être échoué.';
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
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Please, enter your email and password to login.
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
                        disabled={isPending || !firebaseInitialized}
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
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          disabled={isPending || !firebaseInitialized}
                          className="pr-10"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || !firebaseInitialized}>
                {isPending ? 'Connexion en cours...' : !firebaseInitialized ? 'Initialisation...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
