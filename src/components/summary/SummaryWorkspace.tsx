import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  Check,
  Bookmark,
  Layers,
  FileQuestion,
  Network,
  Sparkles,
  BookOpen,
  X,
  Plus,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StudyMaterial, NoteItem, PageId } from '../../types';
import { AiTeachingService } from '../../services/aiService';

interface SummaryWorkspaceProps {
  materials: StudyMaterial[];
  isOpen: boolean;
  onClose: () => void;
  onSaveToNotes: (note: NoteItem) => void;
  onNavigate: (page: PageId) => void;
}

type SummaryFormat =
  | 'Quick Summary'
  | 'Detailed Summary'
  | 'Exam Notes'
  | 'Key Points'
  | 'Formula Sheet'
  | 'Beginner Explanation';

export const SummaryWorkspace: React.FC<SummaryWorkspaceProps> = ({
  materials,
  isOpen,
  onClose,
  onSaveToNotes,
  onNavigate,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<SummaryFormat>('Quick Summary');
  const [selectedTopic, setSelectedTopic] = useState("Ohm's Law & Circuit Dynamics");
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  if (!isOpen) return null;

  const summaryContent = AiTeachingService.generateSummaryContent(selectedTopic, selectedFormat);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(summaryContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download markdown/txt
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([summaryContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTopic.replace(/\s+/g, '_')}_${selectedFormat}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Save to student notes
  const handleSaveNote = () => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title: `${selectedFormat}: ${selectedTopic}`,
      content: summaryContent,
      topicName: selectedTopic,
      isPinned: true,
      tags: ['AI Summary', selectedFormat],
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };
    onSaveToNotes(newNote);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Material Summarizer</h2>
              <p className="text-xs text-slate-500">Transform study material into structured formats</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="p-4 bg-white border-b border-slate-100 overflow-x-auto flex items-center gap-2">
          {(
            [
              'Quick Summary',
              'Detailed Summary',
              'Exam Notes',
              'Key Points',
              'Formula Sheet',
              'Beginner Explanation',
            ] as SummaryFormat[]
          ).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedFormat === fmt
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/40">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
            <ReactMarkdown>{summaryContent}</ReactMarkdown>
          </div>
        </div>

        {/* Footer Actions: Copy, Download, Save to Notes, Cross-Launch (Quiz, Flashcards, Mind Map) */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handleSaveNote}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
            >
              {savedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{savedNote ? 'Saved!' : 'Save to Notes'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
            <button
              onClick={() => {
                onClose();
                onNavigate('flashcards');
              }}
              className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigate('quiz');
              }}
              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigate('mindmap');
              }}
              className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mind Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
