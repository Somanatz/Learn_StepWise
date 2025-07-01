// src/app/student/learn/class/[classId]/subject/[subjectId]/lesson/[lessonId]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lesson as LessonInterface, Question as QuestionInterface, Choice as ChoiceInterface, Quiz as QuizInterface, LessonSummary, UserLessonProgress } from '@/interfaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, PlayCircle, Lightbulb, CheckCircle2, AlertTriangle, Send, Loader2, BookOpen, Maximize2, Minimize2, Bookmark } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { FormItem, FormControl } from '@/components/ui/form';
import { Textarea } from "@/components/ui/textarea"; 
import Link from 'next/link';

interface QuizAttemptPayload {
  answers: { question_id: string | number; choice_id: string | number }[];
}

interface QuizSubmissionResult {
  id: number;
  score: number;
  passed: boolean;
  quiz_title: string;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const lessonId = params.lessonId as string;
  const subjectId = params.subjectId as string;
  const classId = params.classId as string;

  const [lesson, setLesson] = useState<LessonInterface | null>(null);
  const [subjectLessons, setSubjectLessons] = useState<LessonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, string | number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [showSimplified, setShowSimplified] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  useEffect(() => {
    if (!lessonId || !subjectId || !currentUser) return;
    setIsLoading(true);
    setError(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setShowSimplified(false);

    const fetchLessonData = async () => {
      try {
        const [lessonData, allLessonsData, progressData] = await Promise.all([
          api.get<LessonInterface>(`/lessons/${lessonId}/`),
          api.get<LessonSummary[] | {results: LessonSummary[]}>(`/lessons/?subject=${subjectId}`),
          api.get<UserLessonProgress[] | {results: UserLessonProgress[]}>(`/userprogress/?user=${currentUser.id}&lesson=${lessonId}`)
        ]);

        setLesson(lessonData);
        const lessonsList = Array.isArray(allLessonsData) ? allLessonsData : allLessonsData.results || [];
        setSubjectLessons(lessonsList.sort((a,b) => (a.lesson_order || 0) - (b.lesson_order || 0)));

        const currentProgress = Array.isArray(progressData) ? progressData[0] : (progressData.results || [])[0];
        if (currentProgress) {
          setIsCompleted(currentProgress.completed);
        }

      } catch (err) {
        console.error("Failed to fetch lesson data:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessonData();
  }, [lessonId, subjectId, currentUser]);

  // Scroll progress effect
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      if (scrollHeight <= clientHeight) {
        setProgress(100);
        return;
      }
      const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };
    contentElement.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, [lesson]);

  const handleAnswerChange = (questionId: string | number, choiceId: string | number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  };

  const handleMarkAsComplete = async () => {
      if (!currentUser || isCompleted) return;
      setIsMarkingComplete(true);
      try {
        await api.post(`/userprogress/`, { lesson_id: lessonId, completed: true });
        toast({
          title: "Lesson Complete!",
          description: "Great work! Your progress has been saved.",
        });
        setIsCompleted(true);
      } catch (err: any) {
        toast({
          title: "Error Saving Progress",
          description: err.message || "Could not mark lesson as complete.",
          variant: "destructive",
        });
      } finally {
        setIsMarkingComplete(false);
      }
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
        description: `You scored ${result.score.toFixed(0)}%. ${result.passed ? "Congratulations, you passed!" : "You didn't pass this time. Review the lesson and try again."}`,
        variant: result.passed ? "default" : "destructive",
      });
      if (result.passed) {
        handleMarkAsComplete(); // Mark lesson as complete if quiz is passed
      } else if (lesson.simplified_content) {
        setShowSimplified(true);
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
  
  const currentLessonIndex = subjectLessons.findIndex(l => String(l.id) === lessonId);
  const previousLesson = currentLessonIndex > 0 ? subjectLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < subjectLessons.length - 1 ? subjectLessons[currentLessonIndex + 1] : null;

  return (
    <div className={`space-y-8 ${isFullScreen ? 'fixed inset-0 bg-background z-50 overflow-y-auto p-4 md:p-8' : ''}`}>
      <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push(`/student/learn/class/${classId}/subject/${subjectId}`)} className="mb-2">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Subject
          </Button>
      </div>

      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold flex items-center">
                        <PlayCircle className="mr-3 h-7 w-7 md:h-8 md:w-8" /> {lesson.title}
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80 mt-1">
                        Subject: {lesson.subject_name || 'N/A'}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {lesson.simplified_content && (
                      <Button variant="secondary" onClick={() => setShowSimplified(!showSimplified)} className="mt-2 sm:mt-0">
                          <Lightbulb className="mr-2 h-4 w-4" /> {showSimplified ? "Show Original" : "Show Simplified"}
                      </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={toggleFullScreen} title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                      {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            <div className="relative">
                <Progress value={progress} className="absolute top-0 left-0 w-full h-1.5 z-10" />
                <div id="lesson-content-area" ref={contentRef} className={`prose prose-lg max-w-none dark:prose-invert overflow-y-auto ${isFullScreen ? 'h-[calc(100vh-220px)]' : 'max-h-[60vh]' } p-4 md:p-6 rounded-md border bg-muted/30`}>
                  <div dangerouslySetInnerHTML={{ __html: displayContent || '<p>No content available.</p>' }} />
                  {lesson.video_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Video:</h4><video src={lesson.video_url} controls className="w-full rounded-md shadow-lg aspect-video"></video></div>}
                  {lesson.audio_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Audio:</h4><audio src={lesson.audio_url} controls className="w-full"></audio></div>}
                  {lesson.image_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Image:</h4><img src={lesson.image_url} alt={lesson.title || "Lesson image"} className="max-w-full h-auto rounded-md shadow-lg" data-ai-hint="lesson image"/></div>}
                </div>
            </div>
          
          {lesson.quiz && !quizResult?.passed && (
            <>
            <Separator className="my-8" />
            <Card className="bg-secondary/70 border-primary/30 rounded-xl shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-xl md:text-2xl text-primary flex items-center"><BookOpen className="mr-2"/>{lesson.quiz.title}</CardTitle>
                <CardDescription className="text-foreground/80">{lesson.quiz.description || "Test your understanding of this lesson."} (Pass Mark: {lesson.quiz.pass_mark_percentage || 70}%)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {lesson.quiz.questions.length > 0 ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(); }} className="space-y-6">
                    {lesson.quiz.questions.map((q, qIndex) => (
                      <fieldset key={q.id} className="p-4 border rounded-lg bg-background shadow-sm">
                        <legend className="font-semibold mb-3 text-md">Question {qIndex + 1}: {q.text}</legend>
                        <RadioGroup 
                            onValueChange={(value) => handleAnswerChange(q.id, value)} 
                            value={String(selectedAnswers[q.id] || '')}
                            className="space-y-3"
                        >
                          {q.choices.map((choice) => (
                            <FormItem key={choice.id} className="flex items-center space-x-3 space-y-0 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                              <FormControl><RadioGroupItem value={String(choice.id)} id={`q${q.id}-c${choice.id}`} /></FormControl>
                              <Label htmlFor={`q${q.id}-c${choice.id}`} className="font-normal cursor-pointer flex-1 text-sm">{choice.text}</Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </fieldset>
                    ))}
                    <Button type="submit" disabled={isSubmittingQuiz || Object.keys(selectedAnswers).length < lesson.quiz.questions.length} className="w-full sm:w-auto py-3 px-6 text-base">
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
            <Alert variant={quizResult.passed ? "default" : "destructive"} className="mt-6 rounded-lg shadow-md">
              <AlertTitle className="font-bold text-lg">{quizResult.passed ? "Passed!" : "Failed"}</AlertTitle>
              <AlertDescription>
                You scored {quizResult.score.toFixed(0)}% on "{quizResult.quiz_title}".
                {!quizResult.passed && lesson.simplified_content && " Please review the simplified content or the original lesson and try the quiz again if needed."}
                {quizResult.passed && " You can now proceed to the next lesson!"}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="p-6 md:p-8 flex justify-between items-center border-t bg-muted/50">
          <Button variant="outline" asChild disabled={!previousLesson}>
              <Link href={previousLesson ? `/student/learn/class/${classId}/subject/${subjectId}/lesson/${previousLesson.id}` : '#'}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
              </Link>
          </Button>
          
          {isCompleted ? (
              <Button variant="secondary" disabled className="text-green-600 dark:text-green-400">
                  <CheckCircle2 className="mr-2 h-4 w-4"/> Completed
              </Button>
          ) : (
              <Button onClick={handleMarkAsComplete} disabled={isMarkingComplete} size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white">
                  {isMarkingComplete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   Mark as Complete
              </Button>
          )}

          <Button variant="default" asChild disabled={!nextLesson || nextLesson.is_locked}>
              <Link href={nextLesson ? `/student/learn/class/${classId}/subject/${subjectId}/lesson/${nextLesson.id}` : '#'}>
                  Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
