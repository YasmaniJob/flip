/**
 * Scoring and Level Calculation for Diagnostic Module
 */

import { DiagnosticLevel, LEVEL_THRESHOLDS } from '../types';

/**
 * Calculate score percentage for a category
 * @param obtainedPoints Points obtained in the category
 * @param maxPoints Maximum possible points in the category
 * @returns Percentage score (0-100)
 */
export function calculateCategoryScore(obtainedPoints: number, maxPoints: number): number {
  if (maxPoints === 0) return 0;
  return Math.round((obtainedPoints / maxPoints) * 100);
}

/**
 * Calculate overall score from category scores
 * @param categoryScores Record of category scores
 * @returns Overall percentage score (0-100)
 */
export function calculateOverallScore(categoryScores: Record<string, number>): number {
  const scores = Object.values(categoryScores);
  if (scores.length === 0) return 0;
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Determine diagnostic level based on overall score
 * @param overallScore Overall percentage score (0-100)
 * @returns Diagnostic level
 */
export function determineLevel(overallScore: number): DiagnosticLevel {
  if (overallScore >= LEVEL_THRESHOLDS.mentor.min) {
    return 'mentor';
  } else if (overallScore >= LEVEL_THRESHOLDS.competente.min) {
    return 'competente';
  } else if (overallScore >= LEVEL_THRESHOLDS.en_desarrollo.min) {
    return 'en_desarrollo';
  } else {
    return 'explorador';
  }
}

/**
 * Calculate category scores from responses
 * @param responses Array of responses with questionId and score
 * @param questionsByCategory Map of categoryId to array of questionIds
 * @returns Record of categoryId to percentage score
 */
export function calculateCategoryScores(
  responses: Array<{ questionId: string; score: number }>,
  questionsByCategory: Record<string, string[]>
): Record<string, number> {
  const categoryScores: Record<string, number> = {};
  
  for (const [categoryId, questionIds] of Object.entries(questionsByCategory)) {
    // Get responses for this category
    const categoryResponses = responses.filter(r => questionIds.includes(r.questionId));
    
    // Calculate obtained and max points
    const obtainedPoints = categoryResponses.reduce((sum, r) => sum + r.score, 0);
    const maxPoints = questionIds.length * 3; // Max score per question is 3
    
    // Calculate percentage
    categoryScores[categoryId] = calculateCategoryScore(obtainedPoints, maxPoints);
  }
  
  return categoryScores;
}
