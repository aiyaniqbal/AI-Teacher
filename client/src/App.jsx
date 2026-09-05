import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Teaching from './pages/Teaching'
import Quiz from './pages/Quiz'
import Flashcards from './pages/Flashcards'
import Mindmap from './pages/Mindmap'
import Roadmap from './pages/Roadmap'
import Reports from './pages/Reports'
import Summary from './pages/Summary'
import Navbar from './components/Navbar'

// Global context for student state
export const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

function App() {
  const [studentProfile, setStudentProfile] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [lessonPlan, setLessonPlan] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [transcript, setTranscript] = useState([])
  const [performance, setPerformance] = useState({ correct: 0, incorrect: 0, total: 0 })
  const [notes, setNotes] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const contextValue = {
    studentProfile, setStudentProfile,
    currentFile, setCurrentFile,
    lessonPlan, setLessonPlan,
    sessionId, setSessionId,
    currentPhase, setCurrentPhase,
    transcript, setTranscript,
    performance, setPerformance,
    notes, setNotes,
    isSpeaking, setIsSpeaking,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-animated">
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/dashboard" element={
              <>
                <Navbar />
                <Dashboard />
              </>
            } />
            <Route path="/teach" element={
              <>
                <Navbar />
                <Teaching />
              </>
            } />
            <Route path="/quiz" element={
              <>
                <Navbar />
                <Quiz />
              </>
            } />
            <Route path="/flashcards" element={
              <>
                <Navbar />
                <Flashcards />
              </>
            } />
            <Route path="/mindmap" element={
              <>
                <Navbar />
                <Mindmap />
              </>
            } />
            <Route path="/roadmap" element={
              <>
                <Navbar />
                <Roadmap />
              </>
            } />
            <Route path="/reports" element={
              <>
                <Navbar />
                <Reports />
              </>
            } />
            <Route path="/summary" element={
              <>
                <Navbar />
                <Summary />
              </>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppContext.Provider>
  )
}

export default App
