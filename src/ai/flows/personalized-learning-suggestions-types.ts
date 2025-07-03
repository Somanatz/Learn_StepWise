/**
 * @fileOverview Types and schemas for the personalized learning suggestions flow.
 */
import {z} from 'genkit';

export const PersonalizedLearningSuggestionsInputSchema = z.object({
  studentId: z.string().describe('The unique identifier of the student.'),
  performanceData: z.string().describe('A summary of the student\'s performance in lessons and tests.'),
  availableLessons: z.string().describe('A list of available lessons.'),
  availableVideos: z.string().describe('A list of available videos.'),
  availableQuizzes: z.string().describe('A list of available quizzes.'),
});
export type PersonalizedLearningSuggestionsInput = z.infer<
  typeof PersonalizedLearningSuggestionsInputSchema
>;

export const PersonalizedLearningSuggestionsOutputSchema = z.object({
  suggestedLessons: z.string().describe('A list of suggested lessons.'),
  suggestedVideos: z.string().describe('A list of suggested videos.'),
  suggestedQuizzes: z.string().describe('A list of suggested quizzes.'),
  reasoning: z.string().describe('The reasoning behind the suggestions.'),
});
export type PersonalizedLearningSuggestionsOutput = z.infer<
  typeof PersonalizedLearningSuggestionsOutputSchema
>;
