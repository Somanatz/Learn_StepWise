// src/app/student/learn/class/[classId]/subject/[subjectId]/lesson/[lessonId]/page.tsx
'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { api } from '@/lib/api';
import type { Lesson as LessonInterface, Question as QuestionInterface, Choice as ChoiceInterface, Quiz as QuizInterface, LessonSummary, UserLessonProgress, AILessonQuizAttempt as AILessonQuizAttemptInterface, UserNote } from '@/interfaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, PlayCircle, Lightbulb, CheckCircle2, AlertTriangle, Send, Loader2, BookOpen, Maximize2, Minimize2, Bookmark, HelpCircle, Download, FilePenLine, Languages } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { Form, FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import Link from 'next/link';
import { generateLessonQuiz } from '@/ai/flows/lesson-quiz-flow';
import type { QuizQuestion } from '@/ai/flows/lesson-quiz-types';
import { summarizeLesson } from '@/ai/flows/summarize-lesson-flow';
import { translateContent } from '@/ai/flows/translate-content-flow';

const PASSING_SCORE = 75;
const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
];

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
  const [showSimplified, setShowSimplified] = useState(false);
  
  const [isCompleted, setIsCompleted] = useState(false);
  
  // AI Quiz State
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [hasPassedQuiz, setHasPassedQuiz] = useState(false);

  // Notes, Summary, Translation State
  const [userNote, setUserNote] = useState<UserNote | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('es');


  const fetchLessonData = useCallback(async () => {
    if (!lessonId || !subjectId || !currentUser) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const [lessonData, allLessonsData, progressData, quizAttemptsData, userNoteData] = await Promise.all([
        api.get<LessonInterface>(`/lessons/${lessonId}/`),
        api.get<LessonSummary[] | {results: LessonSummary[]}>(`/lessons/?subject=${subjectId}`),
        api.get<UserLessonProgress[] | {results: UserLessonProgress[]}>(`/userprogress/?user=${currentUser.id}&lesson=${lessonId}`),
        api.get<AILessonQuizAttemptInterface[]>(`/ai-quiz-attempts/?user=${currentUser.id}&lesson=${lessonId}&passed=true`),
        api.get<UserNote[]>(`/usernotes/?user=${currentUser.id}&lesson=${lessonId}`),
      ]);

      setLesson(lessonData);
      const lessonsList = Array.isArray(allLessonsData) ? allLessonsData : allLessonsData.results || [];
      setSubjectLessons(lessonsList.sort((a,b) => (a.lesson_order || 0) - (b.lesson_order || 0)));

      const currentProgress = Array.isArray(progressData) ? progressData[0] : (progressData.results || [])[0];
      if (currentProgress) {
        setIsCompleted(currentProgress.completed);
      } else {
        setIsCompleted(false);
      }
      
      const passedAttempts = Array.isArray(quizAttemptsData) ? quizAttemptsData : quizAttemptsData.results || [];
      setHasPassedQuiz(passedAttempts.length > 0);
      
      const note = Array.isArray(userNoteData) ? userNoteData[0] : (userNoteData.results || [])[0];
      setUserNote(note || null);

    } catch (err) {
      console.error("Failed to fetch lesson data:", err);
      setError(err instanceof Error ? err.message : "Failed to load lesson data.");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, subjectId, currentUser]);


  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);


  const currentLessonIndex = useMemo(() => subjectLessons.findIndex(l => String(l.id) === lessonId), [subjectLessons, lessonId]);
  const previousLesson = useMemo(() => currentLessonIndex > 0 ? subjectLessons[currentLessonIndex - 1] : null, [subjectLessons, currentLessonIndex]);
  const nextLesson = useMemo(() => currentLessonIndex > -1 && currentLessonIndex < subjectLessons.length - 1 ? subjectLessons[currentLessonIndex + 1] : null, [subjectLessons, currentLessonIndex]);
  
  const handleStartQuiz = async () => {
    if (!lesson?.content || hasPassedQuiz) return;
    setIsQuizDialogOpen(true);
    setIsLoadingQuiz(true);
    setQuizError(null);
    setQuizResult(null);
    setUserAnswers({});
    setCooldownMessage(null);
    
    try {
        const previousAttempts = await api.get<AILessonQuizAttemptInterface[]>(`/ai-quiz-attempts/?user=${currentUser?.id}&lesson=${lessonId}&ordering=-attempted_at`);
        const latestAttempt = Array.isArray(previousAttempts) ? previousAttempts[0] : (previousAttempts as any).results[0];
        if (latestAttempt && latestAttempt.can_reattempt_at) {
            const now = new Date();
            const reattemptTime = new Date(latestAttempt.can_reattempt_at);
            if (now < reattemptTime) {
                setCooldownMessage(`You must wait until ${reattemptTime.toLocaleString()} to try again.`);
                setIsLoadingQuiz(false);
                return;
            }
        }
    } catch (err) { /* Ignore if no attempts found */ }

    try {
      const quizData = await generateLessonQuiz({ lessonContent: lesson.content });
      setQuizQuestions(quizData.questions || []);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Failed to generate quiz questions.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };
  
  const handleQuizAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentUser) return;
    setIsSubmittingQuiz(true);
    setQuizError(null);
    
    let correctAnswers = 0;
    quizQuestions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      if (q.question_type === 'true_false' || q.question_type === 'multiple_choice') {
        if (userAnswer === q.correct_answer) correctAnswers++;
      } else if (q.question_type === 'fill_in_the_blank') {
        if (userAnswer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correctAnswers++;
      }
    });

    const score = (correctAnswers / quizQuestions.length) * 100;
    const passed = score >= PASSING_SCORE;
    setQuizResult({ score, passed });

    const quizDataPayload = { questions: quizQuestions.map((q, i) => ({ ...q, user_answer: userAnswers[i] || "" })) };
    
    try {
        await api.post('/ai-quiz-attempts/', { lesson: lessonId, score: score, passed: passed, quiz_data: quizDataPayload });
        if (passed) {
            await handleMarkAsComplete(true);
            setHasPassedQuiz(true);
            // Manually unlock the next lesson in the local state for immediate UI feedback.
            if (nextLesson) {
                setSubjectLessons(prevLessons => {
                    return prevLessons.map(l => {
                        if (l.id === nextLesson.id) {
                            return { ...l, is_locked: false };
                        }
                        return l;
                    });
                });
            }
        }
    } catch (err: any) {
        toast({ title: "Error Saving Quiz Result", description: err.message, variant: "destructive" });
    } finally {
        setIsSubmittingQuiz(false);
    }
  };

  const handleMarkAsComplete = async (isFromQuiz: boolean = false) => {
      if (!currentUser || isCompleted) return Promise.resolve();
      try {
        await api.post(`/userprogress/`, { lesson_id: lessonId, completed: true });
        if (!isFromQuiz) { toast({ title: "Lesson Complete!", description: "Great work! Your progress has been saved." }); }
        setIsCompleted(true);
        await fetchLessonData();
      } catch (err: any) {
        toast({ title: "Error Saving Progress", description: err.message || "Could not mark lesson as complete.", variant: "destructive" });
      }
  };

  const handleSaveNote = async () => {
    if (!currentUser || !lesson) return;
    setIsSavingNote(true);
    const payload = { lesson: lesson.id, notes: userNote?.notes || "" };
    try {
        let updatedNote: UserNote;
        if(userNote?.id) {
            updatedNote = await api.patch(`/usernotes/${userNote.id}/`, payload);
        } else {
            updatedNote = await api.post(`/usernotes/`, payload);
        }
        setUserNote(updatedNote);
        toast({ title: "Note Saved!", description: "Your personal notes have been saved." });
    } catch(err: any) {
        toast({ title: "Error Saving Note", description: err.message, variant: "destructive" });
    } finally {
        setIsSavingNote(false);
    }
  }
  
  const handleGenerateSummary = async () => {
    if(!lesson?.content) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
        const result = await summarizeLesson({ lessonContent: lesson.content });
        setAiSummary(result.summary);
    } catch(err:any) {
        toast({title: "Error Generating Summary", description: err.message, variant: "destructive"});
    } finally {
        setIsSummarizing(false);
    }
  }
  
  const handleTranslate = async () => {
    if(!lesson?.content) return;
    setIsTranslating(true);
    setTranslatedContent(null);
    try {
        const result = await translateContent({ content: lesson.content, targetLanguage });
        setTranslatedContent(result.translatedContent);
    } catch(err:any) {
        toast({title: "Error Translating", description: err.message, variant: "destructive"});
    } finally {
        setIsTranslating(false);
    }
  }
  
  if (isLoading) return <div className="space-y-6 p-4"><Skeleton className="h-10 w-1/4" /><Skeleton className="h-16 w-3/4" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (error) return <Card className="text-center py-10 bg-destructive/10 border-destructive"><CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><CardTitle>Error Loading Lesson</CardTitle></CardHeader><CardContent><CardDescription className="text-destructive-foreground">{error}</CardDescription><Button variant="outline" onClick={() => router.back()} className="mt-4"><ChevronLeft className="mr-2 h-4 w-4"/> Go Back</Button></CardContent></Card>;
  if (!lesson) return <p>Lesson not found.</p>;

  const displayContent = showSimplified && lesson.simplified_content ? lesson.simplified_content : lesson.content;

  const renderFooterButton = () => {
    if (isCompleted) return <Button variant="secondary" disabled className="text-green-600 dark:text-green-400"><CheckCircle2 className="mr-2 h-4 w-4"/> Completed</Button>;
    if (nextLesson && !hasPassedQuiz) return <Button onClick={handleStartQuiz} size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"><HelpCircle className="mr-2 h-4 w-4" /> Take Quiz to Unlock Next Lesson</Button>;
    return <Button onClick={() => handleMarkAsComplete(false)} size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"><CheckCircle2 className="mr-2 h-4 w-4" />Mark as Complete</Button>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
          <Button variant="outline" asChild><Link href={`/student/learn/class/${classId}/subject/${subjectId}`}><ChevronLeft className="mr-2 h-4 w-4" /> Back to Subject</Link></Button>
      </div>
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6 md:p-8"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><CardTitle className="text-2xl md:text-3xl font-bold flex items-center"><PlayCircle className="mr-3 h-7 w-7 md:h-8 md:w-8" /> {lesson.title}</CardTitle><CardDescription className="text-primary-foreground/80 mt-1">Subject: {lesson.subject_name || 'N/A'}</CardDescription></div><div className="flex items-center gap-1">{lesson.simplified_content && (<Button variant="secondary" onClick={() => setShowSimplified(!showSimplified)} className="mt-2 sm:mt-0"><Lightbulb className="mr-2 h-4 w-4" /> {showSimplified ? "Show Original" : "Show Simplified"}</Button>)}</div></div></CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
            <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="content"><BookOpen className="mr-2 h-4 w-4"/>Lesson</TabsTrigger><TabsTrigger value="notes"><FilePenLine className="mr-2 h-4 w-4"/>My Notes</TabsTrigger><TabsTrigger value="summary"><Lightbulb className="mr-2 h-4 w-4"/>AI Summary</TabsTrigger><TabsTrigger value="translate"><Languages className="mr-2 h-4 w-4"/>Translate</TabsTrigger></TabsList>
                <TabsContent value="content" className="mt-4"><div id="lesson-content-area" ref={contentRef} className="prose prose-lg max-w-none dark:prose-invert overflow-y-auto max-h-[60vh] p-4 md:p-6 rounded-md border bg-muted/30"><div dangerouslySetInnerHTML={{ __html: displayContent || '<p>No content available.</p>' }} />{lesson.video_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Video:</h4><video src={lesson.video_url} controls className="w-full rounded-md shadow-lg aspect-video"></video></div>}{lesson.audio_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Audio:</h4><audio src={lesson.audio_url} controls className="w-full"></audio></div>}{lesson.image_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Image:</h4><img src={lesson.image_url} alt={lesson.title || "Lesson image"} className="max-w-full h-auto rounded-md shadow-lg" data-ai-hint="lesson image"/></div>}</div></TabsContent>
                <TabsContent value="notes" className="mt-4"><Textarea placeholder="Write your notes here..." className="min-h-[300px] text-base" value={userNote?.notes || ''} onChange={(e) => setUserNote(prev => ({...(prev || {lesson: lessonId, user: currentUser?.id}), notes: e.target.value}))} /><Button onClick={handleSaveNote} disabled={isSavingNote} className="mt-2">{isSavingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Notes</Button></TabsContent>
                <TabsContent value="summary" className="mt-4 space-y-4"><Button onClick={handleGenerateSummary} disabled={isSummarizing}>{isSummarizing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Generate AI Summary</Button>{aiSummary && <div className="p-4 border rounded-md bg-background prose dark:prose-invert max-w-none"><div dangerouslySetInnerHTML={{__html: aiSummary}}/><Button variant="outline" size="sm" className="mt-4" onClick={() => alert("Download TBI")}><Download className="mr-2 h-4"/>Download</Button></div>}</TabsContent>
                <TabsContent value="translate" className="mt-4 space-y-4"><div className="flex gap-2 items-center"><Select value={targetLanguage} onValueChange={setTargetLanguage}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Language"/></SelectTrigger><SelectContent>{SUPPORTED_LANGUAGES.map(lang => <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>)}</SelectContent></Select><Button onClick={handleTranslate} disabled={isTranslating}>{isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Translate Lesson</Button></div>{translatedContent && <div className="p-4 border rounded-md bg-background prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html: translatedContent}}/>}</TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="p-6 md:p-8 flex justify-between items-center border-t bg-muted/50">
            <Button 
                variant="outline" 
                disabled={!previousLesson}
                onClick={() => {
                    if (previousLesson) {
                        router.push(`/student/learn/class/${classId}/subject/${subjectId}/lesson/${previousLesson.id}`);
                    }
                }}
            >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
            </Button>
            
            {renderFooterButton()}

            <Button 
                variant="default" 
                disabled={!nextLesson || nextLesson.is_locked}
                onClick={() => {
                    if (nextLesson && !nextLesson.is_locked) {
                        router.push(`/student/learn/class/${classId}/subject/${subjectId}/lesson/${nextLesson.id}`);
                    }
                }}
            >
                Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      </Card>

      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="text-2xl">Quiz for: {lesson.title}</DialogTitle><DialogDescription>You must score at least {PASSING_SCORE}% to unlock the next lesson.</DialogDescription></DialogHeader><div className="py-4 max-h-[60vh] overflow-y-auto">{isLoadingQuiz && <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}{quizError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}{cooldownMessage && <Alert variant="destructive"><AlertTitle>Attempt Cooldown</AlertTitle><AlertDescription>{cooldownMessage}</AlertDescription></Alert>}{!isLoadingQuiz && !quizError && !cooldownMessage && !quizResult && quizQuestions.length > 0 && (<div className="space-y-6">{quizQuestions.map((q, qIndex) => (<fieldset key={qIndex} className="p-4 border rounded-lg bg-background shadow-sm"><legend className="font-semibold mb-3 text-md">Question {qIndex + 1}: {q.question_text}</legend>{q.question_type === 'multiple_choice' && (<RadioGroup onValueChange={(value) => handleQuizAnswerChange(qIndex, value)} value={userAnswers[qIndex] || ''} className="space-y-2">{q.options?.map((option, oIndex) => (<div key={oIndex} className="flex items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"><RadioGroupItem value={option} id={`q${qIndex}-o${oIndex}`} /><Label htmlFor={`q${qIndex}-o${oIndex}`} className="font-normal cursor-pointer flex-1 text-sm">{option}</Label></div>))}</RadioGroup>)}{q.question_type === 'true_false' && (<RadioGroup onValueChange={(value) => handleQuizAnswerChange(qIndex, value)} value={userAnswers[qIndex] || ''} className="space-y-2"><div className="flex items-center space-x-3"><RadioGroupItem value="True" id={`q${qIndex}-true`} /><Label htmlFor={`q${qIndex}-true`} className="font-normal">True</Label></div><div className="flex items-center space-x-3"><RadioGroupItem value="False" id={`q${qIndex}-false`} /><Label htmlFor={`q${qIndex}-false`} className="font-normal">False</Label></div></RadioGroup>)}{q.question_type === 'fill_in_the_blank' && (<Input placeholder="Type your answer here..." value={userAnswers[qIndex] || ''} onChange={(e) => handleQuizAnswerChange(qIndex, e.target.value)} />)}</fieldset>))}</div>)}{quizResult && (<Alert variant={quizResult.passed ? "default" : "destructive"} className="mt-4 rounded-lg shadow-md"><AlertTitle className="font-bold text-lg">{quizResult.passed ? `Passed! Score: ${quizResult.score.toFixed(0)}%` : `Failed. Score: ${quizResult.score.toFixed(0)}%`}</AlertTitle><AlertDescription>{quizResult.passed ? "Congratulations! You have unlocked the next lesson." : "Please review the material and try again later. There is a 2-hour cooldown before your next attempt."}</AlertDescription></Alert>)}</div><DialogFooter><Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>Close</Button>{!quizResult && !cooldownMessage && (<Button onClick={handleSubmitQuiz} disabled={isSubmittingQuiz || Object.keys(userAnswers).length < quizQuestions.length}>{isSubmittingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit Quiz</Button>)}</DialogFooter></DialogContent></Dialog>
    </div>
  );
}
