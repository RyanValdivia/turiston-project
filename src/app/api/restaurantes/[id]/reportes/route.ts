import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, parseDateRange } from "@/lib/api-helpers";
import { generarReporte } from "@/lib/reporte";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const reportes = await db.reporte.findMany({
      where: { restauranteId: id },
      select: { id: true, periodoFrom: true, periodoTo: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reportes);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const { from, to } = parseDateRange(request.nextUrl.searchParams);

    const { resumen, csv } = await generarReporte(id, from, to);

    const reporte = await db.reporte.create({
      data: {
        restauranteId: id,
        periodoFrom: from,
        periodoTo: to,
        resumenJson: JSON.stringify(resumen),
        csv,
      },
      select: { id: true, periodoFrom: true, periodoTo: true, createdAt: true },
    });

    return NextResponse.json(reporte, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
