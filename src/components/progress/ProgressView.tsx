import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Target,
} from 'lucide-react';
import { StudentProfile, PageId } from '../../types';

interface ProgressViewProps {
  student: StudentProfile;
  onNavigate: (page: PageId) => void;
  onStartWeakPractice: (concept: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  student,
  onNavigate,
  onStartWeakPractice,
}) => {
  // Mastery levels dataset matching prompt Section 18
  const conceptMastery = [
    { name: 'Current Flow (Amperes)', score: 92, status: 'strong' },
    { name: 'Voltage Potential (Volts)', score: 88, status: 'strong' },
    { name: 'Circuit Analysis (KVL)', score: 58, status: 'medium' },
    { name: "Ohm's Law Relationship", score: 51, status: 'weak' },
    { name: 'Resistance Calculations', score: 42, status: 'weak' },
  ];

  // Weekly study time distribution (Mon - Sun)
  const weeklyDistribution = [
    { day: 'Mon', hours: 4.2 },
    { day: 'Tue', hours: 5.0 },
    { day: 'Wed', hours: 3.5 },
    { day: 'Thu', hours: 6.2 },
    { day: 'Fri', hours: 4.8 },
    { day: 'Sat', hours: 2.8 },
    { day: 'Sun', hours: 2.0 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800">
            <BarChart3 className="w-3.5 h-3.5" />
            Learning Analytics & Reports
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Learning Progress & Concept Mastery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Continuous diagnostic tracking based on your quiz answers, time spent, and AI teacher interactions.
          </p>
        </div>

        <button
          onClick={() => onStartWeakPractice("Resistance & Ohm's Law")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Practice 5 Weak Problems</span>
        </button>
      </div>

      {/* 5 Core Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Overall Progress
          </span>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">68%</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Weekly Study Time
          </span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {student.totalStudyHours}h
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Topics Mastered
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {student.topicsStudiedCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Quiz Score
          </span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {student.averageQuizScore}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Study Streak
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="text-2xl font-extrabold text-orange-600 font-mono">
              {student.streakDays} Days
            </span>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Insight Banner (Section 18) */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI Diagnostic Insight</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Real-time Evaluation
          </span>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          "You are consistently improving in electricity fundamentals and qualitative definitions, but your performance drops significantly when numerical problems involving inverse resistance ratios are introduced."
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="text-amber-300 font-semibold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Recommended: Practice 5 targeted resistance calculation problems before continuing.</span>
          </div>
          <button
            onClick={() => onStartWeakPractice('Resistance Calculations')}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shrink-0"
          >
            Start Practice
          </button>
        </div>
      </div>

      {/* Main Grid: Concept Mastery breakdown & Weekly Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Concept Mastery List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Concept Mastery Breakdown
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">5 Tracked Concepts</span>
          </div>

          <div className="space-y-4">
            {conceptMastery.map((item, i) => {
              const isWeak = item.status === 'weak';
              const isStrong = item.status === 'strong';

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {isStrong ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isWeak ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-300" />
                      )}
                      <span className="text-slate-800">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isStrong
                            ? 'bg-emerald-50 text-emerald-800'
                            : isWeak
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isStrong ? 'Mastered' : isWeak ? 'Needs Practice' : 'Developing'}
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{item.score}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isStrong ? 'bg-emerald-500' : isWeak ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Study Time Activity Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Weekly Study Time
              </h2>
              <span className="text-[11px] font-mono text-indigo-600 font-bold">28.5 hrs total</span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-6 pb-2 flex items-end justify-between gap-2 h-44">
              {weeklyDistribution.map((w, idx) => {
                const heightPercent = Math.round((w.hours / 7) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-indigo-600">
                      {w.hours}h
                    </span>
                    <div className="w-full bg-slate-100 rounded-lg h-32 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-sky-400 rounded-lg transition-all duration-500 group-hover:opacity-90"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{w.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-600">
            🔥 Consistent daily practice maintained for 6 consecutive days.
          </div>
        </div>
      </div>
    </div>
  );
};
