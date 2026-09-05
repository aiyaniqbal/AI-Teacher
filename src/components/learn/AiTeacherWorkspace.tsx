import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  ArrowLeft,
  Search,
  Sparkles,
  Lightbulb,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import {
  Lesson,
  LanguageCode,
  NoteItem,
  TranscriptItem,
  LessonDuration,
} from '../../types';

import { AiAvatarCanvas } from '../avatar/AiAvatarCanvas';

import {
  AiTeachingService,
  AdaptiveEvaluationResult,
} from '../../services/aiService';

interface AiTeacherWorkspaceProps {
  lesson: Lesson;
  onBack: () => void;
  language: LanguageCode;
  onLanguageChange: (
    lang: LanguageCode
  ) => void;
  onSaveNote: (
    note: NoteItem
  ) => void;
  existingNotes: NoteItem[];
  onTakeQuiz: () => void;

  // NEW:
  // Allows this page to update the global lesson progress.
  onProgressChange?: (
    progress: number
  ) => void;
}

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const getMeaningfulTitle = (
  title: string | undefined,
  description: string | undefined,
  lessonTopic: string,
  index: number
) => {
  const rawTitle = (title || '').trim();

  // Never show generic generated titles such as "Concept 1".
  const genericTitle =
    /^concept\s*\d+$/i.test(rawTitle) ||
    /^lesson\s*(part|section)?\s*\d+$/i.test(
      rawTitle
    ) ||
    /^part\s*\d+$/i.test(rawTitle);

  if (rawTitle && !genericTitle) {
    return rawTitle;
  }

  const text =
    (description || '').trim();

  /*
   * Try to extract a heading from AI-generated
   * markdown/content.
   */
  const headingMatch = text.match(
    /(?:^|\n)\s*#{1,4}\s+(.+?)(?:\n|$)/
  );

  if (
    headingMatch &&
    headingMatch[1] &&
    headingMatch[1].trim()
  ) {
    return headingMatch[1]
      .replace(/\*\*/g, '')
      .trim();
  }

  /*
   * Try the first sentence when it is short enough
   * to be a useful concept title.
   */
  const firstSentence = text
    .split(/[.!?]\s+/)[0]
    ?.replace(/\*\*/g, '')
    .trim();

  if (
    firstSentence &&
    firstSentence.length >= 5 &&
    firstSentence.length <= 70
  ) {
    return firstSentence;
  }

  /*
   * Final fallback is still meaningful and topic-specific,
   * rather than "Concept 1".
   */
  return `${lessonTopic} — Part ${
    index + 1
  }`;
};


/*
 * Reliable teacher speech.
 *
 * Browser speechSynthesis is deliberately not used because setting hi-IN does
 * not translate English text and Windows/browser voice lists vary by machine.
 * The dedicated TTS server returns real MP3 audio from a Hindi neural voice.
 */
const TTS_SERVER = 'http://127.0.0.1:8001';

const speakTextDirectly = (
  text: string,
  language: LanguageCode,
  rate: number,
  onEnd?: () => void,
): (() => void) => {
  const controller = new AbortController();
  let audio: HTMLAudioElement | null = null;
  // Prime browser media playback from the user's Play click. This avoids
  // autoplay blocking after the asynchronous TTS request completes.
  const unlockAudio = new Audio(
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
  );
  unlockAudio.volume = 0;
  void unlockAudio.play().catch(() => undefined);
  let objectUrl: string | null = null;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onEnd?.();
  };

  const cleanup = () => {
    controller.abort();
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.src = '';
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  if (!text.trim()) {
    finish();
    return cleanup;
  }

  void (async () => {
    try {
      const response = await fetch(`${TTS_SERVER}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, rate }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = `Teacher voice server returned ${response.status}.`;
        try {
          const data = await response.json();
          if (data?.detail) detail = String(data.detail);
        } catch {
          // Keep the HTTP status message.
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      if (controller.signal.aborted) return;

      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      audio.preload = 'auto';
      audio.playbackRate = rate;
      audio.onended = () => {
        cleanup();
        finish();
      };
      audio.onerror = () => {
        console.error('EduMind TTS audio playback failed.');
        cleanup();
        finish();
      };

      await audio.play();
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('EduMind TTS error:', error);
      window.alert(
        language === 'Hindi'
          ? 'Hindi Teacher Voice is unavailable. Start the EduMind voice server on port 8001.'
          : 'Teacher Voice is unavailable. Start the EduMind voice server on port 8001.'
      );
      cleanup();
      finish();
    }
  })();

  return cleanup;
};


export const AiTeacherWorkspace: React.FC<
  AiTeacherWorkspaceProps
> = ({
  lesson,
  onBack,
  language,
  onLanguageChange,
  onSaveNote,
  existingNotes,
  onTakeQuiz,
  onProgressChange,
}) => {
  /*
   * ---------------------------------------------------------
   * Active concept
   * ---------------------------------------------------------
   */

  const firstConcept =
    lesson.concepts.find(
      (c) => c.status === 'in_progress'
    ) ||
    lesson.concepts[0];

  const [
    activeConceptId,
    setActiveConceptId,
  ] = useState<string>(
    firstConcept?.id || ''
  );

  const activeConcept =
    lesson.concepts.find(
      (c) =>
        c.id === activeConceptId
    ) ||
    lesson.concepts[0];

  /*
   * ---------------------------------------------------------
   * Playback
   * ---------------------------------------------------------
   */

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [
    playbackSpeed,
    setPlaybackSpeed,
  ] = useState(1);

  const [
    captionsEnabled,
    setCaptionsEnabled,
  ] = useState(true);

  const [
    activeTranscriptIndex,
    setActiveTranscriptIndex,
  ] = useState(0);

  /*
   * ---------------------------------------------------------
   * Progress
   * ---------------------------------------------------------
   */

  const [
    localProgress,
    setLocalProgress,
  ] = useState(
    Math.max(
      0,
      Math.min(
        100,
        lesson.progressPercent || 0
      )
    )
  );

  /*
   * ---------------------------------------------------------
   * Lesson plan
   * ---------------------------------------------------------
   */

  const [
    lessonPacing,
    setLessonPacing,
  ] = useState<LessonDuration>(
    '20 min'
  );

  const [
    isLessonPlanOpen,
    setIsLessonPlanOpen,
  ] = useState(true);

  /*
   * ---------------------------------------------------------
   * Transcript
   * ---------------------------------------------------------
   */

  const [
    searchTranscript,
    setSearchTranscript,
  ] = useState('');

  const [
    copiedTranscript,
    setCopiedTranscript,
  ] = useState(false);

  const transcriptScrollRef =
    useRef<HTMLDivElement>(null);

  /*
   * ---------------------------------------------------------
   * Quick Check
   * ---------------------------------------------------------
   */

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState<string | null>(
    null
  );

  const [
    isEvaluating,
    setIsEvaluating,
  ] = useState(false);

  const [
    evaluationResult,
    setEvaluationResult,
  ] =
    useState<AdaptiveEvaluationResult | null>(
      null
    );

  /*
   * ---------------------------------------------------------
   * Notes
   * ---------------------------------------------------------
   */

  const [
    rightPanelTab,
    setRightPanelTab,
  ] = useState<
    'interaction' | 'notes'
  >('interaction');

  const [
    noteText,
    setNoteText,
  ] = useState('');

  const [
    noteTitle,
    setNoteTitle,
  ] = useState('');

  const [
    noteIsPinned,
    setNoteIsPinned,
  ] = useState(false);

  const [
    noteSaveSuccess,
    setNoteSaveSuccess,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * Reset when lesson changes
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const first =
      lesson.concepts.find(
        (c) =>
          c.status === 'in_progress'
      ) ||
      lesson.concepts[0];

    if (first) {
      setActiveConceptId(first.id);
    }

    setActiveTranscriptIndex(0);
    setSelectedOptionId(null);
    setEvaluationResult(null);
    setSearchTranscript('');
    setIsPlaying(false);

    setLocalProgress(
      Math.max(
        0,
        Math.min(
          100,
          lesson.progressPercent || 0
        )
      )
    );
  }, [lesson.id]);

  /*
   * IMPORTANT:
   * The App updates lesson.progressPercent while the student
   * is learning. The lesson object therefore changes on every
   * progress update.
   *
   * This effect must NOT depend on the whole `lesson` object,
   * otherwise every progress update would reset the active
   * concept, transcript, Quick Check, and playback state.
   *
   * `lesson.id` is stable for the same lesson, so the workspace
   * resets only when the student actually opens a different
   * lesson.
   */

  /*
   * ---------------------------------------------------------
   * Speech
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelSpeech: (() => void) | undefined;

    if (
      isPlaying &&
      lesson.transcripts.length > 0
    ) {
      const activeText =
        lesson.transcripts[activeTranscriptIndex]?.text || '';

      cancelSpeech = speakTextDirectly(
        activeText,
        language,
        playbackSpeed,
        () => {
          if (
            activeTranscriptIndex <
            lesson.transcripts.length - 1
          ) {
            setActiveTranscriptIndex((prev) => prev + 1);
          } else {
            setIsPlaying(false);
          }
        },
      );
    }

    return () => {
      cancelSpeech?.();
    };
  }, [
    isPlaying,
    activeTranscriptIndex,
    language,
    playbackSpeed,
    lesson.transcripts,
  ]);

  /*
   * ---------------------------------------------------------
   * Transcript auto-scroll
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      transcriptScrollRef.current
    ) {
      const activeElement =
        transcriptScrollRef.current.querySelector(
          '[data-active="true"]'
        );

      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeTranscriptIndex]);

  /*
   * ---------------------------------------------------------
   * Calculate progress from transcript position
   * ---------------------------------------------------------
   *
   * Every time the AI teacher moves to another transcript
   * section, the lesson progress increases.
   */

  useEffect(() => {
    if (lesson.concepts.length === 0) {
      return;
    }

    const transcriptCount = lesson.transcripts.length;
    const transcriptProgress = transcriptCount > 0
      ? Math.round(((activeTranscriptIndex + 1) / transcriptCount) * 100)
      : 0;

    const conceptIndex = lesson.concepts.findIndex(
      (concept) => concept.id === activeConceptId
    );

    const safeConceptIndex = Math.max(0, conceptIndex);
    const conceptProgress = Math.round(
      (safeConceptIndex / lesson.concepts.length) * 100
    );

    const calculatedProgress = Math.min(
      100,
      Math.max(transcriptProgress, conceptProgress)
    );

    setLocalProgress((previous) => {
      const next = Math.max(previous, calculatedProgress);

      if (next !== previous && onProgressChange) {
        onProgressChange(next);
      }

      return next;
    });
  }, [
    activeTranscriptIndex,
    activeConceptId,
    lesson.transcripts.length,
    lesson.concepts.length,
    onProgressChange,
  ]);

  /*
   * ---------------------------------------------------------
   * Mark concept progress
   * ---------------------------------------------------------
   */

  const moveToNextConcept = () => {
    const totalConcepts = lesson.concepts.length;

    if (totalConcepts === 0) {
      return;
    }

    const currentIndex = lesson.concepts.findIndex(
      (concept) => concept.id === activeConceptId
    );

    const safeCurrentIndex = Math.max(0, currentIndex);
    const isLastConcept = safeCurrentIndex >= totalConcepts - 1;

    if (isLastConcept) {
      setIsPlaying(false);
      setLocalProgress(100);
      onProgressChange?.(100);
      return;
    }

    const nextIndex = safeCurrentIndex + 1;
    const nextConcept = lesson.concepts[nextIndex];

    if (!nextConcept) {
      return;
    }

    setIsPlaying(false);
    setActiveConceptId(nextConcept.id);
    setActiveTranscriptIndex(
      lesson.transcripts.length > 0
        ? Math.min(nextIndex, lesson.transcripts.length - 1)
        : 0
    );
    setSelectedOptionId(null);
    setEvaluationResult(null);

    const nextProgress = Math.round(
      (nextIndex / totalConcepts) * 100
    );

    setLocalProgress((previous) => {
      const next = Math.max(previous, nextProgress);
      onProgressChange?.(next);
      return next;
    });
  };

  /*
   * ---------------------------------------------------------
   * Quick Check
   * ---------------------------------------------------------
   */

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || !activeConcept?.quickCheck) {
      return;
    }

    setIsEvaluating(true);

    window.setTimeout(() => {
      const quickCheck = activeConcept.quickCheck as any;
      const options = Array.isArray(quickCheck.options)
        ? quickCheck.options
        : [];

      const selectedOption = options.find(
        (option: any) => String(option.id) === String(selectedOptionId)
      );

      if (!selectedOption) {
        setIsEvaluating(false);
        return;
      }

      // Support both lesson formats used in this project:
      // 1) option.isCorrect
      // 2) quickCheck.correctOptionId
      const correctOptionId =
        quickCheck.correctOptionId ??
        quickCheck.correct_option_id ??
        '';

      const correctOption = options.find(
        (option: any) => option.isCorrect === true
      );

      const isCorrect =
        selectedOption.isCorrect === true ||
        (correctOptionId !== '' &&
          String(selectedOption.id) === String(correctOptionId));

      const explanation = isCorrect
        ? quickCheck.correctExplanation ||
          quickCheck.explanation ||
          ''
        : quickCheck.misconceptionExplanation ||
          quickCheck.explanation ||
          '';

      const correctText =
        correctOption?.text ||
        options.find(
          (option: any) =>
            String(option.id) === String(correctOptionId)
        )?.text ||
        'the correct option';

      const languageValue = String(language || '').toLowerCase();

      const isHindi =
        languageValue === 'hindi' ||
        languageValue === 'hi' ||
        languageValue === 'hi-in' ||
        languageValue === 'हिंदी';

      const isHinglish =
        languageValue === 'hinglish' ||
        languageValue.includes('hinglish');

      const selectedText = String(
        selectedOption.text || ''
      );
      const correctAnswerText = String(
        correctText || ''
      );

      const localizedStatus = isHindi
        ? isCorrect
          ? 'सही उत्तर! बहुत बढ़िया।'
          : 'अभी पूरी तरह सही नहीं — आइए इसे फिर से समझते हैं।'
        : isHinglish
        ? isCorrect
          ? 'Correct! Bahut badhiya.'
          : 'Not quite — chalo ise ek baar phir samajhte hain.'
        : isCorrect
        ? 'Correct! Great job.'
        : 'Not quite — let’s review this.';

      const localizedFeedback = isHindi
        ? isCorrect
          ? explanation ||
            `सही उत्तर "${selectedText}" है।`
          : `आपका उत्तर "${selectedText}" सही नहीं था। सही उत्तर "${correctAnswerText}" है। ${explanation}`.trim()
        : isHinglish
        ? isCorrect
          ? explanation ||
            `Bilkul sahi! "${selectedText}" correct answer hai.`
          : `Aapka answer "${selectedText}" sahi nahi tha. Correct answer "${correctAnswerText}" hai. ${explanation}`.trim()
        : isCorrect
        ? explanation ||
          `Correct! "${selectedText}" is the right answer.`
        : `Your answer "${selectedText}" was not correct. The correct answer is "${correctAnswerText}". ${explanation}`.trim();

      const localizedAnalogy =
        quickCheck.simplifiedAnalogy ||
        (isHindi
          ? isCorrect
            ? `${displayConceptTitle} की मुख्य बात आपने समझ ली है।`
            : `${displayConceptTitle} की मुख्य बात फिर से देखें: ${explanation || 'व्याख्या को दोबारा पढ़ें और फिर प्रयास करें।'}`
          : isHinglish
          ? isCorrect
            ? `Aapne ${displayConceptTitle} ka main idea samajh liya hai.`
            : `${displayConceptTitle} ka main idea yaad rakho: ${explanation || 'Explanation ko dobara dekho aur phir try karo.'}`
          : isCorrect
          ? `You understood the key idea of ${displayConceptTitle}.`
          : `Remember the key idea of ${displayConceptTitle}: ${explanation || 'Review the explanation and try again.'}`);

      const result: AdaptiveEvaluationResult = {
        isCorrect,
        statusText: localizedStatus,
        feedback: localizedFeedback,
        simplifiedAnalogy: localizedAnalogy,
        adaptiveActions: isCorrect
          ? [
              isHindi
                ? 'अवधारणा समझ में आ गई'
                : isHinglish
                ? 'Concept samajh aa gaya'
                : 'Concept understood',
              isHindi
                ? 'अगली अवधारणा के लिए तैयार'
                : isHinglish
                ? 'Next concept ke liye ready'
                : 'Ready for the next concept',
            ]
          : [
              isHindi
                ? 'इस अवधारणा को सरल तरीके से दोहराया जा रहा है'
                : isHinglish
                ? 'Concept ko simpler way mein repeat kar rahe hain'
                : 'Review this concept with a simpler explanation',
              isHindi
                ? 'फिर से Quick Check करें'
                : isHinglish
                ? 'Quick Check phir se try karo'
                : 'Try the Quick Check again',
              isHindi
                ? 'अगले प्रश्नों में इस अवधारणा पर अधिक अभ्यास'
                : isHinglish
                ? 'Next questions mein is concept par extra practice'
                : 'Extra practice on this concept next',
            ],
      };

      setEvaluationResult(result);
      setIsEvaluating(false);
      setRightPanelTab('interaction');

      // Speak the actual adaptive teacher response in the selected language.
      AiTeachingService.speakTranscript(
        result.feedback,
        language
      );

      // A completed Quick Check moves the lesson forward slightly,
      // without forcing the student to leave the current concept.
      if (isCorrect) {
        const conceptIndex = lesson.concepts.findIndex(
          (concept) => concept.id === activeConcept.id
        );
        const quizProgress = Math.round(
          ((conceptIndex + 1) / lesson.concepts.length) * 100
        );

        setLocalProgress((previous) => {
          const next = Math.max(previous, quizProgress);
          onProgressChange?.(next);
          return next;
        });
      }
    }, 350);
  };

  const handleResetCheck = () => {
    setSelectedOptionId(null);
    setEvaluationResult(null);
  };

  /*
   * ---------------------------------------------------------
   * Explain differently
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * There is NO hard-coded Ohm's Law content here.
   */

  const handleExplainDifferently = (
    type: string
  ) => {
    if (!activeConcept) {
      return;
    }

    const conceptTitle =
      activeConcept.title ||
      lesson.topicName;

    const description =
      activeConcept.description ||
      'Review the explanation provided by the AI Teacher.';

    const keyPoints =
      activeConcept.keyPoints ||
      [];

    const pointsText =
      keyPoints.length > 0
        ? keyPoints.join('; ')
        : description;

    let feedback = '';
    let analogy = '';

    switch (type) {
      case 'Explain simpler':
        feedback =
          `Let's make ${conceptTitle} easier to understand. ${description}`;

        analogy =
          keyPoints.length > 0
            ? `The key ideas to remember are: ${pointsText}`
            : `The main idea is: ${description}`;

        break;

      case 'Real-life example':
        feedback =
          `Let's connect ${conceptTitle} to a familiar situation. ${description}`;

        analogy =
          `Think about a real situation where the ideas in ${conceptTitle} could appear. Focus on: ${pointsText}`;

        break;

      case 'Step-by-step':
        feedback =
          `Let's understand ${conceptTitle} step by step. Start with the main idea, then follow the explanation and connect each important point.`;

        analogy =
          `Step-by-step focus: ${pointsText}`;

        break;

      case 'Visual analogy':
        feedback =
          `Imagine ${conceptTitle} as a visual system. Start with the central idea and connect the supporting concepts around it.`;

        analogy =
          `Visual map: ${conceptTitle} → ${pointsText}`;

        break;

      case 'Practice problem':
        feedback =
          `Let's practice ${conceptTitle}. Use the explanation above and the important points to reason through a problem.`;

        analogy =
          `Practice focus: ${pointsText}`;

        break;

      default:
        feedback = description;
        analogy = pointsText;
    }

    setEvaluationResult({
      isCorrect: true,
      statusText:
        `AI Teacher: ${type}`,
      feedback,
      simplifiedAnalogy:
        analogy,
      adaptiveActions: [
        `Generated a ${type.toLowerCase()} perspective`,
        `Based on ${conceptTitle}`,
      ],
    });

    setRightPanelTab(
      'interaction'
    );
  };

  /*
   * ---------------------------------------------------------
   * Notes
   * ---------------------------------------------------------
   */

  const handleCreateNote = () => {
    if (
      !noteText.trim() ||
      !activeConcept
    ) {
      return;
    }

    const newNote: NoteItem = {
      id:
        'note-' +
        Date.now(),

      title:
        noteTitle.trim() ||
        `${activeConcept.title} Note`,

      content: noteText,

      timestamp:
        `${activeConcept.timestamp} — ${activeConcept.title}`,

      conceptName:
        activeConcept.title,

      topicName:
        lesson.topicName,

      isPinned:
        noteIsPinned,

      tags: [
        lesson.courseName,
        'AI Lesson',
      ],

      createdAt:
        'Just now',

      updatedAt:
        'Just now',
    };

    onSaveNote(newNote);

    setNoteText('');
    setNoteTitle('');
    setNoteIsPinned(false);

    setNoteSaveSuccess(true);

    setTimeout(
      () =>
        setNoteSaveSuccess(false),
      2500
    );
  };

  const handleAddTranscriptToNotes = (
    item: TranscriptItem
  ) => {
    setRightPanelTab(
      'notes'
    );

    setNoteText((prev) =>
      prev
        ? `${prev}\n\n[${item.timestamp}] "${item.text}"`
        : `[${item.timestamp} - ${item.speaker}] "${item.text}"`
    );

    if (!noteTitle) {
      setNoteTitle(
        `Notes from ${
          item.conceptName ||
          activeConcept?.title ||
          lesson.topicName
        }`
      );
    }
  };

  const handleCopyTranscript = () => {
    const fullText =
      lesson.transcripts
        .map(
          (t) =>
            `[${t.timestamp}] ${t.speaker}: ${t.text}`
        )
        .join('\n');

    navigator.clipboard.writeText(
      fullText
    );

    setCopiedTranscript(true);

    setTimeout(
      () =>
        setCopiedTranscript(false),
      2000
    );
  };

  const filteredTranscripts =
    lesson.transcripts
      .map((item, originalIndex) => ({
        item,
        originalIndex,
      }))
      .filter(({ item }) =>
        item.text
          .toLowerCase()
          .includes(
            searchTranscript.toLowerCase()
          )
      );

  if (!activeConcept) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Sparkles className="w-8 h-8 mx-auto text-blue-600 mb-3" />
        <h2 className="font-bold text-slate-900">
          Preparing your AI lesson...
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          No lesson concepts are available yet.
        </p>
      </div>
    );
  }

  /*
   * Make sure a generic backend title never reaches
   * the visible interface.
   */

  const displayConceptTitle =
    getMeaningfulTitle(
      activeConcept.title,
      activeConcept.description,
      lesson.topicName,
      Math.max(
        0,
        lesson.concepts.findIndex(
          (c) =>
            c.id === activeConcept.id
        )
      )
    );

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {/* TOP BAR */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">

        <div className="flex items-center gap-3">

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#64748B] hover:text-blue-600 font-medium text-xs border border-[#E2E8F0] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">

              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Topic
              </span>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                Lesson {lesson.lessonNumber} of{' '}
                {lesson.totalLessons}
              </span>

            </div>

            <h1 className="text-base sm:text-lg font-bold text-[#0F172A] leading-tight">
              {lesson.topicName}
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">

          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">

            <Sliders className="w-3.5 h-3.5 text-[#64748B] ml-1 hidden sm:inline" />

            {(
              [
                '5 min',
                '20 min',
                '60 min',
              ] as LessonDuration[]
            ).map((pacing) => (
              <button
                key={pacing}
                onClick={() =>
                  setLessonPacing(
                    pacing
                  )
                }
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lessonPacing ===
                  pacing
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {pacing}
              </button>
            ))}

          </div>

          {/* REAL PROGRESS */}

          <div className="text-xs font-mono bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md border border-blue-100 font-bold">
            {localProgress}% complete
          </div>

        </div>
      </div>

      {/* MAIN WORKSPACE */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT */}

        <div className="lg:col-span-3 space-y-4">

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 flex flex-col justify-between min-h-[420px]">

            <div>

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                  Today's Lesson
                </h3>

                <button
                  onClick={() =>
                    setIsLessonPlanOpen(
                      !isLessonPlanOpen
                    )
                  }
                  className="p-1 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] lg:hidden"
                >
                  {isLessonPlanOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

              </div>

              {isLessonPlanOpen && (
                <div className="space-y-3.5">

                  {lesson.concepts.map(
                    (
                      concept,
                      index
                    ) => {

                      const isActive =
                        concept.id ===
                        activeConceptId;

                      const isCompleted =
                        concept.status ===
                        'completed';

                      const conceptTitle =
                        getMeaningfulTitle(
                          concept.title,
                          concept.description,
                          lesson.topicName,
                          index
                        );

                      return (
                        <div
                          key={
                            concept.id
                          }
                          onClick={() => {
                            setActiveConceptId(
                              concept.id
                            );

                            setActiveTranscriptIndex(
                              Math.min(
                                index,
                                Math.max(
                                  0,
                                  lesson.transcripts.length -
                                    1
                                )
                              )
                            );

                            handleResetCheck();
                          }}
                          className={`flex items-start space-x-3 text-sm cursor-pointer transition-colors ${
                            isActive
                              ? 'font-bold text-blue-600'
                              : isCompleted
                              ? 'text-[#64748B]'
                              : 'text-[#94A3B8] hover:text-[#64748B]'
                          }`}
                        >

                          {isCompleted ? (
                            <span className="text-green-500 font-bold shrink-0 mt-0.5">
                              ✓
                            </span>
                          ) : isActive ? (
                            <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600 text-[10px] font-bold shrink-0 mt-0.5 text-blue-600">
                              ▶
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-[#CBD5E1] shrink-0 mt-0.5" />
                          )}

                          <div className="min-w-0">

                            <span
                              className={
                                isCompleted
                                  ? 'line-through'
                                  : ''
                              }
                            >
                              {index +
                                1}
                              .{' '}
                              {
                                conceptTitle
                              }
                            </span>

                            {isActive && (
                              <p className="text-xs text-[#64748B] font-normal mt-1 leading-snug line-clamp-4">
                                {
                                  concept.description
                                }
                              </p>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* AI DECISION */}

            <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100/80">

              <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">
                AI Decision
              </p>

              <p className="text-[11px] leading-relaxed text-[#1E40AF]">
                AI is adapting this lesson around{' '}
                <strong>
                  "{displayConceptTitle}"
                </strong>{' '}
                based on your current learning session.
              </p>

            </div>

          </div>
        </div>

        {/* CENTER */}

        <div className="lg:col-span-5 space-y-4">

          <AiAvatarCanvas
            isSpeaking={
              isPlaying
            }
            onTogglePlay={() =>
              setIsPlaying(
                !isPlaying
              )
            }
            language={
              language
            }
            currentConceptTitle={
              displayConceptTitle
            }
            playbackSpeed={
              playbackSpeed
            }
            onSpeedChange={
              setPlaybackSpeed
            }
            captionsEnabled={
              captionsEnabled
            }
            onToggleCaptions={() =>
              setCaptionsEnabled(
                !captionsEnabled
              )
            }
            progressPercent={
              localProgress
            }
          />

          {/* CONCEPT HEADER */}

          <div className="bg-white rounded-2xl border border-blue-100 p-5">

            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
              Active Concept
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">
              {displayConceptTitle}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {
                activeConcept.description
              }
            </p>

          </div>

          {/* QUICK CHECK */}

          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 sm:p-6 flex flex-col space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-2">

                <span className="bg-blue-600 text-white p-1 rounded text-xs font-bold flex items-center justify-center w-6 h-6">
                  ?
                </span>

                <h2 className="font-bold text-[#0F172A] text-sm sm:text-base">
                  Quick Check:{' '}
                  {displayConceptTitle}
                </h2>

              </div>

              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider border border-blue-100">
                Adaptive Quiz
              </span>

            </div>

            {activeConcept.quickCheck ? (
              <>
                <p className="text-[#475569] text-sm font-medium leading-relaxed">
                  {
                    activeConcept
                      .quickCheck
                      .question
                  }
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {activeConcept.quickCheck.options.map(
                    (opt) => {

                      const isSelected =
                        selectedOptionId ===
                        opt.id;

                      return (
                        <button
                          key={opt.id}
                          disabled={
                            evaluationResult !==
                            null
                          }
                          onClick={() =>
                            setSelectedOptionId(
                              opt.id
                            )
                          }
                          className={`p-3 rounded-xl text-xs text-left transition-all ${
                            isSelected
                              ? 'border-2 border-blue-500 bg-blue-50 font-bold text-blue-700 shadow-xs'
                              : 'border border-[#E2E8F0] text-[#1E293B] hover:border-blue-500 hover:bg-blue-50/50 bg-white'
                          }`}
                        >
                          <span className="font-mono text-[#64748B] mr-1.5 font-bold">
                            {opt.id
                              .replace(
                                'opt-',
                                ''
                              )
                              .toUpperCase()}
                            .
                          </span>

                          <span>
                            {opt.text}
                          </span>
                        </button>
                      );
                    }
                  )}

                </div>

                {!evaluationResult ? (
                  <div className="flex justify-between items-center pt-2">

                    <span className="text-xs text-[#64748B]">
                      {selectedOptionId
                        ? 'Option selected'
                        : 'Select an answer to proceed'}
                    </span>

                    <button
                      disabled={
                        !selectedOptionId ||
                        isEvaluating
                      }
                      onClick={
                        handleSubmitAnswer
                      }
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-[#CBD5E1] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-200/60 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isEvaluating
                        ? 'Evaluating...'
                        : 'Submit Answer'}
                    </button>

                  </div>
                ) : (
                  <div className="space-y-3 pt-2">

                    <div className="flex justify-between items-center">

                      <div
                        className={`flex items-center text-xs px-3 py-1 rounded-full border ${
                          evaluationResult.isCorrect
                            ? 'text-green-600 bg-green-50 border-green-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        <span className="mr-1">
                          {evaluationResult.isCorrect ? '✓' : '!'}
                        </span>
                        {evaluationResult.statusText}
                      </div>

                      <button
                        onClick={
                          handleResetCheck
                        }
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Try Again
                      </button>

                    </div>

                    <p className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] leading-relaxed">
                      {
                        evaluationResult.feedback
                      }
                    </p>

                    {evaluationResult.simplifiedAnalogy && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">

                        <div className="flex items-center gap-1 font-bold text-blue-700 text-[11px]">

                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />

                          <span>
                            Intuitive Analogy:
                          </span>

                        </div>

                        <p className="text-[11px] leading-relaxed text-[#1E40AF]">
                          {
                            evaluationResult.simplifiedAnalogy
                          }
                        </p>

                      </div>
                    )}

                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">

                <p className="text-xs text-slate-600 leading-relaxed">
                  Listen to the AI Teacher's explanation of{' '}
                  <strong>
                    {displayConceptTitle}
                  </strong>{' '}
                  before beginning the interactive exercise.
                </p>

              </div>
            )}

            {/* EXPLAIN DIFFERENTLY */}

            <div className="pt-2 border-t border-[#E2E8F0]">

              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                Explain Differently
              </p>

              <div className="flex flex-wrap gap-1.5">

                {[
                  'Explain simpler',
                  'Real-life example',
                  'Step-by-step',
                  'Visual analogy',
                  'Practice problem',
                ].map(
                  (promptText) => (
                    <button
                      key={
                        promptText
                      }
                      onClick={() =>
                        handleExplainDifferently(
                          promptText
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-blue-50 border border-[#E2E8F0] hover:border-blue-300 text-[11px] font-medium text-[#475569] hover:text-blue-600 transition-all"
                    >
                      {
                        promptText
                      }
                    </button>
                  )
                )}

              </div>
            </div>

            {/* NEXT CONCEPT */}

            <button
              type="button"
              onClick={
                moveToNextConcept
              }
              disabled={
                lesson.concepts.findIndex(
                  (c) =>
                    c.id ===
                    activeConceptId
                ) >=
                lesson.concepts.length -
                  1
              }
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all"
            >
              {lesson.concepts.findIndex(
                (c) =>
                  c.id ===
                  activeConceptId
              ) >=
              lesson.concepts.length -
                1
                ? 'Lesson Complete'
                : 'Continue to Next Concept →'}
            </button>

          </div>
        </div>

        {/* RIGHT */}

        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col h-full min-h-[460px] overflow-hidden">

          <div className="flex border-b border-[#E2E8F0]">

            <button
              onClick={() =>
                setRightPanelTab(
                  'interaction'
                )
              }
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                rightPanelTab ===
                'interaction'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-[#94A3B8] hover:text-[#64748B] bg-[#F8FAFC]'
              }`}
            >
              Live Transcript
            </button>

            <button
              onClick={() =>
                setRightPanelTab(
                  'notes'
                )
              }
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                rightPanelTab ===
                'notes'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-[#94A3B8] hover:text-[#64748B] bg-[#F8FAFC]'
              }`}
            >
              My Notes ({existingNotes.length})
            </button>

          </div>

          {rightPanelTab ===
          'interaction' ? (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">

              <div className="relative">

                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />

                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={
                    searchTranscript
                  }
                  onChange={(e) =>
                    setSearchTranscript(
                      e.target.value
                    )
                  }
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500"
                />

              </div>

              <div
                ref={
                  transcriptScrollRef
                }
                className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px]"
              >

                {filteredTranscripts.map(
                  ({ item, originalIndex }) => {

                    const isCurrent =
                      originalIndex ===
                      activeTranscriptIndex;

                    return (
                      <div
                        key={
                          item.id
                        }
                        data-active={
                          isCurrent
                        }
                        onClick={() => {
                          setActiveTranscriptIndex(
                            originalIndex
                          );
                          setIsPlaying(
                            true
                          );
                        }}
                        className={`flex space-x-2.5 cursor-pointer rounded-lg p-2 transition-all ${
                          isCurrent
                            ? 'bg-blue-50 border border-blue-100'
                            : 'hover:bg-[#F8FAFC]'
                        }`}
                      >

                        <span
                          className={`text-[10px] font-mono mt-0.5 shrink-0 ${
                            isCurrent
                              ? 'text-blue-500 font-bold'
                              : 'text-[#94A3B8]'
                          }`}
                        >
                          {
                            item.timestamp
                          }
                        </span>

                        <div className="flex-1 min-w-0">

                          <p
                            className={`text-xs leading-relaxed ${
                              isCurrent
                                ? 'text-[#1E293B] font-medium italic'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {
                              item.text
                            }
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">

                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) =>
                    setNoteText(
                      e.target.value
                    )
                  }
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 placeholder-[#94A3B8] resize-none"
                  placeholder="✎ Add a quick note..."
                />

                <div className="flex justify-end mt-2">

                  <button
                    onClick={
                      handleCreateNote
                    }
                    disabled={
                      !noteText.trim()
                    }
                    className="text-blue-600 text-[10px] font-bold hover:text-blue-800 disabled:text-[#CBD5E1]"
                  >
                    Save Note
                  </button>

                </div>

                {noteSaveSuccess && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">
                    ✓ Saved to notebook
                  </p>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">

              <input
                type="text"
                placeholder="Note title..."
                value={
                  noteTitle
                }
                onChange={(e) =>
                  setNoteTitle(
                    e.target.value
                  )
                }
                className="w-full px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-blue-500"
              />

              <textarea
                rows={4}
                value={
                  noteText
                }
                onChange={(e) =>
                  setNoteText(
                    e.target.value
                  )
                }
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 placeholder-[#94A3B8] resize-none"
                placeholder="Take detailed notes on this concept..."
              />

              <button
                onClick={
                  handleCreateNote
                }
                disabled={
                  !noteText.trim()
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#CBD5E1] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Save Note
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pt-2 border-t border-[#E2E8F0] max-h-[160px]">

                {existingNotes
                  .slice(0, 3)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1"
                    >

                      <div className="flex items-center justify-between font-bold text-[#0F172A]">

                        <span className="truncate">
                          {n.title}
                        </span>

                        <span className="text-[10px] text-[#94A3B8] font-normal">
                          {
                            n.timestamp
                          }
                        </span>

                      </div>

                      <p className="text-[#64748B] text-[11px] line-clamp-2">
                        {n.content}
                      </p>

                    </div>
                  ))}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* PROGRESS BAR */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4">

        <div className="flex items-center justify-between mb-2">

          <span className="text-xs font-bold text-slate-700">
            Lesson Progress
          </span>

          <span className="text-xs font-bold text-blue-600">
            {localProgress}%
          </span>

        </div>

        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">

          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700"
            style={{
              width: `${localProgress}%`,
            }}
          />

        </div>

        <p className="text-[10px] text-slate-400 mt-2">
          Progress increases as you listen to the AI Teacher and move through the concepts.
        </p>

      </div>

    </div>
  );
};