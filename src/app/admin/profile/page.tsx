// src/app/admin/profile/page.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { getProfileAction, updateProfileAction } from './actions';
import { Profile } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  biography: z.string().min(20, { message: "La biographie doit comporter au moins 20 caractères." }),
  imageUrl: z.string().min(1, { message: "Une image de profil est requise." }),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      biography: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const currentProfile = await getProfileAction();
        if (currentProfile) {
          setProfile(currentProfile);
          form.reset({
            name: currentProfile.name,
            biography: currentProfile.biography.replace(/<br\s*\/?>/gi, '\n'), // Convert br to newlines for textarea
            imageUrl: currentProfile.imageUrl,
          });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le profil.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateProfileAction({
        ...values,
        biography: values.biography.replace(/\n/g, '<br/>'), // Convert newlines back to br tags
      });
      toast({
        title: 'Profil mis à jour !',
        description: 'Vos informations ont été enregistrées.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Un problème est survenu lors de la mise à jour.',
      });
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-8">Chargement du profil...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold">Modifier votre Profil</h1>
        <p className="text-muted-foreground mt-2">
          Ces informations seront affichées sur la page "À propos".
        </p>
      </header>
      <main>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom complet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="biography"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biographie</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Parlez un peu de vous..."
                      {...field}
                      rows={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de profil</FormLabel>
                  <FormControl>
                    <ImageUpload
                      currentImage={field.value}
                      onImageSelect={(imageData) => {
                        form.setValue('imageUrl', imageData.src);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
