'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRelatedContentAction } from './actions';

type Suggestion = {
  title: string;
  slug: string | null;
};

type RelatedContentProps = {
  currentArticleTitle: string;
  articleContent: string;
};

export default function RelatedContent({
  currentArticleTitle,
  articleContent,
}: RelatedContentProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const result = await getRelatedContentAction({ currentArticleTitle, articleContent });
        setSuggestions(result);
      } catch (error) {
        console.error("Failed to fetch related content:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuggestions();
  }, [currentArticleTitle, articleContent]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <BookText />
            <span>Vous Pourriez Aussi Aimer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Recherche de suggestions...</span>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
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
          {suggestions.map((suggestion, index) =>
            suggestion.slug ? (
              <li key={index}>
                <Link
                  href={`/blog/${suggestion.slug}`}
                  className="group flex items-center justify-between text-primary hover:underline"
                >
                  <span>{suggestion.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ) : null
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
