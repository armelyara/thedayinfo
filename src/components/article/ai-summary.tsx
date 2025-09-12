
'use client';

import { useState } from 'react';
import { summarizeArticle } from '@/ai/flows/article-summarization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type AiSummaryProps = {
  articleContent: string;
};

export default function AiSummary({ articleContent }: AiSummaryProps) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');
    try {
      const result = await summarizeArticle({ articleContent });
      if (result.summary) {
        setSummary(result.summary);
      } else {
        throw new Error('Échec de la génération du résumé.');
      }
    } catch (e: any) {
      console.error(e);
      setError('Désolé, nous n\'avons pas pu générer de résumé pour le moment.');
      toast({
        variant: 'destructive',
        title: 'Échec de la Synthèse',
        description: 'Une erreur est survenue lors de la tentative de résumé de l\'article.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-primary" />
          <span>Résumé par IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary && !isLoading && (
          <div className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              Trop long ? Obtenez un résumé rapide de cet article généré par l'IA.
            </p>
            <Button onClick={handleSummarize} disabled={isLoading}>
              <Wand2 className="mr-2 h-4 w-4" />
              Résumer l'Article
            </Button>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Génération du résumé...</span>
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {summary && (
          <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
            {summary}
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}
