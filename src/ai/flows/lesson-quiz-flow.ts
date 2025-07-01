'use server';
/**
 * @fileOverview Generates a quiz based on lesson content.
 *
 * - generateLessonQuiz - A function that generates quiz questions.
 * - QuizGenerationInput - The input type for the function.
 * - QuizGenerationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const QuizQuestionSchema = z.object({
  question_text: z.string().describe("The text of the quiz question."),
  question_type: z.enum(['multiple_choice', 'true_false', 'fill_in_the_blank']).describe("The type of the question."),
  options: z.array(z.string()).optional().describe("A list of possible answers for multiple-choice questions."),
  correct_answer: z.string().describe("The correct answer for the question. For true/false, this should be 'True' or 'False'."),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("The difficulty level of the question."),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

const QuizGenerationInputSchema = z.object({
  lessonContent: z.string().describe("The full text content of the lesson to generate a quiz from."),
});
export type QuizGenerationInput = z.infer<typeof QuizGenerationInputSchema>;

const QuizGenerationOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe("An array of 5 generated quiz questions."),
});
export type QuizGenerationOutput = z.infer<typeof QuizGenerationOutputSchema>;

export async function generateLessonQuiz(input: QuizGenerationInput): Promise<QuizGenerationOutput> {
  return lessonQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonQuizPrompt',
  input: {schema: QuizGenerationInputSchema},
  output: {schema: QuizGenerationOutputSchema},
  prompt: `You are an expert educator responsible for creating quizzes to test student comprehension. Based on the provided lesson content, generate a quiz with exactly 5 questions.

The quiz must include a mix of the following question types:
- multiple_choice: A question with several options, only one of which is correct. Provide 4 options.
- true_false: A statement that is either true or false.
- fill_in_the_blank: A sentence with a word or phrase missing. The correct_answer should be the missing word/phrase.

The questions should also have a mix of difficulty levels: easy, medium, and hard.

Ensure the questions are diverse and cover different aspects of the lesson content provided below.

Lesson Content:
"""
{{{lessonContent}}}
"""

Generate the 5 quiz questions now.`,
});

const lessonQuizFlow = ai.defineFlow(
  {
    name: 'lessonQuizFlow',
    inputSchema: QuizGenerationInputSchema,
    outputSchema: QuizGenerationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
