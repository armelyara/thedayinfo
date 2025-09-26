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
import { CalendarIcon, Save, Send, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { categories } from '@/components/layout/main-layout';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAutoSave } from '@/hooks/use-auto-save';
import { SaveStatus } from '@/components/admin/save-status';
import { saveDraftAction, saveArticleAction } from './actions';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [pendingAction, setPendingAction] = useState<'publish' | 'schedule'>('publish');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: '',
      content: '',
      image: { src: '', alt: '' },
    },
  });

  const watchedValues = form.watch();
  const scheduledDate = form.watch('scheduledFor');
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [watchedValues]);

  // Auto-sauvegarde en brouillon externe
  const { saveNow } = useAutoSave(
    watchedValues,
    async (data) => {
      setIsSaving(true);
      try {
        const draftData = {
          autoSaveId: currentDraftId,
          title: data.title || '',
          author: data.author || '',
          category: data.category || '',
          content: data.content || '',
          image: data.image?.src ? { src: data.image.src, alt: data.image.alt } : undefined,
          scheduledFor: data.scheduledFor?.toISOString() || null,
          createdAt: currentDraftId ? undefined : new Date().toISOString(),
          isEditing: false
        };

        const savedDraft = await saveDraftAction(draftData);
        
        if (!currentDraftId) {
          setCurrentDraftId(savedDraft.autoSaveId);
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

  // Sauvegarder comme brouillon d'article
  const handleSaveAsDraft = async () => {
    const values = form.getValues();
    
    if (!values.title || !values.content) {
      toast({
        variant: 'destructive',
        title: 'Contenu insuffisant',
        description: 'Au minimum un titre et du contenu sont requis.',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const articleData = {
        title: values.title,
        author: values.author || 'Armel Yara',
        category: values.category || 'Technologie',
        content: values.content,
        image: values.image.src ? values.image : { src: '', alt: '' },
        scheduledFor: values.scheduledFor?.toISOString(),
        actionType: 'draft' as const
      };

      await saveArticleAction(articleData);
      
      toast({
        title: 'Brouillon sauvegardé',
        description: 'Votre article a été sauvegardé en brouillon.',
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder le brouillon.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publication avec confirmation
  const handlePublish = () => {
    setPendingAction('publish');
    setShowPublishConfirm(true);
  };

  // Programmation avec confirmation
  const handleSchedule = () => {
    if (!scheduledDate) {
      toast({
        variant: 'destructive',
        title: 'Date manquante',
        description: 'Veuillez choisir une date de publication.',
      });
      return;
    }
    
    setPendingAction('schedule');
    setShowScheduleConfirm(true);
  };

  const confirmAction = async () => {
    const values = form.getValues();
    
    try {
      const articleData = {
        title: values.title,
        author: values.author || 'Armel Yara',
        category: values.category || 'Technologie',
        content: values.content,
        image: values.image.src ? values.image : { src: '', alt: '' },
        scheduledFor: values.scheduledFor?.toISOString(),
        actionType: pendingAction
      };

      const savedArticle = await saveArticleAction(articleData);
      
      // Supprimer le brouillon externe si il existe
      if (currentDraftId) {
        // deleteDraftAction appelé automatiquement
      }
      
      const successMessage = pendingAction === 'publish' 
        ? 'Article publié et newsletter envoyée!'
        : 'Article programmé pour publication!';
      
      toast({
        title: successMessage,
        description: pendingAction === 'publish' 
          ? 'Votre article est maintenant en ligne.'
          : `Publication programmée le ${format(scheduledDate!, 'PPP', { locale: fr })}.`,
      });
      
      router.push(`/article/${savedArticle.slug}`);
    } catch (error) {
      console.error(`Failed to ${pendingAction} article:`, error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Un problème est survenu lors de ${pendingAction === 'publish' ? 'la publication' : 'la programmation'}.`,
      });
    } finally {
      setShowPublishConfirm(false);
      setShowScheduleConfirm(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
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
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Cette action publiera l'article immédiatement et enverra un email à tous vos abonnés.</span>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => setShowPublishConfirm(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={confirmAction}>
                Confirmer Publication
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showScheduleConfirm && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              L'article sera publié automatiquement le {format(scheduledDate!, 'PPP à HH:mm', { locale: fr })} 
              et l'email sera envoyé à ce moment-là.
            </span>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => setShowScheduleConfirm(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={confirmAction}>
                Confirmer Programmation
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <main>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(confirmAction)} className="space-y-8">
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
            {/* The rest of the form fields will go here */}
          </form>
        </Form>
      </main>
    </div>
  );
}
