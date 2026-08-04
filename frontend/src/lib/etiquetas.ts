import type {
  CategoriaResiduo,
  AreaProceso,
  MotivoGeneracion,
  Turno,
  DestinoPrevisto,
  RolColaborador,
} from "@/lib/api";

/** Etiquetas legibles en español de los enums del dominio, para la UI. */

export const ETIQUETA_CATEGORIA: Record<CategoriaResiduo, string> = {
  MERMA_PREPARACION: "Merma de preparación",
  PRODUCTO_DETERIORADO: "Producto deteriorado",
  SOBREPRODUCCION: "Sobreproducción",
  ALIMENTO_NO_VENDIDO: "Alimento no vendido",
  RESTOS_CLIENTE: "Restos del cliente",
  CARTON: "Cartón",
  VIDRIO: "Vidrio",
  PLASTICO: "Plástico",
  ACEITE_USADO: "Aceite usado",
  NO_APROVECHABLE: "No aprovechable",
};

export const ETIQUETA_AREA: Record<AreaProceso, string> = {
  COCINA: "Cocina",
  ALMACEN: "Almacén",
  SALON: "Salón",
  BARRA: "Barra",
  LIMPIEZA: "Limpieza",
  OTRO: "Otro",
};

export const ETIQUETA_MOTIVO: Record<MotivoGeneracion, string> = {
  SOBREPRODUCCION: "Sobreproducción",
  ERROR_PREPARACION: "Error de preparación",
  PRODUCTO_VENCIDO: "Producto vencido",
  EXCESO_COMPRA: "Exceso de compra",
  DEVOLUCION_CLIENTE: "Devolución del cliente",
  MAL_ALMACENAMIENTO: "Mal almacenamiento",
  ERROR_PORCION: "Error de porción",
  OTRO: "Otro",
};

export const ETIQUETA_TURNO: Record<Turno, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
};

export const ETIQUETA_DESTINO: Record<DestinoPrevisto, string> = {
  RELLENO_SANITARIO: "Relleno sanitario",
  COMPOSTAJE: "Compostaje",
  DONACION: "Donación",
  VALORIZACION_RECICLADOR: "Valorización con reciclador",
  REUTILIZACION_INTERNA: "Reutilización interna",
  VENTA_SUBPRODUCTO: "Venta de subproducto",
  PENDIENTE_DEFINIR: "Pendiente de definir",
};

export const ETIQUETA_ROL: Record<RolColaborador, string> = {
  ADMINISTRADOR: "Administrador",
  JEFE_COCINA: "Jefe de cocina",
  COCINERO: "Cocinero",
  ALMACEN: "Almacén",
  LIMPIEZA: "Limpieza",
  SOSTENIBILIDAD: "Sostenibilidad",
  TURNO: "Turno",
};

/** Categorías consideradas valorizables (coincide con el backend). */
export const CATEGORIAS_VALORIZABLES: CategoriaResiduo[] = [
  "CARTON",
  "VIDRIO",
  "PLASTICO",
  "ACEITE_USADO",
];

export function opcionesDe<T extends string>(map: Record<T, string>): { valor: T; etiqueta: string }[] {
  return (Object.entries(map) as [T, string][]).map(([valor, etiqueta]) => ({ valor, etiqueta }));
}
