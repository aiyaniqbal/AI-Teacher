import pdfProcessor from './pdfProcessor.js';
import ragEngine from './rag.js';
import { v4 as uuidv4 } from 'uuid';

class StudentProfile {
  constructor(data) {
    this.id = uuidv4();
    this.name = data.name || 'Student';
    this.level = data.level || 'beginner'; // beginner, intermediate, advanced
    this.language = data.language || 'english'; // english, hindi, hinglish
    this.availableTime = data.availableTime || 20; // minutes
    this.goal = data.goal || 'general';
    this.weakAreas = [];
    this.strongAreas = [];
    this.performanceHistory = [];
    this.currentSession = null;
  }
}

class LessonPlan {
  constructor(studentProfile, topics, ragContext) {
    this.id = uuidv4();
    this.studentLevel = studentProfile.level;
    this.language = studentProfile.language;
    this.duration = studentProfile.availableTime;
    this.topics = topics;
    this.ragContext = ragContext;
    this.phases = [];
    this.currentPhase = 0;
  }
}

class AITeacher {
  constructor() {
    this.sessions = new Map();
    this.studentProfiles = new Map();
    this.lessonPlans = new Map();
    this.conversations = new Map();
  }

  createStudentProfile(data) {
    const profile = new StudentProfile(data);
    this.studentProfiles.set(profile.id, profile);
    return profile;
  }

  async analyzeContent(pdfResult) {
    // Analyze the PDF content and extract key topics
    const text = pdfResult.text;
    const topics = this.extractTopics(text);
    const difficulty = this.assessDifficulty(text);
    const concepts = this.extractConcepts(text);
    
    return {
      title: pdfResult.title,
      numPages: pdfResult.numPages,
      totalWords: text.split(/\s+/).length,
      topics,
      difficulty,
      concepts,
      summary: this.generateSummary(text)
    };
  }

  extractTopics(text) {
    // Simple topic extraction based on headings and keyword frequency
    const lines = text.split('\n');
    const topics = [];
    const topicKeywords = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Detect headings (lines that are shorter and don't end with period)
      if (trimmed.length > 3 && trimmed.length < 100 && !trimmed.endsWith('.') && /^[A-Z]/.test(trimmed)) {
        topics.push(trimmed);
      }
    });

    // Also extract frequent meaningful phrases
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word);

    return { headings: topics.slice(0, 20), keyTerms: topWords };
  }

  assessDifficulty(text) {
    const avgWordLength = text.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgSentenceLength = text.split(/\s+/).length / sentences;
    
    if (avgSentenceLength > 25 && avgWordLength > 6) return 'advanced';
    if (avgSentenceLength > 15 && avgWordLength > 5) return 'intermediate';
    return 'beginner';
  }

  extractConcepts(text) {
    const conceptPatterns = [
      /(?:is|are|means|refers to|defined as|known as)\s+(.+?)(?:\.|,|\n)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|are)\s+(?:a|an|the)\s+(.+)/gi
    ];
    
    const concepts = [];
    conceptPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        concepts.push({ term: match[1]?.trim(), definition: match[2]?.trim() });
      }
    });
    return concepts.slice(0, 15);
  }

  generateSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).join('. ').trim() + '.';
  }

  async generateLessonPlan(studentProfileId, documentAnalysis) {
    const profile = this.studentProfiles.get(studentProfileId);
    if (!profile) throw new Error('Student profile not found');

    const plan = new LessonPlan(profile, documentAnalysis.topics, documentAnalysis);
    
    // Generate structured phases based on level and time
    const phaseCount = profile.level === 'beginner' ? 6 : profile.level === 'intermediate' ? 5 : 4;
    const timePerPhase = Math.floor(profile.availableTime / phaseCount);
    
    const languageInstructions = this.getLanguageInstructions(profile.language);
    const difficultyMultiplier = profile.level === 'beginner' ? 1.5 : profile.level === 'advanced' ? 0.7 : 1;

    plan.phases = [
      {
        type: 'introduction',
        title: this.getPhaseTitle('introduction', profile.language),
        duration: Math.floor(timePerPhase * 0.1),
        content: await this.generatePhaseContent('introduction', documentAnalysis, profile),
        instructions: languageInstructions
      },
      {
        type: 'explanation',
        title: this.getPhaseTitle('explanation', profile.language),
        duration: Math.floor(timePerPhase * 0.25),
        content: await this.generatePhaseContent('explanation', documentAnalysis, profile),
        instructions: languageInstructions
      },
      {
        type: 'demonstration',
        title: this.getPhaseTitle('demonstration', profile.language),
        duration: Math.floor(timePerPhase * 0.2),
        content: await this.generatePhaseContent('demonstration', documentAnalysis, profile),
        instructions: languageInstructions
      },
      {
        type: 'practice',
        title: this.getPhaseTitle('practice', profile.language),
        duration: Math.floor(timePerPhase * 0.2),
        content: await this.generatePhaseContent('practice', documentAnalysis, profile),
        instructions: languageInstructions
      },
      {
        type: 'assessment',
        title: this.getPhaseTitle('assessment', profile.language),
        duration: Math.floor(timePerPhase * 0.15),
        content: await this.generatePhaseContent('assessment', documentAnalysis, profile),
        instructions: languageInstructions
      },
      {
        type: 'summary',
        title: this.getPhaseTitle('summary', profile.language),
        duration: Math.floor(timePerPhase * 0.1),
        content: await this.generatePhaseContent('summary', documentAnalysis, profile),
        instructions: languageInstructions
      }
    ];

    plan.id = uuidv4();
    this.lessonPlans.set(plan.id, plan);
    return plan;
  }

  getLanguageInstructions(lang) {
    const instructions = {
      english: 'Teach in English. Use clear, simple sentences. Provide examples.',
      hindi: 'हिंदी में सिखाएं। सरल भाषा का प्रयोग करें। उदाहरण दें।',
      hinglish: 'Teach in Hinglish (Hindi + English mix). Use conversational tone. बीच-बीच में Hindi words और English concepts दोनों use करें।'
    };
    return instructions[lang] || instructions.english;
  }

  getPhaseTitle(phase, lang) {
    const titles = {
      introduction: { english: 'Introduction', hindi: 'परिचय', hinglish: 'Introduction / परिचय' },
      explanation: { english: 'Core Concepts', hindi: 'मुख्य अवधारणाएं', hinglish: 'Main Concepts / मुख्य अवधारणाएं' },
      demonstration: { english: 'Visual Examples', hindi: 'दृश्य उदाहरण', hinglish: 'Visual Examples / दृश्य उदाहरण' },
      practice: { english: 'Practice Questions', hindi: 'अभ्यास प्रश्न', hinglish: 'Practice / अभ्यास' },
      assessment: { english: 'Quick Assessment', hindi: 'त्वरित मूल्यांकन', hinglish: 'Assessment / मूल्यांकन' },
      summary: { english: 'Summary & Next Steps', hindi: 'सारांश और अगले कदम', hinglish: 'Summary / सारांश' }
    };
    return titles[phase]?.[lang] || titles[phase]?.english || phase;
  }

  async generatePhaseContent(phase, documentAnalysis, profile) {
    const langCode = profile.language === 'hindi' ? 'Hindi' : profile.language === 'hinglish' ? 'Hinglish' : 'English';
    const levelText = profile.level;
    const mainTopics = documentAnalysis.topics.headings?.slice(0, 5) || ['Key concepts'];
    const keyTerms = documentAnalysis.topics.keyTerms?.slice(0, 10) || [];
    
    // Generate teaching content based on phase type
    const templates = {
      introduction: {
        script: `Welcome! Today we'll be learning about: ${mainTopics.join(', ')}. This is at a ${levelText} level. Let's begin our learning journey! ${profile.language === 'hindi' ? 'आज हम सीखेंगे' : profile.language === 'hinglish' ? 'Aaj hum seekhenge' : ''}`,
        keyPoints: mainTopics,
        visuals: [{ type: 'title', content: `Learning: ${mainTopics.slice(0, 3).join(' | ')}` }],
        teachingNotes: `Focus on making the student comfortable. ${profile.level === 'beginner' ? 'Start from basics.' : 'Recap prior knowledge.'}`
      },
      explanation: {
        script: `Let's dive into the core concepts. Here are the key ideas you need to understand:\n\n${mainTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nThese concepts are connected and build upon each other. ${profile.language === 'hindi' ? 'ये अवधारणाएं आपस में जुड़ी हुई हैं।' : ''}`,
        keyPoints: keyTerms.slice(0, 8),
        visuals: mainTopics.slice(0, 4).map(t => ({ type: 'diagram', content: t })),
        teachingNotes: 'Use step-by-step explanation. Build from simple to complex.'
      },
      demonstration: {
        script: `Now let's see these concepts in action with examples.\n\nLet me show you how this works with a practical example:\n${mainTopics[0] ? `For ${mainTopics[0]}: think of it as building blocks - each piece depends on the previous one.` : ''}\n\nNotice the patterns and connections between concepts.`,
        keyPoints: ['Visual representation', 'Real-world application', 'Pattern recognition'],
        visuals: [{ type: 'formula', content: 'Concept A → Concept B → Understanding' }],
        teachingNotes: 'Use analogies relevant to the student\'s background.'
      },
      practice: {
        script: `Time to practice! I'll ask you some questions to check your understanding.\n\nDon't worry if you don't get it right the first time - that's how we learn! ${profile.language === 'hindi' ? 'गलतियाँ करना ठीक है - यही सीखने का तरीका है!' : ''}`,
        keyPoints: ['Active recall', 'Application', 'Self-assessment'],
        visuals: [{ type: 'question', content: 'Ready for practice?' }],
        teachingNotes: 'Start easy, increase difficulty gradually.'
      },
      assessment: {
        script: `Let's do a quick assessment to see how well you've understood the material.\n\nThis will help me understand what we need to review.\n${profile.language === 'hindi' ? 'चलिए देखते हैं आपने कितना समझा!' : ''}`,
        keyPoints: ['Understanding check', 'Misconception detection', 'Progress measurement'],
        visuals: [{ type: 'quiz', content: 'Assessment Time' }],
        teachingNotes: 'Questions should match student level.'
      },
      summary: {
        script: `Great work today! Let's recap what we learned:\n\n${mainTopics.map((t, i) => `✅ ${t}`).join('\n')}\n\nYou've made excellent progress! ${profile.language === 'hindi' ? 'बहुत अच्छा! आपने आज बहुत कुछ सीखा!' : profile.language === 'hinglish' ? 'Bahut accha! Aaj bahut kuch seekha!' : 'Keep up the great work!'}`,
        keyPoints: ['Recap main points', 'Highlight achievements', 'Next steps'],
        visuals: [{ type: 'checklist', content: 'Learning Summary' }],
        teachingNotes: 'Reinforce positive learning experience.'
      }
    };

    return templates[phase] || templates.introduction;
  }

  async startTeachingSession(studentProfileId, lessonPlanId) {
    const session = {
      id: uuidv4(),
      studentProfileId,
      lessonPlanId,
      currentPhase: 0,
      transcript: [],
      questionsAsked: [],
      answersGiven: [],
      performance: { correct: 0, incorrect: 0, total: 0 },
      adaptations: [],
      notes: '',
      startTime: new Date().toISOString(),
      isActive: true
    };

    this.sessions.set(session.id, session);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (plan && plan.phases.length > 0) {
      const firstPhase = plan.phases[0];
      session.transcript.push({
        timestamp: new Date().toISOString(),
        type: 'teacher',
        phase: firstPhase.type,
        content: firstPhase.content.script,
        visuals: firstPhase.content.visuals
      });
    }

    return session;
  }

  async generateQuestion(studentProfileId, lessonPlanId, topic) {
    const profile = this.studentProfiles.get(studentProfileId);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (!profile || !plan) throw new Error('Profile or plan not found');

    // Get RAG context if available
    let context = '';
    try {
      if (ragEngine.isReady) {
        context = await ragEngine.getContextForTopic(topic || 'general concepts', 3);
      }
    } catch (e) {
      // RAG not available, use plan context
      context = plan.ragContext?.summary || '';
    }

    const difficulty = profile.level;
    const lang = profile.language;
    
    const questionBank = this.getQuestionBank(difficulty, lang, topic);
    const usedQuestions = this.sessions.get([...this.sessions.keys()].pop())?.questionsAsked || [];
    
    // Filter out used questions and pick a random one
    const availableQuestions = questionBank.filter(q => !usedQuestions.includes(q.id));
    const question = availableQuestions.length > 0 
      ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
      : questionBank[0];

    return {
      id: uuidv4(),
      question: question.text,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: difficulty,
      topic: topic || 'general',
      hint: question.hint,
      explanation: question.explanation
    };
  }

  getQuestionBank(difficulty, language, topic) {
    const langPrefix = language === 'hindi' ? 'हिंदी: ' : language === 'hinglish' ? '' : '';
    
    const questions = {
      beginner: [
        {
          id: 'b1',
          text: `${langPrefix}What is the main idea of this concept? What do you think this is about?`,
          type: 'open',
          correctAnswer: 'conceptual',
          hint: 'Think about the key words in the title.',
          explanation: 'Understanding the main idea is the first step to mastering any concept.'
        },
        {
          id: 'b2',
          text: `${langPrefix}Can you give a simple example of this in real life?`,
          type: 'open',
          correctAnswer: 'example',
          hint: 'Think about everyday situations.',
          explanation: 'Connecting concepts to real life helps with retention.'
        },
        {
          id: 'b3',
          text: `${langPrefix}True or False: This concept is used in many areas. Explain why.`,
          type: 'multiple_choice',
          options: ['True - it has wide applications', 'False - it is very limited', 'Only in science', 'Only in math'],
          correctAnswer: 'True - it has wide applications',
          hint: 'Consider different fields.',
          explanation: 'Most fundamental concepts have broad applicability.'
        },
        {
          id: 'b4',
          text: `${langPrefix}Match the following: Define each key term in your own words.`,
          type: 'matching',
          correctAnswer: 'correct_matches',
          hint: 'Use the definitions from the lesson.',
          explanation: 'Defining terms in your own words shows true understanding.'
        }
      ],
      intermediate: [
        {
          id: 'i1',
          text: `${langPrefix}Explain how two concepts from the lesson are related to each other.`,
          type: 'open',
          correctAnswer: 'relationship',
          hint: 'Look for cause-and-effect or dependency.',
          explanation: 'Understanding relationships between concepts deepens knowledge.'
        },
        {
          id: 'i2',
          text: `${langPrefix}Solve this problem: Given the principles discussed, what would happen if we change X?`,
          type: 'problem_solving',
          correctAnswer: 'logical_analysis',
          hint: 'Apply the core principles step by step.',
          explanation: 'Problem-solving applies theory to practice.'
        },
        {
          id: 'i3',
          text: `${langPrefix}Which of the following is the BEST application of this concept?`,
          type: 'multiple_choice',
          options: ['Application A - direct use', 'Application B - theoretical', 'Application C - tangential', 'Application D - unrelated'],
          correctAnswer: 'Application A - direct use',
          hint: 'Think about the primary purpose.',
          explanation: 'Choosing the best application shows depth of understanding.'
        }
      ],
      advanced: [
        {
          id: 'a1',
          text: `${langPrefix}Critically analyze this concept. What are its limitations? Where does it break down?`,
          type: 'critical_thinking',
          correctAnswer: 'balanced_analysis',
          hint: 'Consider edge cases and assumptions.',
          explanation: 'Advanced learners should understand limitations as well as strengths.'
        },
        {
          id: 'a2',
          text: `${langPrefix}Design a solution that uses multiple concepts from this lesson together.`,
          type: 'synthesis',
          correctAnswer: 'integrated_solution',
          hint: 'Combine at least 3 concepts.',
          explanation: 'Synthesizing multiple concepts shows mastery.'
        },
        {
          id: 'a3',
          text: `${langPrefix}Compare this approach with an alternative. Which is better and why?`,
          type: 'comparison',
          correctAnswer: 'balanced_comparison',
          hint: 'Consider pros and cons of each.',
          explanation: 'Comparison requires deep understanding of both approaches.'
        }
      ]
    };

    return questions[difficulty] || questions.beginner;
  }

  async evaluateAnswer(studentProfileId, questionId, answer, correctAnswer) {
    const profile = this.studentProfiles.get(studentProfileId);
    const lang = profile?.language || 'english';
    
    // Simple evaluation logic (in production, would use LLM)
    const isCorrect = this.checkAnswer(answer, correctAnswer);
    
    const evaluation = {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: this.getFeedback(isCorrect, lang),
      misconception: !isCorrect ? this.detectMisconception(answer, correctAnswer) : null,
      suggestedAction: isCorrect ? 'continue' : 're_explain',
      encouragement: this.getEncouragement(isCorrect, lang)
    };

    // Update session performance
    const sessionIds = [...this.sessions.keys()];
    const sessionId = sessionIds[sessionIds.length - 1];
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.performance.total++;
        if (isCorrect) session.performance.correct++;
        else session.performance.incorrect++;
        
        session.questionsAsked.push(questionId);
        session.answersGiven.push({ questionId, answer, isCorrect, timestamp: new Date().toISOString() });
      }
    }

    return evaluation;
  }

  checkAnswer(answer, correctAnswer) {
    if (!answer || !correctAnswer) return false;
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    
    // Check for keyword matches
    const keywords = normalizedCorrect.split(/[,\s]+/).filter(w => w.length > 3);
    const matchCount = keywords.filter(k => normalizedAnswer.includes(k)).length;
    
    return matchCount >= Math.ceil(keywords.length * 0.5) || normalizedAnswer === normalizedCorrect;
  }

  getFeedback(isCorrect, lang) {
    const feedback = {
      correct: {
        english: ['Excellent! You got it right! 🎉', 'Great work! Your understanding is solid.', 'Perfect! Keep going!', 'Well done! That was spot on!'],
        hindi: ['बहुत बढ़िया! आपने सही उत्तर दिया! 🎉', 'शानदार! आपकी समझ अच्छी है।', 'बिल्कुल सही! आगे बढ़ें!', 'अच्छा काम! बिल्कुल सही!'],
        hinglish: ['Bahut badhiya! You got it right! 🎉', 'Great! Your understanding is solid.', 'Perfect! Aage badho!', 'Accha kaam! Bilkul sahi!']
      },
      incorrect: {
        english: ['Not quite right, but good try! Let me explain differently.', 'Almost there! Let\'s look at this from another angle.', 'Don\'t worry - this is how we learn. Let me help you.', 'Close! Let me re-explain this concept.'],
        hindi: ['सही नहीं है, लेकिन अच्छी कोशिश! मैं अलग तरीके से समझाता हूं।', 'लगभग सही! चलिए इसे दूसरे नज़रिए से देखते हैं।', 'चिंता मत करें - ऐसे ही हम सीखते हैं।', 'करीब-करीब! मैं फिर से समझाता हूं।'],
        hinglish: ['Sahi nahi hai, but acchi try! Main alag tarike se samjhata hoon.', 'Lagbhag sahi! Chalo isko dusre angle se dekhte hain.', 'Chinta mat karo - aise hi hum seekhte hain.', 'Kareeb! Main phir se samjhata hoon.']
      }
    };

    const options = isCorrect ? feedback.correct[lang] || feedback.correct.english : feedback.incorrect[lang] || feedback.incorrect.english;
    return options[Math.floor(Math.random() * options.length)];
  }

  getEncouragement(isCorrect, lang) {
    const encouragements = {
      correct: {
        english: 'You\'re making great progress! 💪',
        hindi: 'आप बहुत अच्छा कर रहे हैं! 💪',
        hinglish: 'Tum bahut accha kar rahe ho! 💪'
      },
      incorrect: {
        english: 'Every mistake is a learning opportunity! Keep trying! 🌟',
        hindi: 'हर गलती एक सीखने का मौका है! कोशिश करते रहें! 🌟',
        hinglish: 'Har galti ek seekhne ka mauka hai! Koshish karte raho! 🌟'
      }
    };
    return encouragements[isCorrect ? 'correct' : 'incorrect'][lang] || encouragements[isCorrect ? 'correct' : 'incorrect'].english;
  }

  detectMisconception(answer, correctAnswer) {
    if (!answer) return 'No answer provided';
    
    const answerLower = answer.toLowerCase();
    const correctLower = correctAnswer.toLowerCase();
    
    // Simple misconception detection
    if (answerLower.includes('don\'t know') || answerLower.includes('not sure')) {
      return 'Student is unsure about the concept - needs more explanation';
    }
    if (answerLower.length < 10) {
      return 'Answer is too brief - student may need more context';
    }
    return 'The student\'s answer deviates from the expected concept - may need alternative explanation';
  }

  async adaptTeaching(studentProfileId, evaluation) {
    const profile = this.studentProfiles.get(studentProfileId);
    if (!profile) throw new Error('Profile not found');

    const adaptation = {
      type: evaluation.isCorrect ? 'advance' : 're_explain',
      timestamp: new Date().toISOString()
    };

    if (!evaluation.isCorrect) {
      // Track weak area
      profile.weakAreas.push({
        topic: evaluation.topic || 'general',
        timestamp: new Date().toISOString(),
        misconception: evaluation.misconception
      });

      adaptation.action = 're_explain_with_different_approach';
      adaptation.newApproach = this.generateAlternativeExplanation(evaluation);
    } else {
      profile.strongAreas.push({
        topic: evaluation.topic || 'general',
        timestamp: new Date().toISOString()
      });
      adaptation.action = 'advance_to_next_concept';
    }

    return adaptation;
  }

  generateAlternativeExplanation(evaluation) {
    return {
      strategy: 'Use a different angle - try an analogy, visual, or real-world example',
      newExplanation: `Let me explain this differently. Instead of the abstract approach, let's use a practical example that connects to everyday experience.`,
      suggestedVisual: 'diagram_or_example',
      difficulty: 'easier'
    };
  }

  async generateQuiz(studentProfileId, lessonPlanId, numQuestions = 5) {
    const profile = this.studentProfiles.get(studentProfileId);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const questions = [];
    for (let i = 0; i < numQuestions; i++) {
      const q = await this.generateQuestion(studentProfileId, lessonPlanId);
      questions.push(q);
    }

    // Prioritize weak areas
    if (profile.weakAreas.length > 0) {
      const weakTopic = profile.weakAreas[profile.weakAreas.length - 1].topic;
      const weakQ = await this.generateQuestion(studentProfileId, lessonPlanId, weakTopic);
      questions.push(weakQ);
    }

    return {
      id: uuidv4(),
      title: profile.language === 'hindi' ? 'मूल्यांकन प्रश्नोत्तरी' : profile.language === 'hinglish' ? 'Assessment Quiz' : 'Assessment Quiz',
      questions: questions.slice(0, numQuestions + 1),
      totalQuestions: questions.length,
      difficulty: profile.level,
      language: profile.language,
      timeLimit: profile.availableTime * 0.3 // 30% of available time
    };
  }

  async generateRoadmap(studentProfileId) {
    const profile = this.studentProfiles.get(studentProfileId);
    if (!profile) throw new Error('Profile not found');

    const weakTopics = [...new Set(profile.weakAreas.map(w => w.topic))];
    const strongTopics = [...new Set(profile.strongAreas.map(s => s.topic))];

    const roadmap = {
      id: uuidv4(),
      studentName: profile.name,
      level: profile.level,
      currentProgress: profile.performanceHistory.length,
      sections: [
        {
          title: profile.language === 'hindi' ? '📚 क्या सीखना है' : profile.language === 'hinglish' ? '📚 Kya seekhna hai' : '📚 What to Learn',
          type: 'topics',
          items: weakTopics.length > 0 ? weakTopics : ['Core concepts', 'Advanced topics', 'Practical applications']
        },
        {
          title: profile.language === 'hindi' ? '💪 आपकी ताकत' : profile.language === 'hinglish' ? '💪 Aapki taakat' : '💪 Your Strengths',
          type: 'strengths',
          items: strongTopics.length > 0 ? strongTopics : ['Building foundation...']
        },
        {
          title: profile.language === 'hindi' ? '🎯 अगले कदम' : profile.language === 'hinglish' ? '🎯 Agle kadam' : '🎯 Next Steps',
          type: 'next_steps',
          items: this.generateNextSteps(profile)
        },
        {
          title: profile.language === 'hindi' ? '📊 सुधार के क्षेत्र' : profile.language === 'hinglish' ? '📊 Sudhar ke kshetra' : '📊 Areas to Improve',
          type: 'improvement',
          items: weakTopics.length > 0 ? weakTopics.map(t => `${t} - Practice more questions`) : ['Take more assessments to identify focus areas']
        }
      ],
      estimatedTime: `${Math.ceil(weakTopics.length * 15 + 30)} minutes recommended`,
      generatedAt: new Date().toISOString()
    };

    return roadmap;
  }

  generateNextSteps(profile) {
    const steps = [];
    
    if (profile.weakAreas.length > 0) {
      steps.push(profile.language === 'hindi' ? 'कमज़ोर क्षेत्रों को दोबारा पढ़ें' : 'Review weak areas');
    }
    steps.push(profile.language === 'hindi' ? 'अभ्यास प्रश्न हल करें' : 'Solve practice questions');
    steps.push(profile.language === 'hindi' ? 'अगले टॉपिक पर जाएं' : 'Move to next topic');
    
    if (profile.performanceHistory.length > 3) {
      steps.push(profile.language === 'hindi' ? 'एक पूर्ण परीक्षा दें' : 'Take a full test');
    }
    
    return steps;
  }

  async generateLearningReport(studentProfileId) {
    const profile = this.studentProfiles.get(studentProfileId);
    if (!profile) throw new Error('Profile not found');

    const totalAnswered = profile.performanceHistory.reduce((sum, p) => sum + p.total, 0);
    const totalCorrect = profile.performanceHistory.reduce((sum, p) => sum + p.correct, 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const weakTopics = {};
    profile.weakAreas.forEach(w => {
      weakTopics[w.topic] = (weakTopics[w.topic] || 0) + 1;
    });
    
    const sortedWeak = Object.entries(weakTopics)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, frequency: count }));

    const strongTopics = {};
    profile.strongAreas.forEach(s => {
      strongTopics[s.topic] = (strongTopics[s.topic] || 0) + 1;
    });

    const report = {
      id: uuidv4(),
      studentName: profile.name,
      level: profile.level,
      language: profile.language,
      summary: {
        totalQuestionsAnswered: totalAnswered,
        correctAnswers: totalCorrect,
        accuracy: `${accuracy}%`,
        overallRating: accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Good' : accuracy >= 40 ? 'Needs Improvement' : 'Requires More Practice'
      },
      weakAreas: sortedWeak,
      strongAreas: Object.entries(strongTopics).map(([topic, count]) => ({ topic, count })),
      recommendations: this.generateRecommendations(profile, accuracy),
      studyPlan: this.generateStudyPlan(profile, sortedWeak),
      performanceTrend: profile.performanceHistory.map(p => ({
        date: p.date,
        accuracy: p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0
      })),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  generateRecommendations(profile, accuracy) {
    const recommendations = [];
    const lang = profile.language;
    
    if (accuracy < 40) {
      recommendations.push(lang === 'hindi' ? 'मूल अवधारणाओं को दोबारा पढ़ें' : 'Review basic concepts thoroughly');
      recommendations.push(lang === 'hindi' ? 'आसान प्रश्नों से शुरू करें' : 'Start with easier questions');
    } else if (accuracy < 70) {
      recommendations.push(lang === 'hindi' ? 'अभ्यास प्रश्नों पर ध्यान दें' : 'Focus on practice questions');
      recommendations.push(lang === 'hindi' ? 'कमज़ोर क्षेत्रों में सुधार करें' : 'Improve weak areas');
    } else {
      recommendations.push(lang === 'hindi' ? 'उन्नत विषयों पर जाएं' : 'Move to advanced topics');
      recommendations.push(lang === 'hindi' ? 'चुनौतीपूर्ण प्रश्न हल करें' : 'Tackle challenging problems');
    }
    
    recommendations.push(lang === 'hindi' ? 'नियमित रूप से अभ्यास करें' : 'Practice regularly');
    
    return recommendations;
  }

  generateStudyPlan(profile, weakTopics) {
    const lang = profile.language;
    return {
      dailyGoal: lang === 'hindi' ? '30 मिनट रोज़ाना अभ्यास' : '30 minutes daily practice',
      focusAreas: weakTopics.slice(0, 3).map(w => w.topic),
      activities: [
        lang === 'hindi' ? 'पाठ पढ़ें' : 'Read the lesson',
        lang === 'hindi' ? 'अभ्यास प्रश्न हल करें' : 'Solve practice questions',
        lang === 'hindi' ? 'फ्लैशकार्ड्स का उपयोग करें' : 'Use flashcards',
        lang === 'hindi' ? 'माइंडमैप बनाएं' : 'Create a mind map'
      ],
      estimatedDuration: `${Math.ceil(weakTopics.length * 2)} weeks`
    };
  }

  async generateFlashcards(studentProfileId, lessonPlanId) {
    const profile = this.studentProfiles.get(studentProfileId);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const keyTerms = plan.ragContext?.topics?.keyTerms || ['Concept A', 'Concept B', 'Concept C'];
    const concepts = plan.ragContext?.concepts || [];
    
    const flashcards = [];
    const numCards = Math.min(8, keyTerms.length);
    
    for (let i = 0; i < numCards; i++) {
      const term = keyTerms[i];
      const concept = concepts[i];
      flashcards.push({
        id: uuidv4(),
        front: term,
        back: concept?.definition || `Definition of ${term}`,
        example: `Example: How ${term} is used in practice`,
        difficulty: profile.level,
        language: profile.language
      });
    }

    return {
      id: uuidv4(),
      title: profile.language === 'hindi' ? 'फ्लैशकार्ड्स' : profile.language === 'hinglish' ? 'Flashcards / फ्लैशकार्ड्स' : 'Flashcards',
      cards: flashcards,
      totalCards: flashcards.length,
      suggestedReview: profile.level === 'beginner' ? 'Review all cards twice' : 'Review cards marked as difficult'
    };
  }

  async generateMindMap(studentProfileId, lessonPlanId) {
    const profile = this.studentProfiles.get(studentProfileId);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const mainTopics = plan.topics?.headings?.slice(0, 5) || ['Main Concept'];
    const keyTerms = plan.topics?.keyTerms?.slice(0, 8) || [];

    return {
      id: uuidv4(),
      center: mainTopics[0] || 'Main Topic',
      branches: mainTopics.slice(1, 5).map((topic, i) => ({
        name: topic,
        children: keyTerms.slice(i * 2, i * 2 + 2).map(term => ({
          name: term,
          children: []
        }))
      })),
      language: profile.language,
      suggestedConnections: [
        { from: mainTopics[0], to: mainTopics[1], label: 'leads to' },
        { from: mainTopics[0], to: mainTopics[2], label: 'includes' }
      ]
    };
  }

  async generateSummary(studentProfileId, lessonPlanId) {
    const profile = this.studentProfiles.get(studentProfileId);
    const plan = this.lessonPlans.get(lessonPlanId);
    
    if (!profile || !plan) throw new Error('Profile or plan not found');

    const mainTopics = plan.topics?.headings?.slice(0, 5) || ['Key concepts'];
    
    return {
      id: uuidv4(),
      title: profile.language === 'hindi' ? 'पाठ सारांश' : profile.language === 'hinglish' ? 'Lesson Summary / पाठ सारांश' : 'Lesson Summary',
      overview: `This lesson covered ${mainTopics.join(', ')}. The student at ${profile.level} level learned through structured phases.`,
      keyTakeaways: mainTopics.map(t => `${profile.language === 'hindi' ? 'मुख्य बिंदु' : 'Key point'}: ${t}`),
      conceptsLearned: plan.ragContext?.concepts?.slice(0, 5) || [],
      nextRecommendations: [
        profile.language === 'hindi' ? 'अभ्यास प्रश्न हल करें' : 'Solve practice questions',
        profile.language === 'hindi' ? 'फ्लैशकार्ड्स दोहराएं' : 'Review flashcards',
        profile.language === 'hindi' ? 'अगला पाठ शुरू करें' : 'Start next lesson'
      ],
      studyTime: `${profile.availableTime} minutes completed`
    };
  }
}

export default new AITeacher();
