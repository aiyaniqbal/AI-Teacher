import React from 'react';
import {
  ArrowLeft,
  Flame,
  Globe,
  Menu,
} from 'lucide-react';
import { LanguageCode, PageId } from '../../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onBack: () => void;
  canGoBack: boolean;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  streakDays: number;
  currentTopic: string;
  timeRemaining?: string;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onBack,
  canGoBack,
  language,
  onLanguageChange,
  streakDays,
  currentTopic,
  timeRemaining = '14:32 remaining',
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-8">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Area: Back button MUST appear strictly ABOVE EduMind app name/logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-start">
            {/* 1. BACK BUTTON strictly above the EduMind app name/logo */}
            <button
              onClick={onBack}
              disabled={!canGoBack && currentPage === 'dashboard'}
              className={`text-[#64748B] text-xs font-medium flex items-center transition-colors ${
                canGoBack || currentPage !== 'dashboard'
                  ? 'hover:text-blue-600 cursor-pointer active:scale-95'
                  : 'text-[#94A3B8] cursor-default'
              }`}
              title="Return to previous screen"
            >
              <ArrowLeft className="w-3 h-3 mr-1 stroke-[2.2]" />
              <span>Back</span>
            </button>

            {/* 2. EduMind Logo + App Name */}
            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2 cursor-pointer group mt-0.5"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic text-sm shadow-xs group-hover:scale-105 transition-transform">
                E
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">
                  EduMind
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  AI Teacher
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Sleek Topic & Progress Bar */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className="text-sm">
            <p className="text-[#64748B] text-[10px] uppercase tracking-wider font-semibold">
              Current Topic
            </p>
            <p className="font-bold text-[#0F172A] truncate max-w-[240px]">
              {currentTopic}
            </p>
          </div>

          <div className="h-8 w-px bg-[#E2E8F0]" />

          <div className="w-48">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#64748B]">Lesson 2 of 6</span>
              <span className="text-blue-600 font-bold">35%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '35%' }} />
            </div>
          </div>
        </div>

        {/* Right Area: Study Streak, Language Selector, Remaining Time, Profile */}
        <div className="flex items-center space-x-3">
          {/* Study Streak */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-800"
            title={`${streakDays} days consecutive study streak!`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>{streakDays}d</span>
          </div>

          {/* Language Selector: English | Hindi */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold px-3 py-1.5 rounded-md text-[#475569] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="English">🇬🇧 English</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="Hinglish">🇮🇳 Hinglish</option>
            </select>
          </div>

          {/* Remaining Time */}
          <div className="hidden sm:block text-xs font-mono bg-red-50 text-red-600 px-3 py-1.5 rounded-md border border-red-100 font-medium">
            {timeRemaining.includes('remaining') ? timeRemaining : `${timeRemaining} remaining`}
          </div>

          {/* Student Profile Quick Avatar */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#F8FAFC] transition-colors"
            title="View Profile & Learning Preferences"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              A
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
