import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pdfProcessor from '../pdfProcessor.js';
import ragEngine from '../rag.js';
import aiTeacher from '../aiTeacher.js';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Please upload PDF, TXT, DOC, DOCX, PPT, or PPTX.'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Store uploaded files and sessions in memory
const uploadedFiles = new Map();
const learningSessions = new Map();

// =============================================
// AUTHENTICATION
// =============================================

const JWT_SECRET =
  process.env.JWT_SECRET || 'change-this-secret';

const users = [
  {
    id: 1,
    name: 'AI Teacher Admin',
    email: 'admin@aiteacher.com',
    passwordHash: bcrypt.hashSync('123456', 10),
  },
];

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = users.find(
      (item) =>
        item.email.toLowerCase() ===
        String(email).trim().toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

// =============================================
// STUDENT PROFILE
// =============================================
router.post('/profile', (req, res) => {
  try {
    const profile = aiTeacher.createStudentProfile(req.body);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:id', (req, res) => {
  try {
    const profile = aiTeacher.studentProfiles.get(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// FILE UPLOAD & ANALYSIS
// =============================================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let textResult;
    if (ext === '.pdf') {
      textResult = await pdfProcessor.extractText(filePath);
    } else if (ext === '.txt') {
      const content = fs.readFileSync(filePath, 'utf-8');
      textResult = {
        text: content,
        numPages: 1,
        title: req.file.originalname.replace(ext, ''),
        author: 'User'
      };
    } else {
      // For other file types, read as text
      const content = fs.readFileSync(filePath, 'utf-8');
      textResult = {
        text: content,
        numPages: 1,
        title: req.file.originalname.replace(ext, ''),
        author: 'User'
      };
    }

    // Index in RAG
    const ragResult = await ragEngine.indexDocument(filePath);

    // Analyze content
    const analysis = await aiTeacher.analyzeContent(textResult);

    const fileId = uuidv4();
    uploadedFiles.set(fileId, {
      id: fileId,
      filename: req.file.originalname,
      text: textResult.text,
      analysis,
      ragIndexed: ragResult.success,
      uploadedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      fileId,
      filename: req.file.originalname,
      analysis,
      ragIndexed: ragResult.success,
      chunks: ragResult.chunks || 0
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Topic-based analysis (no file upload)
router.post('/analyze-topic', async (req, res) => {
  try {
    const { topic, description } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    // Create mock analysis for topic-based learning
    const analysis = {
      title: topic,
      numPages: 1,
      totalWords: description?.split(/\s+/).length || 100,
      topics: {
        headings: [topic, 'Key Concepts', 'Applications', 'Examples'],
        keyTerms: topic.toLowerCase().split(/\s+/).concat(['concept', 'definition', 'example', 'application', 'theory'])
      },
      difficulty: 'intermediate',
      concepts: [
        { term: topic, definition: description || `Understanding ${topic} and its core principles` }
      ],
      summary: description || `A comprehensive study of ${topic}`
    };

    const fileId = uuidv4();
    uploadedFiles.set(fileId, {
      id: fileId,
      filename: topic,
      text: description || topic,
      analysis,
      ragIndexed: false,
      uploadedAt: new Date().toISOString()
    });

    res.json({ success: true, fileId, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// LESSON PLANNING
// =============================================
router.post('/lesson-plan', async (req, res) => {
  try {
    const { studentProfileId, fileId } = req.body;
    
    const file = uploadedFiles.get(fileId);
    if (!file) return res.status(404).json({ error: 'File not found. Upload a file or provide a topic first.' });

    const lessonPlan = await aiTeacher.generateLessonPlan(studentProfileId, file.analysis);
    
    // Store in session
    const sessionId = uuidv4();
    learningSessions.set(sessionId, {
      studentProfileId,
      fileId,
      lessonPlanId: lessonPlan.id,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, sessionId, lessonPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// TEACHING SESSION
// =============================================
router.post('/start-session', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId } = req.body;
    const session = await aiTeacher.startTeachingSession(studentProfileId, lessonPlanId);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current teaching phase
router.get('/session/:sessionId/phase', (req, res) => {
  try {
    const session = aiTeacher.sessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const plan = aiTeacher.lessonPlans.get(session.lessonPlanId);
    const currentPhase = plan?.phases[session.currentPhase] || null;
    
    res.json({
      success: true,
      sessionId: session.id,
      currentPhase: session.currentPhase,
      totalPhases: plan?.phases.length || 0,
      phase: currentPhase,
      transcript: session.transcript.slice(-10),
      performance: session.performance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advance to next phase
router.post('/session/:sessionId/next-phase', async (req, res) => {
  try {
    const session = aiTeacher.sessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const plan = aiTeacher.lessonPlans.get(session.lessonPlanId);
    if (!plan) return res.status(404).json({ error: 'Lesson plan not found' });

    session.currentPhase++;
    
    if (session.currentPhase >= plan.phases.length) {
      return res.json({ success: true, completed: true, message: 'Lesson completed!' });
    }

    const nextPhase = plan.phases[session.currentPhase];
    
    session.transcript.push({
      timestamp: new Date().toISOString(),
      type: 'teacher',
      phase: nextPhase.type,
      content: nextPhase.content.script,
      visuals: nextPhase.content.visuals
    });

    res.json({
      success: true,
      currentPhase: session.currentPhase,
      phase: nextPhase,
      transcript: session.transcript.slice(-5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// QUESTIONS & ANSWERS
// =============================================
router.post('/question', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId, topic } = req.body;
    const question = await aiTeacher.generateQuestion(studentProfileId, lessonPlanId, topic);
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/answer', async (req, res) => {
  try {
    const { studentProfileId, questionId, answer, correctAnswer, topic } = req.body;
    const evaluation = await aiTeacher.evaluateAnswer(studentProfileId, questionId, answer, correctAnswer);
    
    // Get adaptation
    const adaptation = await aiTeacher.adaptTeaching(studentProfileId, {
      ...evaluation,
      topic
    });

    // Get profile for performance tracking
    const profile = aiTeacher.studentProfiles.get(studentProfileId);

    res.json({
      success: true,
      evaluation,
      adaptation,
      performance: profile ? {
        totalAnswered: profile.performanceHistory.length > 0 ? 
          profile.performanceHistory.reduce((sum, p) => sum + p.total, 0) + 1 : 1,
        weakAreas: profile.weakAreas.slice(-5),
        strongAreas: profile.strongAreas.slice(-5)
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// QUIZ
// =============================================
router.post('/quiz', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId, numQuestions } = req.body;
    const quiz = await aiTeacher.generateQuiz(studentProfileId, lessonPlanId, numQuestions);
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quiz/submit', async (req, res) => {
  try {
    const { studentProfileId, quizId, answers } = req.body;
    
    let correct = 0;
    let total = answers.length;
    const results = [];
    
    for (const answer of answers) {
      const evaluation = await aiTeacher.evaluateAnswer(
        studentProfileId, 
        answer.questionId, 
        answer.answer, 
        answer.correctAnswer
      );
      results.push({ ...answer, evaluation });
      if (evaluation.isCorrect) correct++;
    }

    // Update performance history
    const profile = aiTeacher.studentProfiles.get(studentProfileId);
    if (profile) {
      profile.performanceHistory.push({
        date: new Date().toISOString(),
        correct,
        total,
        accuracy: Math.round((correct / total) * 100),
        quizId
      });
    }

    const score = Math.round((correct / total) * 100);
    const passed = score >= 60;

    res.json({
      success: true,
      score: `${score}%`,
      correct,
      total,
      passed,
      results,
      message: passed ? 
        'Congratulations! You passed! 🎉' : 
        'You need more practice. Let\'s review the weak areas. 📚',
      recommendation: passed ? 'next_topic' : 'review_weak_areas'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ROADMAP
// =============================================
router.get('/roadmap/:studentProfileId', async (req, res) => {
  try {
    const roadmap = await aiTeacher.generateRoadmap(req.params.studentProfileId);
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// LEARNING REPORT
// =============================================
router.get('/report/:studentProfileId', async (req, res) => {
  try {
    const report = await aiTeacher.generateLearningReport(req.params.studentProfileId);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// FLASHCARDS
// =============================================
router.post('/flashcards', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId } = req.body;
    const flashcards = await aiTeacher.generateFlashcards(studentProfileId, lessonPlanId);
    res.json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// MIND MAP
// =============================================
router.post('/mindmap', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId } = req.body;
    const mindmap = await aiTeacher.generateMindMap(studentProfileId, lessonPlanId);
    res.json({ success: true, mindmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// SUMMARY
// =============================================
router.post('/summary', async (req, res) => {
  try {
    const { studentProfileId, lessonPlanId } = req.body;
    const summary = await aiTeacher.generateSummary(studentProfileId, lessonPlanId);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// RAG STATUS
// =============================================
router.get('/rag/status', (req, res) => {
  try {
    const stats = ragEngine.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search in RAG
router.post('/rag/search', async (req, res) => {
  try {
    const { query, topK } = req.body;
    const results = await ragEngine.search(query, topK || 3);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document context
router.get('/rag/context', async (req, res) => {
  try {
    const context = await ragEngine.getFullDocumentContext();
    res.json({ success: true, context });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
