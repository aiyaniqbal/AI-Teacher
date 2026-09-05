import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiBook, FiHelpCircle, FiLayers, FiMap, FiBarChart2, FiFileText, FiArrowRight, FiZap, FiTarget, FiClock } from 'react-icons/fi'

const tools = [
  { 
    id: 'teach', 
    path: '/teach', 
    label: 'Start Learning', 
    hindi: 'सीखना शुरू करें',
    icon: FiBook, 
    color: 'from-primary-500 to-primary-700',
    desc: 'AI-powered interactive lesson'
  },
  { 
    id: 'quiz', 
    path: '/quiz', 
    label: 'Take Quiz', 
    hindi: 'प्रश्नोत्तरी दें',
    icon: FiHelpCircle, 
    color: 'from-accent-500 to-accent-700',
    desc: 'Test your knowledge'
  },
  { 
    id: 'flashcards', 
    path: '/flashcards', 
    label: 'Flashcards', 
    hindi: 'फ्लैशकार्ड्स',
    icon: FiLayers, 
    color: 'from-green-500 to-green-700',
    desc: 'Review key concepts'
  },
  { 
    id: 'mindmap', 
    path: '/mindmap', 
    label: 'Mind Map', 
    hindi: 'माइंडमैप',
    icon: FiMap, 
    color: 'from-purple-500 to-purple-700',
    desc: 'Visual concept overview'
  },
  { 
    id: 'roadmap', 
    path: '/roadmap', 
    label: 'Roadmap', 
    hindi: 'रोडमैप',
    icon: FiTarget, 
    color: 'from-yellow-500 to-yellow-700',
    desc: 'Your learning path'
  },
  { 
    id: 'reports', 
    path: '/reports', 
    label: 'Reports', 
    hindi: 'रिपोर्ट',
    icon: FiBarChart2, 
    color: 'from-red-500 to-red-700',
    desc: 'Performance analytics'
  },
  { 
    id: 'summary', 
    path: '/summary', 
    label: 'Summary', 
    hindi: 'सारांश',
    icon: FiFileText, 
    color: 'from-cyan-500 to-cyan-700',
    desc: 'Lesson overview'
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { studentProfile, currentFile, lessonPlan, performance } = useApp()
  const [roadmap, setRoadmap] = useState(null)
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (studentProfile) {
      fetchRoadmap()
      fetchReport()
    }
  }, [studentProfile])

  const fetchRoadmap = async () => {
    try {
      const response = await fetch(`/api/roadmap/${studentProfile.id}`)
      const data = await response.json()
      if (data.success) setRoadmap(data.roadmap)
    } catch (err) {
      console.error('Failed to fetch roadmap:', err)
    }
  }

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/report/${studentProfile.id}`)
      const data = await response.json()
      if (data.success) setReport(data.report)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    }
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">🧠</span>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to EduMind</h2>
          <p className="text-dark-300 mb-4">Set up your profile to get started</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Get Started <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const getLangText = (en, hi, hiEn) => {
    if (studentProfile.language === 'hindi') return hi
    if (studentProfile.language === 'hinglish') return hiEn
    return en
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {getLangText('Welcome back, ', 'वापसी पर स्वागत है, ', 'Welcome back, ')}
          <span className="gradient-text">{studentProfile.name}</span>! 👋
        </h1>
        <p className="text-dark-300 text-lg">
          {getLangText(
            `You're learning as a ${studentProfile.level} in ${studentProfile.language}`,
            `आप ${studentProfile.level} स्तर पर ${studentProfile.language} में सीख रहे हैं`,
            `Aap ${studentProfile.level} level pe ${studentProfile.language} mein seekh rahe hain`
          )}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-white">{performance.total || 0}</div>
          <div className="text-sm text-dark-300">{getLangText('Questions Answered', 'प्रश्न उत्तर दिए', 'Sawaal jawab diye')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-400">{performance.correct || 0}</div>
          <div className="text-sm text-dark-300">{getLangText('Correct', 'सही', 'Sahi')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-primary-400">
            {performance.total > 0 ? Math.round((performance.correct / performance.total) * 100) : 0}%
          </div>
          <div className="text-sm text-dark-300">{getLangText('Accuracy', 'सटीकता', 'Accuracy')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-2xl font-bold text-accent-400">{studentProfile.availableTime}m</div>
          <div className="text-sm text-dark-300">{getLangText('Session Time', 'सत्र समय', 'Session Time')}</div>
        </div>
      </div>

      {/* Current content */}
      {currentFile && (
        <div className="card mb-8 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{currentFile.filename || 'Study Material'}</h3>
              <p className="text-sm text-dark-300">
                {currentFile.analysis?.topics?.headings?.length || 0} topics • {currentFile.analysis?.concepts?.length || 0} concepts
              </p>
            </div>
            {lessonPlan && (
              <button
                onClick={() => navigate('/teach')}
                className="btn-primary flex items-center gap-2"
              >
                <FiZap className="w-4 h-4" />
                {getLangText('Resume', 'जारी रखें', 'Jari karein')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Learning tools grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">
          {getLangText('Learning Tools', 'सीखने के उपकरण', 'Seekhne ke upkaran')} 🛠️
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className="glass-card p-5 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{tool.label}</h3>
                <p className="text-xs text-dark-400">{tool.hindi}</p>
                <p className="text-sm text-dark-300 mt-2">{tool.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Weak areas alert */}
      {report && report.weakAreas?.length > 0 && (
        <div className="card mb-8 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-300 mb-1">
                {getLangText('Areas Needing Attention', 'ध्यान देने योग्य क्षेत्र', 'Dhyan dene yogya kshetra')}
              </h3>
              <p className="text-sm text-dark-300 mb-3">
                {getLangText(
                  'Focus on these topics to improve your understanding:',
                  'इन विषयों पर ध्यान दें:',
                  'In vishayon par dhyan dein:'
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {report.weakAreas.slice(0, 5).map((area, i) => (
                  <span key={i} className="badge-danger">{area.topic}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap preview */}
      {roadmap && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FiTarget className="w-5 h-5 text-accent-400" />
              {getLangText('Your Learning Roadmap', 'आपका सीखने का रोडमैप', 'Aapka seekhne ka roadmap')}
            </h3>
            <Link to="/roadmap" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              View All <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmap.sections?.slice(0, 2).map((section, i) => (
              <div key={i} className="bg-dark-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-2">{section.title}</h4>
                <ul className="space-y-1">
                  {section.items?.slice(0, 3).map((item, j) => (
                    <li key={j} className="text-sm text-dark-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
