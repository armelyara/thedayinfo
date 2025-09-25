// src/app/admin/edit/[slug]/edit-article-form.tsx
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
import type { Article } from '@/lib/data-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/rich-text-editor';
import { updateArticleAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
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
  scheduledFor: z.string().optional().nullable(),
});

type EditArticleFormProps = {
  article: Article;
};

export default function EditArticleForm({ article }: EditArticleFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: article.title,
      author: article.author,
      category: article.category,
      content: article.content,
      image: {
        src: article.image.src,
        alt: article.image.alt,
      },
      scheduledFor: article.scheduledFor,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const updatedArticle = await updateArticleAction(article.slug, values);
      toast({
        title: 'Article Mis à Jour !',
        description: 'Votre article a été mis à jour avec succès.',
      });
      router.push(`/article/${updatedArticle.slug}`);
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: 'destructive',
        title: 'Oh oh ! Quelque chose s\'est mal passé.',
        description: 'Un problème est survenu avec votre demande.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Programmer la Publication</FormLabel>
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
                        format(parseISO(field.value), 'PPP', { locale: fr })
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
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                  placeholder="Modifiez le contenu de votre article..."
                  height={500}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
          <Button type="submit">Mettre à Jour l'Article</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
