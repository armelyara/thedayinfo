
'use client';
import Link from 'next/link';
import { suggestRelatedContent } from '@/ai/flows/related-content-suggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, ExternalLink } from 'lucide-react';
import { getPublishedArticles, type Article } from '@/lib/data';
import { useEffect, useState } from 'react';

type RelatedContentProps = {
  currentArticleTitle: string;
  articleContent: string;
};

export default function RelatedContent({
  currentArticleTitle,
  articleContent,
}: RelatedContentProps) {
  const [suggestions, setSuggestions] = useState<{title: string, slug: string | null}[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticlesAndSuggestions() {
      try {
        const [publishedArticles, suggestionResult] = await Promise.all([
          getPublishedArticles(),
          suggestRelatedContent({ currentArticleTitle, articleContent })
        ]);
        
        setArticles(publishedArticles);

        if (suggestionResult.suggestedArticles) {
          const processedSuggestions = suggestionResult.suggestedArticles.map(title => {
            const article = publishedArticles.find(a => a.title.toLowerCase() === title.toLowerCase());
            return {
              title,
              slug: article ? article.slug : null
            };
          }).filter(s => s.slug); // Filter out suggestions that don't have a slug
          setSuggestions(processedSuggestions);
        }
      } catch (error) {
        console.error("Failed to fetch related content:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchArticlesAndSuggestions();
  }, [currentArticleTitle, articleContent]);


  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <BookText />
          <span>Vous Pourriez Aussi Aimer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
             suggestion.slug ? (
            <li key={index}>
              <Link href={`/article/${suggestion.slug}`} className="group flex items-center justify-between text-primary hover:underline">
                  <span>{suggestion.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
             ) : null
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
