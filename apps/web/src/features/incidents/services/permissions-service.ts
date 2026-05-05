import { Incident } from '../types';

export interface User {
  id: string;
  role?: string | null;
  isSuperAdmin?: boolean | null;
}

/**
 * Checks if user can create incidents
 * Any authenticated user can create incidents
 */
export function canCreateIncident(user: User): boolean {
  return !!user.id;
}

/**
 * Checks if user can assign incidents
 * Only Admin and PIP can assign incidents
 */
export function canAssignIncident(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can change incident status
 * Admin, PIP, and the assigned user can change status
 */
export function canChangeStatus(user: User, incident: Incident): boolean {
  // Admin and PIP can always change status
  if (user.isSuperAdmin || user.role === 'admin' || user.role === 'pip') {
    return true;
  }

  // Assignee can change status of their incidents
  if (incident.assigneeId === user.id) {
    return true;
  }

  return false;
}

/**
 * Checks if user can edit incident details (title, description, etc.)
 * Reporter can edit within 24 hours, Admin and PIP can always edit
 */
export function canEditIncident(user: User, incident: Incident): boolean {
  // Admin and PIP can always edit
  if (user.isSuperAdmin || user.role === 'admin' || user.role === 'pip') {
    return true;
  }

  // Reporter can edit within 24 hours
  if (incident.reporterId === user.id) {
    const hoursSinceCreation = (Date.now() - incident.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  }

  return false;
}

/**
 * Checks if user can delete incidents
 * Only Admin and PIP can delete incidents
 */
export function canDeleteIncident(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can add comments to an incident
 * Reporter, Assignee, Admin, and PIP can add comments
 */
export function canAddComment(user: User, incident: Incident): boolean {
  // Admin and PIP can always comment
  if (user.isSuperAdmin || user.role === 'admin' || user.role === 'pip') {
    return true;
  }

  // Reporter and Assignee can comment
  if (incident.reporterId === user.id || incident.assigneeId === user.id) {
    return true;
  }

  return false;
}

/**
 * Checks if user can edit a comment
 * Only the author can edit within 15 minutes
 */
export function canEditComment(user: User, comment: { authorId: string; createdAt: Date }): boolean {
  if (comment.authorId !== user.id) {
    return false;
  }

  const minutesSinceCreation = (Date.now() - comment.createdAt.getTime()) / (1000 * 60);
  return minutesSinceCreation < 15;
}

/**
 * Checks if user can delete a comment
 * Admin, PIP, or the author can delete
 */
export function canDeleteComment(user: User, comment: { authorId: string }): boolean {
  // Admin and PIP can always delete
  if (user.isSuperAdmin || user.role === 'admin' || user.role === 'pip') {
    return true;
  }

  // Author can delete their own comment
  return comment.authorId === user.id;
}

/**
 * Checks if user can manage templates
 * Only Admin and PIP can manage templates
 */
export function canManageTemplates(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can perform bulk operations
 * Only Admin and PIP can perform bulk operations
 */
export function canPerformBulkOperations(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can view incident statistics
 * Admin and PIP can view statistics
 */
export function canViewStatistics(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can export incident data
 * Admin and PIP can export data
 */
export function canExportData(user: User): boolean {
  return user.isSuperAdmin || user.role === 'admin' || user.role === 'pip';
}

/**
 * Checks if user can delete an attachment
 * Reporter, Admin, and PIP can delete attachments
 */
export function canDeleteAttachment(
  user: User, 
  incident: Incident, 
  attachment: { uploadedBy: string }
): boolean {
  // Admin and PIP can always delete
  if (user.isSuperAdmin || user.role === 'admin' || user.role === 'pip') {
    return true;
  }

  // Reporter can delete attachments
  if (incident.reporterId === user.id) {
    return true;
  }

  // Uploader can delete their own attachment
  return attachment.uploadedBy === user.id;
}
