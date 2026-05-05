import { IncidentStatus, INCIDENT_STATE_TRANSITIONS } from '../types';

/**
 * Validates if a state transition is allowed
 */
export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  const allowedTransitions = INCIDENT_STATE_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Gets all valid next states for a given status
 */
export function getValidNextStates(currentStatus: IncidentStatus): IncidentStatus[] {
  return INCIDENT_STATE_TRANSITIONS[currentStatus];
}

/**
 * Validates a state transition and throws an error if invalid
 */
export function validateTransition(from: IncidentStatus, to: IncidentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transición de estado inválida: no se puede cambiar de "${from}" a "${to}"`
    );
  }
}
