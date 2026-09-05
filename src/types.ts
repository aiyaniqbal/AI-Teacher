export type PageId =
  | 'dashboard'
  | 'learn'
  | 'materials'
  | 'roadmap'
  | 'quiz'
  | 'flashcards'
  | 'mindmap'
  | 'notes'
  | 'progress'
  | 'profile';

export type LanguageCode = 'English' | 'Hindi' | 'Hinglish';

export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TeachingStyle = 'Simple' | 'Visual' | 'Examples' | 'Technical';

export type LearningGoal =
  | 'Understand'
  | 'Exam Preparation'
  | 'Interview'
  | 'Revision'
  | 'Deep Learning';

export type LessonDuration = '5 min' | '20 min' | '60 min' | 'Custom';

export interface AssessmentHistoryItem {
  id: string;
  topic: string;
  date: string;
  score: number;
  totalQuestions: number;
}

export interface StudentProfile {
  name: string;
  avatarUrl?: string;
  gradeOrTarget: string;
  learningLevel: LearningLevel;
  preferredLanguage: LanguageCode;
  learningGoals: LearningGoal[];
  primaryGoal: LearningGoal;
  preferredTeachingStyle: TeachingStyle;
  streakDays: number;
  totalStudyHours: number;
  topicsStudiedCount: number;
  averageQuizScore: number;
  currentCourseId: string;
  currentTopicId: string;
  strongAreas: string[];
  weakAreas: string[];
  assessmentHistory: AssessmentHistoryItem[];
}

export interface TranscriptItem {
  id: string;
  timestamp: string;
  seconds: number;
  speaker: 'AI Teacher' | 'Student';
  text: string;
  conceptId?: string;
  conceptName?: string;
}

export interface QuickCheckOption {
  id: string;
  text: string;

  /**
   * Optional because the FastAPI/Gemini lesson format does not need
   * to put the answer flag on every option. The canonical answer can
   * instead be stored on QuickCheckQuestion.correctOptionId.
   */
  isCorrect?: boolean;
}

export interface QuickCheckQuestion {
  id: string;
  conceptId: string;
  conceptName: string;
  question: string;
  options: QuickCheckOption[];

  /**
   * Frontend-compatible canonical answer id.
   */
  correctOptionId?: string;

  /**
   * Backend-compatible snake_case answer id.
   * Kept for safe compatibility if raw backend data reaches a component.
   */
  correct_option_id?: string;

  correctExplanation: string;
  misconceptionExplanation: string;
  simplifiedAnalogy: string;

  followUpQuestion?: {
    question: string;
    options: QuickCheckOption[];
    explanation: string;
  };
}

export interface LessonConcept {
  id: string;
  title: string;
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  description: string;
  keyPoints: string[];
  quickCheck?: QuickCheckQuestion;
}

export interface Lesson {
  id: string;
  courseId: string;
  courseName: string;
  topicId: string;
  topicName: string;
  lessonNumber: number;
  totalLessons: number;
  durationMinutes: number;
  progressPercent: number;
  language: LanguageCode;
  concepts: LessonConcept[];
  transcripts: TranscriptItem[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'PPTX' | 'TXT' | 'Notes' | 'Topic Prompt';
  fileSize: string;
  uploadDate: string;
  extractedTopics: string[];
  chaptersCount: number;
  status: 'ready' | 'processing';
  summaryPreview: string;
}

export interface RoadmapStep {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in_progress' | 'locked';
  progressPercent: number;
  estimatedHours: number;
  description: string;
  subtopics: string[];
}

export interface Roadmap {
  id: string;
  subject: string;
  goal: string;
  totalSteps: number;
  completedSteps: number;
  steps: RoadmapStep[];
  lastUpdated: string;
}

export interface QuizQuestion {
  id: string;
  concept: string;
  conceptCategory: 'weak' | 'medium' | 'strong';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  type: 'MCQ' | 'Short Answer' | 'Conceptual' | 'Problem Solving';
}

export interface QuizResult {
  id: string;
  topic: string;
  date: string;
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  timeSpentMinutes: number;
  strongAreas: string[];
  weakAreas: string[];
  needsPracticeTip: string;
  aiRecommendation: string;
}

export interface Flashcard {
  id: string;
  materialId: string;
  materialName: string;
  topic: string;
  front: string;
  back: string;
  isImportant: boolean;
  masteryStatus: 'known' | 'needs_practice' | 'unreviewed';
  lastReviewed?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  timestamp?: string;
  conceptName?: string;
  topicName: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  children?: MindMapNode[];
  isExpanded?: boolean;
  color?: string;
}
