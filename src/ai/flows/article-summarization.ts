'use server';

/**
 * @fileOverview A flow for generating short summaries of articles in French.
 *
 * - summarizeArticleFlow - A Genkit flow that generates a short summary of an article.
 * - SummarizeArticleInput - The input type for the summarizeArticleFlow function.
 * - SummarizeArticleOutput - The return type for the summarizeArticleFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticleInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The complete text content of the article to be summarized.'),
});
export type SummarizeArticleInput = z.infer<typeof SummarizeArticleInputSchema>;

const SummarizeArticleOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the article in French, highlighting the main points.'),
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

const summarizeArticlePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleInputSchema},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `Tu es un assistant IA qui résume des articles en français. 

Résume l'article suivant en un paragraphe concis qui capture les points principaux. Le résumé DOIT être en français, même si l'article est dans une autre langue.

Article:
{{{articleContent}}}

Réponds UNIQUEMENT en français avec un résumé clair et informatif.`,
});

export const summarizeArticleFlow = ai.defineFlow(
  {
    name: 'summarizeArticleFlow',
    inputSchema: SummarizeArticleInputSchema,
    outputSchema: SummarizeArticleOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticlePrompt(input);
    return {
      ...output!,
    };
  }
);