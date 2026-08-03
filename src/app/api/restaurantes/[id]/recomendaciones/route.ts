import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleRouteError, parseDateRange } from "@/lib/api-helpers";
import { calcularEstadisticas } from "@/lib/estadisticas";
import { generarRecomendaciones } from "@/lib/recomendaciones";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const { from, to } = parseDateRange(request.nextUrl.searchParams);
    const stats = await calcularEstadisticas(id, from, to);
    const recomendaciones = generarRecomendaciones(stats);
    return NextResponse.json({ periodo: { from, to }, recomendaciones });
  } catch (error) {
    return handleRouteError(error);
  }
}
