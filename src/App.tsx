import React, { useState } from 'react';
import {
  PageId,
  Lesson,
  StudyMaterial,
  Flashcard,
  NoteItem,
  Roadmap,
  RoadmapStep,
  QuizQuestion,
  QuizResult,
  StudentProfile,
  LanguageCode,
} from './types';
import {
  sampleLesson,
  sampleMaterials,
  sampleFlashcards,
  sampleNotes,
  sampleRoadmap,
  sampleQuizQuestions,
  sampleQuizResult,
  sampleStudentProfile,
} from './data/mockData';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { AiTeacherWorkspace } from './components/learn/AiTeacherWorkspace';
import { MaterialUpload } from './components/materials/MaterialUpload';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { QuizWorkspace } from './components/quiz/QuizWorkspace';
import { FlashcardWorkspace } from './components/flashcards/FlashcardWorkspace';
import { MindMapView } from './components/mindmap/MindMapView';
import { NotesWorkspace } from './components/notes/NotesWorkspace';
import { ProgressView } from './components/progress/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { SummaryWorkspace } from './components/summary/SummaryWorkspace';


/**
 * Convert the FastAPI/Gemini lesson plan into the frontend Lesson shape.
 * `segments[].content` is the single source of truth for teacher speech
 * and captions, so a generated Hindi lesson cannot fall back to the
 * old English sample transcript.
 */
const buildLessonFromAiPlan = (
  plan: any,
  fallbackTopic: string,
  language: LanguageCode
): Lesson => {
  const segments = Array.isArray(plan?.segments)
    ? plan.segments.filter(
        (segment: any) =>
          segment && typeof segment === 'object'
      )
    : [];

  const concepts = segments.map(
    (segment: any, index: number) => {
      const options = Array.isArray(
        segment.quick_check?.options
      )
        ? segment.quick_check.options
        : [];

      const correctOptionId =
        segment.quick_check?.correct_option_id ??
        segment.quick_check?.correctOptionId ??
        '';

      const quickCheck = segment.quick_check
        ? {
            question: String(
              segment.quick_check.question ?? ''
            ),
            options: options.map(
              (
                option: any,
                optionIndex: number
              ) => ({
                id: String(
                  option.id ??
                    `opt-${optionIndex + 1}`
                ),
                text: String(
                  option.text ?? ''
                ),
                isCorrect:
                  option.isCorrect === true ||
                  String(option.id ?? '') ===
                    String(correctOptionId),
              })
            ),
            correctExplanation: String(
              segment.quick_check.explanation ??
                segment.quick_check
                  .correctExplanation ??
                ''
            ),
            misconceptionExplanation:
              String(
                segment.quick_check
                  .misconceptionExplanation ??
                  segment.quick_check
                    .explanation ??
                  ''
              ),
            simplifiedAnalogy: String(
              segment.quick_check
                .simplifiedAnalogy ?? ''
            ),
            correctOptionId: String(
              correctOptionId
            ),
          }
        : undefined;

      return {
        id: `ai-concept-${String(
          segment.id ?? index + 1
        )}`,
        title: String(
          segment.title ??
            segment.concept ??
            `${fallbackTopic} — Part ${
              index + 1
            }`
        ),
        description: String(
          segment.content ??
            segment.explanation ??
            segment.description ??
            ''
        ),
        timestamp: `${index + 1}`,
        status:
          index === 0
            ? 'in_progress'
            : 'not_started',
        keyPoints: [],
        quickCheck,
      } as any;
    }
  );

  const transcripts = segments
    .map((segment: any, index: number) => {
      const text = String(
        segment.content ??
          segment.explanation ??
          segment.description ??
          ''
      ).trim();

      if (!text) return null;

      return {
        id: `ai-transcript-${String(
          segment.id ?? index + 1
        )}`,
        timestamp: `${index + 1}`,
        speaker: 'AI Teacher',
        text,
        conceptName: String(
          segment.title ??
            segment.concept ??
            fallbackTopic
        ),
      } as any;
    })
    .filter(Boolean) as any[];

  return {
    ...sampleLesson,
    id: `ai-lesson-${Date.now()}`,
    topicName: String(
      plan?.title ?? fallbackTopic
    ),
    courseName: 'AI Generated Lesson',
    lessonNumber: 1,
    totalLessons: Math.max(
      1,
      concepts.length
    ),
    progressPercent: 0,
    language,
    concepts,
    transcripts,
  };
};

export default function App() {
  // Navigation State & Navigation History Stack
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [pageHistory, setPageHistory] = useState<PageId[]>(['dashboard']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Application State
  const [currentLesson, setCurrentLesson] = useState<Lesson>(sampleLesson);
  const [materials, setMaterials] = useState<StudyMaterial[]>(sampleMaterials);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(sampleFlashcards);
  const [notes, setNotes] = useState<NoteItem[]>(sampleNotes);
  const [roadmap, setRoadmap] = useState<Roadmap>(sampleRoadmap);
  const [quizPool, setQuizPool] = useState<QuizQuestion[]>(sampleQuizQuestions);
  const [student, setStudent] = useState<StudentProfile>(sampleStudentProfile);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult>(sampleQuizResult);

  // Summary Modal state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Navigation Handler with Stack Push
  const handleNavigate = (page: PageId) => {
    if (page === currentPage) return;
    setPageHistory((prev) => [...prev, page]);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back Navigation Handler (top-left button strictly above logo)
  const handleBack = () => {
    if (pageHistory.length <= 1) {
      if (currentPage !== 'dashboard') {
        setCurrentPage('dashboard');
      }
      return;
    }
    const newHistory = [...pageHistory];
    newHistory.pop(); // remove current page
    const previousPage = newHistory[newHistory.length - 1];
    setPageHistory(newHistory);
    setCurrentPage(previousPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Language Change Handler
  const handleLanguageChange = (lang: LanguageCode) => {
    setStudent((prev) => ({ ...prev, preferredLanguage: lang }));
    setCurrentLesson((prev) => ({ ...prev, language: lang }));
  };

  // Handlers for Materials & Lessons
  const handleStartLessonWithMaterial = (
    material: StudyMaterial
  ) => {
    try {
      const rawLesson =
        localStorage.getItem(
          'latestLesson'
        );
      const savedLesson = rawLesson
        ? JSON.parse(rawLesson)
        : null;

      if (
        savedLesson &&
        Array.isArray(
          savedLesson.segments
        ) &&
        savedLesson.segments.length > 0
      ) {
        const savedLanguage =
          (
            savedLesson._uiLanguage ||
            savedLesson.language ||
            student.preferredLanguage ||
            'English'
          ) as LanguageCode;

        const aiLesson =
          buildLessonFromAiPlan(
            savedLesson,
            material.title,
            savedLanguage
          );

        setStudent((prev) => ({
          ...prev,
          preferredLanguage:
            savedLanguage,
        }));

        setCurrentLesson(aiLesson);
        handleNavigate('learn');
        return;
      }
    } catch (error) {
      console.error(
        'Could not load generated AI lesson:',
        error
      );
    }

    // Safe fallback only if generation did not produce a lesson.
    setCurrentLesson({
      ...sampleLesson,
      id: 'lesson-' + material.id,
      topicName: material.title,
      language:
        student.preferredLanguage,
    });
    handleNavigate('learn');
  };

  const handleAddMaterial = (material: StudyMaterial) => {
    setMaterials((prev) => [material, ...prev]);
  };

  // Handlers for Roadmap
  const handleSelectRoadmapStep = (step: RoadmapStep) => {
    setCurrentLesson({
      ...sampleLesson,
      id: 'step-' + step.id,
      topicName: step.title,
      language: student.preferredLanguage,
    });
    handleNavigate('learn');
  };

  const handleRegenerateRoadmap = () => {
    setRoadmap((prev) => ({
      ...prev,
      steps: prev.steps.map((s, idx) =>
        idx === 2
          ? {
              ...s,
              title: '3. Data Processing & Numerical Resistance Drill (AI Adapted)',
              description: 'AI detected calculation errors in your latest assessment and added dynamic problem solving modules.',
            }
          : s
      ),
    }));
  };

  // Handlers for Flashcards
  const handleUpdateFlashcard = (updated: Flashcard) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === updated.id ? updated : card))
    );
  };

  const handleAddFlashcards = (newCards: Flashcard[]) => {
    setFlashcards((prev) => [...newCards, ...prev]);
  };

  // Handlers for Notes
  const handleSaveNote = (note: NoteItem) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      if (exists) {
        return prev.map((n) => (n.id === note.id ? note : n));
      }
      return [note, ...prev];
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePinNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Handlers for Quizzes
  const handleSaveQuizResult = (result: QuizResult) => {
    setLastQuizResult(result);
    setStudent((prev) => ({
      ...prev,
      averageQuizScore: Math.round((prev.averageQuizScore + result.scorePercent) / 2),
      topicsStudiedCount: prev.topicsStudiedCount + 1,
      assessmentHistory: [
        {
          id: result.id,
          topic: result.topic,
          date: result.date,
          score: result.scorePercent,
          totalQuestions: result.totalQuestions,
        },
        ...prev.assessmentHistory,
      ],
    }));
  };

  const handleStartWeakPractice = (concept: string) => {
    setCurrentLesson({
      ...sampleLesson,
      id: 'practice-' + Date.now(),
      topicName: `Targeted Practice: ${concept}`,
      language: student.preferredLanguage,
    });
    handleNavigate('learn');
  };

  const handleExplainConcept = (conceptTitle: string) => {
    setCurrentLesson({
      ...sampleLesson,
      id: 'explain-' + Date.now(),
      topicName: `Concept Deep-Dive: ${conceptTitle}`,
      language: student.preferredLanguage,
    });
    handleNavigate('learn');
  };

  const handleGenerateQuestionsFromConcept = (conceptTitle: string) => {
    handleNavigate('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Global Navbar with mandatory top-left back button strictly above EduMind name/logo */}
      <Navbar
        currentPage={currentPage}
        canGoBack={pageHistory.length > 1 || currentPage !== 'dashboard'}
        onBack={handleBack}
        onNavigate={handleNavigate}
        language={student.preferredLanguage}
        onLanguageChange={handleLanguageChange}
        streakDays={student.streakDays}
        currentTopic={currentLesson.topicName}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* 2. Main Page Layout with Navigation Sidebar + Content Workspace Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          weakConceptName={student.weakAreas[0] || "Ohm's Law"}
          learningProgressPercent={currentLesson.progressPercent}
        />

        {/* Dynamic Route View Stage */}
        <main className="flex-1 min-w-0">
          {currentPage === 'dashboard' && (
            <Dashboard
              student={student}
              recentQuiz={lastQuizResult}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
              onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
            />
          )}

          {currentPage === 'learn' && (
            <AiTeacherWorkspace
              lesson={currentLesson}
              onBack={handleBack}
              language={student.preferredLanguage}
              onLanguageChange={handleLanguageChange}
              onSaveNote={handleSaveNote}
              existingNotes={notes}
              onTakeQuiz={() => handleNavigate('quiz')}
            />
          )}

          {currentPage === 'materials' && (
            <MaterialUpload
              materials={materials}
              onStartLessonWithMaterial={handleStartLessonWithMaterial}
              onAddMaterial={handleAddMaterial}
            />
          )}

          {currentPage === 'roadmap' && (
            <RoadmapView
              roadmap={roadmap}
              onSelectStep={handleSelectRoadmapStep}
              onRegenerateRoadmap={handleRegenerateRoadmap}
            />
          )}

          {currentPage === 'quiz' && (
            <QuizWorkspace
              materials={materials}
              quizPool={quizPool}
              student={student}
              lastResult={lastQuizResult}
              onSaveQuizResult={handleSaveQuizResult}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
            />
          )}

          {currentPage === 'flashcards' && (
            <FlashcardWorkspace
              materials={materials}
              flashcards={flashcards}
              onUpdateFlashcard={handleUpdateFlashcard}
              onAddFlashcards={handleAddFlashcards}
            />
          )}

          {currentPage === 'mindmap' && (
            <MindMapView
              onNavigate={handleNavigate}
              onExplainConcept={handleExplainConcept}
              onGenerateQuestions={handleGenerateQuestionsFromConcept}
            />
          )}

          {currentPage === 'notes' && (
            <NotesWorkspace
              notes={notes}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onTogglePin={handleTogglePinNote}
            />
          )}

          {currentPage === 'progress' && (
            <ProgressView
              student={student}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
            />
          )}

          {currentPage === 'profile' && (
            <ProfileView
              student={student}
              onUpdateProfile={(updated) => setStudent(updated)}
            />
          )}
        </main>
      </div>

      {/* 3. Global AI Summarizer Modal */}
      <SummaryWorkspace
        materials={materials}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onSaveToNotes={handleSaveNote}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
