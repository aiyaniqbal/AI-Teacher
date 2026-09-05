import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiCheckCircle, FiXCircle, FiArrowRight, FiRefreshCw, FiAward, FiTarget, FiBarChart2 } from 'react-icons/fi'

export default function Quiz() {
  const navigate = useNavigate()
  const { studentProfile, lessonPlan, performance, setPerformance } = useApp()
  const [quiz, setQuiz] = useState(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile && lessonPlan) {
      generateQuiz()
    }
  }, [studentProfile, lessonPlan])

  const generateQuiz = async () => {
    if (!studentProfile || !lessonPlan) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          lessonPlanId: lessonPlan.id,
          numQuestions: 5
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setQuiz(data.quiz)
        setCurrentQuestionIdx(0)
        setSelectedAnswers({})
        setQuizSubmitted(false)
        setResults(null)
      } else {
        setError(data.error || 'Failed to generate quiz')
      }
    } catch (err) {
      setError('Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async () => {
    if (!quiz || !studentProfile) return
    
    setLoading(true)
    
    try {
      const answers = quiz.questions.map((q, i) => ({
        questionId: q.id,
        answer: selectedAnswers[i] || '',
        correctAnswer: q.correctAnswer,
        topic: q.topic
      }))

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          quizId: quiz.id,
          answers
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setResults(data)
        setQuizSubmitted(true)
        setPerformance({
          ...performance,
          total: (performance.total || 0) + data.total,
          correct: (performance.correct || 0) + data.correct
        })
      }
    } catch (err) {
      setError('Failed to submit quiz')
    } finally {
      setLoading(false)
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
          <span className="text-5xl block mb-4">📝</span>
          <h2 className="text-2xl font-bold text-white mb-2">{getLangText('No content available', 'कोई सामग्री उपलब्ध नहीं', 'Koi content nahi')}</h2>
          <p className="text-dark-300 mb-4">{getLangText('Upload content or choose a topic first', 'पहले सामग्री अपलोड करें', 'Pehle content upload karein')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {getLangText('Get Started', 'शुरू करें', 'Shuru karein')}
          </button>
        </div>
      </div>
    )
  }

  // Results view
  if (quizSubmitted && results) {
    const scoreNum = parseInt(results.score)
    const passed = results.passed

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card text-center animate-fade-in">
          <div className="text-6xl mb-4">
            {passed ? '🎉' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {passed 
              ? getLangText('Congratulations!', 'बधाई हो!', 'Badhai ho!')
              : getLangText('Keep Practicing!', 'अभ्यास जारी रखें!', 'Abhyaas jari rakhein!')}
          </h2>
          <p className="text-dark-300 mb-6">{results.message}</p>
          
          {/* Score */}
          <div className="inline-flex items-center gap-4 bg-dark-800/50 rounded-2xl p-6 mb-6">
            <div>
              <div className="text-4xl font-bold gradient-text">{results.score}</div>
              <div className="text-sm text-dark-300">{getLangText('Score', 'स्कोर', 'Score')}</div>
            </div>
            <div className="w-px h-12 bg-dark-600" />
            <div className="text-left">
              <div className="flex items-center gap-2 text-green-400">
                <FiCheckCircle className="w-4 h-4" />
                <span>{results.correct} {getLangText('correct', 'सही', 'sahi')}</span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <FiXCircle className="w-4 h-4" />
                <span>{results.total - results.correct} {getLangText('incorrect', 'गलत', 'galat')}</span>
              </div>
            </div>
          </div>

          {/* Score visualization */}
          <div className="mb-6">
            <div className="h-4 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  passed ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-accent-500'
                }`}
                style={{ width: `${scoreNum}%` }}
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
            <FiTarget className="w-5 h-5 text-primary-400 inline mr-2" />
            <span className="text-dark-200">
              {passed 
                ? getLangText('Ready for the next topic! 🚀', 'अगले विषय के लिए तैयार! 🚀', 'Agle vishay ke liye taiyar! 🚀')
                : getLangText('Let\'s review weak areas and try again 📚', 'कमज़ोर क्षेत्रों की समीक्षा करें और फिर कोशिश करें 📚', 'Kamzor kshetro ki samiksha karein aur phir koshish karein 📚')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {passed ? (
              <>
                <button onClick={() => navigate('/roadmap')} className="btn-accent flex items-center justify-center gap-2">
                  <FiArrowRight className="w-4 h-4" />
                  {getLangText('View Roadmap', 'रोडमैप देखें', 'Roadmap Dekhein')}
                </button>
                <button onClick={generateQuiz} className="btn-secondary flex items-center justify-center gap-2">
                  <FiRefreshCw className="w-4 h-4" />
                  {getLangText('Take Another Quiz', 'एक और प्रश्नोत्तरी दें', 'Ek Aur Quiz Dein')}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/flashcards')} className="btn-accent flex items-center justify-center gap-2">
                  {getLangText('Review Flashcards', 'फ्लैशकार्ड्स देखें', 'Flashcards Dekhein')}
                </button>
                <button onClick={generateQuiz} className="btn-secondary flex items-center justify-center gap-2">
                  <FiRefreshCw className="w-4 h-4" />
                  {getLangText('Try Again', 'फिर से कोशिश करें', 'Phir Se Koshish Karein')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Quiz in progress
  if (quiz && quiz.questions.length > 0) {
    const question = quiz.questions[currentQuestionIdx]
    const progress = ((currentQuestionIdx + 1) / quiz.questions.length) * 100

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-dark-300 mb-2">
            <span>{getLangText('Question', 'प्रश्न', 'Sawaal')} {currentQuestionIdx + 1} / {quiz.questions.length}</span>
            <span>{quiz.difficulty}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="card animate-fade-in" key={currentQuestionIdx}>
          <div className="flex items-center gap-2 mb-4">
            <FiTarget className="w-5 h-5 text-accent-400" />
            <h3 className="text-sm font-semibold text-dark-300">
              {getLangText('Question', 'प्रश्न', 'Sawaal')} {currentQuestionIdx + 1}
            </h3>
            {question.hint && (
              <span className="ml-auto text-xs text-dark-400 bg-dark-700/50 px-2 py-1 rounded">
                💡 {question.hint}
              </span>
            )}
          </div>
          
          <p className="text-lg text-white mb-6">{question.question}</p>
          
          {/* Options */}
          {question.options ? (
            <div className="space-y-3 mb-6">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestionIdx]: option })}
                  className={`quiz-option w-full text-left ${
                    selectedAnswers[currentQuestionIdx] === option ? 'selected' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 font-medium text-sm ${
                      selectedAnswers[currentQuestionIdx] === option 
                        ? 'border-primary-500 bg-primary-500 text-white' 
                        : 'border-dark-500 text-dark-400'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="text-dark-200">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={selectedAnswers[currentQuestionIdx] || ''}
              onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [currentQuestionIdx]: e.target.value })}
              placeholder={getLangText('Type your answer...', 'अपना उत्तर टाइप करें...', 'Apna jawab type karein...')}
              className="input-field min-h-[100px] resize-y mb-6"
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
              disabled={currentQuestionIdx === 0}
              className="btn-secondary disabled:opacity-30"
            >
              {getLangText('Previous', 'पिछला', 'Pichla')}
            </button>
            
            {currentQuestionIdx < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                className="btn-primary flex items-center gap-2"
              >
                {getLangText('Next', 'अगला', 'Agla')}
                <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={loading}
                className="btn-accent flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiAward className="w-4 h-4" />
                    {getLangText('Submit Quiz', 'प्रश्नोत्तरी जमा करें', 'Quiz Jama Karein')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {getLangText('Generating Quiz...', 'प्रश्नोत्तरी बन रही है...', 'Quiz ban rahi hai...')}
            </h2>
            <p className="text-dark-300">
              {getLangText('Creating personalized questions for you', 'आपके लिए व्यक्तिगत प्रश्न बना रहे हैं', 'Aapke liye personalized prashna bana rahe hain')}
            </p>
          </>
        ) : error ? (
          <>
            <span className="text-5xl block mb-4">⚠️</span>
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-dark-300 mb-4">{error}</p>
            <button onClick={generateQuiz} className="btn-primary">
              {getLangText('Try Again', 'फिर से कोशिश करें', 'Phir Se Koshish Karein')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
