
// src/app/student/learn/class/[classId]/subject/[subjectId]/lesson/[lessonId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lesson as LessonInterface, Question as QuestionInterface, Choice as ChoiceInterface, Quiz as QuizInterface } from '@/interfaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, PlayCircle, Lightbulb, CheckCircle2, AlertTriangle, Send, Loader2, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';

interface QuizAttemptPayload {
  answers: { question_id: string | number; choice_id: string | number }[];
}

interface QuizSubmissionResult {
  id: number;
  score: number;
  passed: boolean;
  quiz_title: string;
  // ... other fields from UserQuizAttemptSerializer
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const lessonId = params.lessonId as string;
  const subjectId = params.subjectId as string; // For navigation or fetching next lesson
  const classId = params.classId as string;

  const [lesson, setLesson] = useState<LessonInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, string | number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [showSimplified, setShowSimplified] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [progress, setProgress] = useState(0); // Lesson content scroll progress


  useEffect(() => {
    if (!lessonId) return;
    setIsLoading(true);
    setError(null);
    setQuizResult(null); // Reset quiz result when lesson changes
    setSelectedAnswers({});
    setShowSimplified(false);

    const fetchLessonDetails = async () => {
      try {
        const lessonData = await api.get<LessonInterface>(`/lessons/${lessonId}/`);
        setLesson(lessonData);
      } catch (err) {
        console.error("Failed to fetch lesson details:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessonDetails();
  }, [lessonId]);

  // Scroll progress
  useEffect(() => {
    const contentElement = document.getElementById('lesson-content-area');
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };
    contentElement.addEventListener('scroll', handleScroll);
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, [lesson]);


  const handleAnswerChange = (questionId: string | number, choiceId: string | number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmitQuiz = async () => {
    if (!lesson?.quiz || !currentUser) return;
    setIsSubmittingQuiz(true);
    setQuizResult(null);

    const payload: QuizAttemptPayload = {
      answers: Object.entries(selectedAnswers).map(([qId, cId]) => ({
        question_id: qId,
        choice_id: cId,
      })),
    };

    try {
      const result = await api.post<QuizSubmissionResult>(`/quizzes/${lesson.quiz.id}/submit_quiz/`, payload);
      setQuizResult(result);
      toast({
        title: `Quiz Submitted: ${result.quiz_title}`,
        description: `You scored ${result.score.toFixed(0)}%. ${result.passed ? "Congratulations, you passed!" : "You didn't pass this time. Try the simplified content or review the lesson."}`,
        variant: result.passed ? "default" : "destructive",
      });
      if (!result.passed && lesson.simplified_content) {
        setShowSimplified(true);
      }
      // Update lesson progress if quiz passed
      if (result.passed) {
          await api.post(`/userprogress/`, {lesson_id: lessonId, completed: true});
      }

    } catch (err: any) {
      toast({ title: "Quiz Submission Failed", description: err.message || "Could not submit quiz.", variant: "destructive" });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!isFullScreen) {
      if (elem.requestFullscreen) elem.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };
  
  // TODO: Fetch next/previous lesson for navigation
  // const navigateLesson = (direction: 'next' | 'prev') => { /* ... */ };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-1/4" /> 
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error) {
     return (
      <Card className="text-center py-10 bg-destructive/10 border-destructive">
        <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><CardTitle>Error Loading Lesson</CardTitle></CardHeader>
        <CardContent><CardDescription className="text-destructive-foreground">{error}</CardDescription>
        <Button variant="outline" onClick={() => router.back()} className="mt-4"><ChevronLeft className="mr-2 h-4 w-4"/> Go Back</Button>
        </CardContent>
      </Card>
    );
  }
  if (!lesson) return <p>Lesson not found.</p>;

  const displayContent = showSimplified && lesson.simplified_content ? lesson.simplified_content : lesson.content;

  return (
    <div className={`space-y-8 ${isFullScreen ? 'fixed inset-0 bg-background z-50 overflow-y-auto' : ''}`}>
        <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push(`/student/learn/class/${classId}/subject/${subjectId}`)} className="mb-2">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Subject
            </Button>
             <Button variant="ghost" size="icon" onClick={toggleFullScreen} title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
        </div>

      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-3xl font-bold flex items-center">
                        <PlayCircle className="mr-3 h-8 w-8" /> {lesson.title}
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80 mt-1">
                        Subject: {lesson.subject_name || 'N/A'}
                    </CardDescription>
                </div>
                {lesson.simplified_content && (
                    <Button variant="secondary" onClick={() => setShowSimplified(!showSimplified)}>
                        <Lightbulb className="mr-2 h-4 w-4" /> {showSimplified ? "Show Original" : "Show Simplified"}
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            <div className="relative">
                <Progress value={progress} className="absolute top-0 left-0 w-full h-1.5 z-10" />
                <div id="lesson-content-area" className={`prose prose-lg max-w-none dark:prose-invert overflow-y-auto ${isFullScreen ? 'h-[calc(100vh-200px)]' : 'max-h-[60vh]' } p-1 rounded-md border bg-muted/20`}>
                  {/* Assuming content might be HTML, otherwise use <p> or Markdown renderer */}
                  <div dangerouslySetInnerHTML={{ __html: displayContent || '<p>No content available.</p>' }} />
                  {lesson.video_url && <div className="mt-4"><h4 className="font-semibold mb-2">Video:</h4><video src={lesson.video_url} controls className="w-full rounded-md shadow"></video></div>}
                  {lesson.audio_url && <div className="mt-4"><h4 className="font-semibold mb-2">Audio:</h4><audio src={lesson.audio_url} controls className="w-full"></audio></div>}
                  {lesson.image_url && <div className="mt-4"><h4 className="font-semibold mb-2">Image:</h4><img src={lesson.image_url} alt="Lesson image" className="max-w-full h-auto rounded-md shadow" data-ai-hint="lesson image"/></div>}
                </div>
            </div>
          
          {lesson.quiz && !quizResult?.passed && ( // Show quiz if it exists and not passed yet
            <>
            <Separator className="my-8" />
            <Card className="bg-secondary/50 border-primary/30">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center"><HelpCircle className="mr-2"/>{lesson.quiz.title}</CardTitle>
                <CardDescription>{lesson.quiz.description || "Test your understanding of this lesson."} (Pass Mark: {lesson.quiz.pass_mark_percentage || 70}%)</CardDescription>
              </CardHeader>
              <CardContent>
                {lesson.quiz.questions.length > 0 ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(); }} className="space-y-6">
                    {lesson.quiz.questions.map((q, qIndex) => (
                      <fieldset key={q.id} className="p-4 border rounded-md bg-background shadow-sm">
                        <legend className="font-semibold mb-2 text-md">Question {qIndex + 1}: {q.text}</legend>
                        <RadioGroup 
                            onValueChange={(value) => handleAnswerChange(q.id, value)} 
                            value={String(selectedAnswers[q.id] || '')}
                            className="space-y-2"
                        >
                          {q.choices.map((choice) => (
                            <FormItem key={choice.id} className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value={String(choice.id)} id={`q${q.id}-c${choice.id}`} /></FormControl>
                              <Label htmlFor={`q${q.id}-c${choice.id}`} className="font-normal cursor-pointer flex-1">{choice.text}</Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </fieldset>
                    ))}
                    <Button type="submit" disabled={isSubmittingQuiz || Object.keys(selectedAnswers).length < lesson.quiz.questions.length} className="w-full sm:w-auto">
                      {isSubmittingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Submit Quiz
                    </Button>
                  </form>
                ) : <p className="text-muted-foreground">This quiz currently has no questions.</p>}
              </CardContent>
            </Card>
            </>
          )}

          {quizResult && (
            <Alert variant={quizResult.passed ? "default" : "destructive"} className="mt-6">
              <AlertTitle className="font-bold text-lg">Quiz Result: {quizResult.passed ? "Passed!" : "Failed"}</AlertTitle>
              <AlertDescription>
                You scored {quizResult.score.toFixed(0)}% on "{quizResult.quiz_title}".
                {!quizResult.passed && lesson.simplified_content && " Please review the simplified content or the original lesson and try the quiz again if needed."}
                {quizResult.passed && " You can now proceed to the next lesson!"}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="p-6 flex justify-between items-center border-t">
          {/* Placeholder for Prev/Next Lesson buttons */}
          <Button variant="outline" disabled>Previous Lesson</Button>
          <Button variant="default" onClick={async () => { 
              // Mark lesson as complete if not already done by quiz
              if (!quizResult?.passed) { // Or if no quiz, mark complete on clicking next
                  try {
                     await api.post(`/userprogress/`, {lesson_id: lessonId, completed: true});
                     toast({title: "Progress Saved", description: "Lesson marked as viewed."});
                  } catch (e) { console.error("Failed to save progress", e); }
              }
              // Navigate to next lesson (implement this logic)
              alert("Next Lesson functionality to be implemented.");
           }}>
            Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5"/> AI Note Taker</CardTitle>
            <CardDescription>Enter your notes about this lesson. Our AI will help summarize them later.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* TODO: Note taking component that calls /api/ai/notes/ */}
            <Textarea placeholder="Start typing your notes here..." rows={5} className="mb-2"/>
            <Button onClick={() => alert("Save notes - TBI")}>Save Notes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
