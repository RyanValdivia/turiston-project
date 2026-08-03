import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generarReporte } from "@/lib/reporte";
import { predecirVentas } from "@/lib/prediccion";
import {
  CategoriaResiduo,
  AreaProceso,
  MotivoGeneracion,
  Turno,
  DestinoPrevisto,
  RolColaborador,
  EstadoPrediccion,
} from "@/generated/prisma/enums";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  const email = "demo@circularaqp.pe";

  const existingUsuario = await db.usuario.findUnique({ where: { email } });
  if (existingUsuario) {
    console.log("Seed ya aplicado, borrando datos previos del restaurante demo...");
    await db.restaurante.delete({ where: { id: existingUsuario.restauranteId } });
  }

  const restaurante = await db.restaurante.create({
    data: {
      nombre: "El Buen Sabor AQP",
      ciudad: "Arequipa",
      lineaBaseSemanalKg: 45,
    },
  });

  const passwordHash = await hashPassword("demo1234");
  await db.usuario.create({
    data: {
      restauranteId: restaurante.id,
      nombre: "María Quispe",
      email,
      passwordHash,
    },
  });

  const [jefeCocina, almacen, limpieza] = await Promise.all([
    db.colaborador.create({
      data: { restauranteId: restaurante.id, nombre: "Carlos Mamani", rol: RolColaborador.JEFE_COCINA, capacitado: true },
    }),
    db.colaborador.create({
      data: { restauranteId: restaurante.id, nombre: "Luis Condori", rol: RolColaborador.ALMACEN, capacitado: false },
    }),
    db.colaborador.create({
      data: { restauranteId: restaurante.id, nombre: "Rosa Apaza", rol: RolColaborador.LIMPIEZA, capacitado: false },
    }),
  ]);
  const admin = await db.colaborador.create({
    data: { restauranteId: restaurante.id, nombre: "María Quispe", rol: RolColaborador.ADMINISTRADOR, capacitado: true },
  });

  const [arroz, pollo, aceite, papa] = await Promise.all([
    db.producto.create({ data: { restauranteId: restaurante.id, nombre: "Arroz", costoUnitario: 3.5 } }),
    db.producto.create({ data: { restauranteId: restaurante.id, nombre: "Pollo", costoUnitario: 12 } }),
    db.producto.create({ data: { restauranteId: restaurante.id, nombre: "Aceite de cocina", costoUnitario: 8 } }),
    db.producto.create({ data: { restauranteId: restaurante.id, nombre: "Papa", costoUnitario: 2 } }),
  ]);
  const productos = [arroz, pollo, aceite, papa];

  function costoDe(productoId: string | undefined, costoManual: number | undefined, cantidadKg: number): number | null {
    if (productoId) {
      const producto = productos.find((p) => p.id === productoId);
      if (producto) return producto.costoUnitario * cantidadKg;
    }
    if (costoManual != null) return costoManual;
    return null;
  }

  type ResiduoSeed = {
    categoria: CategoriaResiduo;
    cantidadKg: number;
    area: AreaProceso;
    productoAsociado: string;
    productoId?: string;
    motivo: MotivoGeneracion;
    turno: Turno;
    destinoPrevisto: DestinoPrevisto;
    costoManual?: number;
    dias: number;
    colaboradorId?: string;
  };

  const residuosSeed: ResiduoSeed[] = [
    { categoria: CategoriaResiduo.SOBREPRODUCCION, cantidadKg: 4, area: AreaProceso.COCINA, productoAsociado: "Arroz con pollo", productoId: arroz.id, motivo: MotivoGeneracion.SOBREPRODUCCION, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, dias: 2, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.SOBREPRODUCCION, cantidadKg: 3.5, area: AreaProceso.COCINA, productoAsociado: "Lomo saltado", productoId: pollo.id, motivo: MotivoGeneracion.SOBREPRODUCCION, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, dias: 5, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.SOBREPRODUCCION, cantidadKg: 3, area: AreaProceso.COCINA, productoAsociado: "Papa a la huancaína", productoId: papa.id, motivo: MotivoGeneracion.EXCESO_COMPRA, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, dias: 9, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.PRODUCTO_DETERIORADO, cantidadKg: 5, area: AreaProceso.ALMACEN, productoAsociado: "Papa", productoId: papa.id, motivo: MotivoGeneracion.EXCESO_COMPRA, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 3, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.PRODUCTO_DETERIORADO, cantidadKg: 3, area: AreaProceso.ALMACEN, productoAsociado: "Arroz", productoId: arroz.id, motivo: MotivoGeneracion.EXCESO_COMPRA, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 12, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.ALIMENTO_NO_VENDIDO, cantidadKg: 2.5, area: AreaProceso.COCINA, productoAsociado: "Menú del día", motivo: MotivoGeneracion.EXCESO_COMPRA, turno: Turno.NOCHE, destinoPrevisto: DestinoPrevisto.DONACION, costoManual: 25, dias: 6, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.PRODUCTO_DETERIORADO, cantidadKg: 2, area: AreaProceso.ALMACEN, productoAsociado: "Pollo", productoId: pollo.id, motivo: MotivoGeneracion.PRODUCTO_VENCIDO, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 15, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.PRODUCTO_DETERIORADO, cantidadKg: 1.5, area: AreaProceso.ALMACEN, productoAsociado: "Aceite de cocina", productoId: aceite.id, motivo: MotivoGeneracion.PRODUCTO_VENCIDO, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 20, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.RESTOS_CLIENTE, cantidadKg: 3, area: AreaProceso.SALON, productoAsociado: "Platos variados", motivo: MotivoGeneracion.ERROR_PORCION, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, costoManual: 15, dias: 1, colaboradorId: admin.id },
    { categoria: CategoriaResiduo.RESTOS_CLIENTE, cantidadKg: 2.5, area: AreaProceso.SALON, productoAsociado: "Platos variados", motivo: MotivoGeneracion.DEVOLUCION_CLIENTE, turno: Turno.NOCHE, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, costoManual: 12, dias: 4, colaboradorId: admin.id },
    { categoria: CategoriaResiduo.ALIMENTO_NO_VENDIDO, cantidadKg: 3, area: AreaProceso.COCINA, productoAsociado: "Postre del día", motivo: MotivoGeneracion.SOBREPRODUCCION, turno: Turno.NOCHE, destinoPrevisto: DestinoPrevisto.DONACION, costoManual: 20, dias: 8, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.CARTON, cantidadKg: 6, area: AreaProceso.ALMACEN, productoAsociado: "Cajas de insumos", motivo: MotivoGeneracion.OTRO, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.VALORIZACION_RECICLADOR, dias: 7, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.VIDRIO, cantidadKg: 4, area: AreaProceso.BARRA, productoAsociado: "Botellas", motivo: MotivoGeneracion.OTRO, turno: Turno.NOCHE, destinoPrevisto: DestinoPrevisto.VALORIZACION_RECICLADOR, dias: 10, colaboradorId: admin.id },
    { categoria: CategoriaResiduo.PLASTICO, cantidadKg: 2.5, area: AreaProceso.ALMACEN, productoAsociado: "Envases", motivo: MotivoGeneracion.OTRO, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.VALORIZACION_RECICLADOR, dias: 14, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.ACEITE_USADO, cantidadKg: 5, area: AreaProceso.COCINA, productoAsociado: "Aceite de frituras", productoId: aceite.id, motivo: MotivoGeneracion.OTRO, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.VALORIZACION_RECICLADOR, dias: 11, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.PRODUCTO_DETERIORADO, cantidadKg: 2, area: AreaProceso.ALMACEN, productoAsociado: "Papa", productoId: papa.id, motivo: MotivoGeneracion.MAL_ALMACENAMIENTO, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 17, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.MERMA_PREPARACION, cantidadKg: 1.5, area: AreaProceso.ALMACEN, productoAsociado: "Verduras", motivo: MotivoGeneracion.MAL_ALMACENAMIENTO, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, costoManual: 8, dias: 19, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.MERMA_PREPARACION, cantidadKg: 3, area: AreaProceso.COCINA, productoAsociado: "Cortes de pollo", productoId: pollo.id, motivo: MotivoGeneracion.ERROR_PREPARACION, turno: Turno.MANANA, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, dias: 2, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.MERMA_PREPARACION, cantidadKg: 2, area: AreaProceso.COCINA, productoAsociado: "Cebolla y ajo", motivo: MotivoGeneracion.ERROR_PREPARACION, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.COMPOSTAJE, costoManual: 6, dias: 6, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.NO_APROVECHABLE, cantidadKg: 2, area: AreaProceso.LIMPIEZA, productoAsociado: "Barrido general", motivo: MotivoGeneracion.OTRO, turno: Turno.NOCHE, destinoPrevisto: DestinoPrevisto.RELLENO_SANITARIO, dias: 3, colaboradorId: limpieza.id },
    { categoria: CategoriaResiduo.NO_APROVECHABLE, cantidadKg: 1.5, area: AreaProceso.LIMPIEZA, productoAsociado: "Empaques varios", motivo: MotivoGeneracion.OTRO, turno: Turno.TARDE, destinoPrevisto: DestinoPrevisto.PENDIENTE_DEFINIR, dias: 13, colaboradorId: limpieza.id },
  ];

  for (const r of residuosSeed) {
    await db.residuo.create({
      data: {
        restauranteId: restaurante.id,
        colaboradorId: r.colaboradorId,
        categoria: r.categoria,
        cantidadKg: r.cantidadKg,
        area: r.area,
        productoAsociado: r.productoAsociado,
        productoId: r.productoId,
        motivo: r.motivo,
        fecha: daysAgo(r.dias),
        turno: r.turno,
        destinoPrevisto: r.destinoPrevisto,
        costoManual: r.costoManual,
        costoTotal: costoDe(r.productoId, r.costoManual, r.cantidadKg),
      },
    });
  }

  // Un par de registros unificados (pantalla "Registro de Operación") con ventas + producción + desperdicio anidados.
  await db.registroOperacion.create({
    data: {
      restauranteId: restaurante.id,
      colaboradorId: jefeCocina.id,
      fecha: daysAgo(2),
      turno: Turno.MANANA,
      observaciones: "Turno mañana regular",
      ventas: {
        create: [
          { restauranteId: restaurante.id, concepto: "Menú ejecutivo", cantidad: 40, montoTotal: 600 },
          { restauranteId: restaurante.id, concepto: "Bebidas", cantidad: 60, montoTotal: 180 },
        ],
      },
      producciones: {
        create: [
          { restauranteId: restaurante.id, productoAsociado: "Arroz con pollo", cantidadProducida: 25, unidad: "kg" },
          { restauranteId: restaurante.id, productoAsociado: "Ensalada", cantidadProducida: 8, unidad: "kg" },
        ],
      },
      residuos: {
        create: [
          {
            restauranteId: restaurante.id,
            categoria: CategoriaResiduo.MERMA_PREPARACION,
            cantidadKg: 1.2,
            area: AreaProceso.COCINA,
            productoAsociado: "Recortes de pollo",
            productoId: pollo.id,
            motivo: MotivoGeneracion.ERROR_PREPARACION,
            fecha: daysAgo(2),
            turno: Turno.MANANA,
            destinoPrevisto: DestinoPrevisto.COMPOSTAJE,
            costoTotal: costoDe(pollo.id, undefined, 1.2),
          },
        ],
      },
    },
  });

  await db.registroOperacion.create({
    data: {
      restauranteId: restaurante.id,
      colaboradorId: almacen.id,
      fecha: daysAgo(5),
      turno: Turno.NOCHE,
      observaciones: "Turno noche fin de semana",
      ventas: {
        create: [{ restauranteId: restaurante.id, concepto: "Parrilla familiar", cantidad: 10, montoTotal: 350 }],
      },
      producciones: {
        create: [{ restauranteId: restaurante.id, productoAsociado: "Papas fritas", cantidadProducida: 12, unidad: "kg" }],
      },
      residuos: {
        create: [
          {
            restauranteId: restaurante.id,
            categoria: CategoriaResiduo.ALIMENTO_NO_VENDIDO,
            cantidadKg: 2,
            area: AreaProceso.COCINA,
            productoAsociado: "Postre del día",
            motivo: MotivoGeneracion.SOBREPRODUCCION,
            fecha: daysAgo(5),
            turno: Turno.NOCHE,
            destinoPrevisto: DestinoPrevisto.DONACION,
            costoManual: 18,
            costoTotal: 18,
          },
        ],
      },
    },
  });

  const entregasSeed = [
    { categoria: CategoriaResiduo.CARTON, pesoKg: 5.5, receptor: "Recicladora Arequipa Verde", fotografiaUrl: "https://example.com/evidencia/carton1.jpg", constanciaUrl: "https://example.com/evidencia/carton1.pdf", dias: 6, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.ACEITE_USADO, pesoKg: 4, receptor: "BioAceites AQP", fotografiaUrl: "https://example.com/evidencia/aceite1.jpg", constanciaUrl: "https://example.com/evidencia/aceite1.pdf", dias: 10, colaboradorId: jefeCocina.id },
    { categoria: CategoriaResiduo.VIDRIO, pesoKg: 1, receptor: "Recicladora Arequipa Verde", fotografiaUrl: undefined, constanciaUrl: undefined, dias: 9, colaboradorId: admin.id },
    { categoria: CategoriaResiduo.CARTON, pesoKg: 2, receptor: "Recicladora Arequipa Verde", fotografiaUrl: "https://example.com/evidencia/carton2.jpg", constanciaUrl: undefined, dias: 1, colaboradorId: almacen.id },
    { categoria: CategoriaResiduo.ACEITE_USADO, pesoKg: 1.5, receptor: "BioAceites AQP", fotografiaUrl: undefined, constanciaUrl: undefined, dias: 20, colaboradorId: jefeCocina.id },
  ];

  for (const e of entregasSeed) {
    await db.entrega.create({
      data: {
        restauranteId: restaurante.id,
        colaboradorId: e.colaboradorId,
        categoria: e.categoria,
        pesoKg: e.pesoKg,
        fecha: daysAgo(e.dias),
        receptor: e.receptor,
        fotografiaUrl: e.fotografiaUrl,
        constanciaUrl: e.constanciaUrl,
      },
    });
  }

  await db.accionAplicada.createMany({
    data: [
      { restauranteId: restaurante.id, recomendacionCodigo: "R1_AJUSTAR_COMPRAS", descripcion: "Se redujo la producción inicial de arroz con pollo en el turno mañana.", fecha: daysAgo(4) },
      { restauranteId: restaurante.id, recomendacionCodigo: "R7_CAPACITAR_INVENTARIO", descripcion: "Capacitación al personal de almacén en rotación FIFO.", fecha: daysAgo(10) },
    ],
  });

  // Historial de ventas "limpio" para poder entrenar el modelo predictivo de
  // verdad (mismo criterio del script original: 10 platos, 01/01/2026-31/07/2026,
  // venta base mayor en fin de semana, con jitter aleatorio).
  const platosMenu = [
    "Lomo Saltado", "Ceviche", "Aji de Gallina", "Causa Rellena",
    "Arroz con Pollo", "Tallarines Verdes", "Papa a la Huancaina",
    "Anticuchos", "Rocoto Relleno", "Chupe de Camarones",
  ];
  const precioBase: Record<string, number> = {
    "Lomo Saltado": 28, "Ceviche": 32, "Aji de Gallina": 24, "Causa Rellena": 20,
    "Arroz con Pollo": 22, "Tallarines Verdes": 25, "Papa a la Huancaina": 15,
    "Anticuchos": 26, "Rocoto Relleno": 18, "Chupe de Camarones": 34,
  };

  function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const fechaFinHistorial = new Date(2026, 6, 31);
  for (
    let fecha = new Date(2026, 0, 1);
    fecha <= fechaFinHistorial;
    fecha.setDate(fecha.getDate() + 1)
  ) {
    const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;

    await db.registroOperacion.create({
      data: {
        restauranteId: restaurante.id,
        fecha: new Date(fecha),
        turno: Turno.TARDE,
        observaciones: "Historial de ventas (backfill para entrenar el modelo predictivo)",
        ventas: {
          create: platosMenu.map((nombre) => {
            const base = esFinde ? randInt(40, 90) : randInt(10, 45);
            const cantidad = Math.max(0, base + randInt(-5, 10));
            return {
              restauranteId: restaurante.id,
              concepto: nombre,
              cantidad,
              montoTotal: cantidad * precioBase[nombre],
            };
          }),
        },
      },
    });
  }
  console.log("Historial de ventas sembrado (01/01/2026-31/07/2026, 10 platos/día).");

  // Reporte persistido de ejemplo (pantalla "Reportes").
  const reportePeriodoTo = new Date();
  const reportePeriodoFrom = daysAgo(30);
  const { resumen, csv } = await generarReporte(restaurante.id, reportePeriodoFrom, reportePeriodoTo);
  await db.reporte.create({
    data: {
      restauranteId: restaurante.id,
      periodoFrom: reportePeriodoFrom,
      periodoTo: reportePeriodoTo,
      resumenJson: JSON.stringify(resumen),
      csv,
    },
  });

  // Predicción de ejemplo (pantalla "Premium Predict") — modelo real (RandomForest,
  // ver predictor/), entrenado con el historial de ventas recién sembrado.
  try {
    const fechaObjetivoPrediccion = new Date(2026, 7, 1); // día siguiente al historial sembrado
    const { entreno, predicciones } = await predecirVentas(restaurante.id, fechaObjetivoPrediccion);
    await db.prediccion.create({
      data: {
        restauranteId: restaurante.id,
        tipo: "ventas_por_plato",
        datosEntradaJson: JSON.stringify({ fechaObjetivo: "2026-08-01" }),
        resultadoJson: JSON.stringify({
          predicciones,
          metrics: entreno.metrics,
          entrenadoEn: entreno.entrenadoEn,
        }),
        estado: EstadoPrediccion.COMPLETADA,
        completadaEn: new Date(),
      },
    });
    console.log(
      `Modelo predictivo entrenado (${entreno.filasUsadas} filas, precisión ~${entreno.metrics.precisionPct}%).`
    );
  } catch (err) {
    console.warn(
      "No se pudo entrenar/predecir en el seed (revisa que Python + predictor/requirements.txt estén instalados):",
      err
    );
  }

  console.log(`Seed completo. Login: ${email} / demo1234 (restauranteId: ${restaurante.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
