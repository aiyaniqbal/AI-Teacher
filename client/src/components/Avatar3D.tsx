import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

// Standard ARKit blend shape names - Avaturn's "Blendshapes V2" export uses these.
// The console.log below in HeadModel prints the real list on load - check it once
// against these names in case your export differs.
const EXPRESSION_KEYS = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
  'mouthSmile', 'mouthSmileLeft', 'mouthSmileRight', 'eyeWideLeft', 'eyeWideRight',
]

const EXPRESSION_MORPHS = {
  thinking:    { browDownLeft: 0.3, browDownRight: 0.3 },
  explaining:  {},
  happy:       { mouthSmile: 0.6, mouthSmileLeft: 0.6, mouthSmileRight: 0.6, browInnerUp: 0.2 },
  encouraging: { mouthSmile: 0.4, mouthSmileLeft: 0.4, mouthSmileRight: 0.4 },
  questioning: { browInnerUp: 0.5, browOuterUpLeft: 0.4, browOuterUpRight: 0.4 },
  surprised:   { browInnerUp: 0.7, eyeWideLeft: 0.5, eyeWideRight: 0.5 },
  proud:       { mouthSmile: 0.7, mouthSmileLeft: 0.7, mouthSmileRight: 0.7 },
  calm:        { mouthSmile: 0.15, mouthSmileLeft: 0.15, mouthSmileRight: 0.15 },
}

function HeadModel({ url, speaking, expression, audioRef }: any) {
  const { scene } = useGLTF(url) as any
  const headMeshRef = useRef<any>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const blink = useRef({ next: performance.now() + 3000, phase: 'idle' as 'idle' | 'closing' | 'opening', value: 0 })
  const talkClock = useRef(0)

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary) {
        headMeshRef.current = child
        console.log('Avatar morph targets found:', Object.keys(child.morphTargetDictionary))
      }
    })
  }, [scene])

  // Real amplitude-driven mouth movement from the actual TTS audio.
  // Needs the <audio> element to have crossOrigin="anonymous"
  useEffect(() => {
    if (!audioRef?.current || analyserRef.current) return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioCtx.createMediaElementSource(audioRef.current)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)
    } catch (e) {
      console.warn('Audio analyser setup failed, falling back to timer-based mouth movement:', e)
    }
  }, [audioRef])

  const setMorph = (name: string, value: number) => {
    const mesh = headMeshRef.current
    if (!mesh) return
    const idx = mesh.morphTargetDictionary[name]
    if (idx !== undefined) mesh.morphTargetInfluences[idx] = value
  }

  useFrame((_, delta) => {
    if (!headMeshRef.current) return

    // Idle blink - runs whether or not the avatar is speaking
    const b = blink.current
    const now = performance.now()
    if (b.phase === 'idle' && now > b.next) b.phase = 'closing'
    if (b.phase === 'closing') {
      b.value = Math.min(1, b.value + delta * 10)
      if (b.value >= 1) b.phase = 'opening'
    } else if (b.phase === 'opening') {
      b.value = Math.max(0, b.value - delta * 10)
      if (b.value <= 0) { b.phase = 'idle'; b.next = now + 2500 + Math.random() * 3000 }
    }
    setMorph('eyeBlinkLeft', b.value)
    setMorph('eyeBlinkRight', b.value)

    // Expression - reset controlled keys first so switching expressions doesn't leave old ones stuck
    EXPRESSION_KEYS.forEach((k) => setMorph(k, 0))
    const preset = EXPRESSION_MORPHS[expression as keyof typeof EXPRESSION_MORPHS] || {}
    Object.entries(preset).forEach(([k, v]) => setMorph(k, v as number))

    // Mouth movement while speaking
    if (speaking && analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataRef.current as any)
      const avg = dataRef.current!.reduce((a, v) => a + v, 0) / dataRef.current!.length
      const level = Math.min(1, avg / 90) // tune the 90 against your TTS voice's loudness
      setMorph('mouthOpen', level)
      setMorph('jawOpen', level * 0.7)
    } else if (speaking) {
      talkClock.current += delta
      const level = 0.3 + 0.3 * Math.abs(Math.sin(talkClock.current * 8 + Math.random() * 0.5))
      setMorph('mouthOpen', level)
      setMorph('jawOpen', level * 0.5)
    } else {
      setMorph('mouthOpen', 0)
      setMorph('jawOpen', 0)
    }
  })

  // position/scale depend on your specific model's proportions - tweak after first render
  return <primitive object={scene} position={[0, -1.6, 0]} scale={1.4} />
}

export default function Avatar3D({
  speaking = false,
  expression = 'explaining',
  size = 'lg',
  audioRef,     // ref to the <audio> element playing your TTS output
  modelUrl = 'https://models.readyplayer.me/63d9e05c3a57410012a36a77.glb?morphTargets=Smile_Left,Smile_Right,eyeBlinkLeft,eyeBlinkRight',
}: {
  speaking?: boolean
  expression?: 'thinking' | 'explaining' | 'happy' | 'encouraging' | 'questioning' | 'surprised' | 'proud' | 'calm'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  audioRef?: React.RefObject<HTMLAudioElement>
  modelUrl?: string
}) {
  const sizeClasses = { sm: 'w-32 h-32', md: 'w-48 h-48', lg: 'w-64 h-64', xl: 'w-80 h-80' }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-2 border-primary-500/50`}>
        <Canvas camera={{ position: [0, 0, 1.4], fov: 30 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[1, 2, 2]} intensity={1} />
          <Suspense fallback={null}>
            <HeadModel url={modelUrl} speaking={speaking} expression={expression} audioRef={audioRef} />
          </Suspense>
        </Canvas>
        {speaking && (
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-dark-900 z-20" />
        )}
      </div>
      <span className="text-sm font-medium text-dark-300">AI Teacher</span>
    </div>
  )
}