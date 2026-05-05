import { db } from '@/lib/db';
import { incidentSequences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generates a sequential ID for incidents within an institution
 * Uses atomic database operations to prevent race conditions
 */
export async function generateSequentialId(institutionId: string): Promise<{ sequentialId: number; displayId: string }> {
  return await db.transaction(async (tx) => {
    // Try to get existing sequence
    const [sequence] = await tx
      .select()
      .from(incidentSequences)
      .where(eq(incidentSequences.institutionId, institutionId))
      .for('update'); // Lock row for update

    let nextNumber: number;

    if (sequence) {
      // Increment existing sequence
      nextNumber = sequence.lastNumber + 1;
      await tx
        .update(incidentSequences)
        .set({ lastNumber: nextNumber })
        .where(eq(incidentSequences.id, sequence.id));
    } else {
      // Create new sequence starting at 1
      nextNumber = 1;
      await tx.insert(incidentSequences).values({
        id: crypto.randomUUID(),
        institutionId,
        lastNumber: nextNumber,
      });
    }

    // Format display ID: INC-001, INC-002, etc.
    const displayId = `INC-${String(nextNumber).padStart(3, '0')}`;

    return {
      sequentialId: nextNumber,
      displayId,
    };
  });
}
