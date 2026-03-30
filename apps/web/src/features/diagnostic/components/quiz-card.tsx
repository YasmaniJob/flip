'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiagnosticQuestion, DiagnosticScore } from '../types';
import { SCORE_LABELS, SCORE_ICONS } from '../types';

interface QuizCardProps {
  question: DiagnosticQuestion;
  questionNumber: number;
  totalQuestions: number;
  currentScore?: DiagnosticScore;
  categoryName?: string;
  onAnswer: (score: DiagnosticScore) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const scoreOptions: DiagnosticScore[] = [0, 1, 2, 3];

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  currentScore,
  categoryName,
  onAnswer,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: QuizCardProps) {
  const progress = (questionNumber / totalQuestions) * 100;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with progress */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="text-gray-600 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          <div className="text-center">
            <span className="text-sm font-medium text-gray-600">
              Pregunta {questionNumber} de {totalQuestions}
            </span>
            {categoryName && (
              <p className="text-xs text-gray-500 mt-1">
                {categoryName}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext || currentScore === undefined}
            className="text-gray-600 disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      
      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
              {/* Category Badge */}
              {categoryName && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {categoryName}
                  </span>
                </div>
              )}
              
              {/* Question Text */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {question.text}
                </h2>
              </div>
              
              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreOptions.map((score) => (
                  <motion.button
                    key={score}
                    onClick={() => onAnswer(score)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-6 rounded-xl border-2 transition-all text-left
                      ${
                        currentScore === score
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">
                        {SCORE_ICONS[score]}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {SCORE_LABELS[score]}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
