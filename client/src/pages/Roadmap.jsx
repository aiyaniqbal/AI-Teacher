import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiTarget, FiCheckCircle, FiClock, FiArrowRight, FiBook, FiStar, FiAlertTriangle } from 'react-icons/fi'

export default function Roadmap() {
  const navigate = useNavigate()
  const { studentProfile } = useApp()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile) {
      fetchRoadmap()
    }
  }, [studentProfile])

  const fetchRoadmap = async () => {
    if (!studentProfile) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/roadmap/${studentProfile.id}`)
      const data = await response.json()
      
      if (data.success) {
        setRoadmap(data.roadmap)
      }
    } catch (err) {
      setError('Failed to load roadmap')
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

  if (!studentProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <span className="text-5xl block mb-4">🗺️</span>
          <h2 className="text-2xl font-bold text-white mb-2">No profile found</h2>
          <p className="text-dark-300 mb-4">Set up your profile first</p>
          <button onClick={() => navigate('/')} className="btn-primary">Get Started</button>
        </div>
      </div>
    )
  }

  if (loading || !roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {getLangText('Building your roadmap...', 'आपका रोडमैप बन रहा है...', 'Aapka roadmap ban raha hai...')}
          </h2>
        </div>
      </div>
    )
  }

  const sectionIcons = {
    topics: FiBook,
    strengths: FiStar,
    next_steps: FiArrowRight,
    improvement: FiAlertTriangle
  }

  const sectionColors = {
    topics: 'from-primary-500/20 to-primary-700/20 border-primary-500/30',
    strengths: 'from-green-500/20 to-green-700/20 border-green-500/30',
    next_steps: 'from-accent-500/20 to-accent-700/20 border-accent-500/30',
    improvement: 'from-yellow-500/20 to-yellow-700/20 border-yellow-500/30'
  }

  const sectionTextColors = {
    topics: 'text-primary-300',
    strengths: 'text-green-300',
    next_steps: 'text-accent-300',
    improvement: 'text-yellow-300'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <FiTarget className="w-6 h-6 text-accent-400" />
          {getLangText('Your Learning Roadmap', 'आपका सीखने का रोडमैप', 'Aapka Learning Roadmap')}
        </h1>
        <p className="text-dark-300">
          {getLangText('Personalized path based on your performance', 'आपके प्रदर्शन के आधार पर व्यक्तिगत रास्ता', 'Aapke performance ke aadhar par personalized rasta')}
        </p>
      </div>

      {/* Student info */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
            {studentProfile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{roadmap.studentName}</h3>
            <p className="text-sm text-dark-300">
              {roadmap.level} • {roadmap.currentProgress} sessions completed
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-dark-400">
              <FiClock className="w-4 h-4 inline mr-1" />
              {roadmap.estimatedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap sections */}
      <div className="space-y-6">
        {roadmap.sections?.map((section, i) => {
          const Icon = sectionIcons[section.type] || FiBook
          const colorClass = sectionColors[section.type] || sectionColors.topics
          const textColor = sectionTextColors[section.type] || sectionTextColors.topics
          
          return (
            <div 
              key={i} 
              className={`card bg-gradient-to-br ${colorClass} animate-fade-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${textColor}`} />
                </div>
                <h3 className={`font-semibold ${textColor}`}>{section.title}</h3>
              </div>
              
              <div className="space-y-2">
                {section.items?.map((item, j) => (
                  <div 
                    key={j} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/30 hover:bg-dark-800/50 transition-colors"
                  >
                    {section.type === 'strengths' ? (
                      <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    ) : section.type === 'improvement' ? (
                      <FiAlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    ) : section.type === 'next_steps' ? (
                      <FiArrowRight className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                    )}
                    <span className="text-sm text-dark-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <button onClick={() => navigate('/teach')} className="btn-primary flex items-center justify-center gap-2">
          <FiBook className="w-4 h-4" />
          {getLangText('Continue Learning', 'सीखना जारी रखें', 'Seekhna Jari Rakhein')}
        </button>
        <button onClick={() => navigate('/quiz')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('Take a Quiz', 'प्रश्नोत्तरी दें', 'Quiz Dein')}
        </button>
        <button onClick={() => navigate('/reports')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('View Reports', 'रिपोर्ट देखें', 'Reports Dekhein')}
        </button>
      </div>
    </div>
  )
}
