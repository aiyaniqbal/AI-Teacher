import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiMap, FiRefreshCw } from 'react-icons/fi'

export default function Mindmap() {
  const navigate = useNavigate()
  const { studentProfile, lessonPlan } = useApp()
  const [mindmap, setMindmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentProfile && lessonPlan) {
      generateMindmap()
    }
  }, [studentProfile, lessonPlan])

  const generateMindmap = async () => {
    if (!studentProfile || !lessonPlan) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: studentProfile.id,
          lessonPlanId: lessonPlan.id
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMindmap(data.mindmap)
      }
    } catch (err) {
      setError('Failed to generate mindmap')
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
          <span className="text-5xl block mb-4">🗺️</span>
          <h2 className="text-2xl font-bold text-white mb-2">{getLangText('No content available', 'कोई सामग्री उपलब्ध नहीं', 'Koi content nahi')}</h2>
          <p className="text-dark-300 mb-4">{getLangText('Upload content first', 'पहले सामग्री अपलोड करें', 'Pehle content upload karein')}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            {getLangText('Get Started', 'शुरू करें', 'Shuru karein')}
          </button>
        </div>
      </div>
    )
  }

  if (loading || !mindmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {getLangText('Generating Mind Map...', 'माइंडमैप बन रहा है...', 'Mind Map ban raha hai...')}
          </h2>
        </div>
      </div>
    )
  }

  const colors = [
    'from-primary-500 to-primary-700',
    'from-accent-500 to-accent-700',
    'from-green-500 to-green-700',
    'from-purple-500 to-purple-700',
    'from-cyan-500 to-cyan-700',
  ]

  const nodeColors = [
    'bg-primary-500/20 border-primary-500/40 text-primary-300',
    'bg-accent-500/20 border-accent-500/40 text-accent-300',
    'bg-green-500/20 border-green-500/40 text-green-300',
    'bg-purple-500/20 border-purple-500/40 text-purple-300',
    'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <FiMap className="w-6 h-6 text-primary-400" />
          {getLangText('Mind Map', 'माइंडमैप', 'Mind Map')}
        </h1>
        <p className="text-dark-300">{getLangText('Visual overview of your concepts', 'आपकी अवधारणाओं का दृश्य अवलोकन', 'Aapki avdharanaon ka drishya avlokan')}</p>
        <button onClick={generateMindmap} className="btn-secondary mt-3 flex items-center gap-2 mx-auto">
          <FiRefreshCw className="w-4 h-4" />
          {getLangText('Regenerate', 'पुनर्निर्माण', 'Regenerate')}
        </button>
      </div>

      {/* Mind Map Visualization */}
      <div className="card overflow-hidden">
        {/* Center node */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xl font-bold shadow-lg shadow-primary-500/25">
              🧠 {mindmap.center}
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {mindmap.branches?.map((branch, i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Connection line */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${colors[i % colors.length]}`} />
                <div className={`px-4 py-2 rounded-xl border ${nodeColors[i % nodeColors.length]} font-semibold`}>
                  {branch.name}
                </div>
              </div>
              
              {/* Sub-nodes */}
              <div className="ml-11 space-y-2">
                {branch.children?.map((child, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-4 h-px bg-dark-500" />
                    <div className="px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/30 text-sm text-dark-200">
                      {child.name}
                    </div>
                  </div>
                ))}
                {branch.children?.length === 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-dark-500" />
                    <div className="px-3 py-1.5 rounded-lg bg-dark-800/50 border border-dark-700/30 text-sm text-dark-400 italic">
                      {getLangText('Expand to explore', 'विस्तार के लिए क्लिक करें', 'Vistar ke liye click karein')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Suggested connections */}
        {mindmap.suggestedConnections && mindmap.suggestedConnections.length > 0 && (
          <div className="mt-8 p-4 bg-dark-800/50 rounded-xl">
            <h3 className="text-sm font-semibold text-dark-300 mb-3">
              {getLangText('Suggested Connections', 'सुझाए गए कनेक्शन', 'Sujhaye gaye connections')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {mindmap.suggestedConnections.map((conn, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="badge-primary">{conn.from}</span>
                  <span className="text-dark-400">→ {conn.label} →</span>
                  <span className="badge-accent">{conn.to}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
