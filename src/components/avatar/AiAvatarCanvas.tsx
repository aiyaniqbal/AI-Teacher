import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Sparkles, Subtitles, Play, Pause, FastForward } from 'lucide-react';
import { LanguageCode } from '../../types';

interface AiAvatarCanvasProps {
  isSpeaking: boolean;
  onTogglePlay: () => void;
  language: LanguageCode;
  currentConceptTitle: string;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  captionsEnabled: boolean;
  onToggleCaptions: () => void;
  progressPercent?: number;
}

export const AiAvatarCanvas: React.FC<AiAvatarCanvasProps> = ({
  isSpeaking,
  onTogglePlay,
  language,
  currentConceptTitle,
  playbackSpeed,
  onSpeedChange,
  captionsEnabled,
  onToggleCaptions,
  progressPercent = 45,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Lip-sync / speaking animation effect
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 180 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isSpeaking, playbackSpeed]);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl overflow-hidden border border-slate-700/60 flex flex-col">
      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSpeaking ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span>{isSpeaking ? 'AI Teacher is explaining...' : 'AI Teacher paused'}</span>
          <span className="text-slate-400 text-[10px] ml-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/60 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-indigo-200 font-medium text-[11px]">EduMind Neural Voice</span>
        </div>
      </div>

      {/* Center Avatar Representation Area (Reduced Height, Compact & Modern) */}
      <div className="relative h-48 sm:h-56 md:h-60 w-full flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900/80 to-slate-950">
        {/* Subtle Ambient Wave Glow */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div
            className={`w-64 h-64 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-3xl transition-all duration-700 ${
              isSpeaking ? 'scale-110 opacity-60' : 'scale-90 opacity-20'
            }`}
          />
        </div>

        {/* Human-like Stylized AI Teacher Avatar SVG */}
        <div className="relative z-10 flex flex-col items-center select-none">
          <div className="relative">
            {/* Outer Aura Ring */}
            <div
              className={`absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 opacity-40 blur-md transition-opacity duration-300 ${
                isSpeaking ? 'opacity-80 scale-105' : 'opacity-20 scale-100'
              }`}
            />

            {/* Avatar Frame */}
            <svg
              className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full ring-2 ring-indigo-400/50 bg-gradient-to-b from-indigo-950 to-slate-900 shadow-2xl transition-transform duration-300"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background gradient */}
              <circle cx="60" cy="60" r="58" fill="url(#avatarBg)" />
              <defs>
                <linearGradient id="avatarBg" x1="0" y1="0" x2="120" y2="120">
                  <stop stopColor="#1e1b4b" />
                  <stop offset="1" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#ffdbca" />
                  <stop offset="1" stopColor="#f5c2a8" />
                </linearGradient>
                <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#312e81" />
                  <stop offset="1" stopColor="#1e1b4b" />
                </linearGradient>
              </defs>

              {/* Shoulders & Professional Blazer */}
              <path
                d="M20 115 C20 90, 40 82, 60 82 C80 82, 100 90, 100 115 Z"
                fill="#3730a3"
              />
              <path
                d="M42 84 L60 102 L78 84 L72 115 L48 115 Z"
                fill="#ffffff"
              />
              <path
                d="M56 86 L60 92 L64 86 Z"
                fill="#4f46e5"
              />

              {/* Neck */}
              <rect x="52" y="66" width="16" height="18" rx="4" fill="url(#skinGrad)" />

              {/* Head / Face */}
              <ellipse cx="60" cy="52" rx="22" ry="26" fill="url(#skinGrad)" />

              {/* Hair Base */}
              <path
                d="M36 48 C36 28, 46 22, 60 22 C74 22, 84 28, 84 48 C84 42, 80 32, 60 30 C40 32, 36 42, 36 48 Z"
                fill="url(#hairGrad)"
              />

              {/* Smart Glasses */}
              <rect x="44" y="44" width="13" height="9" rx="3" fill="#0f172a" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5" />
              <rect x="63" y="44" width="13" height="9" rx="3" fill="#0f172a" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5" />
              <line x1="57" y1="48" x2="63" y2="48" stroke="#6366f1" strokeWidth="1.5" />

              {/* Eyes */}
              {blink ? (
                <>
                  <line x1="47" y1="48" x2="54" y2="48" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
                  <line x1="66" y1="48" x2="73" y2="48" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="50.5" cy="48" r="2.2" fill="#1e1b4b" />
                  <circle cx="69.5" cy="48" r="2.2" fill="#1e1b4b" />
                  <circle cx="51.2" cy="47.2" r="0.7" fill="#ffffff" />
                  <circle cx="70.2" cy="47.2" r="0.7" fill="#ffffff" />
                </>
              )}

              {/* Eyebrows */}
              <path d="M46 41 Q50 39 55 41" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M65 41 Q70 39 74 41" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Nose */}
              <path d="M60 51 L59 56 L62 56" stroke="#d97706" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* Natural Speaking Mouth Animation */}
              {isSpeaking && mouthOpen ? (
                <ellipse cx="60" cy="64" rx="4.5" ry="3.5" fill="#be123c" />
              ) : isSpeaking ? (
                <path d="M55 64 Q60 67 65 64" stroke="#be123c" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M56 64 Q60 67 64 64" stroke="#9f1239" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}
            </svg>
          </div>

          {/* Voice Wave Visualizer when speaking */}
          <div className="flex items-center gap-1 mt-2.5 h-6">
            {isSpeaking ? (
              <>
                <div className="w-1 bg-indigo-400 rounded-full animate-wave-1" />
                <div className="w-1 bg-sky-400 rounded-full animate-wave-2" />
                <div className="w-1 bg-purple-400 rounded-full animate-wave-3" />
                <div className="w-1 bg-indigo-400 rounded-full animate-wave-4" />
                <div className="w-1 bg-sky-400 rounded-full animate-wave-5" />
                <div className="w-1 bg-indigo-400 rounded-full animate-wave-2" />
                <div className="w-1 bg-purple-400 rounded-full animate-wave-1" />
              </>
            ) : (
              <span className="text-[11px] text-slate-400 tracking-wide">Press Play to listen</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Concept Banner & Progress Bar (as specified in prompt) */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-700/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/80 text-[11px] shrink-0">
            Active Concept
          </span>
          <span className="font-medium text-slate-200 truncate">{currentConceptTitle}</span>
        </div>
        <span className="text-slate-400 text-[11px] font-mono shrink-0">{progressPercent}% complete</span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-gradient-to-r from-indigo-500 to-sky-400 h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Compact Video & Learning Controls Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/95 flex items-center justify-between gap-3 text-slate-300 text-xs">
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
            title={isSpeaking ? 'Pause AI Teacher' : 'Play AI Teacher'}
          >
            {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Volume toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Speed selector */}
          <button
            onClick={() => {
              const speeds = [1, 1.25, 1.5];
              const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
              onSpeedChange(next);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors"
            title="Change Playback Speed"
          >
            <FastForward className="w-3 h-3 text-blue-400" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Captions Toggle */}
          <button
            onClick={onToggleCaptions}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
              captionsEnabled
                ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Subtitles"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Captions</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle Focus Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
