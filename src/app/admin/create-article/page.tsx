
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Send, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { categories } from '@/components/layout/main-layout';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAutoSave } from '@/hooks/use-auto-save';
import { SaveStatus } from '@/components/admin/save-status';
import { saveDraftActionServer, saveArticleAction } from './actions';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import type { Draft } from '@/lib/data-types';

const formSchema = z.object({
  title: z.string().min(10, { message: 'Le titre doit comporter au moins 10 caractères.' }),
  author: z.string().min(2, { message: "L'auteur doit comporter au moins 2 caractères." }),
  category: z.string({ required_error: 'Veuillez sélectionner une catégorie.' }),
  content: z.string().min(100, { message: 'Le contenu doit comporter au moins 100 caractères.' }),
  image: z.object({
    src: z.string().min(1, "L'image est requise."),
    alt: z.string().min(1, "La description de l'image est requise."),
  }),
  scheduledFor: z.date().optional(),
});

export default function CreateArticlePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [lastSaved, setLastSaved] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string>();
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'schedule' | 'draft'>('publish');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: 'Armel Yara',
      content: '',
      image: { src: '', alt: '' },
    },
  });

  const watchedValues = form.watch();
  const scheduledDate = form.watch('scheduledFor');
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [Object.values(watchedValues)]);

  // Auto-sauvegarde en brouillon externe
  const { saveNow } = useAutoSave(
    watchedValues,
    async (data) => {
      setIsSaving(true);
      try {
        const draftData: Partial<Draft> = {
          id: currentDraftId,
          title: data.title || '',
          author: data.author || '',
          category: data.category || '',
          content: data.content || '',
          image: data.image?.src ? { src: data.image.src, alt: data.image.alt } : undefined,
          scheduledFor: data.scheduledFor?.toISOString(),
          createdAt: currentDraftId ? undefined : new Date().toISOString(),
        };

        const savedDraft = await saveDraftActionServer(draftData);
        
        if (!currentDraftId) {
          setCurrentDraftId(savedDraft.id);
        }
        
        setLastSaved(savedDraft.lastSaved);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    },
    { delay: 30000, enabled: true }
  );

  const executeSaveAction = async (actionType: 'draft' | 'publish' | 'schedule') => {
    const values = form.getValues();
    
    // Validation manuelle pour brouillon
    if (actionType === 'draft' && (!values.title || !values.content)) {
        toast({
            variant: 'destructive',
            title: 'Contenu insuffisant',
            description: 'Un titre et du contenu sont requis pour sauvegarder un brouillon.',
        });
        return;
    }

    // Validation complète pour publier/programmer
    if (actionType === 'publish' || actionType === 'schedule') {
        const isValid = await form.trigger();
        if (!isValid) {
            toast({
                variant: 'destructive',
                title: 'Champs invalides',
                description: 'Veuillez corriger les erreurs avant de continuer.',
            });
            return;
        }
    }

    setIsSaving(true);
    try {
        const articleData = {
            id: currentDraftId,
            title: values.title,
            author: values.author,
            category: values.category,
            content: values.content,
            image: values.image,
            scheduledFor: values.scheduledFor?.toISOString(),
            actionType,
        };

        const result = await saveArticleAction(articleData);

        let successMessageTitle = '';
        let successMessageDesc = '';
        let redirectUrl = '/admin/drafts';

        if (actionType === 'draft' || (actionType === 'schedule' && 'status' in result && result.status === 'scheduled')) {
            successMessageTitle = 'Brouillon sauvegardé';
            successMessageDesc = `Votre article a été sauvegardé en tant que ${actionType === 'schedule' ? 'brouillon programmé' : 'brouillon'}.`;
            setCurrentDraftId(result.id);
        } else if (actionType === 'publish' && 'slug' in result) {
            successMessageTitle = 'Article publié !';
            successMessageDesc = 'Votre article est maintenant en ligne.';
            redirectUrl = `/article/${result.slug}`;
        }
        
        toast({
            title: successMessageTitle,
            description: successMessageDesc,
        });

        router.push(redirectUrl);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erreur de sauvegarde',
            description: error instanceof Error ? error.message : 'Impossible de sauvegarder l\'article.',
        });
    } finally {
        setIsSaving(false);
        setShowPublishConfirm(false);
        setShowScheduleConfirm(false);
    }
  };

  const handleSaveAsDraft = () => executeSaveAction('draft');
  const handlePublish = () => { setPendingAction('publish'); setShowPublishConfirm(true); };
  const handleSchedule = () => {
    if (!scheduledDate) {
        toast({ variant: 'destructive', title: 'Date manquante', description: 'Veuillez choisir une date de publication.' });
        return;
    }
    setPendingAction('schedule');
    executeSaveAction('schedule'); // La nouvelle logique sauvegarde directement dans les brouillons
  };
  const confirmPublish = () => executeSaveAction('publish');

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
            <h1 className="text-4xl font-headline font-bold">Écrire un Nouvel Article</h1>
            <p className="text-muted-foreground mt-2">
              Votre contenu est automatiquement sauvegardé en brouillon pendant l'écriture.
            </p>
          </div>
          
          <div className="text-right">
            <SaveStatus 
              lastSaved={lastSaved}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        </div>
      </header>
      
      {showPublishConfirm && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Cette action publiera l'article immédiatement et enverra un email à tous vos abonnés.</span>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => setShowPublishConfirm(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={confirmPublish} disabled={isSaving}>
                {isSaving ? 'Publication...' : 'Confirmer Publication'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <main>
        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="L'avenir de l'IA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auteur</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.slug} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        form.setValue('image.alt', form.getValues('title') || 'Image de l\'article');
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Programmer la Publication</FormLabel>
                   <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: fr })
                              ) : (
                                <span>Choisissez une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {field.value && (
                        <Input
                          type="time"
                          className="w-[120px]"
                          defaultValue={format(field.value, 'HH:mm')}
                          onChange={(e) => {
                            const time = e.target.value.split(':');
                            const hours = parseInt(time[0], 10);
                            const minutes = parseInt(time[1], 10);
                            const newDate = setMinutes(setHours(field.value!, hours), minutes);
                            field.onChange(newDate);
                          }}
                        />
                      )}
                    </div>
                  <FormDescription>
                    Laisser vide pour publier maintenant ou sauvegarder en brouillon.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Racontez votre histoire avec style..."
                      height={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
                <Button variant="outline" onClick={handleSaveAsDraft} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder en brouillon'}
                </Button>

                {scheduledDate ? (
                    <Button onClick={handleSchedule} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                        <Clock className="h-4 w-4 mr-2" />
                        {isSaving ? 'Programmation...' : 'Programmer'}
                    </Button>
                ) : (
                    <Button onClick={handlePublish} disabled={isSaving}>
                        <Send className="h-4 w-4 mr-2" />
                        Publier Maintenant
                    </Button>
                )}
            </div>

          </form>
        </Form>
      </main>
    </div>
  );
}

    