
// src/components/recommendations/LearningSuggestions.tsx
'use client';

import { useState, useEffect } from 'react';
import { personalizedLearningSuggestions, PersonalizedLearningSuggestionsInput, PersonalizedLearningSuggestionsOutput } from '@/ai/flows/personalized-learning-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, BookOpen, Video, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext'; // To get student ID and data
import { api } from '@/lib/api'; // To fetch lessons, videos, quizzes if needed
import type { LessonSummary, Quiz } from '@/interfaces'; // Assuming these interfaces exist

export default function LearningSuggestions() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PersonalizedLearningSuggestionsOutput | null>(null);
  
  // States for dynamic data needed by the AI flow
  const [performanceData, setPerformanceData] = useState<string>("");
  const [availableLessons, setAvailableLessons] = useState<string>("");
  const [availableVideos, setAvailableVideos] = useState<string>("");
  const [availableQuizzes, setAvailableQuizzes] = useState<string>("");
  const [isInputDataLoading, setIsInputDataLoading] = useState(true);


  useEffect(() => {
    const fetchInputData = async () => {
      if (!currentUser || !currentUser.student_profile) {
        setIsInputDataLoading(false);
        setError("Student data not available to generate suggestions.");
        return;
      }
      setIsInputDataLoading(true);
      try {
        // --- Fetch Performance Data (Example: Last few quiz scores) ---
        // TODO: Replace with actual API calls to get student performance data
        // const quizAttempts = await api.get(`/quizattempts/?user=${currentUser.id}&ordering=-completed_at&page_size=3`);
        // const performanceSummary = quizAttempts.map(qa => `${qa.quiz_title}: ${qa.score}%`).join(', ') || "No recent quiz data.";
        // setPerformanceData(performanceSummary);
        setPerformanceData("Mock: Struggling with fractions, good at history dates."); // Placeholder

        // --- Fetch Available Learning Materials ---
        // TODO: Fetch actual lists of lessons, videos, quizzes relevant to the student (e.g., their enrolled class/subjects)
        // const lessonsData = await api.get<LessonSummary[]>(`/lessons/?subject__class_obj=${currentUser.student_profile.enrolled_class}`);
        // setAvailableLessons(lessonsData.map(l => l.title).join(', ') || "No lessons found.");
        setAvailableLessons("Math: Fractions Part 1, Decimals. History: Ancient Rome."); // Placeholder

        // setAvailableVideos("Math: Visualizing Fractions. History: Fall of Rome Doc."); // Placeholder
        // setAvailableQuizzes("Math: Fractions Quiz. History: Roman Empire Quiz."); // Placeholder

        // For videos and quizzes, if not directly linked to lessons, fetch them separately
        // For simplicity, using placeholders for videos and quizzes now.
        setAvailableVideos("Video: Fractions Explained, Video: Intro to Algebra");
        setAvailableQuizzes("Quiz: Basic Algebra, Quiz: Fractions Advanced");

      } catch (err) {
        console.error("Error fetching input data for AI suggestions:", err);
        setError("Could not load necessary data for suggestions.");
      } finally {
        setIsInputDataLoading(false);
      }
    };

    if (currentUser) {
      fetchInputData();
    } else {
      setIsInputDataLoading(false); // Not logged in, no data to fetch
    }
  }, [currentUser]);

  const fetchSuggestions = async () => {
    if (!currentUser || isInputDataLoading || !performanceData || !availableLessons) {
        setError("Cannot fetch suggestions: prerequisite data missing or still loading.");
        return;
    }
    setIsLoading(true);
    setError(null);
    
    const input: PersonalizedLearningSuggestionsInput = {
      studentId: String(currentUser.id),
      performanceData,
      availableLessons,
      availableVideos,
      availableQuizzes,
    };

    try {
      const result = await personalizedLearningSuggestions(input);
      setSuggestions(result);
    } catch (err) {
      console.error("Error fetching learning suggestions:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching suggestions.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Automatically fetch suggestions once input data is loaded
  useEffect(() => {
      if(!isInputDataLoading && performanceData && availableLessons && !suggestions && !isLoading) {
          fetchSuggestions();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInputDataLoading, performanceData, availableLessons]);

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
          <Button onClick={fetchSuggestions} disabled={isLoading || isInputDataLoading}>
            {(isLoading || isInputDataLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isInputDataLoading ? 'Preparing...' : 'Refreshing...'}
              </>
            ) : (
              "Refresh Suggestions"
            )}
          </Button>
        </div>

        {(isLoading || isInputDataLoading) && !suggestions && (
          <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions && (
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
