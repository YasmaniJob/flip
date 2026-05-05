import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incidents, incidentChangeHistory } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/helpers";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { canAssignIncident } from "@/features/incidents/services/permissions-service";

const bulkAssignSchema = z.object({
  incidentIds: z.array(z.string()).min(1).max(50),
  assigneeId: z.string().nullable(),
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
    const { incidentIds, assigneeId } = bulkAssignSchema.parse(body);

    // Check permissions (only Admin and PIP can assign)
    if (!canAssignIncident(session.user)) {
      return NextResponse.json(
        { error: "No tienes permisos para asignar incidencias" },
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
            assigneeId,
            updatedAt: new Date(),
          })
          .where(eq(incidents.id, incident.id));

        // Record change
        await db.insert(incidentChangeHistory).values({
          id: nanoid(),
          incidentId: incident.id,
          changedBy: session.user.id,
          field: "assignee",
          oldValue: incident.assigneeId,
          newValue: assigneeId,
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
    console.error("Error in bulk assign:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al asignar incidencias" },
      { status: 500 }
    );
  }
}
