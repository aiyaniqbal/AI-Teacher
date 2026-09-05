import {
  LanguageCode,
  LessonConcept,
  QuizQuestion,
  StudyMaterial,
  Roadmap,
  Flashcard,
  MindMapNode,
} from '../types';

export interface AdaptiveEvaluationResult {
  isCorrect: boolean;
  statusText: string;
  feedback: string;
  adaptiveActions: string[];
  simplifiedAnalogy: string;
  followUpQuestion?: {
    question: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    explanation: string;
  };
}

export class AiTeachingService {
  /**
   * Evaluates student's answer and calculates the adaptive loop response
   */
  static evaluateAnswer(
    concept: LessonConcept,
    selectedOptionId: string,
    language: LanguageCode = 'English'
  ): AdaptiveEvaluationResult {
    const quickCheck = concept.quickCheck;
    if (!quickCheck) {
      return {
        isCorrect: true,
        statusText: 'Understanding detected: Good',
        feedback: 'Great job maintaining steady progress on this concept!',
        adaptiveActions: ['Pacing maintained', 'Advancing to next concept'],
        simplifiedAnalogy: '',
      };
    }

    const selectedOption = quickCheck.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect ?? false;

    const localized = (english: string, hindi: string, hinglish: string) =>
      language === 'Hindi' ? hindi : language === 'Hinglish' ? hinglish : english;

    if (isCorrect) {
      const feedback = quickCheck.correctExplanation?.trim() ||
        localized(
          `Correct. You understood ${concept.title}.`,
          `सही उत्तर। आपने ${concept.title} को समझ लिया है।`,
          `Bilkul sahi. Aapne ${concept.title} ko samajh liya hai.`,
        );

      return {
        isCorrect: true,
        statusText: localized(
          'Strong understanding — ready to advance.',
          'बहुत अच्छी समझ — अब अगली अवधारणा के लिए तैयार हैं।',
          'Strong understanding — ab next concept ke liye ready hain.',
        ),
        feedback,
        adaptiveActions: [
          localized('Mastery increased', 'समझ का स्तर बढ़ा', 'Mastery improve hui'),
          localized('Pacing can accelerate', 'सीखने की गति बढ़ाई जा सकती है', 'Pacing thodi fast ki ja sakti hai'),
          localized('Next concept unlocked', 'अगली अवधारणा उपलब्ध है', 'Next concept unlock ho gaya'),
        ],
        simplifiedAnalogy: '',
      };
    } else {
      const feedback = quickCheck.misconceptionExplanation?.trim() ||
        localized(
          `Let’s revisit ${concept.title} using a simpler explanation.`,
          `आइए ${concept.title} को एक सरल तरीके से फिर से समझते हैं।`,
          `Chalo ${concept.title} ko ek simpler explanation ke saath dobara samajhte hain.`,
        );

      const analogy = quickCheck.simplifiedAnalogy?.trim() ||
        localized(
          `Think about the key idea in ${concept.title} and connect it to the example above.`,
          `${concept.title} के मुख्य विचार को ऊपर दिए गए उदाहरण से जोड़कर देखें।`,
          `${concept.title} ke main idea ko upar diye example se connect karke dekho.`,
        );

      return {
        isCorrect: false,
        statusText: localized(
          'Needs improvement — teaching is adapting.',
          'अभी थोड़ा और अभ्यास चाहिए — शिक्षक आपकी समझ के अनुसार तरीका बदल रहा है।',
          'Thoda aur practice chahiye — teacher aapki understanding ke hisaab se adapt kar raha hai.',
        ),
        feedback,
        adaptiveActions: [
          localized('Simplifying this concept', 'इस अवधारणा को सरल तरीके से दोहराया जा रहा है', 'Concept ko simpler way mein repeat kar rahe hain'),
          localized('Providing another explanation or analogy', 'एक और व्याख्या या उदाहरण दिया जा रहा है', 'Ek aur explanation ya analogy di ja rahi hai'),
          localized('Giving extra practice on this concept', 'इस अवधारणा पर अतिरिक्त अभ्यास दिया जाएगा', 'Is concept par extra practice milegi'),
        ],
        simplifiedAnalogy: analogy,
        followUpQuestion: quickCheck.followUpQuestion
          ? {
              question: quickCheck.followUpQuestion.question,
              options: quickCheck.followUpQuestion.options.map((option) => ({
                id: option.id,
                text: option.text,
                isCorrect: option.isCorrect === true,
              })),
              explanation: quickCheck.followUpQuestion.explanation,
            }
          : undefined,
      };
    }
  }

  /**
   * Simulates AI RAG processing on uploaded files or topic prompt
   */
  static async processUploadedMaterial(
    fileOrTopicName: string,
    fileType: string
  ): Promise<StudyMaterial> {
    // Artificial slight delay for realistic processing feel
    await new Promise((res) => setTimeout(res, 800));

    const isML = fileOrTopicName.toLowerCase().includes('machine') || fileOrTopicName.toLowerCase().includes('ai');
    const isBio = fileOrTopicName.toLowerCase().includes('bio') || fileOrTopicName.toLowerCase().includes('cell');

    let extractedTopics = ['Electric Current', 'Voltage', 'Resistance', "Ohm's Law", 'Circuits'];
    let summaryPreview = 'Comprehensive breakdown of fundamental principles, definitions, mathematical formulas, and practice problems.';

    if (isML) {
      extractedTopics = ['Supervised Learning', 'Loss Functions', 'Gradient Descent', 'Backpropagation', 'Evaluation Metrics'];
      summaryPreview = 'Extracted key mathematical foundations of gradient descent optimization, cost surface minimizations, and network weights.';
    } else if (isBio) {
      extractedTopics = ['Cell Membrane', 'Mitochondria ATP', 'Protein Synthesis', 'DNA Transcription', 'Enzyme Catalysis'];
      summaryPreview = 'Indexed structural organelle mechanics, cellular respiration pathways, and biochemical ATP synthesis stages.';
    }

    return {
      id: 'mat-' + Date.now(),
      title: fileOrTopicName.replace(/\.[^/.]+$/, ''),
      fileName: fileOrTopicName,
      fileType: (fileType.toUpperCase().includes('PDF') ? 'PDF' : fileType.toUpperCase().includes('DOC') ? 'DOCX' : 'Topic Prompt') as any,
      fileSize: '3.4 MB',
      uploadDate: 'Just now',
      extractedTopics,
      chaptersCount: extractedTopics.length,
      status: 'ready',
      summaryPreview,
    };
  }

  /**
   * Generates adaptive questions giving higher weight to weak areas
   */
  static generateAdaptiveQuiz(
    basePool: QuizQuestion[],
    weakConcepts: string[],
    questionCount: number = 5
  ): { questions: QuizQuestion[]; distributionNote: string } {
    // Shuffle helper
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Filter questions by categories
    const weakQuestions = basePool.filter((q) => q.conceptCategory === 'weak' || weakConcepts.some((w) => q.concept.toLowerCase().includes(w.toLowerCase())));
    const otherQuestions = basePool.filter((q) => !weakQuestions.includes(q));

    const weakQuota = Math.ceil(questionCount * 0.6); // 60% from weak
    const otherQuota = questionCount - weakQuota;

    const selectedWeak = shuffle(weakQuestions).slice(0, weakQuota);
    const selectedOther = shuffle(otherQuestions).slice(0, otherQuota);

    const merged = shuffle([...selectedWeak, ...selectedOther]);

    // Shuffle options within each question so student never sees same positions
    const finalQuestions = merged.map((q) => {
      const correctText = q.options[q.correctAnswerIndex];
      const shuffledOptions = shuffle([...q.options]);
      const newCorrectIndex = shuffledOptions.indexOf(correctText);

      return {
        ...q,
        options: shuffledOptions,
        correctAnswerIndex: newCorrectIndex,
      };
    });

    const distributionNote = 'Adaptive Engine: 60% questions selected from your weak area (Resistance & Ohm’s Law), 40% from Voltage/Current to balance reinforcement.';

    return {
      questions: finalQuestions.length > 0 ? finalQuestions : basePool.slice(0, questionCount),
      distributionNote,
    };
  }

  /**
   * Generates flashcards based on a topic
   */
  static generateFlashcards(topic: string, count: number = 5): Flashcard[] {
    const list: Flashcard[] = [
      {
        id: 'fc-gen-1',
        materialId: 'mat-dyn',
        materialName: topic,
        topic,
        front: `What is the core definition of ${topic}?`,
        back: `${topic} describes fundamental principles, dynamic interactions, and mathematical relationships governing the underlying system.`,
        isImportant: true,
        masteryStatus: 'unreviewed',
      },
      {
        id: 'fc-gen-2',
        materialId: 'mat-dyn',
        materialName: topic,
        topic,
        front: `What is the primary governing formula for ${topic}?`,
        back: `V = I × R (or standard equivalent system state equations linking flux, resistance, and driving potential).`,
        isImportant: false,
        masteryStatus: 'needs_practice',
      },
      {
        id: 'fc-gen-3',
        materialId: 'mat-dyn',
        materialName: topic,
        topic,
        front: `How do variations in system constraints affect ${topic}?`,
        back: `Increasing resistive factors impedes flow rate inversely when driving potential is fixed.`,
        isImportant: false,
        masteryStatus: 'unreviewed',
      },
    ];

    return list.slice(0, count);
  }

  /**
   * Generates formatted summaries
   */
  static generateSummaryContent(
    topic: string,
    format: 'Quick Summary' | 'Detailed Summary' | 'Exam Notes' | 'Key Points' | 'Formula Sheet' | 'Beginner Explanation'
  ): string {
    switch (format) {
      case 'Quick Summary':
        return `### Quick Summary: ${topic}\n\n- **Core Theme**: Fundamental principles governing charges, potentials, and circuit resistance.\n- **Primary Formula**: $V = I \\times R$ (Ohm's Law).\n- **Key Takeaway**: Current is directly proportional to voltage and inversely proportional to resistance. At constant voltage, doubling resistance halves current flow.\n- **Applications**: Circuit design, household fuses, sensory robotics, and power systems.`;

      case 'Exam Notes':
        return `### ⚡ High-Yield Exam Notes: ${topic}\n\n1. **Definitions to Memorize**:\n   - *Electric Current ($I$)*: Rate of charge movement $I = Q / t$ (Amperes = Coulombs/sec).\n   - *Electric Potential ($V$)*: Energy per charge $V = W / Q$ (Volts = Joules/Coulomb).\n   - *Resistance ($R$)*: Opposition to current flow (Ohms $\\Omega$).\n\n2. **Common Exam Traps**:\n   - Remember: In parallel circuits, voltage across all branches is EQUAL, but current divides.\n   - In series circuits, current is EQUAL across all components, but voltages sum up.\n   - Watch out for units: Convert $mA$ to $A$ before applying $V = IR$!\n\n3. **Quick Problem Template**:\n   - Given $V = 12\\text{V}, R = 4\\,\\Omega \\rightarrow I = 12/4 = 3\\text{A}$.`;

      case 'Formula Sheet':
        return `### 📐 Formula & Unit Reference: ${topic}\n\n| Concept | Symbol | Formula | SI Unit |\n| :--- | :---: | :--- | :---: |\n| Current | $I$ | $I = \\frac{Q}{t}$ | Ampere (A) |\n| Voltage | $V$ | $V = \\frac{W}{Q} = I \\times R$ | Volt (V) |\n| Resistance | $R$ | $R = \\frac{\\rho L}{A} = \\frac{V}{I}$ | Ohm ($\\Omega$) |\n| Series Resistance | $R_{eq}$ | $R_1 + R_2 + R_3$ | $\\Omega$ |\n| Parallel Resistance | $R_{eq}$ | $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}$ | $\\Omega$ |\n| Electrical Power | $P$ | $P = V \\cdot I = I^2 R = \\frac{V^2}{R}$ | Watt (W) |`;

      case 'Beginner Explanation':
        return `### 💡 Simple Explanation for Beginners\n\nImagine electricity as **water flowing in pipes**:\n\n1. **Voltage** is the **Water Pressure** coming out of your water pump. Higher pressure pushes more water.\n2. **Current** is the **Speed and volume of water** flowing through the pipe.\n3. **Resistance** is like a **narrow section of pipe or a sponge inside**. It makes it harder for water to pass.\n\nWhen you squeeze the pipe (increase resistance), less water can escape (current drops). That is the simple beauty of Ohm's Law!`;

      case 'Key Points':
        return `### 🎯 Key Bullet Points\n\n- Current cannot flow without a closed conductive loop and potential difference.\n- Ohm's law strictly holds for Ohmic conductors at constant temperature.\n- Slope of a V-I graph gives the resistance ($R = \\Delta V / \\Delta I$).\n- Safety devices like fuses melt at high currents ($P = I^2 R$) to protect equipment.`;

      default:
        return `### Comprehensive Detailed Guide: ${topic}\n\nDetailed breakdown covering theoretical background, historical experiments, empirical verification, mathematical derivations, circuit topology, series-parallel transformations, and real-world engineering applications.`;
    }
  }

  /**
   * Browser Speech Synthesis for the AI Teacher Voice
   */
  static speakTranscript(
    text: string,
    language: LanguageCode = 'English',
    onEnd?: () => void
  ): () => void {
    if (typeof window === 'undefined' || !text?.trim()) {
      onEnd?.();
      return () => {};
    }

    const controller = new AbortController();
    let audio: HTMLAudioElement | null = null;
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

    void (async () => {
      try {
        const response = await fetch('http://127.0.0.1:8001/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, rate: 1 }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail = `Teacher voice server returned ${response.status}.`;
          try {
            const data = await response.json();
            if (data?.detail) detail = String(data.detail);
          } catch {}
          throw new Error(detail);
        }

        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        audio = new Audio(objectUrl);
        audio.onended = () => { cleanup(); finish(); };
        audio.onerror = () => { cleanup(); finish(); };
        await audio.play();
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('EduMind TTS error:', error);
        cleanup();
        finish();
      }
    })();

    return cleanup;
  }
}
