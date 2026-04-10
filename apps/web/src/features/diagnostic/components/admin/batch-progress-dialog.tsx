'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BatchProgressDialogProps {
  open: boolean;
  title: string;
  total: number;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  variant: 'approve' | 'reject';
}

export function BatchProgressDialog({
  open,
  title,
  total,
  isLoading,
  isSuccess,
  isError,
  variant,
}: BatchProgressDialogProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setCurrentStep(0);
      
      // Simulate progress animation
      const duration = 2000; // 2 seconds
      const steps = 60;
      const interval = duration / steps;
      
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + (90 / steps);
        });
        setCurrentStep((prev) => Math.min(prev + 1, total));
      }, interval);

      return () => clearInterval(timer);
    } else if (isSuccess) {
      setProgress(100);
      setCurrentStep(total);
    }
  }, [isLoading, isSuccess, total]);

  const variantStyles = {
    approve: {
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    reject: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      color: 'bg-red-500',
      lightColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
  };

  const style = variantStyles[variant];

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {/* Animated Icon */}
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
              )}
              {isSuccess && (
                <div className="animate-in zoom-in-50 duration-300">
                  {style.icon}
                </div>
              )}
              {isError && (
                <div className="animate-in zoom-in-50 duration-300">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              )}
            </div>

            <AlertDialogTitle className="text-xl font-bold text-center">
              {isLoading && title}
              {isSuccess && (variant === 'approve' ? '¡Aprobación Completada!' : '¡Rechazo Completado!')}
              {isError && 'Error en el Proceso'}
            </AlertDialogTitle>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-3">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full transition-all duration-300 ease-out',
                    style.color
                  )}
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              
              <AlertDialogDescription className="text-center text-sm">
                Procesando {currentStep} de {total} docentes...
              </AlertDialogDescription>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <AlertDialogDescription className="text-center">
              {variant === 'approve' 
                ? `${total} docente${total !== 1 ? 's' : ''} aprobado${total !== 1 ? 's' : ''} exitosamente`
                : `${total} docente${total !== 1 ? 's' : ''} rechazado${total !== 1 ? 's' : ''} exitosamente`
              }
            </AlertDialogDescription>
          )}

          {/* Error Message */}
          {isError && (
            <AlertDialogDescription className="text-center text-red-600">
              Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* Animated Checkmarks */}
        {isSuccess && (
          <div className="flex justify-center gap-1 py-4">
            {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full animate-in fade-in zoom-in-50',
                  style.color
                )}
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
