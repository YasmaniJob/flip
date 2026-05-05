import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidentAttachments, incidents, incidentChangeHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import { nanoid } from "nanoid";
import { canDeleteAttachment } from "@/features/incidents/services/permissions-service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string; attachmentId: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user }; // Maintain compatibility with existing code
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: institutionId, incidentId, attachmentId } = await params;

    // Verify incident exists and belongs to institution
    const incident = await db.query.incidents.findFirst({
      where: and(
        eq(incidents.id, incidentId),
        eq(incidents.institutionId, institutionId),
        eq(incidents.isActive, true)
      ),
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incidencia no encontrada" },
        { status: 404 }
      );
    }

    // Get attachment
    const attachment = await db.query.incidentAttachments.findFirst({
      where: and(
        eq(incidentAttachments.id, attachmentId),
        eq(incidentAttachments.incidentId, incidentId)
      ),
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Archivo adjunto no encontrado" },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canDeleteAttachment(session.user, incident, attachment)) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este archivo" },
        { status: 403 }
      );
    }

    // Delete from storage
    try {
      await del(attachment.storageUrl);
    } catch (error) {
      console.error("Error deleting from blob storage:", error);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await db
      .delete(incidentAttachments)
      .where(eq(incidentAttachments.id, attachmentId));

    // Record in change history
    await db.insert(incidentChangeHistory).values({
      id: nanoid(),
      incidentId,
      changedBy: session.user.id,
      field: "attachment",
      oldValue: attachment.fileName,
      newValue: null,
      changeType: "deleted",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}
