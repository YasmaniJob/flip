/**
 * Hook for managing diagnostic quiz state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagnosticConfig, DiagnosticScore, DiagnosticLevel } from '../types';

interface QuizState {
  // Configuration
  config: DiagnosticConfig | null;
  setConfig: (config: DiagnosticConfig) => void;
  
  // Session
  token: string | null;
  sessionId: string | null;
  setSession: (token: string, sessionId: string) => void;
  
  // Progress
  currentQuestionIndex: number;
  responses: Record<string, DiagnosticScore>;
  setResponse: (questionId: string, score: DiagnosticScore) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  
  // Results
  overallScore: number | null;
  level: DiagnosticLevel | null;
  categoryScores: Record<string, number> | null;
  setResults: (overallScore: number, level: DiagnosticLevel, categoryScores: Record<string, number>) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Reset
  reset: () => void;
}

export const useDiagnosticQuiz = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      token: null,
      sessionId: null,
      currentQuestionIndex: 0,
      responses: {},
      overallScore: null,
      level: null,
      categoryScores: null,
      isLoading: false,
      
      // Actions
      setConfig: (config) => set({ config }),
      
      setSession: (token, sessionId) => set({ token, sessionId }),
      
      setResponse: (questionId, score) => {
        const { responses } = get();
        set({
          responses: {
            ...responses,
            [questionId]: score,
          },
        });
      },
      
      nextQuestion: () => {
        const { currentQuestionIndex, config } = get();
        if (config && currentQuestionIndex < config.questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },
      
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },
      
      goToQuestion: (index) => set({ currentQuestionIndex: index }),
      
      setResults: (overallScore, level, categoryScores) =>
        set({ overallScore, level, categoryScores }),
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      reset: () =>
        set({
          config: null,
          token: null,
          sessionId: null,
          currentQuestionIndex: 0,
          responses: {},
          overallScore: null,
          level: null,
          categoryScores: null,
          isLoading: false,
        }),
    }),
    {
      name: 'diagnostic-quiz-storage',
      partialize: (state) => ({
        token: state.token,
        sessionId: state.sessionId,
        responses: state.responses,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
    }
  )
);
