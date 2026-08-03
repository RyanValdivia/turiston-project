-- CreateTable
CREATE TABLE "Restaurante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL DEFAULT 'Arequipa',
    "lineaBaseSemanalKg" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "capacitado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Colaborador_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costoUnitario" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Producto_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroOperacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "fecha" DATETIME NOT NULL,
    "turno" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegistroOperacion_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegistroOperacion_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "registroOperacionId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "montoTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Venta_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Venta_registroOperacionId_fkey" FOREIGN KEY ("registroOperacionId") REFERENCES "RegistroOperacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "registroOperacionId" TEXT NOT NULL,
    "productoAsociado" TEXT NOT NULL,
    "cantidadProducida" REAL NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'kg',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Produccion_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Produccion_registroOperacionId_fkey" FOREIGN KEY ("registroOperacionId") REFERENCES "RegistroOperacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Residuo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "registroOperacionId" TEXT,
    "categoria" TEXT NOT NULL,
    "cantidadKg" REAL NOT NULL,
    "area" TEXT NOT NULL,
    "areaDetalle" TEXT,
    "productoAsociado" TEXT NOT NULL,
    "productoId" TEXT,
    "motivo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "turno" TEXT NOT NULL,
    "destinoPrevisto" TEXT NOT NULL,
    "costoManual" REAL,
    "costoTotal" REAL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Residuo_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Residuo_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Residuo_registroOperacionId_fkey" FOREIGN KEY ("registroOperacionId") REFERENCES "RegistroOperacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Residuo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "categoria" TEXT NOT NULL,
    "pesoKg" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "receptor" TEXT NOT NULL,
    "fotografiaUrl" TEXT,
    "constanciaUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entrega_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Entrega_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccionAplicada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "recomendacionCodigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    CONSTRAINT "AccionAplicada_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "periodoFrom" DATETIME NOT NULL,
    "periodoTo" DATETIME NOT NULL,
    "resumenJson" TEXT NOT NULL,
    "csv" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reporte_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prediccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restauranteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "horizonteDias" INTEGER,
    "datosEntradaJson" TEXT NOT NULL,
    "resultadoJson" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadaEn" DATETIME,
    CONSTRAINT "Prediccion_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_restauranteId_key" ON "Usuario"("restauranteId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_resetToken_key" ON "Usuario"("resetToken");

-- CreateIndex
CREATE INDEX "Colaborador_restauranteId_idx" ON "Colaborador"("restauranteId");

-- CreateIndex
CREATE INDEX "Producto_restauranteId_idx" ON "Producto"("restauranteId");

-- CreateIndex
CREATE INDEX "RegistroOperacion_restauranteId_idx" ON "RegistroOperacion"("restauranteId");

-- CreateIndex
CREATE INDEX "RegistroOperacion_restauranteId_fecha_idx" ON "RegistroOperacion"("restauranteId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroOperacion_restauranteId_fecha_turno_key" ON "RegistroOperacion"("restauranteId", "fecha", "turno");

-- CreateIndex
CREATE INDEX "Venta_restauranteId_idx" ON "Venta"("restauranteId");

-- CreateIndex
CREATE INDEX "Venta_registroOperacionId_idx" ON "Venta"("registroOperacionId");

-- CreateIndex
CREATE INDEX "Produccion_restauranteId_idx" ON "Produccion"("restauranteId");

-- CreateIndex
CREATE INDEX "Produccion_registroOperacionId_idx" ON "Produccion"("registroOperacionId");

-- CreateIndex
CREATE INDEX "Residuo_restauranteId_idx" ON "Residuo"("restauranteId");

-- CreateIndex
CREATE INDEX "Residuo_restauranteId_fecha_idx" ON "Residuo"("restauranteId", "fecha");

-- CreateIndex
CREATE INDEX "Residuo_registroOperacionId_idx" ON "Residuo"("registroOperacionId");

-- CreateIndex
CREATE INDEX "Entrega_restauranteId_idx" ON "Entrega"("restauranteId");

-- CreateIndex
CREATE INDEX "Entrega_restauranteId_fecha_idx" ON "Entrega"("restauranteId", "fecha");

-- CreateIndex
CREATE INDEX "AccionAplicada_restauranteId_idx" ON "AccionAplicada"("restauranteId");

-- CreateIndex
CREATE INDEX "Reporte_restauranteId_idx" ON "Reporte"("restauranteId");

-- CreateIndex
CREATE INDEX "Prediccion_restauranteId_idx" ON "Prediccion"("restauranteId");
