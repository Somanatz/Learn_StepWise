// src/ai/flows/personalized-learning-suggestions.ts
'use server';

/**
 * @fileOverview AI flow to provide personalized learning suggestions based on student performance.
 *
 * - personalizedLearningSuggestions - A function that generates personalized learning suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PersonalizedLearningSuggestionsInput, PersonalizedLearningSuggestionsInputSchema, PersonalizedLearningSuggestionsOutput, PersonalizedLearningSuggestionsOutputSchema } from './personalized-learning-suggestions-types';

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
