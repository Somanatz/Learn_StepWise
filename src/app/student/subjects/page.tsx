
// src/app/student/subjects/page.tsx

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, PlusCircle, Trash2, HelpCircle, ChevronLeft, Search, UserCircle, Bell, Maximize2, Minimize2, Bookmark, Download, Link as LinkIcon, Star, Tv, Sun, Moon } from 'lucide-react';
import type { Subject as SubjectInterface, Class as ClassInterface, School, Lesson as LessonInterface, UserLessonProgress, LessonSummary } from '@/interfaces';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';

export default function StudentMySubjectsPage() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [allSubjects, setAllSubjects] = useState<SubjectInterface[]>([]);
    const [allClasses, setAllClasses] = useState<ClassInterface[]>([]);
    const [lessonsForSelectedSubject, setLessonsForSelectedSubject] = useState<LessonInterface[]>([]);
    const [lessonProgressMap, setLessonProgressMap] = useState<Map<string | number, UserLessonProgress>>(new Map());

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | number | null>(null);
    const [activeLessonDetails, setActiveLessonDetails] = useState<LessonInterface | null>(null);

    const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);
    const [isLoadingLessonContent, setIsLoadingLessonContent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isFullScreen, setIsFullScreen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (!currentUser) return;
        setIsLoadingSubjects(true);
        const schoolId = currentUser.student_profile?.school;
        if (!schoolId) {
            setError("No school assigned to student profile.");
            setIsLoadingSubjects(false);
            return;
        }
        
        api.get<ClassInterface[] | {results: ClassInterface[]}>(`/classes/?school=${schoolId}&page_size=100`)
            .then(res => {
                const classes = Array.isArray(res) ? res : res.results || [];
                setAllClasses(classes);
                const subjects = classes.flatMap(c => 
                    (c.subjects || []).map(s => ({...s, class_obj_name: c.name}))
                );
                setAllSubjects(subjects);
            })
            .catch(err => setError("Failed to load classes and subjects."))
            .finally(() => setIsLoadingSubjects(false));
    }, [currentUser]);

    const handleLoadLessons = useCallback(() => {
        if (!selectedSubjectId || !currentUser) return;
        
        setActiveLessonId(null);
        setActiveLessonDetails(null);
        setIsLoadingLessons(true);

        const fetchLessonsAndProgress = async () => {
            try {
                const lessonsRes = await api.get<LessonInterface[] | { results: LessonInterface[] }>(`/lessons/?subject=${selectedSubjectId}`);
                const lessons = Array.isArray(lessonsRes) ? lessonsRes : lessonsRes.results || [];
                setLessonsForSelectedSubject(lessons);

                const lessonIds = lessons.map(l => l.id);
                if (lessonIds.length > 0) {
                    const progressRes = await api.get<UserLessonProgress[] | {results: UserLessonProgress[]}>(`/userprogress/?user=${currentUser.id}&lesson__in=${lessonIds.join(',')}`);
                    const progress = Array.isArray(progressRes) ? progressRes : progressRes.results || [];
                    const progressMap = new Map(progress.map(p => [p.lesson, p]));
                    setLessonProgressMap(progressMap);
                }
            } catch (err) {
                setError("Failed to load lessons for the selected subject.");
                setLessonsForSelectedSubject([]);
            } finally {
                setIsLoadingLessons(false);
            }
        };

        fetchLessonsAndProgress();
    }, [selectedSubjectId, currentUser]);
    
    const [debouncedSaveScroll] = useDebounce((lessonId: string | number, scrollTop: number) => {
        const existingProgress = lessonProgressMap.get(lessonId);
        if (!existingProgress) return;
        
        const newProgressData = { ...existingProgress.progress_data, scrollPosition: scrollTop };
        
        api.patch(`/userprogress/${existingProgress.id}/`, { progress_data: newProgressData })
            .catch(err => console.warn("Failed to save scroll position", err));
    }, 500);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!activeLessonId) return;
        debouncedSaveScroll(activeLessonId, e.currentTarget.scrollTop);
    };

    const handleLessonClick = (lessonId: string | number) => {
        setActiveLessonId(lessonId);
        setIsLoadingLessonContent(true);
        api.get<LessonInterface>(`/lessons/${lessonId}/`)
            .then(data => {
                setActiveLessonDetails(data);
            })
            .catch(err => {
                toast({ title: "Error", description: "Could not load lesson content.", variant: "destructive"});
                setActiveLessonDetails(null);
            })
            .finally(() => setIsLoadingLessonContent(false));
    };
    
    useEffect(() => {
        if (activeLessonDetails && contentRef.current) {
            const progress = lessonProgressMap.get(activeLessonDetails.id);
            const scrollPosition = progress?.progress_data?.scrollPosition;
            if (typeof scrollPosition === 'number') {
                contentRef.current.scrollTop = scrollPosition;
            } else {
                contentRef.current.scrollTop = 0;
            }
        }
    }, [activeLessonDetails, lessonProgressMap]);


    const toggleFullScreen = () => {
        const elem = document.getElementById("content-learning-page-container");
        if (!elem) return;

        if (!isFullScreen) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div id="content-learning-page-container" className={`flex flex-col h-screen ${isFullScreen ? 'fixed inset-0 bg-background z-[200] overflow-hidden' : 'relative'}`}>
             {!isFullScreen && (
                <header className="flex items-center justify-between p-4 border-b shrink-0 h-[65px]">
                     <Button variant="outline" asChild>
                        <Link href="/student"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Search className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon"><Bell className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon"><UserCircle className="h-5 w-5"/></Button>
                    </div>
                </header>
            )}

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-1/3 min-w-[350px] max-w-[450px] border-r flex flex-col p-4 overflow-y-auto bg-card">
                     <div className="mb-4 space-y-2">
                        <Label htmlFor="subject-select">Select Subject</Label>
                        <div className="flex gap-2">
                            <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId || ''} disabled={isLoadingSubjects}>
                                <SelectTrigger id="subject-select">
                                    <SelectValue placeholder={isLoadingSubjects ? "Loading..." : "Choose a subject"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSubjects.map(subject => (
                                        <SelectItem key={subject.id} value={String(subject.id)}>{subject.name} - {subject.class_obj_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleLoadLessons} disabled={!selectedSubjectId || isLoadingLessons}>
                                {isLoadingLessons ? <Loader2 className="h-4 w-4 animate-spin"/> : "Load"}
                            </Button>
                        </div>
                     </div>
                     <h2 className="text-xl font-semibold mb-3">Chapters</h2>
                     {isLoadingLessons ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
                        </div>
                     ) : lessonsForSelectedSubject.length > 0 ? (
                        <div className="space-y-3">
                            {lessonsForSelectedSubject.map(lesson => {
                                const progress = lessonProgressMap.get(lesson.id);
                                const isCompleted = progress?.completed || false;
                                return (
                                <Card key={lesson.id} className={`hover:shadow-md transition-shadow cursor-pointer ${activeLessonId === lesson.id ? 'border-primary' : ''}`} onClick={() => handleLessonClick(lesson.id)}>
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base">{lesson.title}</CardTitle>
                                        <CardDescription>By Jane Doe</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <Progress value={isCompleted ? 100 : 0} className="h-2" />
                                        <p className="text-xs text-muted-foreground mt-1">{isCompleted ? "Completed" : "Not Started"}</p>
                                    </CardContent>
                                    <CardFooter className="p-3">
                                        <Button variant="default" size="sm" className="w-full">
                                            {isCompleted ? "Review" : "Start"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )})}
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground text-center mt-4">
                            {selectedSubjectId ? "No lessons in this subject yet." : "Please select and load a subject."}
                        </p>
                     )}
                </aside>

                <main className="flex-1 flex flex-col p-6 overflow-hidden bg-muted/20">
                    {activeLessonDetails ? (
                        <>
                         <div className="flex justify-between items-center mb-4 shrink-0">
                             <h1 className="text-2xl font-bold">{activeLessonDetails.title}</h1>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" title="Bookmark"><Bookmark className="h-5 w-5"/></Button>
                                <Button variant="ghost" size="icon" title="Download"><Download className="h-5 w-5"/></Button>
                                <Button variant="ghost" size="icon" onClick={toggleFullScreen} title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                                    {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5"/>}
                                </Button>
                             </div>
                         </div>
                         <div id="lesson-content-display-area" ref={contentRef} onScroll={handleScroll} className="prose prose-lg prose-p:leading-relaxed max-w-none dark:prose-invert overflow-y-auto bg-background p-8 rounded-lg shadow-inner flex-1">
                             <div dangerouslySetInnerHTML={{ __html: activeLessonDetails.content || '<p>No content available.</p>' }} />
                             {activeLessonDetails.video_url && <div className="mt-6"><h4 className="font-semibold mb-2 text-lg">Video:</h4><video src={activeLessonDetails.video_url} controls className="w-full rounded-md shadow-lg aspect-video"></video></div>}
                         </div>
                        </>
                    ) : isLoadingLessonContent ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            <div>
                                <BookOpen className="h-16 w-16 mx-auto mb-4" />
                                <p>Select a lesson from the left to begin learning.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
