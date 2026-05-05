import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidents, incidentChangeHistory } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { canAssignIncident } from "@/features/incidents/services/permissions-service";

const bulkPrioritySchema = z.object({
  incidentIds: z.array(z.string()).min(1).max(50),
  priority: z.enum(["baja", "media", "alta", "critica"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user };
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: institutionId } = await params;
    const body = await req.json();
    const { incidentIds, priority } = bulkPrioritySchema.parse(body);

    // Check permissions (Admin, PIP, or Assignee can change priority)
    const canChange = 
      session.user.isSuperAdmin || 
      session.user.role === "admin" || 
      session.user.role === "pip";

    if (!canChange) {
      return NextResponse.json(
        { error: "No tienes permisos para cambiar prioridades" },
        { status: 403 }
      );
    }

    // Fetch all incidents
    const incidentsList = await db.query.incidents.findMany({
      where: and(
        eq(incidents.institutionId, institutionId),
        inArray(incidents.id, incidentIds),
        eq(incidents.isActive, true)
      ),
    });

    if (incidentsList.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron incidencias" },
        { status: 404 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    // Process each incident
    for (const incident of incidentsList) {
      try {
        // Update incident
        await db
          .update(incidents)
          .set({
            priority,
            updatedAt: new Date(),
          })
          .where(eq(incidents.id, incident.id));

        // Record change
        await db.insert(incidentChangeHistory).values({
          id: nanoid(),
          incidentId: incident.id,
          changedBy: session.user.id,
          field: "priority",
          oldValue: incident.priority,
          newValue: priority,
          changeType: "updated",
          metadata: { bulkOperation: true },
          createdAt: new Date(),
        });

        results.success.push(incident.id);
      } catch (error) {
        results.failed.push({
          id: incident.id,
          reason: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return NextResponse.json({
      success: results.success.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error("Error in bulk priority update:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar prioridades" },
      { status: 500 }
    );
  }
}
