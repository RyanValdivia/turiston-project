/**
 * Returns an ISO date + turno guaranteed not to collide with seeded
 * operaciones for the demo restaurant: the Jan-Jul 2026 sales backfill only
 * ever uses Turno.TARDE (through 2026-07-31), and the other seed operaciones
 * use daysAgo(2)/daysAgo(5) on different turnos. "Today" + NOCHE is free.
 */
export function freshFechaTurno(offsetDays = 0): { fecha: string; turno: "NOCHE" } {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { fecha: d.toISOString().slice(0, 10), turno: "NOCHE" };
}

/**
 * Same idea as freshFechaTurno, but derives the offset from Date.now() so the
 * date itself differs on every run (not just "today") — needed by tests that
 * hit the [restauranteId,fecha,turno] unique constraint and must stay safe to
 * re-run repeatedly against the same dev.db without a reseed in between.
 */
export function uniqueFechaTurno(turno: "MANANA" | "TARDE" | "NOCHE" = "TARDE") {
  const offsetDays = 30 + (Date.now() % 3650);
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { fecha: d.toISOString().slice(0, 10), turno };
}
