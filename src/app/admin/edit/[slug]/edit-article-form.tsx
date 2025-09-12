
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
