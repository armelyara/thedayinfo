'use server';

/**
 * @fileOverview A flow for generating short summaries of articles.
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
    .describe('A concise summary of the article, highlighting the main points.'),
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

const summarizeArticlePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleInputSchema},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `Summarize the following article in a concise paragraph that captures the main points:\n\n{{{articleContent}}}`,
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
