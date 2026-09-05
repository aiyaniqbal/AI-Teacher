import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiFileText, FiCheckCircle, FiArrowRight, FiBook, FiTarget, FiClock } from 'react-icons/fi'

export default function Summary() {
  const navigate = useNavigate()
  const { studentProfile, lessonPlan, notes } = useApp()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile && lessonPlan) {
      generateSummary()
    }
  }, [studentProfile, lessonPlan])

  const generateSummary = async () => {
    if (!studentProfile || !lessonPlan) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          lessonPlanId: lessonPlan.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setSummary(data.summary)
      }
    } catch (err) {
      setError('Failed to generate summary')
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
          <span className="text-5xl block mb-4">📋</span>
          <h2 className="text-2xl font-bold text-white mb-2">{getLangText('No lesson available', 'कोई पाठ उपलब्ध नहीं', 'Koi lesson nahi')}</h2>
          <p className="text-dark-300 mb-4">{getLangText('Complete a lesson first', 'पहले एक पाठ पूरा करें', 'Pehle ek lesson poora karein')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {getLangText('Get Started', 'शुरू करें', 'Shuru karein')}
          </button>
        </div>
      </div>
    )
  }

  if (loading || !summary) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {getLangText('Generating Summary...', 'सारांश बन रहा है...', 'Summary ban raha hai...')}
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <FiFileText className="w-6 h-6 text-primary-400" />
          {summary.title || getLangText('Lesson Summary', 'पाठ सारांश', 'Lesson Summary')}
        </h1>
        <p className="text-dark-300">
          {getLangText('Overview of what you learned', 'आपने क्या सीखा इसका अवलोकन', 'Aapne kya seekha iska avlokan')}
        </p>
      </div>

      {/* Overview */}
      <div className="card mb-6">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <FiBook className="w-5 h-5 text-primary-400" />
          {getLangText('Overview', 'अवलोकन', 'Avlokan')}
        </h3>
        <p className="text-dark-200 leading-relaxed">{summary.overview}</p>
      </div>

      {/* Key Takeaways */}
      {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-accent-400" />
            {getLangText('Key Takeaways', 'मुख्य निष्कर्ष', 'Mukhya Nishkarsh')}
          </h3>
          <div className="space-y-2">
            {summary.keyTakeaways.map((takeaway, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/30">
                <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-dark-200">{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concepts Learned */}
      {summary.conceptsLearned && summary.conceptsLearned.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-4">
            {getLangText('Concepts Learned', 'सीखी गई अवधारणाएं', 'Seekhi Gai Avdharanaen')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.conceptsLearned.map((concept, i) => (
              <div key={i} className="p-3 rounded-lg bg-dark-800/30 border border-dark-600/30">
                <div className="font-medium text-primary-300 text-sm">{concept.term}</div>
                <div className="text-xs text-dark-300 mt-1">{concept.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Time */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <FiClock className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <div className="text-white font-medium">
              {getLangText('Study Time', 'अध्ययन समय', 'Study Time')}: {summary.studyTime}
            </div>
            <div className="text-sm text-dark-300">
              {getLangText('Great effort!', 'बहुत अच्छा प्रयास!', 'Bahut accha prayas!')} 💪
            </div>
          </div>
        </div>
      </div>

      {/* Notes from session */}
      {notes && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-3">
            {getLangText('Your Notes', 'आपके नोट्स', 'Aapke Notes')}
          </h3>
          <div className="bg-dark-800/50 rounded-xl p-4">
            <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans">{notes}</pre>
          </div>
        </div>
      )}

      {/* Next Recommendations */}
      {summary.nextRecommendations && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-4">
            {getLangText('What to do next', 'अगला कदम', 'Agla Kadam')}
          </h3>
          <div className="space-y-2">
            {summary.nextRecommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/30">
                <span className="text-lg">
                  {i === 0 ? '📝' : i === 1 ? '🃏' : '🚀'}
                </span>
                <span className="text-sm text-dark-200">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate('/quiz')} className="btn-accent flex items-center justify-center gap-2">
          {getLangText('Take Quiz', 'प्रश्नोत्तरी दें', 'Quiz Dein')}
        </button>
        <button onClick={() => navigate('/flashcards')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('Review Flashcards', 'फ्लैशकार्ड्स देखें', 'Flashcards Dekhein')}
        </button>
        <button onClick={() => navigate('/mindmap')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('View Mind Map', 'माइंडमैप देखें', 'Mindmap Dekhein')}
        </button>
        <button onClick={() => navigate('/reports')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('View Reports', 'रिपोर्ट देखें', 'Reports Dekhein')}
        </button>
      </div>
    </div>
  )
}
