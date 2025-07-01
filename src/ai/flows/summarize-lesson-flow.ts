'use server';
/**
 * @fileOverview Flow to summarize lesson content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SummarizeLessonInputSchema = z.object({
  lessonContent: z.string().describe("The full text content of the lesson to summarize."),
});
export type SummarizeLessonInput = z.infer<typeof SummarizeLessonInputSchema>;

export const SummarizeLessonOutputSchema = z.object({
  summary: z.string().describe("The concise summary of the lesson, formatted as HTML with headings and lists."),
});
export type SummarizeLessonOutput = z.infer<typeof SummarizeLessonOutputSchema>;


export async function summarizeLesson(input: SummarizeLessonInput): Promise<SummarizeLessonOutput> {
  return summarizeLessonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLessonPrompt',
  input: {schema: SummarizeLessonInputSchema},
  output: {schema: SummarizeLessonOutputSchema},
  prompt: `You are an expert educator. Summarize the following lesson content into concise key points, using HTML formatting. Use <h4> for headings and <ul>/<li> for lists where appropriate.

Lesson Content:
"""
{{{lessonContent}}}
"""

Generate the summary now.`,
});

const summarizeLessonFlow = ai.defineFlow(
  {
    name: 'summarizeLessonFlow',
    inputSchema: SummarizeLessonInputSchema,
    outputSchema: SummarizeLessonOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
