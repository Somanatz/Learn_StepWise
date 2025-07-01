'use server';
/**
 * @fileOverview Flow to translate lesson content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const TranslateContentInputSchema = z.object({
  content: z.string().describe("The HTML content to be translated."),
  targetLanguage: z.string().describe("The target language for translation (e.g., 'Spanish', 'Hindi')."),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

export const TranslateContentOutputSchema = z.object({
  translatedContent: z.string().describe("The translated HTML content."),
});
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;


export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: {schema: TranslateContentInputSchema},
  output: {schema: TranslateContentOutputSchema},
  prompt: `Translate the following HTML content into {{targetLanguage}}. It is critical that you maintain all original HTML tags and structure. Only translate the text content within the tags.

HTML Content to Translate:
"""
{{{content}}}
"""

Provide only the translated HTML content.`,
});

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
