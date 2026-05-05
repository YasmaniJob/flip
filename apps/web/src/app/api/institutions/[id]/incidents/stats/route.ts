import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { incidents } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

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
    const { searchParams } = new URL(req.url);
    
    // Optional date range filters
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build base where clause
    const whereConditions = [
      eq(incidents.institutionId, institutionId),
      eq(incidents.isActive, true),
    ];

    if (dateFrom) {
      whereConditions.push(gte(incidents.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      whereConditions.push(lte(incidents.createdAt, new Date(dateTo)));
    }

    // Fetch all incidents for this institution
    const allIncidents = await db.query.incidents.findMany({
      where: and(...whereConditions),
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

    // Calculate statistics
    const total = allIncidents.length;

    // By status
    const byStatus = allIncidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By priority
    const byPriority = allIncidents.reduce((acc, inc) => {
      acc[inc.priority] = (acc[inc.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By type
    const byType = allIncidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Open vs resolved
    const open = allIncidents.filter(
      (inc) => ["reportada", "en_revision", "en_progreso"].includes(inc.status)
    ).length;

    const resolved = allIncidents.filter(
      (inc) => ["resuelta", "cerrada"].includes(inc.status)
    ).length;

    // Average resolution time (in minutes)
    const resolvedIncidents = allIncidents.filter(
      (inc) => inc.resolvedAt && inc.resolutionTime
    );

    const averageResolutionTime =
      resolvedIncidents.length > 0
        ? Math.round(
            resolvedIncidents.reduce((sum, inc) => sum + (inc.resolutionTime || 0), 0) /
              resolvedIncidents.length
          )
        : 0;

    // Average resolution time by type
    const averageResolutionTimeByType = resolvedIncidents.reduce((acc, inc) => {
      if (!acc[inc.type]) {
        acc[inc.type] = { total: 0, count: 0 };
      }
      acc[inc.type].total += inc.resolutionTime || 0;
      acc[inc.type].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const avgByType = Object.entries(averageResolutionTimeByType).reduce(
      (acc, [type, data]) => {
        acc[type] = Math.round(data.total / data.count);
        return acc;
      },
      {} as Record<string, number>
    );

    // Top resources with most incidents
    const resourceCounts = allIncidents
      .filter((inc) => inc.resourceId && inc.resource)
      .reduce((acc, inc) => {
        const key = inc.resourceId!;
        if (!acc[key]) {
          acc[key] = {
            resourceId: key,
            resourceName: inc.resource?.name || "Desconocido",
            resourceInternalId: inc.resource?.internalId || "",
            count: 0,
          };
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

    const topResourcesWithIncidents = Object.values(resourceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recurrent incidents count
    const recurrentIncidents = allIncidents.filter((inc) => inc.isRecurrent).length;

    // Response
    const stats = {
      total,
      byStatus,
      byPriority,
      byType,
      open,
      resolved,
      averageResolutionTime,
      averageResolutionTimeByType: avgByType,
      topResourcesWithIncidents,
      recurrentIncidents,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching incident stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
