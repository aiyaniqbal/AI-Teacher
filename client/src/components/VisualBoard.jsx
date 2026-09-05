import React from 'react'

const visualTypes = {
  title: ({ content }) => (
    <div className="text-center p-6">
      <h2 className="text-3xl font-bold gradient-text mb-2">{content}</h2>
      <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full" />
    </div>
  ),
  diagram: ({ content }) => (
    <div className="p-4">
      <div className="bg-dark-800/50 rounded-xl p-6 border border-primary-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-primary-300">{content}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-dark-700/50 rounded-lg p-3 border border-dark-600/30">
              <div className="w-full h-2 bg-primary-500/20 rounded mb-2" style={{ width: `${60 + Math.random() * 40}%` }} />
              <div className="w-3/4 h-2 bg-dark-600/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  formula: ({ content }) => (
    <div className="p-4">
      <div className="bg-dark-800/50 rounded-xl p-6 border border-accent-500/20 font-mono">
        <div className="text-accent-300 text-lg text-center tracking-wider">{content}</div>
      </div>
    </div>
  ),
  question: ({ content }) => (
    <div className="p-4">
      <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-xl p-6 border border-primary-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">❓</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{content}</h3>
            <p className="text-dark-300 text-sm mt-1">Take your time to think...</p>
          </div>
        </div>
      </div>
    </div>
  ),
  checklist: ({ content }) => (
    <div className="p-4">
      <div className="bg-dark-800/50 rounded-xl p-6 border border-green-500/20">
        <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
          <span>✅</span> {content}
        </h3>
        <div className="space-y-2">
          {['Main concept understood', 'Examples practiced', 'Ready for next step'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-dark-300">
              <span className="text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  quiz: ({ content }) => (
    <div className="p-4">
      <div className="bg-gradient-to-br from-accent-500/10 to-primary-500/10 rounded-xl p-6 border border-accent-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📝</span>
          <h3 className="text-lg font-semibold text-accent-300">{content}</h3>
        </div>
      </div>
    </div>
  )
}

export default function VisualBoard({ visuals = [], height = 'auto' }) {
  if (!visuals || visuals.length === 0) {
    return (
      <div className="visual-board flex items-center justify-center" style={{ height: height === 'auto' ? '200px' : height }}>
        <div className="text-center text-dark-400">
          <span className="text-4xl block mb-2">📖</span>
          <p className="text-sm">Teaching content will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="visual-board p-4 overflow-y-auto" style={{ maxHeight: height === 'auto' ? '400px' : height }}>
      <div className="space-y-4">
        {visuals.map((visual, index) => {
          const VisualComponent = visualTypes[visual.type]
          return VisualComponent ? (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <VisualComponent content={visual.content} />
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}
