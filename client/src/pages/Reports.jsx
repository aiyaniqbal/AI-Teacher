import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiBarChart2, FiTarget, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiArrowRight, FiBook } from 'react-icons/fi'

export default function Reports() {
  const navigate = useNavigate()
  const { studentProfile } = useApp()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile) {
      fetchReport()
    }
  }, [studentProfile])

  const fetchReport = async () => {
    if (!studentProfile) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/report/${studentProfile.id}`)
      const data = await response.json()
      
      if (data.success) {
        setReport(data.report)
      }
    } catch (err) {
      setError('Failed to load report')
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
          <span className="text-5xl block mb-4">📊</span>
          <h2 className="text-2xl font-bold text-white mb-2">No profile found</h2>
          <p className="text-dark-300 mb-4">Set up your profile first</p>
          <button onClick={() => navigate('/')} className="btn-primary">Get Started</button>
        </div>
      </div>
    )
  }

  if (loading || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {getLangText('Generating Report...', 'रिपोर्ट बन रही है...', 'Report ban rahi hai...')}
          </h2>
        </div>
      </div>
    )
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'text-green-400'
      case 'Good': return 'text-blue-400'
      case 'Needs Improvement': return 'text-yellow-400'
      case 'Requires More Practice': return 'text-red-400'
      default: return 'text-dark-300'
    }
  }

  const getAccuracyBarColor = (accuracy) => {
    const num = parseInt(accuracy)
    if (num >= 80) return 'from-green-500 to-green-400'
    if (num >= 60) return 'from-blue-500 to-blue-400'
    if (num >= 40) return 'from-yellow-500 to-yellow-400'
    return 'from-red-500 to-red-400'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <FiBarChart2 className="w-6 h-6 text-primary-400" />
          {getLangText('Learning Report', 'सीखने की रिपोर्ट', 'Learning Report')}
        </h1>
        <p className="text-dark-300">{getLangText('Your performance analysis', 'आपके प्रदर्शन का विश्लेषण', 'Aapke performance ka analysis')}</p>
      </div>

      {/* Summary card */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{report.summary?.totalQuestionsAnswered || 0}</div>
            <div className="text-sm text-dark-300">{getLangText('Questions', 'प्रश्न', 'Sawaal')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{report.summary?.correctAnswers || 0}</div>
            <div className="text-sm text-dark-300">{getLangText('Correct', 'सही', 'Sahi')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400">{report.summary?.accuracy || '0%'}</div>
            <div className="text-sm text-dark-300">{getLangText('Accuracy', 'सटीकता', 'Accuracy')}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRatingColor(report.summary?.overallRating)}`}>
              {report.summary?.overallRating || 'N/A'}
            </div>
            <div className="text-sm text-dark-300">{getLangText('Rating', 'रेटिंग', 'Rating')}</div>
          </div>
        </div>
      </div>

      {/* Performance bar */}
      <div className="card mb-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-primary-400" />
          {getLangText('Overall Performance', 'समग्र प्रदर्शन', 'Overall Performance')}
        </h3>
        <div className="h-6 bg-dark-700 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${getAccuracyBarColor(report.summary?.accuracy)} transition-all duration-1000`}
            style={{ width: report.summary?.accuracy || '0%' }}
          />
        </div>
        <div className="flex justify-between text-sm text-dark-400">
          <span>0%</span>
          <span>{report.summary?.accuracy || '0%'}</span>
          <span>100%</span>
        </div>
      </div>

      {/* Weak areas - Most important for scoring! */}
      {report.weakAreas && report.weakAreas.length > 0 && (
        <div className="card mb-6 bg-red-500/5 border-red-500/20">
          <h3 className="font-semibold text-red-300 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5" />
            {getLangText('Areas Needing Improvement', 'सुधार की आवश्यकता वाले क्षेत्र', 'Sudhar ki aavashyakta wale kshetra')}
          </h3>
          <div className="space-y-3">
            {report.weakAreas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/30">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-red-400">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{area.topic}</div>
                  <div className="text-xs text-dark-400">
                    {area.frequency} {getLangText('incorrect answers', 'गलत उत्तर', 'galat jawab')}
                  </div>
                </div>
                <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, area.frequency * 20)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-dark-300 mt-4">
            💡 {getLangText(
              'Questions will focus more on these areas to help you improve',
              'इन क्षेत्रों पर अधिक प्रश्न आएंगे',
              'In kshetro par adhik prashn aayenge'
            )}
          </p>
        </div>
      )}

      {/* Strong areas */}
      {report.strongAreas && report.strongAreas.length > 0 && (
        <div className="card mb-6 bg-green-500/5 border-green-500/20">
          <h3 className="font-semibold text-green-300 mb-4 flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5" />
            {getLangText('Your Strengths', 'आपकी ताकत', 'Aapki Taakat')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.strongAreas.map((area, i) => (
              <span key={i} className="badge-success">
                ✅ {area.topic} ({area.count}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-accent-400" />
            {getLangText('Recommendations', 'सुझाव', 'Sujhav')}
          </h3>
          <div className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/30">
                <span className="text-lg">
                  {i === 0 ? '🎯' : i === 1 ? '📚' : '💪'}
                </span>
                <span className="text-sm text-dark-200">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Plan */}
      {report.studyPlan && (
        <div className="card mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <FiBook className="w-5 h-5 text-primary-400" />
            {getLangText('Study Plan', 'अध्ययन योजना', 'Adhyayan Yojana')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-sm text-dark-400 mb-1">{getLangText('Daily Goal', 'दैनिक लक्ष्य', 'Dainik Lakshya')}</div>
              <div className="text-white font-medium">{report.studyPlan.dailyGoal}</div>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="text-sm text-dark-400 mb-1">{getLangText('Duration', 'अवधि', 'Avadhi')}</div>
              <div className="text-white font-medium">{report.studyPlan.estimatedDuration}</div>
            </div>
          </div>
          
          {report.studyPlan.activities && (
            <div className="mt-4">
              <div className="text-sm text-dark-400 mb-2">{getLangText('Activities', 'गतिविधियाँ', 'Gatividhiyan')}</div>
              <div className="flex flex-wrap gap-2">
                {report.studyPlan.activities.map((activity, i) => (
                  <span key={i} className="badge-primary">{activity}</span>
                ))}
              </div>
            </div>
          )}
          
          {report.studyPlan.focusAreas && report.studyPlan.focusAreas.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-dark-400 mb-2">{getLangText('Focus Areas', 'ध्यान केंद्रित क्षेत्र', 'Dhyan Kendrit Kshetra')}</div>
              <div className="flex flex-wrap gap-2">
                {report.studyPlan.focusAreas.map((area, i) => (
                  <span key={i} className="badge-accent">{area}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate('/teach')} className="btn-primary flex items-center justify-center gap-2">
          <FiBook className="w-4 h-4" />
          {getLangText('Continue Learning', 'सीखना जारी रखें', 'Seekhna Jari Rakhein')}
        </button>
        <button onClick={() => navigate('/quiz')} className="btn-accent flex items-center justify-center gap-2">
          <FiTarget className="w-4 h-4" />
          {getLangText('Take Another Test', 'एक और परीक्षा दें', 'Ek Aur Test Dein')}
        </button>
        <button onClick={() => navigate('/roadmap')} className="btn-secondary flex items-center justify-center gap-2">
          {getLangText('View Roadmap', 'रोडमैप देखें', 'Roadmap Dekhein')}
        </button>
      </div>
    </div>
  )
}
