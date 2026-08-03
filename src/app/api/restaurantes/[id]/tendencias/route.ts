import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleRouteError, parseDateRange } from "@/lib/api-helpers";
import { calcularTendencia } from "@/lib/estadisticas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const { from, to } = parseDateRange(request.nextUrl.searchParams);
    const tendencia = await calcularTendencia(id, from, to);
    return NextResponse.json({ periodo: { from, to }, tendencia });
  } catch (error) {
    return handleRouteError(error);
  }
}
