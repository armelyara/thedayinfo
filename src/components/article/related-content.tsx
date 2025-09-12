
import Link from 'next/link';
import { suggestRelatedContent } from '@/ai/flows/related-content-suggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, ExternalLink } from 'lucide-react';
import { articles } from '@/lib/data';

type RelatedContentProps = {
  currentArticleTitle: string;
  articleContent: string;
};

// Helper to find a slug for a given title
const findSlugByTitle = (title: string): string | null => {
  const article = articles.find(a => a.title.toLowerCase() === title.toLowerCase());
  return article ? article.slug : null;
};


export default async function RelatedContent({
  currentArticleTitle,
  articleContent,
}: RelatedContentProps) {
  let suggestions: {title: string, slug: string | null}[] = [];

  try {
    const result = await suggestRelatedContent({ currentArticleTitle, articleContent });
    if(result.suggestedArticles) {
      suggestions = result.suggestedArticles.map(title => ({
        title,
        slug: findSlugByTitle(title)
      }));
    }
  } catch (error) {
    console.error("Failed to fetch related content:", error);
    // Render nothing if AI call fails
    return null;
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
