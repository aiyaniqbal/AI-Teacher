import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Sliders,
  Plus,
  Filter,
} from 'lucide-react';
import { Flashcard, StudyMaterial } from '../../types';
import { AiTeachingService } from '../../services/aiService';

interface FlashcardWorkspaceProps {
  materials: StudyMaterial[];
  flashcards: Flashcard[];
  onUpdateFlashcard: (updated: Flashcard) => void;
  onAddFlashcards: (cards: Flashcard[]) => void;
}

export const FlashcardWorkspace: React.FC<FlashcardWorkspaceProps> = ({
  materials,
  flashcards,
  onUpdateFlashcard,
  onAddFlashcards,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'needs_practice' | 'starred'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter flashcards based on user selection
  const filteredCards = flashcards.filter((card) => {
    if (selectedMaterial !== 'all' && card.materialId !== selectedMaterial) return false;
    if (filterMode === 'needs_practice' && card.masteryStatus !== 'needs_practice') return false;
    if (filterMode === 'starred' && !card.isImportant) return false;
    return true;
  });

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  // Flip card
  const handleFlip = () => setIsFlipped(!isFlipped);

  // Mark Mastery Status
  const handleSetStatus = (status: 'known' | 'needs_practice') => {
    if (!currentCard) return;
    onUpdateFlashcard({
      ...currentCard,
      masteryStatus: status,
      lastReviewed: 'Just now',
    });
    // Auto advance
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  // Toggle Important Star
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    onUpdateFlashcard({
      ...currentCard,
      isImportant: !currentCard.isImportant,
    });
  };

  // AI Flashcard Generation
  const handleGenerateNewCards = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = AiTeachingService.generateFlashcards("Ohm's Law & Circuit Dynamics", 4);
      onAddFlashcards(generated);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-xs font-bold text-purple-700">
            <Layers className="w-3.5 h-3.5" />
            Spaced Repetition Engine
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Active recall cards generated from your learning material and weak areas.
          </p>
        </div>

        <button
          disabled={isGenerating}
          onClick={handleGenerateNewCards}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Generating...' : 'Generate Flashcards'}</span>
        </button>
      </div>

      {/* Filter and Selection Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              setFilterMode('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Cards ({flashcards.length})
          </button>
          <button
            onClick={() => {
              setFilterMode('needs_practice');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'needs_practice'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Practice ({flashcards.filter((f) => f.masteryStatus === 'needs_practice').length})</span>
          </button>
          <button
            onClick={() => {
              setFilterMode('starred');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'starred'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Important</span>
          </button>
        </div>

        <span className="text-xs font-mono font-bold text-slate-400 self-end sm:self-center">
          {filteredCards.length > 0 ? `${currentIndex + 1} / ${filteredCards.length}` : '0 cards'}
        </span>
      </div>

      {/* Main Flashcard Interactive Stage */}
      {currentCard ? (
        <div className="space-y-4">
          {/* Card Container with 3D Flip feel */}
          <div
            onClick={handleFlip}
            className={`min-h-[280px] sm:min-h-[320px] p-6 sm:p-10 rounded-3xl cursor-pointer transition-all duration-300 border shadow-md flex flex-col justify-between select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white border-indigo-700'
                : 'bg-white text-slate-900 border-slate-200/90 hover:border-indigo-300'
            }`}
          >
            {/* Top Bar of Card */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  isFlipped ? 'bg-indigo-800/60 text-indigo-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isFlipped ? 'Back (Answer & Formula)' : 'Front (Question)'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleStar}
                  className={`p-2 rounded-xl transition-colors ${
                    currentCard.isImportant
                      ? 'text-amber-400 hover:text-amber-500'
                      : isFlipped
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-300 hover:text-slate-600'
                  }`}
                  title="Mark as Important"
                >
                  <Star className={`w-5 h-5 ${currentCard.isImportant ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Center Content */}
            <div className="py-6 text-center space-y-3">
              <h2 className="text-lg sm:text-2xl font-bold leading-relaxed whitespace-pre-line">
                {isFlipped ? currentCard.back : currentCard.front}
              </h2>
            </div>

            {/* Bottom Hint */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold opacity-70">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card to flip</span>
            </div>
          </div>

          {/* Action Controls: Previous, Mark Known, Needs Practice, Next */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Quick Evaluation Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleSetStatus('needs_practice')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors active:scale-95"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>⚠ Need Practice</span>
              </button>

              <button
                onClick={() => handleSetStatus('known')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ I Know This</span>
              </button>
            </div>

            <button
              disabled={currentIndex >= filteredCards.length - 1}
              onClick={() => {
                setCurrentIndex((prev) => Math.min(filteredCards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 text-xs font-bold transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <h2 className="text-base font-bold text-slate-800">No flashcards match this filter</h2>
          <p className="text-xs text-slate-500">
            Generate new flashcards from your uploaded material to boost active recall.
          </p>
          <button
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
