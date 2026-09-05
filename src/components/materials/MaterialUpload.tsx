import React, { useState } from 'react';

import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Sliders,
  ArrowRight,
  BookOpen,
  X,
  Loader2,
} from 'lucide-react';

import {
  StudyMaterial,
  LearningLevel,
  LanguageCode,
  LessonDuration,
  LearningGoal,
  TeachingStyle,
} from '../../types';

import { AiTeachingService } from '../../services/aiService';

const SUPPORTED_LEARNING_LEVELS: readonly LearningLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

const isLearningLevel = (value: string): value is LearningLevel =>
  SUPPORTED_LEARNING_LEVELS.includes(value as LearningLevel);

const getLearningLevelOptions = (
  educationLevels: MaterialUploadProps['educationLevels']
): LearningLevel[] => {
  if (!educationLevels?.length) {
    return [...SUPPORTED_LEARNING_LEVELS];
  }

  const normalized = educationLevels
    .map((item): string => {
      if (typeof item === 'string') return item.trim();

      return String(
        item?.name ??
          item?.level ??
          item?.title ??
          ''
      ).trim();
    })
    .filter(isLearningLevel);

  const uniqueLevels = Array.from(new Set(normalized));

  return uniqueLevels.length > 0
    ? uniqueLevels
    : [...SUPPORTED_LEARNING_LEVELS];
};

interface MaterialUploadProps {
  materials: StudyMaterial[];
  onStartLessonWithMaterial: (
    material: StudyMaterial
  ) => void;
  onAddMaterial: (
    material: StudyMaterial
  ) => void;
  educationLevels?: Array<{
    name?: unknown;
    level?: unknown;
    title?: unknown;
  } | string>;
  educationLevelsLoading?: boolean;
}

export const MaterialUpload: React.FC<
  MaterialUploadProps
> = ({
  materials,
  onStartLessonWithMaterial,
  onAddMaterial,
  educationLevels = [],
  educationLevelsLoading = false,
}) => {
  const [topicInput, setTopicInput] =
    useState('');

  const [dragActive, setDragActive] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [level, setLevel] =
    useState<LearningLevel>(
      'Intermediate'
    );

  const [language, setLanguage] =
    useState<LanguageCode>(
      'English'
    );

  const [availableTime, setAvailableTime] =
    useState<LessonDuration>(
      '20 min'
    );

  const [goal, setGoal] =
    useState<LearningGoal>(
      'Exam Preparation'
    );

  const [teachingStyle, setTeachingStyle] =
    useState<TeachingStyle>(
      'Visual'
    );

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [processedMaterial, setProcessedMaterial] =
    useState<StudyMaterial | null>(
      null
    );

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const handleDrag = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === 'dragenter' ||
      e.type === 'dragover'
    ) {
      setDragActive(true);
    } else if (
      e.type === 'dragleave'
    ) {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      setSelectedFile(
        e.dataTransfer.files[0]
      );
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      setSelectedFile(
        e.target.files[0]
      );
    }
  };

  const handleRemoveFile = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  /*
   * =========================================================
   * REAL BACKEND LESSON CREATION
   * =========================================================
   */

  const handleCreateLesson = async () => {
    if (
      (!selectedFile &&
        !topicInput.trim()) ||
      isProcessing
    ) {
      return;
    }

    setIsProcessing(true);
    setAnalysisStep(1);
    setProcessedMaterial(null);

    try {
      let sessionId: string | null = null;

      let materialName =
        topicInput.trim();

      /*
       * STEP 1:
       * Upload the document to FastAPI.
       */

      if (selectedFile) {
        setAnalysisStep(2);

        const formData = new FormData();

        formData.append(
          'file',
          selectedFile
        );

        const uploadResponse =
          await fetch(
            'http://127.0.0.1:8000/upload',
            {
              method: 'POST',
              body: formData,
            }
          );

        if (!uploadResponse.ok) {
          const errorData =
            await uploadResponse
              .json()
              .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              'Document upload failed.'
          );
        }

        const uploadData =
          await uploadResponse.json();

        sessionId =
          uploadData.session_id;

        materialName =
          selectedFile.name;

        setAnalysisStep(3);
      }

      /*
       * STEP 2:
       * Ask Gemini to create the lesson.
       */

      setAnalysisStep(4);

      const lessonForm =
        new FormData();

      lessonForm.append(
        'topic',
        topicInput.trim() ||
          materialName
      );

      lessonForm.append(
        'level',
        level.toLowerCase()
      );

      lessonForm.append(
        'time_minutes',
        availableTime.replace(
          ' min',
          ''
        )
      );

      lessonForm.append(
        'language',
        language
      );

      lessonForm.append(
        'learning_goal',
        goal
      );

      lessonForm.append(
        'teaching_style',
        teachingStyle
      );

      if (sessionId) {
        lessonForm.append(
          'session_id',
          sessionId
        );
      }

      const lessonResponse =
        await fetch(
          'http://127.0.0.1:8000/lesson/start',
          {
            method: 'POST',
            body: lessonForm,
          }
        );

      if (!lessonResponse.ok) {
        const errorData =
          await lessonResponse
            .json()
            .catch(() => ({}));

        throw new Error(
          errorData.detail ||
            'AI lesson generation failed.'
        );
      }

      const lessonData =
        await lessonResponse.json();

      /*
       * STEP 3:
       * Save the REAL AI lesson.
       */

      localStorage.setItem(
        'latestLesson',
        JSON.stringify({
          ...lessonData,
          _uiLanguage: language,
          _uiLevel: level,
          _uiGoal: goal,
          _uiTeachingStyle: teachingStyle,
          _uiAvailableTime: availableTime,
        })
      );

      if (sessionId) {
        localStorage.setItem(
          'ragSessionId',
          sessionId
        );
      }

      setAnalysisStep(5);

      /*
       * STEP 4:
       * Create the material card.
       */

      const newMaterial =
        await AiTeachingService.processUploadedMaterial(
          materialName,
          selectedFile
            ? selectedFile.name
                .split('.')
                .pop() || 'DOC'
            : 'Topic'
        );

      setProcessedMaterial(
        newMaterial
      );

      onAddMaterial(
        newMaterial
      );

      console.log(
        'REAL AI LESSON:',
        lessonData
      );

      console.log(
        'RAG SESSION:',
        sessionId
      );

    } catch (error) {
      console.error(
        'AI Teacher error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating your lesson.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* Header */}

      <div className="text-center space-y-2 max-w-2xl mx-auto">

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-700">
          <Sparkles className="w-3.5 h-3.5" />
          RAG Document & Topic Ingestion
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Teach me from my material
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          Upload your learning material or
          syllabus and EduMind will turn it
          into an adaptive, personalized
          lesson.
        </p>
      </div>

      {/* Processing */}

      {(isProcessing ||
        processedMaterial) && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-xl p-6 sm:p-8 space-y-6">

          <div className="flex items-center justify-between border-b border-slate-100 pb-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isProcessing
                    ? 'Understanding your material...'
                    : 'Material Processed & Indexed'}
                </h2>

                <p className="text-xs text-slate-500">
                  AI lesson and RAG processing
                  completed
                </p>
              </div>
            </div>

            {isProcessing && (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

            {[
              [1, 'Document & text processed'],
              [2, 'Chapters & sections identified'],
              [3, 'Important concepts extracted'],
              [4, 'AI lesson generated'],
              [5, 'Adaptive learning structure created'],
            ].map(
              ([step, text], index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border ${
                    analysisStep >=
                    Number(step)
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  } ${
                    index === 4
                      ? 'sm:col-span-2'
                      : ''
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      analysisStep >=
                      Number(step)
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                    }`}
                  />

                  <span className="font-semibold">
                    {text}
                  </span>
                </div>
              )
            )}
          </div>

          {processedMaterial && (
            <div className="pt-2 space-y-4">

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <FileText className="w-4 h-4 text-indigo-600" />

                    <span>
                      Document: "
                      {
                        processedMaterial.fileName
                      }
                      "
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-indigo-600">
                    {
                      processedMaterial
                        .extractedTopics
                        .length
                    }{' '}
                    Topics Extracted
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {processedMaterial.extractedTopics.map(
                    (topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        • {topic}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    onStartLessonWithMaterial(
                      processedMaterial
                    )
                  }
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  <span>
                    Start Personalized Lesson
                  </span>

                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Main */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Upload */}

        <div className="lg:col-span-7 space-y-5">

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/50'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/60'
            }`}
          >

            <input
              type="file"
              id="file-upload"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={
                handleFileChange
              }
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center space-y-3">

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>

              <div>

                <p className="text-sm font-bold text-slate-800">
                  {selectedFile
                    ? selectedFile.name
                    : 'Drop your study document here'}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF, DOC, DOCX,
                  PPT, PPTX, TXT
                </p>
              </div>

              {selectedFile ? (
                <div className="flex items-center gap-2 z-20">

                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    File selected
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleRemoveFile
                    }
                    className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>

                </div>
              ) : (
                <span className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                  Browse Files
                </span>
              )}
            </div>
          </div>

          {/* Topic */}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">

            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Or enter a topic
            </label>

            <div className="relative">

              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

              <input
                type="text"
                placeholder="e.g. Cellular Biology"
                value={topicInput}
                disabled={isProcessing}
                onChange={(e) =>
                  setTopicInput(
                    e.target.value
                  )
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Existing Materials */}

          {materials.length > 0 && (
            <div className="space-y-3">

              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Existing Study Materials (
                {materials.length}
                )
              </h2>

              <div className="grid grid-cols-1 gap-2.5">

                {materials.map(
                  (mat) => (
                    <div
                      key={mat.id}
                      onClick={() =>
                        onStartLessonWithMaterial(
                          mat
                        )
                      }
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {mat.fileType}
                        </div>

                        <div>

                          <p className="text-xs font-bold text-slate-900">
                            {mat.title}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {mat.extractedTopics.join(
                              ' • '
                            )}
                          </p>

                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-indigo-600" />

                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">

          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">

            <Sliders className="w-4 h-4 text-indigo-600" />

            <h2 className="text-sm font-bold text-slate-900">
              Personalize Your AI Teacher
            </h2>

          </div>

          {/* Level */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-slate-700">
              Learning Level
            </label>

            {educationLevelsLoading && (
              <p className="text-[11px] text-indigo-600">
                Loading levels from Supabase...
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {getLearningLevelOptions(educationLevels).map(
                (lvl: LearningLevel) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      level === lvl
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {lvl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Language */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-slate-700">
              Language
            </label>

            <div className="grid grid-cols-3 gap-2">

              {(
                [
                  'English',
                  'Hindi',
                  'Hinglish',
                ] as LanguageCode[]
              ).map(
                (lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() =>
                      setLanguage(lng)
                    }
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      language === lng
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {lng}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-slate-700">
              Available Time
            </label>

            <div className="grid grid-cols-3 gap-2">

              {(
                [
                  '5 min',
                  '20 min',
                  '60 min',
                ] as LessonDuration[]
              ).map(
                (duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() =>
                      setAvailableTime(
                        duration
                      )
                    }
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      availableTime ===
                      duration
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {duration}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Goal */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-slate-700">
              Primary Goal
            </label>

            <select
              value={goal}
              onChange={(e) =>
                setGoal(
                  e.target.value as LearningGoal
                )
              }
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <option value="Understand">
                Understand Fundamentals
              </option>

              <option value="Exam Preparation">
                Exam Preparation
              </option>

              <option value="Interview">
                Technical Interview
              </option>

              <option value="Revision">
                Quick Revision
              </option>

              <option value="Deep Learning">
                Deep Academic Mastery
              </option>
            </select>
          </div>

          {/* Teaching Style */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-slate-700">
              Teaching Style
            </label>

            <div className="grid grid-cols-2 gap-2">

              {(
                [
                  'Simple',
                  'Visual',
                  'Examples',
                  'Technical',
                ] as TeachingStyle[]
              ).map(
                (style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setTeachingStyle(
                        style
                      )
                    }
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      teachingStyle ===
                      style
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {style}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Create */}

          <button
            type="button"
            disabled={
              (!selectedFile &&
                !topicInput.trim()) ||
              isProcessing
            }
            onClick={
              handleCreateLesson
            }
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Creating AI Lesson...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Create My Lesson
                </span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};
