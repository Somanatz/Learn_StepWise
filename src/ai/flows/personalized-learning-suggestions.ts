// src/ai/flows/personalized-learning-suggestions.ts
'use server';

/**
 * @fileOverview AI flow to provide personalized learning suggestions based on student performance.
 *
 * - personalizedLearningSuggestions - A function that generates personalized learning suggestions.
 * - PersonalizedLearningSuggestionsInput - The input type for the personalizedLearningSuggestions function.
 * - PersonalizedLearningSuggestionsOutput - The return type for the personalizedLearningSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedLearningSuggestionsInputSchema = z.object({
  studentId: z.string().describe('The unique identifier of the student.'),
  performanceData: z.string().describe('A summary of the student\'s performance in lessons and tests.'),
  availableLessons: z.string().describe('A list of available lessons.'),
  availableVideos: z.string().describe('A list of available videos.'),
  availableQuizzes: z.string().describe('A list of available quizzes.'),
});
export type PersonalizedLearningSuggestionsInput = z.infer<
  typeof PersonalizedLearningSuggestionsInputSchema
>;

const PersonalizedLearningSuggestionsOutputSchema = z.object({
  suggestedLessons: z.string().describe('A list of suggested lessons.'),
  suggestedVideos: z.string().describe('A list of suggested videos.'),
  suggestedQuizzes: z.string().describe('A list of suggested quizzes.'),
  reasoning: z.string().describe('The reasoning behind the suggestions.'),
});
export type PersonalizedLearningSuggestionsOutput = z.infer<
  typeof PersonalizedLearningSuggestionsOutputSchema
>;

export async function personalizedLearningSuggestions(
  input: PersonalizedLearningSuggestionsInput
): Promise<PersonalizedLearningSuggestionsOutput> {
  return personalizedLearningSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedLearningSuggestionsPrompt',
  input: {schema: PersonalizedLearningSuggestionsInputSchema},
  output: {schema: PersonalizedLearningSuggestionsOutputSchema},
  prompt: `You are an AI learning assistant that provides personalized learning suggestions for students.

  Based on the student's performance data, available lessons, videos, and quizzes, you will suggest extra lessons, videos, and quiz practices to help the student focus on areas where they need the most help.

  Student Performance Data: {{{performanceData}}}
  Available Lessons: {{{availableLessons}}}
  Available Videos: {{{availableVideos}}}
  Available Quizzes: {{{availableQuizzes}}}

  Please provide a list of suggested lessons, videos, and quizzes, along with a brief explanation of why you are suggesting them.
  Format the response as a JSON object.
  `,
});

const personalizedLearningSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedLearningSuggestionsFlow',
    inputSchema: PersonalizedLearningSuggestionsInputSchema,
    outputSchema: PersonalizedLearningSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
