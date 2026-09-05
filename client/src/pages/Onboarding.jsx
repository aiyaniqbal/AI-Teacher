import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { FiUpload, FiFileText, FiUser, FiGlobe, FiClock, FiTarget, FiArrowRight, FiBook, FiMessageCircle } from 'react-icons/fi'

const levels = [
  { id: 'beginner', label: 'Beginner', hindi: 'शुरुआती', icon: '🌱', desc: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', hindi: 'मध्यम', icon: '📚', desc: 'Some prior knowledge' },
  { id: 'advanced', label: 'Advanced', hindi: 'उन्नत', icon: '🎓', desc: 'Ready for complex topics' }
]

const languages = [
  { id: 'english', label: 'English', hindi: 'अंग्रेजी', flag: '🇺🇸' },
  { id: 'hindi', label: 'Hindi', hindi: 'हिंदी', flag: '🇮🇳' },
  { id: 'hinglish', label: 'Hinglish', hindi: 'हिंग्लिश', flag: '🌐' }
]

const times = [
  { id: 10, label: '10 min', desc: 'Quick session' },
  { id: 20, label: '20 min', desc: 'Standard session' },
  { id: 30, label: '30 min', desc: 'Deep dive' },
  { id: 45, label: '45 min', desc: 'Comprehensive' },
  { id: 60, label: '60 min', desc: 'Full lesson' }
]

const goals = [
  { id: 'exam', label: 'Exam Preparation', hindi: 'परीक्षा की तैयारी', icon: '📝' },
  { id: 'concept', label: 'Understand Concepts', hindi: 'अवधारणाएं समझना', icon: '💡' },
  { id: 'project', label: 'Project Help', hindi: 'प्रोजेक्ट में मदद', icon: '🛠️' },
  { id: 'general', label: 'General Learning', hindi: 'सामान्य सीखना', icon: '📖' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { setStudentProfile, setCurrentFile, setLessonPlan, setSessionId } = useApp()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [language, setLanguage] = useState('')
  const [time, setTime] = useState(20)
  const [goal, setGoal] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileAnalysis, setFileAnalysis] = useState(null)
  const [topicMode, setTopicMode] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const steps = [
    { id: 'name', label: language === 'hindi' ? 'आपका नाम' : language === 'hinglish' ? 'Aapka Naam' : 'Your Name' },
    { id: 'level', label: language === 'hindi' ? 'स्तर' : language === 'hinglish' ? 'Level' : 'Learning Level' },
    { id: 'language', label: language === 'hindi' ? 'भाषा' : language === 'hinglish' ? 'Bhasha / Language' : 'Language' },
    { id: 'time', label: language === 'hindi' ? 'समय' : language === 'hinglish' ? 'Time / Samay' : 'Available Time' },
    { id: 'goal', label: language === 'hindi' ? 'लक्ष्य' : language === 'hinglish' ? 'Goal / Lakshya' : 'Learning Goal' },
    { id: 'content', label: language === 'hindi' ? 'सामग्री' : language === 'hinglish' ? 'Content / Samagri' : 'Upload Content' },
  ]

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setUploadedFile(data)
        setFileAnalysis(data.analysis)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTopicSubmit = async () => {
    if (!topicInput.trim()) return
    
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput, description: `Learning about ${topicInput}` })
      })

      const data = await response.json()
      
      if (data.success) {
        setUploadedFile(data)
        setFileAnalysis(data.analysis)
        setTopicMode(true)
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Failed to analyze topic. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Create student profile
      const profileResponse = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level, language, availableTime: time, goal })
      })

      const profileData = await profileResponse.json()
      
      if (!profileData.success) {
        throw new Error('Failed to create profile')
      }

      setStudentProfile(profileData.profile)

      // Generate lesson plan
      if (uploadedFile) {
        const planResponse = await fetch('/api/lesson-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentProfileId: profileData.profile.id, 
            fileId: uploadedFile.fileId 
          })
        })

        const planData = await planResponse.json()
        
        if (planData.success) {
          setLessonPlan(planData.lessonPlan)
          setSessionId(planData.sessionId)
        }
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0
      case 1: return level !== ''
      case 2: return language !== ''
      case 3: return time > 0
      case 4: return goal !== ''
      case 5: return uploadedFile || topicMode
      default: return false
    }
  }

  const getLangText = (en, hi, hiEn) => {
    if (language === 'hindi') return hi
    if (language === 'hinglish') return hiEn
    return en
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">EduMind</h1>
          <p className="text-dark-300 text-lg">
            {getLangText('AI Teacher, Not Just a Chatbot', 'AI शिक्षक, सिर्फ चैटबॉट नहीं', 'AI Teacher, Sirf Chatbot Nahi')}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-dark-400 mb-2">
            <span>{getLangText('Step', 'चरण', 'Step')} {step + 1} / {steps.length}</span>
            <span>{steps[step]?.label}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="card min-h-[400px] flex flex-col">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="flex-1 flex flex-col justify-center animate-fade-in">
              <div className="text-center mb-8">
                <span className="text-5xl mb-4 block">👋</span>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {getLangText('What should we call you?', 'हम आपको क्या कहें?', 'Aapko kya kahein?')}
                </h2>
                <p className="text-dark-300">
                  {getLangText('Enter your name to personalize your learning experience', 'अपना नाम दर्ज करें', 'Apna naam daalein')}
                </p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={getLangText('Your name', 'आपका नाम', 'Aapka naam')}
                className="input-field text-center text-xl"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && canProceed() && setStep(1)}
              />
            </div>
          )}

          {/* Step 1: Level */}
          {step === 1 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {getLangText('Select your level', 'अपना स्तर चुनें', 'Apna level chunein')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {levels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      level === l.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600/50 bg-dark-800/30 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-3xl">{l.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{l.label}</div>
                      <div className="text-sm text-dark-300">{l.hindi} • {l.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {getLangText('Choose your language', 'अपनी भाषा चुनें', 'Apni bhasha chunein')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {languages.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      language === l.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600/50 bg-dark-800/30 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-3xl">{l.flag}</span>
                    <div>
                      <div className="font-semibold text-white">{l.label}</div>
                      <div className="text-sm text-dark-300">{l.hindi}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {getLangText('How much time do you have?', 'आपके पास कितना समय है?', 'Aapke paas kitna samay hai?')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {times.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTime(t.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      time === t.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600/50 bg-dark-800/30 hover:border-dark-500'
                    }`}
                  >
                    <div className="text-2xl font-bold text-white">{t.label}</div>
                    <div className="text-sm text-dark-300 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Goal */}
          {step === 4 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {getLangText('What is your learning goal?', 'आपका सीखने का लक्ष्य क्या है?', 'Aapka seekhne ka lakshya kya hai?')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      goal === g.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600/50 bg-dark-800/30 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{g.label}</div>
                      <div className="text-sm text-dark-300">{g.hindi}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Upload Content */}
          {step === 5 && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {getLangText('Upload your study material', 'अपनी पढ़ाई सामग्री अपलोड करें', 'Apni padhai samagri upload karein')}
              </h2>

              {!uploadedFile && !topicMode && (
                <div className="space-y-4">
                  {/* File upload */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-dark-600/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-200"
                  >
                    <FiUpload className="w-12 h-12 mx-auto text-dark-400 mb-4" />
                    <p className="text-white font-medium mb-2">
                      {getLangText('Click to upload PDF, TXT, DOC, PPT', 'PDF, TXT, DOC, PPT अपलोड करने के लिए क्लिक करें', 'PDF, TXT, DOC, PPT upload karne ke liye click karein')}
                    </p>
                    <p className="text-sm text-dark-400">Max 50MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-dark-600/50" />
                    <span className="text-dark-400 text-sm">
                      {getLangText('OR', 'या', 'YA')}
                    </span>
                    <div className="flex-1 h-px bg-dark-600/50" />
                  </div>

                  {/* Topic input */}
                  <div>
                    <p className="text-dark-300 mb-3 text-center">
                      {getLangText('Or enter a topic to learn about', 'या कोई विषय दर्ज करें', 'Ya koi vishay daalein')}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        placeholder={getLangText('e.g., Machine Learning, History of India', 'जैसे, मशीन लर्निंग, भारत का इतिहास', 'Jaise, Machine Learning')}
                        className="input-field flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleTopicSubmit()}
                      />
                      <button
                        onClick={handleTopicSubmit}
                        disabled={!topicInput.trim() || loading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {getLangText('Go', 'जाओ', 'Jao')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File uploaded */}
              {uploadedFile && (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                    <FiFileText className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="font-medium text-white">{uploadedFile.filename}</p>
                      <p className="text-sm text-dark-300">
                        {fileAnalysis?.totalWords?.toLocaleString()} words • 
                        {fileAnalysis?.topics?.headings?.length || 0} topics identified
                      </p>
                    </div>
                  </div>

                  {fileAnalysis && (
                    <div className="bg-dark-800/50 rounded-xl p-4">
                      <h3 className="font-semibold text-white mb-2">
                        {getLangText('Topics Found:', 'विषय मिले:', 'Topics Mile:')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {fileAnalysis.topics?.headings?.slice(0, 8).map((topic, i) => (
                          <span key={i} className="badge-primary">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setUploadedFile(null); setFileAnalysis(null); setTopicMode(false); }}
                    className="text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    {getLangText('Upload different file', 'अलग फाइल अपलोड करें', 'Alag file upload karein')}
                  </button>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-dark-300">
                    {getLangText('Analyzing content...', 'सामग्री का विश्लेषण हो रहा है...', 'Content ka analysis ho raha hai...')}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {getLangText('Back', 'पीछे', 'Peeche')}
            </button>
            
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {getLangText('Next', 'आगे', 'Aage')}
                <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || loading}
                className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {getLangText('Setting up...', 'तैयार हो रहा है...', 'Taiyar ho raha hai...')}
                  </span>
                ) : (
                  <>
                    {getLangText('Start Learning!', 'सीखना शुरू करें!', 'Seekhna shuru karein!')}
                    <FiBook className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-dark-400 text-sm">
          <p>
            {getLangText(
              'Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue',
              'समझें → योजना बनाएं → समझाएं → प्रदर्शन करें → प्रश्न पूछें → मूल्यांकन करें → अनुकूलन करें → जारी रखें',
              'Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
