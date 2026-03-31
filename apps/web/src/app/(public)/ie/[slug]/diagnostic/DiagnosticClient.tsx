'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DiagnosticLanding } from '@/features/diagnostic/components/diagnostic-landing';
import { IdentificationForm } from '@/features/diagnostic/components/identification-form';
import { QuizCard } from '@/features/diagnostic/components/quiz-card';
import { ResultsScreen } from '@/features/diagnostic/components/results-screen';
import { useDiagnosticQuiz } from '@/features/diagnostic/hooks/use-diagnostic-quiz';
import { useSession } from '@/lib/auth-client';
import type { DiagnosticScore } from '@/features/diagnostic/types';

interface DiagnosticClientProps {
  initialConfig: any;
  slug: string;
}

type Step = 'landing' | 'identify' | 'quiz' | 'results';

export function DiagnosticClient({ initialConfig, slug }: DiagnosticClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [step, setStep] = useState<Step>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  
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
  }, [token, config, step]);
  
  const handleStart = () => {
    // 🚀 Fast Track: If user is logged in, skip identification form
    if (session?.user && !token) {
      handleIdentify({
        dni: (session.user as any).dni || '',
        name: session.user.name,
        email: session.user.email
      });
      return;
    }
    setStep('identify');
  };
  
  const handleIdentify = async (data: { dni: string; name: string; email: string, userId?: string }) => {
    setIsLoading(true);
    setUserName(data.name);
    
    // Inject userId from session if available
    const payload = {
      ...data,
      userId: session?.user?.id
    };
    
    try {
      const res = await fetch(`/api/diagnostic/${slug}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al identificarse');
        return;
      }
      
      const result = await res.json();
      
      // Check if teacher already completed this year
      if (result.canComplete === false) {
        toast.info(`Ya completaste el diagnóstico de ${result.year}`);
        throw result; // Pass to form to handle UI state
      }
      
      setCurrentYear(result.year);
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
    if (!token) {
      toast.error('Sesión no encontrada. Por favor, reinicia el diagnóstico.');
      return;
    }

    if (!slug) {
      toast.error('Configuración de institución no disponible.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/diagnostic/${encodeURIComponent(slug)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const result = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(result.error || `Error del servidor (${res.status})`);
      }
      
      setResults(result.overallScore, result.level, result.categoryScores);
      setStep('results');
      toast.success('¡Diagnóstico completado con éxito!');
    } catch (error: any) {
      console.error('Error completing quiz:', error);
      toast.error(error.message || 'Error al procesar el diagnóstico. Por favor, inténtalo de nuevo.');
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
          year={currentYear}
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
          userName={userName || (session?.user?.name) || 'Evaluado'}
          institutionName={config.institutionName}
          institutionLogo={config.institutionLogo}
          educationalLevel={(config as any).educationalLevel}
          province={(config as any).province}
          overallScore={overallScore}
          level={level}
          categoryScores={categoryScores}
          categoryNames={categoryNames}
          year={currentYear}
          onContinue={handleContinue}
        />
      )}
    </>
  );
}
