import React, { useState, useEffect, useRef } from 'react'

const EXPRESSIONS = {
  thinking:    { browY: 2,  eyeScale: 0.9, mouth: 'closed' },
  explaining:  { browY: 0,  eyeScale: 1,   mouth: 'closed' },
  happy:       { browY: -1, eyeScale: 1,   mouth: 'smile'  },
  encouraging: { browY: 0,  eyeScale: 1,   mouth: 'smile'  },
  questioning: { browY: -3, eyeScale: 1,   mouth: 'closed' },
  surprised:   { browY: -4, eyeScale: 1.3, mouth: 'open'   },
  proud:       { browY: -1, eyeScale: 1,   mouth: 'smile'  },
  calm:        { browY: 1,  eyeScale: 0.9, mouth: 'closed' },
}

function Mouth({ state }) {
  if (state === 'closed') {
    return <path d="M82,148 Q100,154 118,148" stroke="#7a3b3b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
  }
  if (state === 'smile') {
    return <path d="M80,146 Q100,160 120,146 Q100,150 80,146 Z" fill="#7a3b3b" />
  }
  if (state === 'half') {
    return <ellipse cx="100" cy="148" rx="12" ry="6" fill="#7a3b3b" />
  }
  return (
    <>
      <ellipse cx="100" cy="149" rx="15" ry="13" fill="#7a3b3b" />
      <ellipse cx="100" cy="144" rx="12" ry="3" fill="#fff" opacity="0.85" />
    </>
  )
}

export default function Avatar({ speaking = false, expression = 'explaining', size = 'lg' }) {
  const [mouthState, setMouthState] = useState('closed')
  const [blinking, setBlinking] = useState(false)
  const speakTimer = useRef(null)
  const blinkTimer = useRef(null)

  const config = EXPRESSIONS[expression] || EXPRESSIONS.explaining

  // Talking animation: irregular mouth-shape cycling, not a fixed on/off toggle
  useEffect(() => {
    if (!speaking) {
      setMouthState(config.mouth)
      return
    }
    const talkStates = ['closed', 'half', 'open', 'half']
    let i = 0
    const tick = () => {
      setMouthState(talkStates[i % talkStates.length])
      i++
      speakTimer.current = setTimeout(tick, 90 + Math.random() * 130) // 90-220ms, irregular
    }
    tick()
    return () => clearTimeout(speakTimer.current)
  }, [speaking, expression])

  // Idle blinking - runs regardless of speech, keeps the avatar feeling alive
  useEffect(() => {
    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 140)
        scheduleBlink()
      }, 2500 + Math.random() * 3000)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimer.current)
  }, [])

  const sizeClasses = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32', xl: 'w-40 h-40' }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30
          border-2 border-primary-500/50 flex items-center justify-center overflow-hidden
          ${speaking ? 'avatar-speaking' : 'transition-all duration-300'}
          hover:scale-105`}
      >
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] relative z-10">
          {/* hair */}
          <path d="M40,95 Q35,30 100,25 Q165,30 160,95 Q160,60 100,55 Q40,60 40,95 Z" fill="#3a2c22" />
          {/* head + ears */}
          <ellipse cx="42" cy="115" rx="8" ry="12" fill="#f4c9a1" />
          <ellipse cx="158" cy="115" rx="8" ry="12" fill="#f4c9a1" />
          <ellipse cx="100" cy="112" rx="58" ry="65" fill="#f4c9a1" />

          {/* eyebrows - shift per expression */}
          <rect x="62" y="86" width="26" height="5" rx="2.5" fill="#3a2c22"
            style={{ transform: `translateY(${config.browY}px)`, transition: 'transform 0.25s ease' }} />
          <rect x="112" y="86" width="26" height="5" rx="2.5" fill="#3a2c22"
            style={{ transform: `translateY(${config.browY}px)`, transition: 'transform 0.25s ease' }} />

          {/* eyes - squash on blink */}
          <g style={{ transform: `scaleY(${blinking ? 0.05 : config.eyeScale})`, transformOrigin: '75px 102px', transition: 'transform 0.08s ease' }}>
            <ellipse cx="75" cy="102" rx="9" ry="10" fill="white" />
            <circle cx="75" cy="103" r="4.5" fill="#2b2140" />
          </g>
          <g style={{ transform: `scaleY(${blinking ? 0.05 : config.eyeScale})`, transformOrigin: '125px 102px', transition: 'transform 0.08s ease' }}>
            <ellipse cx="125" cy="102" rx="9" ry="10" fill="white" />
            <circle cx="125" cy="103" r="4.5" fill="#2b2140" />
          </g>

          {/* glasses in your brand accent color */}
          <g fill="none" stroke="#5c7cfa" strokeWidth="3">
            <rect x="58" y="90" width="34" height="26" rx="10" />
            <rect x="108" y="90" width="34" height="26" rx="10" />
            <line x1="92" y1="100" x2="108" y2="100" />
          </g>

          <Mouth state={mouthState} />
        </svg>

        {speaking && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-dark-900 z-20" />
        )}
      </div>

      <span className="text-sm font-medium text-dark-300">AI Teacher</span>

      {speaking && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 bg-primary-400 rounded-full"
              style={{ height: `${Math.random() * 16 + 8}px`, animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` }} />
          ))}
        </div>
      )}
    </div>
  )
}