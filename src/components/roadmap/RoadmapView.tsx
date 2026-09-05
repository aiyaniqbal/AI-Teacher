import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  PlayCircle,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import { Roadmap, RoadmapStep } from '../../types';

interface RoadmapViewProps {
  roadmap: Roadmap;
  onSelectStep: (step: RoadmapStep) => void;
  onRegenerateRoadmap: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  onSelectStep,
  onRegenerateRoadmap,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>(
    roadmap.steps.find((s) => s.status === 'in_progress')?.id || roadmap.steps[0].id
  );

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onRegenerateRoadmap();
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
            <Compass className="w-3.5 h-3.5" />
            AI Dynamic Curriculum
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Personalized Learning Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            EduMind builds your learning path based on your goals, knowledge, and performance.
          </p>
        </div>

        <button
          disabled={isGenerating}
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Adapting Roadmap...' : 'Generate New Roadmap'}</span>
        </button>
      </div>

      {/* Adaptive Decision Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950 text-indigo-100 border border-indigo-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/60 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">Dynamic Adaptation Active</p>
            <p className="text-indigo-200/80">
              Module 3 expanded with extra numerical practice on Resistance & Branch Circuits based on your 72% quiz score.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-indigo-300 font-bold bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-700">
            {roadmap.completedSteps} of {roadmap.totalSteps} Completed
          </span>
        </div>
      </div>

      {/* Main Roadmap Timeline / Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Nodes List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {roadmap.steps.map((step, idx) => {
            const isSelected = selectedStepId === step.id;
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isLocked = step.status === 'locked';

            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-white border-emerald-200 hover:border-emerald-300'
                    : isInProgress
                    ? 'bg-white border-amber-300 hover:border-amber-400'
                    : 'bg-slate-50/80 border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isInProgress ? (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs animate-pulse">
                          <PlayCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          Step {step.number}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Completed
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {step.progressPercent}% In Progress
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            Locked
                          </span>
                        )}
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 mt-1">
                        {step.title}
                      </h2>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    ~{step.estimatedHours} hrs
                  </span>
                </div>

                {/* Progress bar for in-progress step */}
                {isInProgress && (
                  <div className="mt-3 w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${step.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Detail Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          {(() => {
            const currentStep = roadmap.steps.find((s) => s.id === selectedStepId) || roadmap.steps[0];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">
                      Step {currentStep.number} Detail
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {currentStep.title}
                    </h2>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Subtopics Checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Core Concepts in this Module
                  </span>
                  <div className="space-y-1.5">
                    {currentStep.subtopics.map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-800"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectStep(currentStep)}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Launch AI Teacher for this Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
