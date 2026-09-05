import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Layers,
  Compass,
  BookOpen,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import {
  QuizQuestion,
  QuizResult,
  StudyMaterial,
  StudentProfile,
  PageId,
} from '../../types';
import { AiTeachingService } from '../../services/aiService';
import confetti from 'canvas-confetti';

interface QuizWorkspaceProps {
  materials: StudyMaterial[];
  quizPool: QuizQuestion[];
  student: StudentProfile;
  lastResult: QuizResult;
  onSaveQuizResult: (res: QuizResult) => void;
  onNavigate: (page: PageId) => void;
  onStartWeakPractice: (concept: string) => void;
}

export const QuizWorkspace: React.FC<QuizWorkspaceProps> = ({
  materials,
  quizPool,
  student,
  lastResult,
  onSaveQuizResult,
  onNavigate,
  onStartWeakPractice,
}) => {
  // Modes: 'config' | 'testing' | 'report'
  const [mode, setMode] = useState<'config' | 'testing' | 'report'>('config');

  // Generator configurations
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || 'mat-1');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Adaptive'>('Adaptive');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('Mixed');

  // Active Test State
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [distributionNote, setDistributionNote] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [testTimeSeconds, setTestTimeSeconds] = useState(0);

  // Active completed result
  const [currentReport, setCurrentReport] = useState<QuizResult>(lastResult);

  // Timer effect in testing mode
  useEffect(() => {
    let timer: any;
    if (mode === 'testing') {
      timer = setInterval(() => {
        setTestTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode]);

  // Generate Quiz handler
  const handleGenerateQuiz = () => {
    const generated = AiTeachingService.generateAdaptiveQuiz(
      quizPool,
      student.weakAreas,
      questionCount
    );

    setActiveQuestions(generated.questions);
    setDistributionNote(generated.distributionNote);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTestTimeSeconds(0);
    setMode('testing');
  };

  // Submit test and generate report
  const handleSubmitTest = () => {
    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const incorrect = activeQuestions.length - correct;
    const score = Math.round((correct / activeQuestions.length) * 100);

    if (score >= 70) {
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }

    const newResult: QuizResult = {
      id: 'res-' + Date.now(),
      topic: `${materials.find((m) => m.id === selectedMaterialId)?.title || 'Physics'} — Adaptive Assessment`,
      date: 'Just now',
      scorePercent: score,
      totalQuestions: activeQuestions.length,
      correctCount: correct,
      incorrectCount: incorrect,
      timeSpentMinutes: Math.max(1, Math.round(testTimeSeconds / 60)),
      strongAreas: score > 60 ? ['Voltage Potential', 'Current Flow'] : ['Basic Terminology'],
      weakAreas: score < 80 ? ["Ohm's Law Calculations", 'Parallel Branches'] : [],
      needsPracticeTip: 'Resistance calculations and equivalent formulas in branch circuits',
      aiRecommendation:
        score >= 80
          ? 'Exceptional mastery! You are ready to advance to Next Generation Circuits & Power Systems.'
          : 'Your conceptual grasp of current and voltage is solid, but you should practice 3-5 numerical resistance problems before advancing.',
    };

    setCurrentReport(newResult);
    onSaveQuizResult(newResult);
    setMode('report');
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. QUIZ GENERATOR CONFIGURATION VIEW */}
      {mode === 'config' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-800">
                <FileQuestion className="w-3.5 h-3.5" />
                Adaptive Assessment Engine
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Quiz Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Dynamically weighted tests targeted at your weak concepts with shuffled non-repeating questions.
              </p>
            </div>

            <button
              onClick={handleGenerateQuiz}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Quiz</span>
            </button>
          </div>

          {/* ADAPTIVE QUESTION ENGINE VISIBLE LOGIC (Section 14) */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <h2 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Adaptive Weighting Logic
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Live Calibration
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Weak Concept */}
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-300">⚠ Weak: Resistance</span>
                  <span className="font-mono text-amber-400">48% Mastery</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Targeted Quota: <strong className="text-amber-300">50% of questions</strong>
                </p>
              </div>

              {/* Medium Concept */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-200">Voltage Potential</span>
                  <span className="font-mono text-slate-400">76% Mastery</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Targeted Quota: <strong className="text-indigo-300">30% of questions</strong>
                </p>
              </div>

              {/* Strong Concept */}
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-300">✓ Strong: Current</span>
                  <span className="font-mono text-emerald-400">90% Mastery</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Targeted Quota: <strong className="text-emerald-300">20% of questions</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              💡 <em>More questions are being generated from Resistance because it is currently your weakest concept. Options & questions are continuously randomized to prevent rote memorization.</em>
            </p>
          </div>

          {/* Generator Parameters Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
            {/* 1. Material Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Study Material / Topic
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMaterialId(m.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedMaterialId === m.id
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span className="truncate">{m.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {m.extractedTopics.slice(0, 3).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Difficulty Setting
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Easy', 'Medium', 'Hard', 'Adaptive'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {diff} {diff === 'Adaptive' && '⚡'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Number of Questions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionCount === num
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
                <button
                  onClick={() => setQuestionCount(15)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    questionCount === 15
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Custom (15)
                </button>
              </div>
            </div>

            {/* 4. Question Types */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['Mixed', 'MCQ', 'Short Answer', 'Conceptual', 'Problem Solving'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setQuestionType(t)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      questionType === t
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEST MODE VIEW (Section 12) */}
      {mode === 'testing' && activeQuestions.length > 0 && (
        <div className="space-y-6">
          {/* Test Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Physics — Adaptive Assessment
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900">
                  Question {currentIndex + 1} of {activeQuestions.length}
                </span>
                {flaggedQuestions[currentIndex] && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Flagged
                  </span>
                )}
              </div>
            </div>

            {/* Timer & Flag Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setFlaggedQuestions((prev) => ({
                    ...prev,
                    [currentIndex]: !prev[currentIndex],
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  flaggedQuestions[currentIndex]
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flag</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTime(testTimeSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Test Question Card */}
          {(() => {
            const currentQ = activeQuestions[currentIndex];
            const currentAnswer = userAnswers[currentIndex];

            return (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
                {/* Concept badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Concept: {currentQ.concept}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Type: {currentQ.type}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h2>

                {/* Option Buttons */}
                <div className="space-y-3">
                  {currentQ.options.map((optText, optIdx) => {
                    const isSelected = currentAnswer === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [currentIndex]: optIdx,
                          }))
                        }
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="leading-snug pt-0.5">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Navigation Buttons: Previous, Next, Submit */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentIndex < activeQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Test</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. POST-TEST REPORT VIEW (Section 13) */}
      {mode === 'report' && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Adaptive Assessment Outcome
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  Your Learning Report
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">{currentReport.topic}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-semibold">Overall Score</p>
                  <p className="text-3xl font-extrabold text-indigo-600 font-mono">
                    {currentReport.scorePercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Score Grid: Correct, Incorrect, Accuracy, Time */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800">Correct</p>
                <p className="text-xl font-bold text-emerald-950 mt-1">
                  {currentReport.correctCount} / {currentReport.totalQuestions}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <p className="text-xs font-bold text-rose-800">Incorrect</p>
                <p className="text-xl font-bold text-rose-950 mt-1">
                  {currentReport.incorrectCount}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <p className="text-xs font-bold text-indigo-800">Accuracy</p>
                <p className="text-xl font-bold text-indigo-950 mt-1 font-mono">
                  {currentReport.scorePercent}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <p className="text-xs font-bold text-amber-800">Time Spent</p>
                <p className="text-xl font-bold text-amber-950 mt-1 font-mono">
                  {currentReport.timeSpentMinutes} min
                </p>
              </div>
            </div>

            {/* Strong Areas vs Weak Areas Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Strong Areas */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Strong Areas Mastered
                </span>
                <div className="space-y-1">
                  {currentReport.strongAreas.map((area, i) => (
                    <div key={i} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Weak Areas Needing Focus
                </span>
                <div className="space-y-1">
                  {currentReport.weakAreas.map((area, i) => (
                    <div key={i} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                      <span className="text-amber-600 font-bold">⚠</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Recommendation</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentReport.aiRecommendation}
              </p>
            </div>

            {/* Action Buttons: Practice Weak Areas, Generate New Roadmap, Take Another Test, Continue Learning */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <button
                onClick={() => onStartWeakPractice(currentReport.weakAreas[0] || "Ohm's Law")}
                className="p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Weak Areas</span>
              </button>

              <button
                onClick={() => onNavigate('roadmap')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Generate New Roadmap</span>
              </button>

              <button
                onClick={() => setMode('config')}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Take Another Test</span>
              </button>

              <button
                onClick={() => onNavigate('learn')}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Continue Learning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
