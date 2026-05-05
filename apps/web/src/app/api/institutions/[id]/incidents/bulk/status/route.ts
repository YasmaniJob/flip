import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidents, incidentChangeHistory } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { canChangeStatus } from "@/features/incidents/services/permissions-service";
import { canTransition } from "@/features/incidents/services/state-machine-service";

const bulkStatusSchema = z.object({
  incidentIds: z.array(z.string()).min(1).max(50),
  status: z.enum(["reportada", "en_revision", "en_progreso", "resuelta", "cerrada"]),
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
    const { incidentIds, status } = bulkStatusSchema.parse(body);

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
        // Check permissions
        if (!canChangeStatus(session.user, incident)) {
          results.failed.push({
            id: incident.id,
            reason: "Sin permisos para cambiar el estado",
          });
          continue;
        }

        // Check state transition
        if (!canTransition(incident.status as any, status)) {
          results.failed.push({
            id: incident.id,
            reason: `Transición inválida de ${incident.status} a ${status}`,
          });
          continue;
        }

        // Update incident
        await db
          .update(incidents)
          .set({
            status,
            updatedAt: new Date(),
            ...(status === "resuelta" && {
              resolvedAt: new Date(),
              resolutionTime: Math.floor(
                (Date.now() - incident.createdAt.getTime()) / (1000 * 60)
              ),
            }),
          })
          .where(eq(incidents.id, incident.id));

        // Record change
        await db.insert(incidentChangeHistory).values({
          id: nanoid(),
          incidentId: incident.id,
          changedBy: session.user.id,
          field: "status",
          oldValue: incident.status,
          newValue: status,
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
    console.error("Error in bulk status update:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar incidencias" },
      { status: 500 }
    );
  }
}
