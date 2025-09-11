'use server';

/**
 * @fileOverview A flow for suggesting related articles based on the content of the current article.
 *
 * - suggestRelatedContent - A function that takes the content of an article and returns a list of suggested article titles.
 * - SuggestRelatedContentInput - The input type for the suggestRelatedContent function.
 * - SuggestRelatedContentOutput - The return type for the suggestRelatedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedContentInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the article for which to suggest related articles.'),
  currentArticleTitle: z.string().describe('The title of the current article.'),
});
export type SuggestRelatedContentInput = z.infer<typeof SuggestRelatedContentInputSchema>;

const SuggestRelatedContentOutputSchema = z.object({
  suggestedArticles: z
    .array(z.string())
    .describe('A list of titles of articles related to the current article.'),
});
export type SuggestRelatedContentOutput = z.infer<typeof SuggestRelatedContentOutputSchema>;

export async function suggestRelatedContent(
  input: SuggestRelatedContentInput
): Promise<SuggestRelatedContentOutput> {
  return suggestRelatedContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedContentPrompt',
  input: {schema: SuggestRelatedContentInputSchema},
  output: {schema: SuggestRelatedContentOutputSchema},
  prompt: `You are a blog content curator for thedayinfo.com. A user is currently reading an article titled "{{currentArticleTitle}}" with the following content:

  {{articleContent}}

  Suggest three other articles from the blog that might interest them. Just return the titles of the articles in a JSON array.  Do not suggest the current article.
  `,
});

const suggestRelatedContentFlow = ai.defineFlow(
  {
    name: 'suggestRelatedContentFlow',
    inputSchema: SuggestRelatedContentInputSchema,
    outputSchema: SuggestRelatedContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
