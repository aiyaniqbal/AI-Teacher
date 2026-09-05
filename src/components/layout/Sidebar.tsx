import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FolderOpen,
  Compass,
  FileQuestion,
  Layers,
  Network,
  Edit3,
  BarChart3,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { PageId } from '../../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  weakConceptName: string;
  learningProgressPercent: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  weakConceptName,
  learningProgressPercent,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn / AI Teacher', icon: GraduationCap, badge: 'Live', badgeColor: 'bg-blue-50 text-blue-600' },
    { id: 'materials', label: 'My Materials', icon: FolderOpen, badge: '3', badgeColor: 'bg-slate-100 text-[#64748B]' },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'quiz', label: 'Quiz & Cards', icon: FileQuestion, badge: 'Adaptive', badgeColor: 'bg-amber-50 text-amber-700' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'mindmap', label: 'Mind Map', icon: Network },
    { id: 'notes', label: 'Notes', icon: Edit3 },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 shadow-sm transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header inside mobile / desktop Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="flex items-center justify-between px-2 mb-3 md:hidden">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 mb-2 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Menu
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'font-bold text-blue-600 bg-blue-50'
                      : 'font-medium text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-[#64748B]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.badgeColor || 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Learning loop focus indicator */}
<div className="pt-4 px-1">
  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100/70 space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
        AI Decision
      </span>

      <span className="font-mono text-blue-700 font-bold text-[11px]">
        {learningProgressPercent}%
      </span>
    </div>

    <p className="text-[11px] leading-relaxed text-[#1E40AF]">
      {weakConceptName
        ? `AI is focusing on "${weakConceptName}" and adapting the lesson to help you understand it better.`
        : 'AI is adapting the lesson based on your learning progress.'}
    </p>
  </div>
</div>
        </div>

        {/* User Profile Mini Footer */}
        <div
          onClick={() => onNavigate('profile')}
          className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              A
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-[#0F172A] truncate">Alex Johnson</p>
              <p className="text-xs text-[#64748B]">Intermediate Student</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
