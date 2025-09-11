import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Article } from '@/lib/data';
import { ArrowRight } from 'lucide-react';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={article.image.aiHint}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-6">
          <Badge variant="secondary" className="mb-2 w-fit">{article.category}</Badge>
          <h3 className="mb-2 text-xl font-headline font-bold leading-tight">
            {article.title}
          </h3>
          <p className="flex-1 text-muted-foreground line-clamp-3">
            {article.content.substring(0, 120)}...
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-0">
            <div className="flex items-center text-sm font-semibold text-primary">
                Read More
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
