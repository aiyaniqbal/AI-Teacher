import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import Avatar from '../components/Avatar3D'
import VisualBoard from '../components/VisualBoard'
import { FiPlay, FiPause, FiSkipForward, FiMessageCircle, FiCheckCircle, FiXCircle, FiEdit3, FiArrowRight, FiVolume2, FiVolumeX, FiBookOpen, FiTarget } from 'react-icons/fi'

const teachingPhases = [
  { id: 'introduction', icon: '👋', label: 'Introduction' },
  { id: 'explanation', icon: '💡', label: 'Core Concepts' },
  { id: 'demonstration', icon: '📊', label: 'Visual Examples' },
  { id: 'practice', icon: '❓', label: 'Practice' },
  { id: 'assessment', icon: '📝', label: 'Assessment' },
  { id: 'summary', icon: '✅', label: 'Summary' }
]

export default function Teaching() {
  const navigate = useNavigate()
  const { 
    studentProfile, currentFile, lessonPlan, sessionId,
    setTranscript, transcript, performance, setPerformance,
    notes, setNotes, isSpeaking, setIsSpeaking
  } = useApp()
  
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(null)
  const audioRef = useRef(null)
  const [phaseContent, setPhaseContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showQuestion, setShowQuestion] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [showNotes, setShowNotes] = useState(false)
  const transcriptRef = useRef(null)
  const speechRef = useRef(null)

  useEffect(() => {
    if (lessonPlan && lessonPlan.phases) {
      setCurrentPhaseIdx(0)
      loadPhase(0)
    }
  }, [lessonPlan])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  useEffect(() => {
    if (autoPlay && !showQuestion && !loading) {
      const timer = setTimeout(() => {
        if (currentPhaseIdx < (lessonPlan?.phases?.length || 0) - 1) {
          advancePhase()
        }
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, currentPhaseIdx, showQuestion, loading])

  const loadPhase = async (phaseIdx) => {
    if (!lessonPlan || !lessonPlan.phases || phaseIdx >= lessonPlan.phases.length) return
    
    const phase = lessonPlan.phases[phaseIdx]
    setCurrentPhase(phase)
    setPhaseContent(phase.content)
    
    // Add to transcript
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'teacher',
      phaseType: phase.type,
      content: phase.content.script,
      visuals: phase.content.visuals
    }
    setTranscript(prev => [...prev, newEntry])

    // Speak the content if voice is enabled
    if (voiceEnabled && 'speechSynthesis' in window) {
      speakText(phase.content.script)
    }

    // If it's practice or assessment phase, generate a question
    if (phase.type === 'practice' || phase.type === 'assessment') {
      setTimeout(() => generateQuestion(phase.type), 3000)
    }
  }

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 500))
      utterance.lang = studentProfile?.language === 'hindi' ? 'hi-IN' : 'en-US'
      utterance.rate = 0.9
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const advancePhase = async () => {
    if (currentPhaseIdx < (lessonPlan?.phases?.length || 0) - 1) {
      const nextIdx = currentPhaseIdx + 1
      setCurrentPhaseIdx(nextIdx)
      setShowQuestion(false)
      setAnswerSubmitted(false)
      setEvaluation(null)
      setSelectedAnswer('')
      await loadPhase(nextIdx)
    }
  }

  const generateQuestion = async (phaseType) => {
    if (!studentProfile || !lessonPlan) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          lessonPlanId: lessonPlan.id,
          topic: currentPhase?.type
        })
      })
      const data = await response.json()
      if (data.success) {
        setCurrentQuestion(data.question)
        setShowQuestion(true)
        
        // Add question to transcript
        setTranscript(prev => [...prev, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: 'question',
          content: data.question.text,
          options: data.question.options
        }])
      }
    } catch (err) {
      console.error('Failed to generate question:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return
    
    setAnswerSubmitted(true)
    setIsSpeaking(false)
    
    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          topic: currentPhase?.type
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setEvaluation(data.evaluation)
        setPerformance(data.performance || performance)
        
        // Add evaluation to transcript
        setTranscript(prev => [...prev, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: 'evaluation',
          content: data.evaluation.feedback,
          isCorrect: data.evaluation.isCorrect,
          encouragement: data.evaluation.encouragement
        }])
        
        // Speak feedback
        if (voiceEnabled) {
          speakText(data.evaluation.feedback)
        }

        // If incorrect, show re-explanation and adaptation
        if (!data.evaluation.isCorrect && data.adaptation?.newApproach) {
          setTimeout(() => {
            setTranscript(prev => [...prev, {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              type: 're_explanation',
              content: data.adaptation.newApproach.newExplanation,
              visual: data.adaptation.newApproach.suggestedVisual
            }])
          }, 2000)
        }
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleNextQuestion = () => {
    setShowQuestion(false)
    setAnswerSubmitted(false)
    setEvaluation(null)
    setSelectedAnswer('')
    setCurrentQuestion(null)
    
    // Generate another question after a delay
    setTimeout(() => generateQuestion(currentPhase?.type), 1000)
  }

  const endSession = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    navigate('/reports')
  }

  if (!studentProfile || !lessonPlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <span className="text-5xl block mb-4">📚</span>
          <h2 className="text-2xl font-bold text-white mb-2">No lesson loaded</h2>
          <p className="text-dark-300 mb-4">Please upload content or choose a topic first</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Onboarding
          </button>
        </div>
      </div>
    )
  }

  const getLangText = (en, hi, hiEn) => {
    if (studentProfile.language === 'hindi') return hi
    if (studentProfile.language === 'hinglish') return hiEn
    return en
  }

  const phaseProgress = ((currentPhaseIdx + 1) / lessonPlan.phases.length) * 100

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Phase progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FiBookOpen className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-dark-300">
              {getLangText('Lesson Progress', 'पाठ प्रगति', 'Lesson Progress')}
            </span>
          </div>
          <span className="text-sm text-dark-400">
            {currentPhaseIdx + 1} / {lessonPlan.phases.length}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${phaseProgress}%` }} />
        </div>
        
        {/* Phase indicators */}
        <div className="flex justify-between mt-3">
          {lessonPlan.phases.map((phase, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 text-xs ${
                i < currentPhaseIdx ? 'text-green-400' :
                i === currentPhaseIdx ? 'text-primary-400 font-medium' :
                'text-dark-500'
              }`}
            >
              <span>{i < currentPhaseIdx ? '✅' : teachingPhases[i]?.icon || '📖'}</span>
              <span className="hidden sm:inline">{teachingPhases[i]?.label || phase.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content area - split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Visual Board (smaller) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
                  <FiTarget className="w-4 h-4" />
                  {getLangText('Visual Board', 'दृश्य बोर्ड', 'Visual Board')}
                </h3>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title={voiceEnabled ? 'Mute' : 'Unmute'}
                >
                  {voiceEnabled ? (
                    <FiVolume2 className="w-4 h-4 text-primary-400" />
                  ) : (
                    <FiVolumeX className="w-4 h-4 text-dark-400" />
                  )}
                </button>
              </div>
              
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <Avatar 
                  speaking={isSpeaking} 
                  expression={currentPhase?.type === 'assessment' ? 'questioning' : 
                    currentPhase?.type === 'summary' ? 'proud' : 'explaining'}
                  size="md"
                  audioRef={audioRef}
                />
                <audio
                  ref={audioRef}
                  crossOrigin="anonymous"
                />
              </div>

              {/* Current phase info */}
              {currentPhase && (
                <div className="text-center">
                  <div className="badge-primary mb-2">
                    {currentPhase.title}
                  </div>
                  <p className="text-xs text-dark-400">
                    {currentPhase.duration} min • {getLangText('Phase', 'चरण', 'Phase')} {currentPhaseIdx + 1}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="glass-card p-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  autoPlay 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
                title={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
              >
                {autoPlay ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
              </button>
              
              <button
                onClick={advancePhase}
                disabled={currentPhaseIdx >= lessonPlan.phases.length - 1}
                className="p-3 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-all duration-200 disabled:opacity-30"
                title="Next phase"
              >
                <FiSkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={endSession}
                className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                title="End session"
              >
                <FiArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Transcript + Question area */}
        <div className="lg:col-span-2">
          {/* Transcript */}
          <div className="glass-card mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
                <FiMessageCircle className="w-4 h-4" />
                {getLangText('Transcript', 'प्रतिलिपि', 'Transcript')}
              </h3>
              <span className="text-xs text-dark-400">{transcript.length} messages</span>
            </div>
            
            <div 
              ref={transcriptRef}
              className="p-4 max-h-[500px] overflow-y-auto space-y-3"
            >
              {transcript.map((entry) => (
                <div key={entry.id} className="transcript-line animate-slide-up">
                  {entry.type === 'teacher' && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1 bg-dark-800/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary-400">AI Teacher</span>
                          <span className="text-xs text-dark-500">•</span>
                          <span className="text-xs text-dark-500">{entry.phaseType}</span>
                        </div>
                        <p className="text-sm text-dark-200 whitespace-pre-line">{entry.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {entry.type === 'question' && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">❓</span>
                      </div>
                      <div className="flex-1 bg-accent-500/10 border border-accent-500/20 rounded-xl p-3">
                        <span className="text-xs font-medium text-accent-400">Question</span>
                        <p className="text-sm text-white mt-1">{entry.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {entry.type === 'evaluation' && (
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {entry.isCorrect ? (
                          <FiCheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <FiXCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className={`flex-1 rounded-xl p-3 ${
                        entry.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                        <p className="text-sm text-white">{entry.content}</p>
                        {entry.encouragement && (
                          <p className="text-xs text-dark-300 mt-1">{entry.encouragement}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {entry.type === 're_explanation' && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">💡</span>
                      </div>
                      <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                        <span className="text-xs font-medium text-yellow-400">Re-explanation</span>
                        <p className="text-sm text-dark-200 mt-1">{entry.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-dark-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question area */}
          {showQuestion && currentQuestion && (
            <div className="glass-card animate-slide-up">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiTarget className="w-5 h-5 text-accent-400" />
                  <h3 className="font-semibold text-white">
                    {getLangText('Question', 'प्रश्न', 'Sawaal')}
                  </h3>
                  <span className="badge-accent ml-auto">
                    {currentQuestion.difficulty}
                  </span>
                </div>
                
                <p className="text-dark-200 mb-4">{currentQuestion.question}</p>
                
                {/* Options or open answer */}
                {currentQuestion.options ? (
                  <div className="space-y-2 mb-4">
                    {currentQuestion.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => !answerSubmitted && setSelectedAnswer(option)}
                        disabled={answerSubmitted}
                        className={`quiz-option w-full text-left ${
                          selectedAnswer === option ? 'selected' : ''
                        } ${
                          answerSubmitted && option === currentQuestion.correctAnswer ? 'correct' : ''
                        } ${
                          answerSubmitted && selectedAnswer === option && option !== currentQuestion.correctAnswer ? 'incorrect' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedAnswer === option ? 'border-primary-500 bg-primary-500' : 'border-dark-500'
                          }`}>
                            {selectedAnswer === option && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-sm text-dark-200">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4">
                    <textarea
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      placeholder={getLangText('Type your answer...', 'अपना उत्तर टाइप करें...', 'Apna jawab type karein...')}
                      className="input-field min-h-[80px] resize-none"
                      disabled={answerSubmitted}
                    />
                  </div>
                )}

                {/* Submit / Next buttons */}
                {!answerSubmitted ? (
                  <button
                    onClick={submitAnswer}
                    disabled={!selectedAnswer}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {getLangText('Submit Answer', 'उत्तर जमा करें', 'Jawab jama karein')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Evaluation result */}
                    {evaluation && (
                      <div className={`rounded-xl p-4 ${
                        evaluation.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                        <p className="text-white font-medium mb-1">{evaluation.feedback}</p>
                        <p className="text-sm text-dark-300">{evaluation.encouragement}</p>
                        
                        {!evaluation.isCorrect && currentQuestion.hint && (
                          <div className="mt-3 p-3 bg-dark-800/50 rounded-lg">
                            <p className="text-xs text-dark-400">
                              <FiTarget className="w-3 h-3 inline mr-1" />
                              {getLangText('Hint:', 'संकेत:', 'Hint:')} {currentQuestion.hint}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleNextQuestion}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <FiArrowRight className="w-4 h-4" />
                      {getLangText('Next Question', 'अगला प्रश्न', 'Agla Sawaal')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes section */}
          <div className="glass-card mt-4">
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => setShowNotes(!showNotes)}
            >
              <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
                <FiEdit3 className="w-4 h-4" />
                {getLangText('My Notes', 'मेरे नोट्स', 'Mere Notes')}
              </h3>
              <span className="text-xs text-dark-400">
                {showNotes ? '▼' : '▶'}
              </span>
            </div>
            
            {showNotes && (
              <div className="px-4 pb-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={getLangText(
                    'Take notes here while learning...\n\n• Key points\n• Questions to ask later\n• Things to review',
                    'यहाँ सीखते समय नोट्स लिखें...\n\n• मुख्य बिंदु\n• बाद में पूछने के लिए प्रश्न\n• समीक्षा के लिए चीजें',
                    'Yahan seekhte samay notes likhein...\n\n• Key points\n• Baad mein poochne ke liye sawaal\n• Review ke liye cheezein'
                  )}
                  className="w-full bg-dark-800/50 border border-dark-600/50 rounded-xl p-3 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[120px] resize-y"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}