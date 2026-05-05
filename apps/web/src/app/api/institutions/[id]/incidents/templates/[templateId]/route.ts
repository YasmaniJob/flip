import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidentTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { canManageTemplates } from "@/features/incidents/services/permissions-service";

const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  type: z.enum(["recursos", "infraestructura", "servicios", "seguridad", "otros"]).optional(),
  suggestedPriority: z.enum(["baja", "media", "alta", "critica"]).optional(),
  titleTemplate: z.string().min(5).max(200).optional(),
  descriptionTemplate: z.string().min(10).max(2000).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user };
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check permissions
    if (!canManageTemplates(session.user)) {
      return NextResponse.json(
        { error: "No tienes permisos para editar plantillas" },
        { status: 403 }
      );
    }

    const { id: institutionId, templateId } = await params;
    const body = await req.json();
    const data = updateTemplateSchema.parse(body);

    // Verify template exists
    const template = await db.query.incidentTemplates.findFirst({
      where: and(
        eq(incidentTemplates.id, templateId),
        eq(incidentTemplates.institutionId, institutionId)
      ),
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // Update template
    const [updated] = await db
      .update(incidentTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(incidentTemplates.id, templateId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar plantilla" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user };
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check permissions
    if (!canManageTemplates(session.user)) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar plantillas" },
        { status: 403 }
      );
    }

    const { id: institutionId, templateId } = await params;

    // Verify template exists
    const template = await db.query.incidentTemplates.findFirst({
      where: and(
        eq(incidentTemplates.id, templateId),
        eq(incidentTemplates.institutionId, institutionId)
      ),
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // Soft delete (deactivate)
    await db
      .update(incidentTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(incidentTemplates.id, templateId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Error al eliminar plantilla" },
      { status: 500 }
    );
  }
}
