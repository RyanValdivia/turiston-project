export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    let details: unknown;
    try {
      const body = await response.json();
      message = body.error ?? message;
      details = body.details;
    } catch {
      // respuesta sin cuerpo JSON (ej. 500 crudo)
    }
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}
export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) });
}
function patch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "PATCH", ...(body ? { body: JSON.stringify(body) } : {}) });
}
function del<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Tipos (reflejan las respuestas reales del backend)
// ---------------------------------------------------------------------------

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  createdAt: string;
  restaurante: Restaurante;
}

export interface Restaurante {
  id: string;
  nombre: string;
  ciudad: string;
  lineaBaseSemanalKg: number | null;
  createdAt: string;
}

export type RolColaborador =
  | "ADMINISTRADOR"
  | "JEFE_COCINA"
  | "COCINERO"
  | "ALMACEN"
  | "LIMPIEZA"
  | "SOSTENIBILIDAD"
  | "TURNO";

export interface Colaborador {
  id: string;
  restauranteId: string;
  nombre: string;
  rol: RolColaborador;
  capacitado: boolean;
  createdAt: string;
}

export interface Producto {
  id: string;
  restauranteId: string;
  nombre: string;
  costoUnitario: number;
  createdAt: string;
}

export type CategoriaResiduo =
  | "MERMA_PREPARACION"
  | "PRODUCTO_DETERIORADO"
  | "SOBREPRODUCCION"
  | "ALIMENTO_NO_VENDIDO"
  | "RESTOS_CLIENTE"
  | "CARTON"
  | "VIDRIO"
  | "PLASTICO"
  | "ACEITE_USADO"
  | "NO_APROVECHABLE";
export type AreaProceso = "COCINA" | "ALMACEN" | "SALON" | "BARRA" | "LIMPIEZA" | "OTRO";
export type MotivoGeneracion =
  | "SOBREPRODUCCION"
  | "ERROR_PREPARACION"
  | "PRODUCTO_VENCIDO"
  | "EXCESO_COMPRA"
  | "DEVOLUCION_CLIENTE"
  | "MAL_ALMACENAMIENTO"
  | "ERROR_PORCION"
  | "OTRO";
export type Turno = "MANANA" | "TARDE" | "NOCHE";
export type DestinoPrevisto =
  | "RELLENO_SANITARIO"
  | "COMPOSTAJE"
  | "DONACION"
  | "VALORIZACION_RECICLADOR"
  | "REUTILIZACION_INTERNA"
  | "VENTA_SUBPRODUCTO"
  | "PENDIENTE_DEFINIR";

export interface ResiduoItem {
  categoria: CategoriaResiduo;
  cantidadKg: number;
  area: AreaProceso;
  areaDetalle?: string;
  productoAsociado: string;
  productoId?: string;
  motivo: MotivoGeneracion;
  fecha: string;
  turno: Turno;
  destinoPrevisto: DestinoPrevisto;
  costoManual?: number;
  observaciones?: string;
}

export interface Residuo extends ResiduoItem {
  id: string;
  restauranteId: string;
  colaboradorId: string | null;
  registroOperacionId: string | null;
  costoTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VentaItem {
  concepto: string;
  cantidad: number;
  montoTotal: number;
}
export interface Venta extends VentaItem {
  id: string;
  restauranteId: string;
  registroOperacionId: string;
  createdAt: string;
}

export interface ProduccionItem {
  productoAsociado: string;
  cantidadProducida: number;
  unidad?: string;
}
export interface Produccion extends ProduccionItem {
  id: string;
  restauranteId: string;
  registroOperacionId: string;
  createdAt: string;
}

export interface RegistroOperacion {
  id: string;
  restauranteId: string;
  colaboradorId: string | null;
  fecha: string;
  turno: Turno;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  ventas: Venta[];
  producciones: Produccion[];
  residuos: Residuo[];
}

export interface DashboardResponse {
  periodo: { from: string; to: string };
  resumen: {
    totalKg: number;
    perdidaEstimada: number;
    segregacionPct: number | null;
    valorizacionPct: number | null;
    prevencionPct: number | null;
    desperdicioPor100Platos: number | null;
    categoriaMasGenerada: string | null;
    areaCritica: { area: string; kg: number; share: number } | null;
  };
  ultimasOperaciones: {
    id: string;
    fecha: string;
    turno: Turno;
    totalVentas: number;
    totalProducidoKg: number;
    totalDesperdicioKg: number;
  }[];
}

export interface IndicadoresResponse {
  periodo: { from: string; to: string };
  generacion: { totalKg: number; porCategoria: Record<string, number> };
  desperdicioPor100Platos: number | null;
  economia: { perdidaEstimada: number; kgSinCostoAsignado: number };
  prevencionPct: number | null;
  segregacionPct: number | null;
  valorizacionPct: number | null;
  operacion: { accionesAplicadas: number };
  personal: { capacitadosPct: number | null; total: number; capacitados: number };
  trazabilidadPct: number | null;
  adopcionPct: number;
  satisfaccion: null;
  analisis: {
    categoriaMasGenerada: string | null;
    areaCritica: { area: string; kg: number; share: number } | null;
    turnoCritico: { turno: string; kg: number } | null;
    porArea: Record<string, number>;
    porTurno: Record<string, number>;
    porMotivo: Record<string, number>;
  };
}

export interface Recomendacion {
  codigo: string;
  titulo: string;
  descripcion: string;
  prioridad: number;
}
export interface RecomendacionesResponse {
  periodo: { from: string; to: string };
  recomendaciones: Recomendacion[];
}

export interface TendenciaBucket {
  periodoInicio: string;
  periodoFin: string;
  totalKg: number;
  perdidaEstimada: number;
}
export interface TendenciasResponse {
  periodo: { from: string; to: string };
  tendencia: TendenciaBucket[];
}

export interface ReporteResumen {
  id: string;
  periodoFrom: string;
  periodoTo: string;
  createdAt: string;
}
export interface ReporteDetalle extends ReporteResumen {
  resumen: Record<string, unknown>;
}

export interface PrediccionPlato {
  plato: string;
  prediccion: number;
}
export interface PrediccionMetrics {
  mae: number;
  mape: number;
  r2: number;
  precisionPct: number;
}
export interface Prediccion {
  id: string;
  restauranteId: string;
  tipo: string;
  estado: "PENDIENTE" | "COMPLETADA" | "ERROR";
  createdAt: string;
  completadaEn: string | null;
  datosEntrada: unknown;
  resultado: {
    predicciones: PrediccionPlato[];
    metrics: PrediccionMetrics;
    entrenadoEn: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function login(data: { email: string; password: string }) {
  return post<{ usuario: { id: string; nombre: string; email: string }; restauranteId: string }>(
    "/auth/login",
    data,
  );
}

export function register(data: {
  nombreUsuario: string;
  email: string;
  password: string;
  nombreRestaurante: string;
  ciudad?: string;
}) {
  return post<{
    usuario: { id: string; nombre: string; email: string };
    restaurante: { id: string; nombre: string; ciudad: string };
  }>("/auth/register", data);
}

export function logout() {
  return post<{ ok: true }>("/auth/logout");
}

export function me() {
  return get<Usuario>("/auth/me");
}

export function forgotPassword(email: string) {
  return post<{ ok: true; resetToken?: string; expiresAt?: string }>("/auth/forgot-password", {
    email,
  });
}

export function resetPassword(token: string, newPassword: string) {
  return post<{ ok: true }>("/auth/reset-password", { token, newPassword });
}

// ---------------------------------------------------------------------------
// Restaurante / Dashboard
// ---------------------------------------------------------------------------

export function updateRestaurante(
  restauranteId: string,
  data: Partial<{ nombre: string; ciudad: string; lineaBaseSemanalKg: number | null }>,
) {
  return patch<Restaurante>(`/restaurantes/${restauranteId}`, data);
}

export function getDashboard(restauranteId: string, params?: { from?: string; to?: string }) {
  return get<DashboardResponse>(`/restaurantes/${restauranteId}/dashboard${qs(params)}`);
}

// ---------------------------------------------------------------------------
// Colaboradores / Productos
// ---------------------------------------------------------------------------

export function listColaboradores(restauranteId: string) {
  return get<Colaborador[]>(`/restaurantes/${restauranteId}/colaboradores`);
}
export function createColaborador(
  restauranteId: string,
  data: { nombre: string; rol: RolColaborador; capacitado?: boolean },
) {
  return post<Colaborador>(`/restaurantes/${restauranteId}/colaboradores`, data);
}

export function updateColaborador(
  restauranteId: string,
  colaboradorId: string,
  data: Partial<{ nombre: string; rol: RolColaborador; capacitado: boolean }>,
) {
  return patch<Colaborador>(
    `/restaurantes/${restauranteId}/colaboradores/${colaboradorId}`,
    data,
  );
}
export function deleteColaborador(restauranteId: string, colaboradorId: string) {
  return del<{ ok: true }>(`/restaurantes/${restauranteId}/colaboradores/${colaboradorId}`);
}

export function listProductos(restauranteId: string) {
  return get<Producto[]>(`/restaurantes/${restauranteId}/productos`);
}
export function createProducto(
  restauranteId: string,
  data: { nombre: string; costoUnitario: number },
) {
  return post<Producto>(`/restaurantes/${restauranteId}/productos`, data);
}
export function updateProducto(
  restauranteId: string,
  productoId: string,
  data: Partial<{ nombre: string; costoUnitario: number }>,
) {
  return patch<Producto>(`/restaurantes/${restauranteId}/productos/${productoId}`, data);
}
export function deleteProducto(restauranteId: string, productoId: string) {
  return del<{ ok: true }>(`/restaurantes/${restauranteId}/productos/${productoId}`);
}

// ---------------------------------------------------------------------------
// Entregas (trazabilidad / valorización)
// ---------------------------------------------------------------------------

export interface EntregaItem {
  categoria: CategoriaResiduo;
  pesoKg: number;
  fecha: string;
  receptor: string;
  fotografiaUrl?: string;
  constanciaUrl?: string;
  observaciones?: string;
  colaboradorId?: string;
}
export interface Entrega extends Omit<EntregaItem, "colaboradorId"> {
  id: string;
  restauranteId: string;
  colaboradorId: string | null;
  createdAt: string;
}

export function listEntregas(
  restauranteId: string,
  params?: { from?: string; to?: string; categoria?: CategoriaResiduo },
) {
  return get<Entrega[]>(`/restaurantes/${restauranteId}/entregas${qs(params)}`);
}
export function createEntrega(restauranteId: string, data: EntregaItem) {
  return post<Entrega>(`/restaurantes/${restauranteId}/entregas`, data);
}
export function updateEntrega(
  restauranteId: string,
  entregaId: string,
  data: Partial<EntregaItem>,
) {
  return patch<Entrega>(`/restaurantes/${restauranteId}/entregas/${entregaId}`, data);
}
export function deleteEntrega(restauranteId: string, entregaId: string) {
  return del<{ ok: true }>(`/restaurantes/${restauranteId}/entregas/${entregaId}`);
}

// ---------------------------------------------------------------------------
// Residuos (registro individual, además del anidado en operaciones)
// ---------------------------------------------------------------------------

export function listResiduos(
  restauranteId: string,
  params?: {
    from?: string;
    to?: string;
    categoria?: CategoriaResiduo;
    area?: AreaProceso;
    turno?: Turno;
  },
) {
  return get<Residuo[]>(`/restaurantes/${restauranteId}/residuos${qs(params)}`);
}
export function createResiduo(restauranteId: string, data: ResiduoItem & { colaboradorId?: string }) {
  return post<Residuo>(`/restaurantes/${restauranteId}/residuos`, data);
}
export function deleteResiduo(restauranteId: string, residuoId: string) {
  return del<{ ok: true }>(`/restaurantes/${restauranteId}/residuos/${residuoId}`);
}

// ---------------------------------------------------------------------------
// Acciones aplicadas (recomendaciones puestas en práctica)
// ---------------------------------------------------------------------------

export interface AccionAplicada {
  id: string;
  restauranteId: string;
  recomendacionCodigo: string;
  descripcion: string;
  fecha: string;
  notas: string | null;
}

export function listAcciones(restauranteId: string) {
  return get<AccionAplicada[]>(`/restaurantes/${restauranteId}/acciones`);
}
export function createAccion(
  restauranteId: string,
  data: { recomendacionCodigo: string; descripcion: string; notas?: string },
) {
  return post<AccionAplicada>(`/restaurantes/${restauranteId}/acciones`, data);
}

// ---------------------------------------------------------------------------
// Registro de Operación / Historial
// ---------------------------------------------------------------------------

export interface OperacionFilters {
  from?: string;
  to?: string;
  turno?: Turno;
  q?: string;
}

export function listOperaciones(restauranteId: string, filters?: OperacionFilters) {
  return get<RegistroOperacion[]>(`/restaurantes/${restauranteId}/operaciones${qs(filters)}`);
}
export function getOperacion(restauranteId: string, operacionId: string) {
  return get<RegistroOperacion>(`/restaurantes/${restauranteId}/operaciones/${operacionId}`);
}
export function createOperacion(
  restauranteId: string,
  data: {
    colaboradorId?: string;
    fecha: string;
    turno: Turno;
    observaciones?: string;
    ventas?: VentaItem[];
    producciones?: ProduccionItem[];
    desperdicios?: ResiduoItem[];
  },
) {
  return post<RegistroOperacion>(`/restaurantes/${restauranteId}/operaciones`, data);
}
export function updateOperacion(
  restauranteId: string,
  operacionId: string,
  data: Partial<{
    colaboradorId: string;
    fecha: string;
    turno: Turno;
    observaciones: string;
    ventas: VentaItem[];
    producciones: ProduccionItem[];
    desperdicios: ResiduoItem[];
  }>,
) {
  return patch<RegistroOperacion>(
    `/restaurantes/${restauranteId}/operaciones/${operacionId}`,
    data,
  );
}
export function deleteOperacion(restauranteId: string, operacionId: string) {
  return del<{ ok: true }>(`/restaurantes/${restauranteId}/operaciones/${operacionId}`);
}

// ---------------------------------------------------------------------------
// Análisis
// ---------------------------------------------------------------------------

export function getIndicadores(
  restauranteId: string,
  params?: { from?: string; to?: string; platosVendidos?: number },
) {
  return get<IndicadoresResponse>(`/restaurantes/${restauranteId}/indicadores${qs(params)}`);
}
export function getRecomendaciones(restauranteId: string, params?: { from?: string; to?: string }) {
  return get<RecomendacionesResponse>(
    `/restaurantes/${restauranteId}/recomendaciones${qs(params)}`,
  );
}
export function getTendencias(restauranteId: string, params?: { from?: string; to?: string }) {
  return get<TendenciasResponse>(`/restaurantes/${restauranteId}/tendencias${qs(params)}`);
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

export function listReportes(restauranteId: string) {
  return get<ReporteResumen[]>(`/restaurantes/${restauranteId}/reportes`);
}
export function createReporte(restauranteId: string, params?: { from?: string; to?: string }) {
  return post<ReporteResumen>(`/restaurantes/${restauranteId}/reportes${qs(params)}`);
}
export function getReporte(restauranteId: string, reporteId: string) {
  return get<ReporteDetalle>(`/restaurantes/${restauranteId}/reportes/${reporteId}`);
}
export function reporteExportUrl(restauranteId: string, reporteId: string) {
  return `/api/restaurantes/${restauranteId}/reportes/${reporteId}/export`;
}

// ---------------------------------------------------------------------------
// Predicciones
// ---------------------------------------------------------------------------

export function listPredicciones(restauranteId: string) {
  return get<Prediccion[]>(`/restaurantes/${restauranteId}/predicciones`);
}
export function createPrediccion(restauranteId: string, data?: { fecha?: string }) {
  return post<Prediccion>(`/restaurantes/${restauranteId}/predicciones`, data ?? {});
}

// ---------------------------------------------------------------------------

function qs<T extends object>(params?: T): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [
    string,
    string | number,
  ][];
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}
