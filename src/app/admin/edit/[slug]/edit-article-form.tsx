
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
import { categories } from '@/lib/data';
import type { Article } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateArticleAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';

const formSchema = z.object({
  title: z.string().min(10, {
    message: 'Le titre doit comporter au moins 10 caractères.',
  }),
  author: z.string().min(2, {
    message: 'L\'auteur doit comporter au moins 2 caractères.',
  }),
  category: z.string({
    required_error: 'Veuillez sélectionner une catégorie.',
  }),
  content: z.string().min(100, {
    message: 'Le contenu doit comporter au moins 100 caractères.',
  }),
  scheduledFor: z.date().optional(),
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
      scheduledFor: article.scheduledFor ? parseISO(article.scheduledFor) : undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const submissionData = {
        ...values,
        scheduledFor: values.scheduledFor?.toISOString(),
      };
      const updatedArticle = await updateArticleAction(article.slug, submissionData);
      toast({
        title: 'Article Mis à Jour !',
        description: 'Votre article a été mis à jour avec succès.',
      });
      router.push(`/article/${updatedArticle.slug}`);
    } catch (error) {
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
                    </Trigger>
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
                <Textarea
                    placeholder="Racontez votre histoire..."
                    className="min-h-[200px]"
                    {...field}
                />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <Button type="submit">Mettre à Jour l'Article</Button>
        </form>
    </Form>
  );
}

    