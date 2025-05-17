
// src/components/recommendations/LearningSuggestions.tsx
'use client';

import { useState, useEffect } from 'react';
import { personalizedLearningSuggestions, PersonalizedLearningSuggestionsInput, PersonalizedLearningSuggestionsOutput } from '@/ai/flows/personalized-learning-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, BookOpen, Video, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for demonstration - In a real app, this would be fetched or derived
const mockStudentId = "student-123";
const mockPerformanceData = "Struggling with fractions in Math, but excelling in historical dates for History. Average in English grammar.";
const mockAvailableLessons = "Math: Fractions Part 1, Fractions Part 2, Decimals. History: Ancient Rome, World War II. English: Advanced Verbs, Noun Clauses.";
const mockAvailableVideos = "Math: Visualizing Fractions. History: Fall of Rome Documentary. English: Grammar Mistakes to Avoid.";
const mockAvailableQuizzes = "Math: Fractions Quiz. History: Roman Empire Quiz. English: Verb Tense Quiz.";

export default function LearningSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PersonalizedLearningSuggestionsOutput | null>(null);
  const [studentId, setStudentId] = useState(mockStudentId); // Could be dynamic

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    // Keep existing suggestions while new ones are loading, or clear them:
    // setSuggestions(null); 

    const input: PersonalizedLearningSuggestionsInput = {
      studentId,
      performanceData: mockPerformanceData, // Replace with actual dynamic data
      availableLessons: mockAvailableLessons, // Replace with actual dynamic data
      availableVideos: mockAvailableVideos, // Replace with actual dynamic data
      availableQuizzes: mockAvailableQuizzes, // Replace with actual dynamic data
    };

    try {
      const result = await personalizedLearningSuggestions(input);
      setSuggestions(result);
    } catch (err) {
      console.error("Error fetching learning suggestions:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-poppins flex items-center">
          <Lightbulb className="mr-3 text-primary" size={30} />
          Personalized Learning Suggestions
        </CardTitle>
        <CardDescription>AI-powered recommendations to help you focus on areas for improvement and leverage your strengths.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={fetchSuggestions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
              </>
            ) : (
              "Refresh Suggestions"
            )}
          </Button>
        </div>

        {isLoading && !suggestions && (
          <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error Fetching Suggestions</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions && ( // Display suggestions even if isLoading is true for a refresh
          <div className="space-y-6">
            <Alert className="bg-secondary border-primary/50">
              <Lightbulb className="h-5 w-5 text-primary" />
              <AlertTitle className="font-semibold text-primary">AI Reasoning</AlertTitle>
              <AlertDescription className="text-sm text-secondary-foreground">
                {suggestions.reasoning}
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                <BookOpen className="mr-2 h-5 w-5" /> Suggested Lessons
              </h3>
              {suggestions.suggestedLessons ? (
                <ul className="list-disc list-inside pl-5 space-y-1 text-sm text-muted-foreground bg-background p-4 rounded-md shadow">
                  {suggestions.suggestedLessons.split(',').map(lesson => lesson.trim()).filter(Boolean).map((lesson, index) => (
                    <li key={`lesson-${index}`}>{lesson}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No specific lesson suggestions at this time.</p>}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                <Video className="mr-2 h-5 w-5" /> Suggested Videos
              </h3>
              {suggestions.suggestedVideos ? (
                <ul className="list-disc list-inside pl-5 space-y-1 text-sm text-muted-foreground bg-background p-4 rounded-md shadow">
                   {suggestions.suggestedVideos.split(',').map(video => video.trim()).filter(Boolean).map((video, index) => (
                    <li key={`video-${index}`}>{video}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No specific video suggestions at this time.</p>}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
                <HelpCircle className="mr-2 h-5 w-5" /> Suggested Quizzes
              </h3>
              {suggestions.suggestedQuizzes ? (
                <ul className="list-disc list-inside pl-5 space-y-1 text-sm text-muted-foreground bg-background p-4 rounded-md shadow">
                  {suggestions.suggestedQuizzes.split(',').map(quiz => quiz.trim()).filter(Boolean).map((quiz, index) => (
                    <li key={`quiz-${index}`}>{quiz}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No specific quiz suggestions at this time.</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
