'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface DiagnosticLandingProps {
  customMessage?: string;
  institutionName: string;
  institutionLogo?: string | null;
  totalQuestions: number;
  onStart: () => void;
}

export function DiagnosticLanding({ customMessage, institutionName, institutionLogo, totalQuestions, onStart }: DiagnosticLandingProps) {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Diagnóstico de Habilidades Digitales 2026';
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Institution Logo */}
        {institutionLogo ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative h-24 w-48">
              <Image
                src={institutionLogo}
                alt={institutionName}
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-lg font-semibold text-gray-700">{institutionName}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-semibold text-gray-700">{institutionName}</p>
          </motion.div>
        )}
        
        {/* Title with typewriter effect */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 min-h-[3rem]">
            {displayedText}
            <span className="animate-pulse">|</span>
          </h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-lg text-gray-600 max-w-xl mx-auto"
          >
            {customMessage || 'Descubre tu nivel de competencia digital y recibe recomendaciones personalizadas para tu desarrollo profesional.'}
          </motion.p>
        </div>
        
        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⚡</span>
            <span>5-10 minutos</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">📊</span>
            <span>{totalQuestions} preguntas</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>Resultados inmediatos</span>
          </div>
        </motion.div>
        
        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
        >
          <Button
            size="lg"
            onClick={onStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Comenzar Diagnóstico
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
        
        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
          className="text-sm text-gray-500"
        >
          Tus respuestas son confidenciales y solo serán usadas para mejorar tu experiencia educativa.
        </motion.p>
      </motion.div>
    </div>
  );
}
