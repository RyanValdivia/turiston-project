import {
  post,
  createOperacion,
  createEntrega,
  createProducto,
  createColaborador,
  type VentaItem,
  type ProduccionItem,
  type ResiduoItem,
  type EntregaItem,
  type Turno,
  type RolColaborador,
} from "@/lib/api";

/**
 * Cliente del asistente conversacional de restora.
 *
 * El backend nunca guarda: devuelve un borrador validado. El guardado real lo
 * hace `guardarBorrador` contra los endpoints existentes (createOperacion,
 * createEntrega, ...), sólo tras la confirmación del usuario.
 */

export type FlujoId = "operacion" | "entrega" | "producto" | "colaborador";

export interface FlujoInfo {
  id: FlujoId;
  etiqueta: string;
  icono: string;
  descripcion: string;
}

export const FLUJOS_DISPONIBLES: FlujoInfo[] = [
  {
    id: "operacion",
    etiqueta: "Registrar el día",
    icono: "edit_note",
    descripcion: "Ventas, producción y desperdicios de un turno.",
  },
  {
    id: "entrega",
    etiqueta: "Entrega a reciclador",
    icono: "recycling",
    descripcion: "Registra una entrega con evidencia para la trazabilidad.",
  },
  {
    id: "producto",
    etiqueta: "Producto del catálogo",
    icono: "inventory_2",
    descripcion: "Agrega un producto con su costo para calcular pérdidas.",
  },
  {
    id: "colaborador",
    etiqueta: "Colaborador",
    icono: "group",
    descripcion: "Registra personal y su capacitación.",
  },
];

export interface MensajeChat {
  rol: "user" | "assistant";
  contenido: string;
}

export interface CampoFaltante {
  clave: string;
  etiqueta: string;
}

export interface ResumenBorrador {
  titulo: string;
  lineas: string[];
}

export interface RespuestaAsistente {
  mensaje: string;
  borrador: Record<string, unknown>;
  borradorParaGuardar: Record<string, unknown>;
  camposFaltantes: CampoFaltante[];
  listoParaGuardar: boolean;
  resumen: ResumenBorrador;
  proveedor: string;
}

export function enviarMensajeAsistente(
  restauranteId: string,
  payload: { flujo: FlujoId; mensajes: MensajeChat[]; borrador?: Record<string, unknown> },
) {
  return post<RespuestaAsistente>(`/restaurantes/${restauranteId}/asistente`, payload);
}

/**
 * Persiste el borrador confirmado por el usuario usando el endpoint que
 * corresponde a cada flujo. Devuelve la ruta a la que conviene navegar después.
 */
export async function guardarBorrador(
  restauranteId: string,
  flujo: FlujoId,
  borrador: Record<string, unknown>,
): Promise<{ rutaSugerida: string }> {
  switch (flujo) {
    case "operacion": {
      const b = borrador as {
        fecha: string;
        turno: Turno;
        observaciones?: string;
        ventas?: VentaItem[];
        producciones?: ProduccionItem[];
        desperdicios?: ResiduoItem[];
      };
      await createOperacion(restauranteId, {
        fecha: b.fecha,
        turno: b.turno,
        ...(b.observaciones ? { observaciones: b.observaciones } : {}),
        ...(b.ventas ? { ventas: b.ventas } : {}),
        ...(b.producciones ? { producciones: b.producciones } : {}),
        ...(b.desperdicios ? { desperdicios: b.desperdicios } : {}),
      });
      return { rutaSugerida: "/history" };
    }
    case "entrega": {
      await createEntrega(restauranteId, borrador as unknown as EntregaItem);
      return { rutaSugerida: "/entregas" };
    }
    case "producto": {
      const b = borrador as { nombre: string; costoUnitario: number };
      await createProducto(restauranteId, b);
      return { rutaSugerida: "/catalogo" };
    }
    case "colaborador": {
      const b = borrador as {
        nombre: string;
        rol: RolColaborador;
        capacitado?: boolean;
      };
      await createColaborador(restauranteId, b);
      return { rutaSugerida: "/catalogo" };
    }
    default:
      throw new Error(`Flujo desconocido: ${flujo}`);
  }
}
