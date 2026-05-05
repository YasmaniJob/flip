import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidentAttachments, incidents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user };
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: institutionId, incidentId } = await params;

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

    // Check current attachment count
    const currentAttachments = await db.query.incidentAttachments.findMany({
      where: eq(incidentAttachments.incidentId, incidentId),
    });

    if (currentAttachments.length >= MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_ATTACHMENTS} archivos permitidos por incidencia` },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo de 5MB" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(
      `incidents/${institutionId}/${incidentId}/${nanoid()}-${file.name}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    // Create attachment record
    const [attachment] = await db
      .insert(incidentAttachments)
      .values({
        id: nanoid(),
        incidentId,
        uploadedBy: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageKey: blob.pathname,
        storageUrl: blob.url,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incidentId: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const session = { user };
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: institutionId, incidentId } = await params;

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

    // Get attachments
    const attachments = await db.query.incidentAttachments.findMany({
      where: eq(incidentAttachments.incidentId, incidentId),
      with: {
        uploadedBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Error al obtener los archivos adjuntos" },
      { status: 500 }
    );
  }
}
