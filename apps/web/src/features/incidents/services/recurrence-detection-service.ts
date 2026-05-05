import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { eq, and, gte, isNotNull } from "drizzle-orm";

/**
 * Detects recurrent incidents based on:
 * - Same resource with 3+ incidents in 30 days
 * - Same location + type with 3+ incidents in 30 days
 * 
 * This should be run periodically (e.g., daily cron job)
 */
export async function detectRecurrentIncidents(institutionId: string) {
  try {
    // Date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch recent incidents
    const recentIncidents = await db.query.incidents.findMany({
      where: and(
        eq(incidents.institutionId, institutionId),
        eq(incidents.isActive, true),
        gte(incidents.createdAt, thirtyDaysAgo)
      ),
    });

    const updates: Array<{ id: string; isRecurrent: boolean; recurrenceCount: number }> = [];

    // Check by resource
    const byResource = recentIncidents
      .filter((inc) => inc.resourceId)
      .reduce((acc, inc) => {
        const key = inc.resourceId!;
        if (!acc[key]) acc[key] = [];
        acc[key].push(inc);
        return acc;
      }, {} as Record<string, typeof recentIncidents>);

    for (const [resourceId, incidentsList] of Object.entries(byResource)) {
      if (incidentsList.length >= 3) {
        // Mark all as recurrent
        for (const incident of incidentsList) {
          updates.push({
            id: incident.id,
            isRecurrent: true,
            recurrenceCount: incidentsList.length,
          });
        }
      }
    }

    // Check by location + type
    const byLocation = recentIncidents
      .filter((inc) => inc.location && inc.type)
      .reduce((acc, inc) => {
        const key = `${inc.location}|${inc.type}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(inc);
        return acc;
      }, {} as Record<string, typeof recentIncidents>);

    for (const [key, incidentsList] of Object.entries(byLocation)) {
      if (incidentsList.length >= 3) {
        // Mark all as recurrent
        for (const incident of incidentsList) {
          // Only update if not already marked by resource check
          const existing = updates.find((u) => u.id === incident.id);
          if (!existing) {
            updates.push({
              id: incident.id,
              isRecurrent: true,
              recurrenceCount: incidentsList.length,
            });
          }
        }
      }
    }

    // Apply updates
    for (const update of updates) {
      await db
        .update(incidents)
        .set({
          isRecurrent: update.isRecurrent,
          recurrenceCount: update.recurrenceCount,
          updatedAt: new Date(),
        })
        .where(eq(incidents.id, update.id));
    }

    return {
      processed: recentIncidents.length,
      markedRecurrent: updates.length,
      byResource: Object.keys(byResource).length,
      byLocation: Object.keys(byLocation).length,
    };
  } catch (error) {
    console.error("Error detecting recurrent incidents:", error);
    throw error;
  }
}

/**
 * Check if a specific incident should be marked as recurrent
 * Call this when creating a new incident
 */
export async function checkIncidentRecurrence(
  institutionId: string,
  incidentId: string,
  resourceId: string | null,
  location: string | null,
  type: string
): Promise<{ isRecurrent: boolean; recurrenceCount: number }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let relatedIncidents: any[] = [];

    // Check by resource
    if (resourceId) {
      relatedIncidents = await db.query.incidents.findMany({
        where: and(
          eq(incidents.institutionId, institutionId),
          eq(incidents.resourceId, resourceId),
          eq(incidents.isActive, true),
          gte(incidents.createdAt, thirtyDaysAgo)
        ),
      });
    }
    // Check by location + type
    else if (location) {
      relatedIncidents = await db.query.incidents.findMany({
        where: and(
          eq(incidents.institutionId, institutionId),
          eq(incidents.location, location),
          eq(incidents.type, type),
          eq(incidents.isActive, true),
          gte(incidents.createdAt, thirtyDaysAgo)
        ),
      });
    }

    const isRecurrent = relatedIncidents.length >= 3;
    const recurrenceCount = relatedIncidents.length;

    // If recurrent, mark all related incidents
    if (isRecurrent) {
      for (const incident of relatedIncidents) {
        await db
          .update(incidents)
          .set({
            isRecurrent: true,
            recurrenceCount,
            updatedAt: new Date(),
          })
          .where(eq(incidents.id, incident.id));
      }
    }

    return { isRecurrent, recurrenceCount };
  } catch (error) {
    console.error("Error checking incident recurrence:", error);
    return { isRecurrent: false, recurrenceCount: 0 };
  }
}
