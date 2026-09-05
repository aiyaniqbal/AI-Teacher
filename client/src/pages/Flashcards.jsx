import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiArrowRight, FiRefreshCw, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, FiLayers } from 'react-icons/fi'

export default function Flashcards() {
  const navigate = useNavigate()
  const { studentProfile, lessonPlan } = useApp()
  const [flashcards, setFlashcards] = useState(null)
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(new Set())
  const [unknown, setUnknown] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile && lessonPlan) {
      generateFlashcards()
    }
  }, [studentProfile, lessonPlan])

  const generateFlashcards = async () => {
    if (!studentProfile || !lessonPlan) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          lessonPlanId: lessonPlan.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setFlashcards(data.flashcards)
        setCurrentCardIdx(0)
        setFlipped(false)
        setKnown(new Set())
        setUnknown(new Set())
      }
    } catch (err) {
      setError('Failed to generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  const markCard = (isKnown) => {
    if (isKnown) {
      setKnown(prev => new Set([...prev, currentCardIdx]))
      setUnknown(prev => {
        const next = new Set(prev)
        next.delete(currentCardIdx)
        return next
      })
    } else {
      setUnknown(prev => new Set([...prev, currentCardIdx]))
      setKnown(prev => {
        const next = new Set(prev)
        next.delete(currentCardIdx)
        return next
      })
    }
    // Auto advance
    if (currentCardIdx < (flashcards?.cards?.length || 0) - 1) {
      setTimeout(() => {
        setCurrentCardIdx(currentCardIdx + 1)
        setFlipped(false)
      }, 300)
    }
  }

  const getLangText = (en, hi, hiEn) => {
    if (!studentProfile) return en
    if (studentProfile.language === 'hindi') return hi
    if (studentProfile.language === 'hinglish') return hiEn
    return en
  }

  if (!studentProfile || !lessonPlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <span className="text-5xl block mb-4">🃏</span>
          <h2 className="text-2xl font-bold text-white mb-2">{getLangText('No content available', 'कोई सामग्री उपलब्ध नहीं', 'Koi content nahi')}</h2>
          <p className="text-dark-300 mb-4">{getLangText('Upload content first', 'पहले सामग्री अपलोड करें', 'Pehle content upload karein')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {getLangText('Get Started', 'शुरू करें', 'Shuru karein')}
          </button>
        </div>
      </div>
    )
  }

  if (loading || !flashcards) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {getLangText('Generating Flashcards...', 'फ्लैशकार्ड्स बन रहे हैं...', 'Flashcards ban rahe hain...')}
          </h2>
        </div>
      </div>
    )
  }

  const cards = flashcards.cards || []
  const currentCard = cards[currentCardIdx]
  const totalCards = cards.length
  const knownCount = known.size
  const unknownCount = unknown.size
  const reviewedCount = knownCount + unknownCount

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <FiLayers className="w-6 h-6 text-primary-400" />
          {flashcards.title || getLangText('Flashcards', 'फ्लैशकार्ड्स', 'Flashcards')}
        </h1>
        <p className="text-dark-300">
          {getLangText('Tap to flip • Mark as known/unknown', 'फ्लिप करने के लिए टैप करें', 'Flip karne ke liye tap karein')}
        </p>
      </div>

      {/* Progress stats */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{currentCardIdx + 1}/{totalCards}</div>
          <div className="text-xs text-dark-400">{getLangText('Current', 'वर्तमान', 'Current')}</div>
        </div>
        <div className="w-px bg-dark-600" />
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{knownCount}</div>
          <div className="text-xs text-dark-400">{getLangText('Known', 'ज्ञात', 'Known')}</div>
        </div>
        <div className="w-px bg-dark-600" />
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{unknownCount}</div>
          <div className="text-xs text-dark-400">{getLangText('Unknown', 'अज्ञात', 'Unknown')}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-6">
        <div 
          className="progress-fill" 
          style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div 
          className={`flashcard mb-6 cursor-pointer ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flashcard-inner">
            {/* Front */}
            <div className="flashcard-front bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/30">
              <div>
                <span className="text-xs text-primary-300 mb-2 block">
                  {getLangText('Term', 'शब्द', 'Term')}
                </span>
                <h3 className="text-2xl font-bold text-white">{currentCard.front}</h3>
                <p className="text-sm text-dark-400 mt-4">
                  {getLangText('Tap to reveal answer', 'उत्तर देखने के लिए टैप करें', 'Jawab dekhne ke liye tap karein')}
                </p>
              </div>
            </div>
            
            {/* Back */}
            <div className="flashcard-back bg-gradient-to-br from-accent-500/20 to-accent-700/20 border border-accent-500/30">
              <div>
                <span className="text-xs text-accent-300 mb-2 block">
                  {getLangText('Definition', 'परिभाषा', 'Definition')}
                </span>
                <p className="text-lg text-white">{currentCard.back}</p>
                {currentCard.example && (
                  <p className="text-sm text-dark-300 mt-3 italic">💡 {currentCard.example}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => { setCurrentCardIdx(Math.max(0, currentCardIdx - 1)); setFlipped(false) }}
          disabled={currentCardIdx === 0}
          className="p-3 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-all disabled:opacity-30"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => markCard(false)}
          className="flex-1 py-3 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <FiXCircle className="w-5 h-5" />
          {getLangText("Don't Know", 'नहीं आता', 'Nahi Aata')}
        </button>
        
        <button
          onClick={() => markCard(true)}
          className="flex-1 py-3 px-4 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <FiCheckCircle className="w-5 h-5" />
          {getLangText('Know It', 'आता है', 'Aata Hai')}
        </button>
        
        <button
          onClick={() => { setCurrentCardIdx(Math.min(totalCards - 1, currentCardIdx + 1)); setFlipped(false) }}
          disabled={currentCardIdx >= totalCards - 1}
          className="p-3 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-all disabled:opacity-30"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Results when all cards reviewed */}
      {reviewedCount === totalCards && (
        <div className="card text-center animate-fade-in">
          <div className="text-4xl mb-3">
            {knownCount > unknownCount ? '🎉' : '📚'}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {getLangText('Review Complete!', 'समीक्षा पूर्ण!', 'Review Purn!')}
          </h3>
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{knownCount}</div>
              <div className="text-sm text-dark-300">{getLangText('Known', 'ज्ञात', 'Known')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{unknownCount}</div>
              <div className="text-sm text-dark-300">{getLangText('Need Review', 'समीक्षा चाहिए', 'Review Chahiye')}</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={generateFlashcards} className="btn-secondary flex items-center gap-2">
              <FiRefreshCw className="w-4 h-4" />
              {getLangText('Restart', 'पुनरारंभ', 'Restart')}
            </button>
            <button onClick={() => navigate('/quiz')} className="btn-primary flex items-center gap-2">
              {getLangText('Take Quiz', 'प्रश्नोत्तरी दें', 'Quiz Dein')}
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Card indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentCardIdx(i); setFlipped(false) }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentCardIdx ? 'bg-primary-400 scale-125' :
              known.has(i) ? 'bg-green-500' :
              unknown.has(i) ? 'bg-red-500' :
              'bg-dark-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
