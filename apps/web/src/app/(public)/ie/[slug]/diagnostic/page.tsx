'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DiagnosticLanding } from '@/features/diagnostic/components/diagnostic-landing';
import { IdentificationForm } from '@/features/diagnostic/components/identification-form';
import { QuizCard } from '@/features/diagnostic/components/quiz-card';
import { ResultsScreen } from '@/features/diagnostic/components/results-screen';
import { useDiagnosticQuiz } from '@/features/diagnostic/hooks/use-diagnostic-quiz';
import type { DiagnosticScore } from '@/features/diagnostic/types';

type Step = 'landing' | 'identify' | 'quiz' | 'results';

export default function DiagnosticPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [step, setStep] = useState<Step>('landing');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    config,
    setConfig,
    token,
    sessionId,
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
    reset,
  } = useDiagnosticQuiz();
  
  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [slug]);
  
  // Check if resuming session
  useEffect(() => {
    if (token && config && step === 'landing') {
      setStep('quiz');
    }
  }, [token, config]);
  
  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/diagnostic/${slug}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Institución no encontrada');
          router.push('/');
          return;
        }
        if (res.status === 403) {
          toast.error('El diagnóstico no está disponible para esta institución');
          router.push('/');
          return;
        }
        throw new Error('Error loading configuration');
      }
      
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar el diagnóstico');
    }
  };
  
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
  
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Cargando diagnóstico...</p>
        </div>
      </div>
    );
  }
  
  // Build category names map
  const categoryNames = config.categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);
  
  // Get current question's category name
  const currentQuestion = config.questions[currentQuestionIndex];
  const currentCategoryName = currentQuestion ? categoryNames[currentQuestion.categoryId] : undefined;
  
  // Check if all questions are answered
  const allQuestionsAnswered = config.questions.every(q => responses[q.id] !== undefined);
  
  return (
    <>
      {step === 'landing' && (
        <DiagnosticLanding
          customMessage={config.customMessage}
          institutionName={config.institutionName}
          institutionLogo={config.institutionLogo}
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
