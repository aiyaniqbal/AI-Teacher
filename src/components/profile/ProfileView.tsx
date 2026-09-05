import React, { useState } from 'react';
import {
  User,
  Settings,
  Sparkles,
  BookOpen,
  Award,
  Globe,
  Sliders,
  CheckCircle2,
  Clock,
  Save,
  Check,
} from 'lucide-react';
import {
  StudentProfile,
  LearningLevel,
  LanguageCode,
  TeachingStyle,
  LearningGoal,
} from '../../types';

interface ProfileViewProps {
  student: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  student,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(student.name);
  const [level, setLevel] = useState<LearningLevel>(student.learningLevel);
  const [language, setLanguage] = useState<LanguageCode>(student.preferredLanguage);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(student.preferredTeachingStyle);
  const [goal, setGoal] = useState<LearningGoal>(student.primaryGoal);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateProfile({
      ...student,
      name,
      learningLevel: level,
      preferredLanguage: language,
      preferredTeachingStyle: teachingStyle,
      primaryGoal: goal,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{name}</h1>
            <p className="text-xs text-slate-500">
              Personalized AI Learner • Joined EduMind
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {level}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {goal}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {language}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mastery Index</p>
          <p className="text-3xl font-extrabold text-indigo-600 font-mono mt-0.5">
            {student.averageQuizScore}%
          </p>
        </div>
      </div>

      {/* Settings & Preferences Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Learning Preferences & AI Tuning</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Learning Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Learning Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as LearningLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    level === lvl
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Preferred Teacher Language</label>
            <div className="grid grid-cols-3 gap-2">
              {(['English', 'Hindi', 'Hinglish'] as LanguageCode[]).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => setLanguage(lng)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === lng
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
          </div>

          {/* Teaching Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Preferred Teaching Style</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Simple', 'Visual', 'Examples', 'Technical'] as TeachingStyle[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTeachingStyle(st)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    teachingStyle === st
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Primary Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as LearningGoal)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Understand">Understand Fundamentals</option>
              <option value="Exam Preparation">Exam Preparation</option>
              <option value="Interview">Technical Interview</option>
              <option value="Revision">Quick Revision</option>
              <option value="Deep Learning">Deep Academic Mastery</option>
            </select>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Assessment & Study History summary */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Recent Assessment History
        </h2>
        <div className="space-y-2">
          {student.assessmentHistory.map((hist) => (
            <div
              key={hist.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{hist.topic}</p>
                <p className="text-[11px] text-slate-400">{hist.date}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-indigo-600">{hist.score}%</span>
                <p className="text-[10px] text-slate-400">{hist.totalQuestions} Questions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
