import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incidentTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { canManageTemplates } from "@/features/incidents/services/permissions-service";
import { requireAuth } from "@/lib/auth/helpers";

const createTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(["recursos", "infraestructura", "servicios", "seguridad", "otros"]),
  suggestedPriority: z.enum(["baja", "media", "alta", "critica"]),
  titleTemplate: z.string().min(5).max(200),
  descriptionTemplate: z.string().min(10).max(2000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: institutionId } = await params;

    // Fetch active templates
    const templates = await db.query.incidentTemplates.findMany({
      where: and(
        eq(incidentTemplates.institutionId, institutionId),
        eq(incidentTemplates.isActive, true)
      ),
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Error al obtener plantillas" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check permissions
    if (!canManageTemplates(user)) {
      return NextResponse.json(
        { error: "No tienes permisos para crear plantillas" },
        { status: 403 }
      );
    }

    const { id: institutionId } = await params;
    const body = await req.json();
    const data = createTemplateSchema.parse(body);

    // Create template
    const [template] = await db
      .insert(incidentTemplates)
      .values({
        id: nanoid(),
        institutionId,
        name: data.name,
        type: data.type,
        suggestedPriority: data.suggestedPriority,
        titleTemplate: data.titleTemplate,
        descriptionTemplate: data.descriptionTemplate,
        isActive: true,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear plantilla" },
      { status: 500 }
    );
  }
}
