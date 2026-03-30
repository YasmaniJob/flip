/**
 * GET /api/institutions/[id]/diagnostic/results
 * 
 * Get diagnostic results and statistics for an institution
 * Admin endpoint (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticSessions, diagnosticCategories } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { verifyAdminAccess } from '@/features/diagnostic/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    const diagnosticEnabled = process.env.FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
    if (!diagnosticEnabled) {
      return NextResponse.json(
        { error: 'Diagnostic admin panel is not enabled' },
        { status: 503 }
      );
    }
    
    const { id: institutionId } = params;
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request, institutionId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Not authenticated' ? 401 : 403 }
      );
    }
    
    // Get all completed sessions
    const completedSessions = await db.query.diagnosticSessions.findMany({
      where: and(
        eq(diagnosticSessions.institutionId, institutionId),
        isNotNull(diagnosticSessions.overallScore)
      ),
    });
    
    if (completedSessions.length === 0) {
      return NextResponse.json({
        totalSessions: 0,
        averageScore: 0,
        levelDistribution: {},
        categoryAverages: {},
      });
    }
    
    // Calculate overall statistics
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / completedSessions.length);
    
    // Level distribution
    const levelDistribution: Record<string, number> = {};
    for (const session of completedSessions) {
      const level = session.level || 'unknown';
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    }
    
    // Category averages
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    
    for (const session of completedSessions) {
      if (session.categoryScores) {
        const scores = session.categoryScores as Record<string, number>;
        for (const [categoryId, score] of Object.entries(scores)) {
          if (!categoryTotals[categoryId]) {
            categoryTotals[categoryId] = { sum: 0, count: 0 };
          }
          categoryTotals[categoryId].sum += score;
          categoryTotals[categoryId].count += 1;
        }
      }
    }
    
    // Get category names
    const categories = await db.query.diagnosticCategories.findMany();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    const categoryAverages: Record<string, { name: string; average: number }> = {};
    for (const [categoryId, totals] of Object.entries(categoryTotals)) {
      categoryAverages[categoryId] = {
        name: categoryMap.get(categoryId) || 'Unknown',
        average: Math.round(totals.sum / totals.count),
      };
    }
    
    return NextResponse.json({
      totalSessions: completedSessions.length,
      averageScore,
      levelDistribution,
      categoryAverages,
      sessions: completedSessions.map(s => ({
        id: s.id,
        name: s.name,
        overallScore: s.overallScore,
        level: s.level,
        completedAt: s.completedAt,
        status: s.status,
      })),
    });
    
  } catch (error) {
    console.error('Error fetching diagnostic results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
