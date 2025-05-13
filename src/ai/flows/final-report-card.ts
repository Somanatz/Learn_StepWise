'use server';
/**
 * @fileOverview Generates a final report card for a student based on their test scores.
 *
 * - generateFinalReportCard - A function that generates the final report card.
 * - FinalReportCardInput - The input type for the generateFinalReportCard function.
 * - FinalReportCardOutput - The return type for the generateFinalReportCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestScoreSchema = z.object({
  subject: z.string().describe('The subject of the test.'),
  score: z.number().describe('The score obtained in the test.'),
  maxScore: z.number().describe('The maximum possible score for the test.'),
  date: z.string().describe('The date when the test was taken.'),
});

const StudentSchema = z.object({
  name: z.string().describe('The name of the student.'),
  classLevel: z.number().describe('The class level of the student (e.g., 1 for 1st grade).'),
});

const FinalReportCardInputSchema = z.object({
  student: StudentSchema.describe('Information about the student.'),
  testScores: z.array(TestScoreSchema).describe('An array of test scores for the student.'),
});
export type FinalReportCardInput = z.infer<typeof FinalReportCardInputSchema>;

const FinalReportCardOutputSchema = z.object({
  reportCard: z.string().describe('The generated final report card.'),
  classLeader: z.string().optional().describe('The name of the class leader, if applicable.'),
  rank: z.number().optional().describe('The student rank in class, if applicable.'),
});
export type FinalReportCardOutput = z.infer<typeof FinalReportCardOutputSchema>;

export async function generateFinalReportCard(input: FinalReportCardInput): Promise<FinalReportCardOutput> {
  return finalReportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'finalReportCardPrompt',
  input: {schema: FinalReportCardInputSchema},
  output: {schema: FinalReportCardOutputSchema},
  prompt: `You are an expert educator who generates final report cards for students.

  Analyze the student's performance across all subjects and tests taken during the year.
  Provide a summary of their overall academic progress, highlighting strengths and areas for improvement.
  If applicable, identify the class leader based on overall performance and determine the student's rank in the class.

  Student Information:
  Name: {{{student.name}}}
  Class Level: {{{student.classLevel}}}

  Test Scores:
  {{#each testScores}}
  - Subject: {{{subject}}}, Score: {{{score}}}/{{{maxScore}}}, Date: {{{date}}}
  {{/each}}
  \n
  Report Card:`, 
});

const finalReportCardFlow = ai.defineFlow(
  {
    name: 'finalReportCardFlow',
    inputSchema: FinalReportCardInputSchema,
    outputSchema: FinalReportCardOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
