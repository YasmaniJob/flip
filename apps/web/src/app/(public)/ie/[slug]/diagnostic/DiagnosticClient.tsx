'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DiagnosticLanding } from '@/features/diagnostic/components/diagnostic-landing';
import { IdentificationForm } from '@/features/diagnostic/components/identification-form';
import { QuizCard } from '@/features/diagnostic/components/quiz-card';
import { ResultsScreen } from '@/features/diagnostic/components/results-screen';
import { useDiagnosticQuiz } from '@/features/diagnostic/hooks/use-diagnostic-quiz';
import type { DiagnosticScore } from '@/features/diagnostic/types';

interface DiagnosticClientProps {
  initialConfig: any;
  slug: string;
}

type Step = 'landing' | 'identify' | 'quiz' | 'results';

export function DiagnosticClient({ initialConfig, slug }: DiagnosticClientProps) {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('landing');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    config,
    setConfig,
    token,
    setSession,
    currentQuestionIndex,
    responses,
    setResponse,
    nextQuestion,
    previousQuestion,
    overallScore,
    level,
    categoryScores,
    setResults,
  } = useDiagnosticQuiz();
  
  // Initialize config from server-side data
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig, setConfig]);
  
  // Check if resuming session
  useEffect(() => {
    if (token && config && step === 'landing') {
      setStep('quiz');
    }
  }, [token, config]);
  
  const handleStart = () => {
    setStep('identify');
  };
  
  const handleIdentify = async (data: { dni: string; name: string; email: string }) => {
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/diagnostic/${slug}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al identificarse');
        return;
      }
      
      const result = await res.json();
      setSession(result.token, result.sessionId);
      
      if (result.isResuming) {
        toast.success('Retomando tu diagnóstico...');
      } else {
        toast.success('¡Comencemos!');
      }
      
      setStep('quiz');
    } catch (error) {
      console.error('Error identifying:', error);
      toast.error('Error al identificarse');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswer = async (score: DiagnosticScore) => {
    if (!config || !token) return;
    
    const question = config.questions[currentQuestionIndex];
    setResponse(question.id, score);
    
    // Save to backend
    try {
      await fetch(`/api/diagnostic/${slug}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          questionId: question.id,
          score,
        }),
      });
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Error al guardar respuesta');
    }
  };
  
  const handleComplete = async () => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/diagnostic/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      if (!res.ok) {
        throw new Error('Error completing quiz');
      }
      
      const result = await res.json();
      setResults(result.overallScore, result.level, result.categoryScores);
      setStep('results');
      toast.success('¡Diagnóstico completado!');
    } catch (error) {
      console.error('Error completing quiz:', error);
      toast.error('Error al completar el diagnóstico');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    router.push('/login');
  };
  
  // Wait for config if not available (shouldn't happen with Server Side data)
  if (!config) return null;
  
  const categoryNames = config.categories.reduce((acc: any, cat: any) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);
  
  const currentQuestion = config.questions[currentQuestionIndex];
  const currentCategoryName = currentQuestion ? categoryNames[currentQuestion.categoryId] : undefined;
  const allQuestionsAnswered = config.questions.every((q: any) => responses[q.id] !== undefined);
  
  return (
    <>
      {step === 'landing' && (
        <DiagnosticLanding
          customMessage={config.customMessage}
          institutionName={config.institutionName}
          institutionLogo={config.institutionLogo}
          totalQuestions={config.totalQuestions}
          onStart={handleStart}
        />
      )}
      
      {step === 'identify' && (
        <IdentificationForm
          onSubmit={handleIdentify}
          isLoading={isLoading}
        />
      )}
      
      {step === 'quiz' && currentQuestion && (
        <QuizCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={config.questions.length}
          currentScore={responses[currentQuestion.id]}
          categoryName={currentCategoryName}
          categoryId={currentQuestion.categoryId}
          onAnswer={handleAnswer}
          onPrevious={previousQuestion}
          onNext={nextQuestion}
          onComplete={handleComplete}
          canGoPrevious={currentQuestionIndex > 0}
          canGoNext={currentQuestionIndex < config.questions.length - 1}
          isLastQuestion={currentQuestionIndex === config.questions.length - 1}
          allQuestionsAnswered={allQuestionsAnswered}
          isCompleting={isLoading}
        />
      )}
      
      {step === 'results' && overallScore !== null && level && categoryScores && (
        <ResultsScreen
          overallScore={overallScore}
          level={level}
          categoryScores={categoryScores}
          categoryNames={categoryNames}
          onContinue={handleContinue}
        />
      )}
    </>
  );
}
