import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Eye, MessageCircle } from 'lucide-react';
import type { Article } from '@/lib/data-types';


type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  // Supprimer les balises HTML du contenu pour l'aperçu
  const plainTextContent = article.content.replace(/<[^>]*>?/gm, '');

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          <Link href={`/blog/${article.slug}`} className="group block">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={article.image.aiHint}
            />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-1 flex-col p-6">
        <Badge variant="secondary" className="mb-2 w-fit">{article.category}</Badge>
        <Link href={`/blog/${article.slug}`} className="group">
          <h3 className="mb-2 text-xl font-headline font-bold leading-tight hover:text-primary transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="flex-1 text-muted-foreground line-clamp-3">
          {plainTextContent.substring(0, 120)}...
        </p>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
  <Link href={`/blog/${article.slug}`} className="group w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center text-sm font-semibold text-primary">
        Lire la suite
        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{article.views}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{article.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  </Link>
</CardFooter>
    </Card>
  );
}
