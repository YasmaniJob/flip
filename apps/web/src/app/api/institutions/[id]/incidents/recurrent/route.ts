import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";

export async function GET(
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

    // Date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch incidents from last 30 days
    const recentIncidents = await db.query.incidents.findMany({
      where: and(
        eq(incidents.institutionId, institutionId),
        eq(incidents.isActive, true),
        gte(incidents.createdAt, thirtyDaysAgo)
      ),
      with: {
        resource: {
          columns: {
            id: true,
            name: true,
            internalId: true,
          },
        },
      },
    });

    // Group by resource
    const byResource = recentIncidents
      .filter((inc) => inc.resourceId)
      .reduce((acc, inc) => {
        const key = inc.resourceId!;
        if (!acc[key]) {
          acc[key] = {
            resourceId: key,
            resourceName: inc.resource?.name || "Desconocido",
            resourceInternalId: inc.resource?.internalId || "",
            incidents: [],
            count: 0,
          };
        }
        acc[key].incidents.push({
          id: inc.id,
          displayId: inc.displayId,
          title: inc.title,
          status: inc.status,
          priority: inc.priority,
          createdAt: inc.createdAt,
        });
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

    // Filter resources with 3+ incidents
    const recurrentByResource = Object.values(byResource)
      .filter((group: any) => group.count >= 3)
      .sort((a: any, b: any) => b.count - a.count);

    // Group by location + type
    const byLocation = recentIncidents
      .filter((inc) => inc.location && inc.type)
      .reduce((acc, inc) => {
        const key = `${inc.location}|${inc.type}`;
        if (!acc[key]) {
          acc[key] = {
            location: inc.location!,
            type: inc.type,
            incidents: [],
            count: 0,
          };
        }
        acc[key].incidents.push({
          id: inc.id,
          displayId: inc.displayId,
          title: inc.title,
          status: inc.status,
          priority: inc.priority,
          createdAt: inc.createdAt,
        });
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

    // Filter locations with 3+ incidents
    const recurrentByLocation = Object.values(byLocation)
      .filter((group: any) => group.count >= 3)
      .sort((a: any, b: any) => b.count - a.count);

    // Get all marked as recurrent
    const markedRecurrent = recentIncidents.filter((inc) => inc.isRecurrent);

    return NextResponse.json({
      byResource: recurrentByResource,
      byLocation: recurrentByLocation,
      markedRecurrent: markedRecurrent.map((inc) => ({
        id: inc.id,
        displayId: inc.displayId,
        title: inc.title,
        status: inc.status,
        priority: inc.priority,
        type: inc.type,
        resourceId: inc.resourceId,
        location: inc.location,
        recurrenceCount: inc.recurrenceCount,
        createdAt: inc.createdAt,
      })),
      summary: {
        totalRecurrentResources: recurrentByResource.length,
        totalRecurrentLocations: recurrentByLocation.length,
        totalMarkedRecurrent: markedRecurrent.length,
      },
    });
  } catch (error) {
    console.error("Error fetching recurrent incidents:", error);
    return NextResponse.json(
      { error: "Error al obtener incidencias recurrentes" },
      { status: 500 }
    );
  }
}
