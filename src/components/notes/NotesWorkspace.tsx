import React, { useState } from 'react';
import {
  Edit3,
  Sparkles,
  Pin,
  Clock,
  Search,
  Plus,
  Trash2,
  Tag,
  Check,
  Download,
  BookOpen,
  Filter,
} from 'lucide-react';
import { NoteItem } from '../../types';

interface NotesWorkspaceProps {
  notes: NoteItem[];
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({
  notes,
  onSaveNote,
  onDeleteNote,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const activeNote = notes.find((n) => n.id === activeNoteId) || filteredNotes[0];

  // All unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Save or update note
  const handleSave = () => {
    if (!content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newNote: NoteItem = {
      id: isEditing && activeNoteId ? activeNoteId : 'note-' + Date.now(),
      title: title.trim() || 'Untitled Study Note',
      content: content,
      timestamp: '14:22 — Ohm’s Law',
      topicName: 'Physics — Electricity',
      isPinned,
      tags: tags.length > 0 ? tags : ['Physics', 'Study Note'],
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };

    onSaveNote(newNote);
    setIsEditing(false);
    setActiveNoteId(newNote.id);
  };

  // AI Summarize Notes
  const handleAiSummarizeAllNotes = () => {
    const summaryText = notes.map((n) => `• ${n.title}: ${n.content}`).join('\n\n');
    setTitle('AI Synthesis: Consolidated Study Digest');
    setContent(`### AI Consolidated Notes Summary\n\n${summaryText}\n\n**Action Items**:\n- Review Ohm's Law inverted ratio before next quiz.`);
    setTagsInput('AI Summary, Review, Digest');
    setIsPinned(true);
    setIsEditing(true);
  };

  // AI Organize / Auto-tag Notes
  const handleAiOrganize = () => {
    alert('EduMind AI organized 3 notes and categorized tags under [Formula, Physics, Analogy].');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
            <Edit3 className="w-3.5 h-3.5" />
            Active Learning Notebook
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ✎ My Study Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Timestamped annotations and formulas captured directly during AI teacher explanations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAiOrganize}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Organize</span>
          </button>

          <button
            onClick={handleAiSummarizeAllNotes}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Summarize Notes</span>
          </button>

          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setTagsInput('');
              setIsPinned(false);
              setIsEditing(true);
              setActiveNoteId(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Note</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notes List & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search bar & Tag selector */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes and formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Tag filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedTag === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Card List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xs font-bold text-slate-900 leading-snug">
                      {note.title}
                    </h2>
                    {note.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {note.content}
                  </p>

                  {note.timestamp && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded w-fit">
                      <Clock className="w-3 h-3" />
                      <span>{note.timestamp}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Note Reader & Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between min-h-[500px]">
          {isEditing ? (
            /* Editing / Creating Form */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {activeNoteId ? 'Edit Note' : 'Create New Note'}
                </span>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                    isPinned ? 'bg-amber-50 border-amber-300 text-amber-800' : 'text-slate-400'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pin</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Note Title (e.g. Ohm's Law Circuit Rules)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />

              <input
                type="text"
                placeholder="Tags (comma-separated, e.g. Formula, Exam-Prep, Physics)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />

              <textarea
                rows={10}
                placeholder="Write your study notes, insights, and equations here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : activeNote ? (
            /* Active Note Display */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{activeNote.title}</h2>
                    {activeNote.timestamp && (
                      <p className="text-[11px] text-indigo-600 font-mono mt-0.5">
                        Recorded at {activeNote.timestamp}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTogglePin(activeNote.id)}
                      className={`p-1.5 rounded-lg border ${
                        activeNote.isPinned
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                      title="Pin note"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTitle(activeNote.title);
                        setContent(activeNote.content);
                        setTagsInput(activeNote.tags.join(', '));
                        setIsPinned(activeNote.isPinned);
                        setIsEditing(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteNote(activeNote.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeNote.content}
                </div>
              </div>

              {/* Tags footer */}
              <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {activeNote.tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Edit3 className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">No note selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
