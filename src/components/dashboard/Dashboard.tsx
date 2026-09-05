import React from 'react';
import {
  Play,
  Flame,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Upload,
  Layers,
  FileQuestion,
  FileText,
  Network,
  Compass,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { StudentProfile, PageId, QuizResult } from '../../types';

interface DashboardProps {
  student: StudentProfile;
  recentQuiz: QuizResult;
  onNavigate: (page: PageId) => void;
  onStartWeakPractice: (concept: string) => void;
  onOpenSummaryModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  student,
  recentQuiz,
  onNavigate,
  onStartWeakPractice,
  onOpenSummaryModal,
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden border border-slate-700/50">
        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            AI Adaptive Learning Mode Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Good afternoon, {student.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-300 font-normal">
            Ready to continue learning? Your AI Teacher is ready to pick up where you left off.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigate('learn')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume Lesson</span>
          </button>
        </div>
      </div>

      {/* Top 3 Core Action Cards (Continue Learning, Weak Area, Recommended Next) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. CURRENT SESSION / Continue Learning */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Current Session
              </span>
              <span className="text-xs font-mono font-bold text-[#64748B]">Lesson 2 of 6</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Physics — Electricity</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Ohm's Law & Circuit Dynamics</p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#64748B]">Progress</span>
                <span className="text-blue-600 font-mono font-bold">68%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('learn')}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Continue Learning</span>
          </button>
        </div>

        {/* 2. WEAK AREA / Practice Now */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Weak Area Identified
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Ohm's Law</h2>
              <p className="text-xs text-amber-700 font-medium mt-0.5">Needs more practice (48% accuracy)</p>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your recent quiz showed hesitation with inverse proportions ($I = V/R$) and branch currents.
            </p>
          </div>

          <button
            onClick={() => onStartWeakPractice("Ohm's Law")}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Now</span>
          </button>
        </div>

        {/* 3. RECOMMENDED / Start Session */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Recommended Next
              </span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Resistance and Circuits</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Based on your recent performance</p>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Targeted 15-minute adaptive lesson with interactive analogies for equivalent resistance in parallel networks.
            </p>
          </div>

          <button
            onClick={() => onNavigate('learn')}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Start Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Row: Streak, Recent Quiz, Topics, Mastery */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Streak */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B]">Study Streak</p>
            <p className="text-lg font-bold text-[#0F172A]">{student.streakDays} Days</p>
          </div>
        </div>

        {/* Recent Quiz Score */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B]">Recent Quiz Score</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#0F172A]">{recentQuiz.scorePercent}%</span>
              <span className="text-[11px] text-[#94A3B8] font-mono">({recentQuiz.correctCount}/{recentQuiz.totalQuestions})</span>
            </div>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B]">Topics Mastered</p>
            <p className="text-lg font-bold text-[#0F172A]">{student.topicsStudiedCount} Topics</p>
          </div>
        </div>

        {/* Total Time */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#64748B]">Study Time</p>
            <p className="text-lg font-bold text-[#0F172A]">{student.totalStudyHours} Hours</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Quick Actions</h2>
            <p className="text-xs text-[#64748B]">Instantly launch an AI-powered learning tool</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Upload Material */}
          <button
            onClick={() => onNavigate('materials')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Upload Material</span>
          </button>

          {/* 2. Start AI Teacher */}
          <button
            onClick={() => onNavigate('learn')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Start AI Teacher</span>
          </button>

          {/* 3. Generate Quiz */}
          <button
            onClick={() => onNavigate('quiz')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileQuestion className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Generate Quiz</span>
          </button>

          {/* 4. Create Flashcards */}
          <button
            onClick={() => onNavigate('flashcards')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Create Flashcards</span>
          </button>

          {/* 5. Summarize Material */}
          <button
            onClick={onOpenSummaryModal}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Summarize Material</span>
          </button>

          {/* 6. Generate Mind Map */}
          <button
            onClick={() => onNavigate('mindmap')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Generate Mind Map</span>
          </button>

          {/* 7. Create Roadmap */}
          <button
            onClick={() => onNavigate('roadmap')}
            className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border border-[#E2E8F0] hover:border-blue-300 shadow-2xs transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1E293B]">Create Roadmap</span>
          </button>
        </div>
      </div>
    </div>
  );
};
