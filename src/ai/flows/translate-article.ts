'use server';

/**
 * @fileOverview A Genkit flow for translating French article content to English.
 *
 * - translateArticleFlow - Translates a French article (title + HTML content) to English.
 * - TranslateArticleInput  - Input type for the flow.
 * - TranslateArticleOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateArticleInputSchema = z.object({
  title: z.string().describe('The French article title to translate.'),
  content: z
    .string()
    .describe(
      'The French article content in HTML format to translate. All HTML tags must be preserved exactly.'
    ),
});
export type TranslateArticleInput = z.infer<typeof TranslateArticleInputSchema>;

const TranslateArticleOutputSchema = z.object({
  title_en: z.string().describe('The translated English title.'),
  content_en: z
    .string()
    .describe(
      'The translated English content in HTML format, with all original HTML tags preserved.'
    ),
});
export type TranslateArticleOutput = z.infer<typeof TranslateArticleOutputSchema>;

const translateArticlePrompt = ai.definePrompt({
  name: 'translateArticlePrompt',
  input: { schema: TranslateArticleInputSchema },
  output: { schema: TranslateArticleOutputSchema },
  prompt: `You are a professional French-to-English translator specializing in technical and blog content.

Your task is to translate the following French blog article into natural, fluent English.

CRITICAL RULES:
1. Translate ALL text content from French to English.
2. PRESERVE ALL HTML TAGS exactly as they appear — do not remove, add, or modify any HTML tag.
3. Only translate the text nodes inside HTML tags, never the tags themselves or their attributes.
4. Keep proper nouns, brand names, and technical terms in their original form (e.g. "Firebase", "Next.js").
5. The translation must read naturally in English, not like a literal word-for-word translation.

---
TITLE (French):
{{{title}}}

---
CONTENT (French HTML):
{{{content}}}

---
Return the translated title in "title_en" and the translated HTML content in "content_en".`,
});

export const translateArticleFlow = ai.defineFlow(
  {
    name: 'translateArticleFlow',
    inputSchema: TranslateArticleInputSchema,
    outputSchema: TranslateArticleOutputSchema,
  },
  async (input) => {
    const { output } = await translateArticlePrompt(input);
    return output!;
  }
);
