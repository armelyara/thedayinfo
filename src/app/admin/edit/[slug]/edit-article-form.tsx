
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Article, Draft } from '@/lib/data-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/rich-text-editor';
import { updateItemAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Send, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { categories } from '@/components/layout/main-layout';
import { ImageUpload } from '@/components/ui/image-upload';

const formSchema = z.object({
  title: z.string().min(10, {
    message: 'Le titre doit comporter au moins 10 caractères.',
  }),
  author: z.string().min(2, {
    message: "L'auteur doit comporter au moins 2 caractères.",
  }),
  category: z.string({
    required_error: 'Veuillez sélectionner une catégorie.',
  }),
  content: z.string().min(100, {
    message: 'Le contenu doit comporter au moins 100 caractères.',
  }),
  image: z.object({
    src: z.string().min(1, "L'image est requise."),
    alt: z.string().min(1, "La description de l'image est requise."),
  }),
  scheduledFor: z.date().optional().nullable(),
});

type EditArticleFormProps = {
  item: Article | Draft;
  isDraft: boolean;
};

export default function EditArticleForm({ item, isDraft }: EditArticleFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: item.title,
      author: item.author,
      category: item.category,
      content: item.content,
      image: {
        src: item.image?.src || '',
        alt: item.image?.alt || '',
      },
      scheduledFor: item.scheduledFor ? new Date(item.scheduledFor) : null,
    },
  });

  const scheduledDate = form.watch('scheduledFor');

  async function handleAction(actionType: 'draft' | 'publish' | 'schedule') {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Champs invalides',
        description: 'Veuillez corriger les erreurs avant de continuer.',
      });
      return;
    }

    const values = form.getValues();
    const idOrSlug = isDraft ? (item as Draft).id : (item as Article).slug;
    const originalArticleSlug = isDraft ? (item as Draft).originalArticleSlug : undefined;


    try {
      // Cast 'scheduledFor' to a format suitable for the action
      const submissionValues = {
        ...values,
        scheduledFor: values.scheduledFor ? values.scheduledFor.toISOString() : undefined,
      };

      const result = await updateItemAction(idOrSlug, submissionValues, actionType, isDraft, originalArticleSlug);
      
      let successMessage = '';
      let redirectUrl = '/admin';

      if (result.status === 'draft') {
        successMessage = 'Brouillon mis à jour !';
        redirectUrl = '/admin/drafts';
      } else if (result.status === 'scheduled') {
        successMessage = 'Article programmé avec succès !';
        redirectUrl = '/admin/drafts';
      } else if (result.status === 'published') {
        successMessage = 'Article mis à jour et publié !';
        redirectUrl = `/article/${(result as Article).slug}`;
      }

      toast({
        title: 'Succès !',
        description: successMessage,
      });
      router.push(redirectUrl);
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: 'destructive',
        title: 'Oh oh ! Quelque chose s\'est mal passé.',
        description: error instanceof Error ? error.message : 'Un problème est survenu avec votre demande.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
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
                    form.setValue('image.alt', form.getValues('title'));
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
          render={({ field }) => {
            return (
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
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date)}
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
                      defaultValue={field.value ? format(field.value, 'HH:mm') : ''}
                      onChange={(e) => {
                          if (!field.value) return;
                          const time = e.target.value.split(':');
                          const hours = parseInt(time[0], 10);
                          const minutes = parseInt(time[1], 10);
                          const newDate = setMinutes(setHours(field.value, hours), minutes);
                          field.onChange(newDate);
                      }}
                    />
                  )}
                </div>
                 <FormDescription>
                      Si une date est définie, l'article sera sauvegardé comme brouillon programmé.
                  </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
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
                  placeholder="Modifiez le contenu de votre article..."
                  height={500}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => handleAction('draft')}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder en brouillon
          </Button>

          {scheduledDate ? (
              <Button onClick={() => handleAction('schedule')} className="bg-blue-600 hover:bg-blue-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Mettre à jour la programmation
              </Button>
          ) : (
              <Button onClick={() => handleAction('publish')}>
                  <Send className="h-4 w-4 mr-2" />
                  {isDraft ? "Publier Maintenant" : "Mettre à jour et Publier"}
              </Button>
          )}

           <Button type="button" variant="ghost" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}

    