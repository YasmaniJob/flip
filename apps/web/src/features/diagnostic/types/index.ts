/**
 * Type Definitions for Diagnostic Module
 */

// Response score values
export type DiagnosticScore = 0 | 1 | 2 | 3;

export const SCORE_LABELS = {
  0: 'No sé hacerlo',
  1: 'Puedo hacerlo con ayuda',
  2: 'Puedo hacerlo solo',
  3: 'Puedo hacerlo y orientar a otros',
} as const;

export const SCORE_ICONS = {
  0: '🌑',
  1: '🤝',
  2: '⚡',
  3: '🌟',
} as const;

// Session status
export type SessionStatus = 'in_progress' | 'completed' | 'approved';

// Level determination
export type DiagnosticLevel = 'explorador' | 'en_desarrollo' | 'competente' | 'mentor';

export const LEVEL_LABELS = {
  explorador: 'Explorador Digital',
  en_desarrollo: 'En Desarrollo',
  competente: 'Competente',
  mentor: 'Mentor Digital',
} as const;

export const LEVEL_ICONS = {
  explorador: '🌑',
  en_desarrollo: '🤝',
  competente: '⚡',
  mentor: '🌟',
} as const;

export const LEVEL_THRESHOLDS = {
  explorador: { min: 0, max: 30 },
  en_desarrollo: { min: 31, max: 60 },
  competente: { min: 61, max: 85 },
  mentor: { min: 86, max: 100 },
} as const;

// API Request/Response types
export interface IdentifyRequest {
  dni: string;
  name: string;
  email: string;
}

export interface IdentifyResponse {
  token: string;
  sessionId: string;
  isResuming: boolean;
  progress: number;
  totalQuestions: number;
}

export interface SaveResponseRequest {
  token: string;
  questionId: string;
  score: DiagnosticScore;
}

export interface SaveResponseResponse {
  success: boolean;
  progress: number;
  totalQuestions: number;
}

export interface CompleteSessionRequest {
  token: string;
}

export interface CompleteSessionResponse {
  success: boolean;
  overallScore: number;
  level: DiagnosticLevel;
  categoryScores: Record<string, number>;
}

export interface DiagnosticConfig {
  enabled: boolean;
  requiresApproval: boolean;
  customMessage?: string;
  institutionName: string;
  institutionLogo?: string | null;
  categories: DiagnosticCategory[];
  questions: DiagnosticQuestion[];
}

export interface DiagnosticCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  code: string;
  categoryId: string;
  text: string;
  order: number;
  isActive: boolean;
}

export interface DiagnosticSession {
  id: string;
  token: string;
  institutionId: string;
  staffId?: string;
  name: string;
  dni?: string;
  email?: string;
  status: SessionStatus;
  progress: number;
  totalQuestions: number;
  overallScore?: number;
  level?: DiagnosticLevel;
  categoryScores?: Record<string, number>;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticResponse {
  id: string;
  sessionId: string;
  questionId: string;
  score: DiagnosticScore;
  answeredAt: Date;
}

// Admin types
export interface PendingSession {
  id: string;
  name: string;
  dni?: string;
  email?: string;
  overallScore: number;
  level: DiagnosticLevel;
  completedAt: Date;
}

export interface ApproveSessionRequest {
  sessionId: string;
}

export interface ApproveSessionResponse {
  success: boolean;
  staffId: string;
  action: 'created' | 'linked';
}
