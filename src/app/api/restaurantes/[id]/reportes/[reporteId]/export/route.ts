import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reporteId: string }> }
) {
  try {
    const { id, reporteId } = await params;
    await requireSession(request, id);
    const reporte = await db.reporte.findFirst({ where: { id: reporteId, restauranteId: id } });
    if (!reporte) throw new NotFoundError("Reporte no encontrado");

    return new NextResponse(reporte.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-circularaqp-${reporte.id}.csv"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
