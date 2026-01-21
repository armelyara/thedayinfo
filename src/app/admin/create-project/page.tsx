// src/app/admin/create-project/page.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { saveProjectAction } from './actions';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Le titre doit comporter au moins 5 caractères.' }),
  description: z.string().min(20, { message: 'La description courte doit comporter au moins 20 caractères.' }),
  fullDescription: z.string().min(100, { message: 'La description complète doit comporter au moins 100 caractères.' }),
  image: z.object({
    src: z.string().min(1, "L'image est requise."),
    alt: z.string().min(1, "La description de l'image est requise."),
  }),
  technologies: z.string().min(1, 'Veuillez indiquer au moins une technologie.'),
  status: z.enum(['en-cours', 'terminé', 'maintenance']),
  startDate: z.string().min(1, 'La date de début est requise.'),
  endDate: z.string().optional(),
  githubUrl: z.string().url({ message: "Veuillez entrer une URL valide." }).optional().or(z.literal('')),
  demoUrl: z.string().url({ message: "Veuillez entrer une URL valide." }).optional().or(z.literal('')),
  blogArticleSlug: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateProjectPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      fullDescription: '',
      image: { src: '', alt: '' },
      technologies: '',
      status: 'en-cours',
      startDate: '',
      endDate: '',
      githubUrl: '',
      demoUrl: '',
      blogArticleSlug: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      const projectData = {
        ...values,
        technologies: values.technologies.split(',').map(tech => tech.trim()).filter(Boolean),
      };

      const result = await saveProjectAction(projectData);
      
      toast({
        title: 'Projet sauvegardé !',
        description: `Le projet "${result.title}" a été ajouté avec succès.`,
      });

      router.push('/admin/projects');

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de sauvegarde',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le projet.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Tableau de Bord
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-headline font-bold">Créer un Nouveau Projet</h1>
            <p className="text-muted-foreground mt-2">
              Remplissez les détails ci-dessous pour ajouter un nouveau projet à votre portfolio.
            </p>
          </div>
        </div>
      </header>
      
      <main>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du projet</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon super projet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      currentImage={field.value.src}
                      onImageSelect={(imageData) => {
                        form.setValue('image.src', imageData.src);
                        form.setValue('image.alt', form.getValues('title') || 'Image du projet');
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description courte</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Une brève description pour la carte du projet." {...field} rows={3} />
                  </FormControl>
                  <FormDescription>Cette description apparaîtra sur la carte du projet dans la liste.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description complète</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Décrivez votre projet en détail ici..." {...field} rows={10} />
                  </FormControl>
                   <FormDescription>Cette description apparaîtra sur la page de détail du projet. Vous pouvez utiliser du HTML simple.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technologies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technologies</FormLabel>
                  <FormControl>
                    <Input placeholder="Next.js, Firebase, Tailwind CSS" {...field} />
                  </FormControl>
                  <FormDescription>Séparez les technologies par des virgules.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en-cours">En cours</SelectItem>
                        <SelectItem value="terminé">Terminé</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>URL GitHub (optionnel)</FormLabel>
                    <FormControl>
                        <Input placeholder="https://github.com/user/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="demoUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>URL de la démo (optionnel)</FormLabel>
                    <FormControl>
                        <Input placeholder="https://mon-projet.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="blogArticleSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug de l'article de blog associé (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="mon-super-article-sur-le-projet" {...field} />
                  </FormControl>
                  <FormDescription>
                    Si un article de blog détaille ce projet, entrez son slug ici (ex: "titre-de-l-article").
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
                <Button 
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                    <Save className="h-4 w-4 mr-2" />
                    {form.formState.isSubmitting ? 'Sauvegarde...' : 'Sauvegarder le Projet'}
                </Button>
            </div>

          </form>
        </Form>
      </main>
    </div>
  );
}
