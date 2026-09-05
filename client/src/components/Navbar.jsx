import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../App'
import { FiArrowLeft, FiHome, FiBook, FiHelpCircle, FiMap, FiBarChart2, FiLayers } from 'react-icons/fi'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome },
  { path: '/teach', label: 'Teach', icon: FiBook },
  { path: '/quiz', label: 'Quiz', icon: FiHelpCircle },
  { path: '/flashcards', label: 'Cards', icon: FiLayers },
  { path: '/mindmap', label: 'Mind Map', icon: FiMap },
  { path: '/roadmap', label: 'Roadmap', icon: FiBarChart2 },
  { path: '/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/summary', label: 'Summary', icon: FiBook },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentProfile } = useApp()

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Back button - above all */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors duration-200"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold gradient-text">EduMind</span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-500/20 text-primary-400' 
                      : 'text-dark-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-2">
            {navLinks.slice(0, 4).map(({ path, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-500/20 text-primary-400' 
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
          </div>

          {/* Student name */}
          {studentProfile && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                {studentProfile.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <span className="text-sm text-dark-300">{studentProfile.name}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
