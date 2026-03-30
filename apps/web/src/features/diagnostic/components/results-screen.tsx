'use client';

import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Trophy, Download, ArrowRight } from 'lucide-react';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import type { DiagnosticLevel } from '../types';

interface ResultsScreenProps {
  overallScore: number;
  level: DiagnosticLevel;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
  onContinue?: () => void;
}

export function ResultsScreen({
  overallScore,
  level,
  categoryScores,
  categoryNames,
  onContinue,
}: ResultsScreenProps) {
  // Prepare data for radar chart
  const radarData = Object.entries(categoryScores).map(([categoryId, score]) => ({
    category: categoryNames[categoryId] || 'Unknown',
    score,
    fullMark: 100,
  }));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            ¡Diagnóstico Completado!
          </h1>
          
          <p className="text-lg text-gray-600">
            Aquí están tus resultados
          </p>
        </div>
        
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
        >
          {/* Overall Score */}
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {overallScore}%
            </div>
            <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-gray-900">
              <span>{LEVEL_ICONS[level]}</span>
              <span>{LEVEL_LABELS[level]}</span>
            </div>
          </div>
          
          {/* Radar Chart */}
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280' }}
                />
                <Radar
                  name="Tu Nivel"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Desglose por Dimensión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(categoryScores).map(([categoryId, score]) => (
                <div
                  key={categoryId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    {categoryNames[categoryId]}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Download className="w-5 h-5" />
            Descargar Resultados
          </Button>
          
          {onContinue && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2"
              onClick={onContinue}
            >
              Continuar en Flip
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </motion.div>
        
        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-500 space-y-2"
        >
          <p>
            Tus resultados han sido guardados y están disponibles en tu perfil.
          </p>
          <p>
            Recibirás recomendaciones personalizadas para mejorar tus habilidades digitales.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
