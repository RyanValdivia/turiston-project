<p align="center">
  <strong style="font-size:2rem">🍽️ restora</strong><br/>
  <em>Gestión inteligente de residuos para restaurantes turísticos de Arequipa</em>
</p>

---

## 📌 Descripción

**restora** es una plataforma web que transforma registros simples de residuos en información de costos, recomendaciones operativas y evidencia de valorización para restaurantes turísticos de Arequipa. Incluye un **asistente conversacional con IA** (Gemini / Groq / modo guiado) que permite completar registros en menos de un minuto hablando en lenguaje natural.

Proyecto desarrollado para el reto **TURISTÓN 2026**.

---

## 🧩 Problema

> **5 Whys (Lienzo 5):**
> Los administradores de restaurantes turísticos de Arequipa no saben qué residuo genera la mayor pérdida económica, ni tienen tiempo para registrar datos de desperdicio en medio de la operación diaria.

> **HMW:** ¿Cómo podríamos facilitar que un administrador registre desperdicios, identifique pérdidas y reciba recomendaciones sin necesitar un sistema complejo ni más de un minuto por registro?

---

## 🎯 Objetivos

1. **Registro de ≤1 minuto** — Asistente conversacional que recopila datos hablando con el usuario y prellena los formularios.
2. **Cálculo de pérdida económica real** — Conversión automática kg → S/ usando costos unitarios del catálogo de productos.
3. **Trazabilidad con evidencia** — Registro de entregas a recicladores con receptor, fotografía y constancia.
4. **Recomendaciones automáticas** — Motor de reglas (R1–R10) que identifica oportunidades de mejora.
5. **Predicción de ventas** — Modelo RandomForest que estima la demanda por plato para reducir sobreproducción.

---

## ✨ Funcionalidades

### Implementadas ✅

| Módulo | Descripción |
|--------|-------------|
| **Asistente IA** | Chat conversacional con cascada Gemini → Groq → modo guiado determinista. Nunca se rompe. |
| **Registro de operaciones** | Formulario multi-ítem: varias ventas + varios desperdicios en un solo registro de turno. |
| **Dashboard** | Panel con KPIs del día: pérdida económica, kg generados, prevención, tendencia semanal. |
| **Análisis y recomendaciones** | 6 indicadores del PDF + motor R1–R10 con posibilidad de registrar acciones aplicadas. |
| **Entregas / Trazabilidad** | Alta de entregas a recicladores con receptor, evidencia fotográfica y constancia. |
| **Catálogo** | Gestión de productos con costo unitario + personal con marca de capacitación. |
| **Reportes** | Generación y descarga de reportes en CSV con resumen JSON persistido. |
| **Predicción IA** | Modelo RandomForest (scikit-learn) entrenado con historial de ventas por plato. |
| **Autenticación** | JWT en cookie httpOnly, aislamiento multi-tenant por `restauranteId`. |
| **Historial** | Listado de registros de operación anteriores con detalle de ventas y desperdicios. |
| **Perfil** | Información del restaurante y datos del usuario. |

### Pendientes / Roadmap 🚧

| Funcionalidad | Estado |
|---------------|--------|
| Integración con POS (punto de venta) | Planificado |
| Integración con balanza digital | Planificado |
| Marketplace de subproductos valorizables | Planificado |
| Notificaciones push por umbrales de desperdicio | Planificado |
| Export PDF de reportes | Planificado |

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                      NAVEGADOR                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Frontend (Vite + TanStack Start + React)          │  │
│  │  Puerto :8080                                      │  │
│  │  • Rutas: dashboard, register, entregas, analytics │  │
│  │  • Asistente Widget (chat flotante global)         │  │
│  │  • Proxy /api → :3000                              │  │
│  └──────────────┬─────────────────────────────────────┘  │
└─────────────────┼────────────────────────────────────────┘
                  │ fetch /api/*
┌─────────────────▼────────────────────────────────────────┐
│  Backend (Next.js 16 — API only)                         │
│  Puerto :3000                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  src/app/api/                                      │  │
│  │  • auth (login, register, session, logout)         │  │
│  │  • restaurantes/[id]/ (CRUD completo)              │  │
│  │  • restaurantes/[id]/asistente (POST)              │  │
│  └──────────────┬─────────────────────────────────────┘  │
│  ┌──────────────▼─────────────────────────────────────┐  │
│  │  src/lib/                                          │  │
│  │  • ai/: provider, flujos, contexto, prompt,        │  │
│  │         dialogo (fallback determinista)             │  │
│  │  • estadisticas, recomendaciones, costo, reporte   │  │
│  │  • prediccion → pythonBridge → predictor/          │  │
│  │  • validation/ (schemas Zod)                       │  │
│  └──────────────┬─────────────────────────────────────┘  │
│  ┌──────────────▼─────────────────────────────────────┐  │
│  │  Prisma 7 + SQLite (better-sqlite3)                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                  │ spawn
┌─────────────────▼────────────────────────────────────────┐
│  Predictor (Python / scikit-learn)                        │
│  • train.py — entrena RandomForest con historial         │
│  • predict.py — predice demanda por plato                │
│  ⚠️ Directorio INTOCABLE (requisito del reto)            │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TanStack Start/Router/Query, Vite 8, Tailwind CSS 4, Recharts, Material Symbols |
| Backend | Next.js 16 (App Router, API routes), Zod 4, jose (JWT) |
| Base de datos | SQLite vía Prisma 7 + better-sqlite3 |
| IA — Chat | Google Gemini (`gemini-2.5-flash`), Groq (`llama-3.3-70b-versatile`), fallback determinista |
| IA — Predicción | Python 3, scikit-learn (RandomForest), joblib |
| Lenguaje | TypeScript 5 (frontend + backend), Python 3 (predictor) |

---

## 📋 Requisitos previos

- **Node.js** ≥ 20 (recomendado: 22 LTS)
- **npm** ≥ 10
- **Python 3** ≥ 3.10 (solo para el módulo de predicciones)
  - Paquetes: `pip install -r predictor/requirements.txt`

---

## ⚡ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/RyanValdivia/turiston-project.git
cd turiston-project

# 2. Instalar dependencias del backend
npm install

# 3. Instalar dependencias del frontend
cd frontend && npm install && cd ..

# 4. (Opcional) Instalar dependencias de Python para predicciones
pip install -r predictor/requirements.txt
```

---

## ⚙️ Configuración

Copia el archivo de ejemplo y edita con tus valores:

```bash
cp .env.example .env
```

Variables clave en `.env`:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Ruta a la base SQLite | ✅ (default: `file:./dev.db`) |
| `AUTH_SECRET` | Secreto para firmar JWTs | ✅ |
| `GEMINI_API_KEY` | API key de Google Gemini | ❌ (el asistente funciona sin ella) |
| `GEMINI_MODEL` | Modelo Gemini a usar | ❌ (default: `gemini-2.5-flash`) |
| `GROQ_API_KEY` | API key de Groq (respaldo) | ❌ |
| `GROQ_MODEL` | Modelo Groq a usar | ❌ (default: `llama-3.3-70b-versatile`) |
| `ASISTENTE_HABILITADO` | `"true"` / `"false"` | ❌ (default: `true`) |
| `PYTHON_BIN` | Ejecutable de Python | ❌ (default: `python`) |

> 💡 El asistente funciona **sin API keys**: si Gemini y Groq no están disponibles, cae automáticamente al **modo guiado determinista**.

---

## 🚀 Ejecución

### Desarrollo (dos terminales)

```bash
# Terminal 1 — Backend (API, :3000)
npx prisma generate
npx prisma migrate dev
npx prisma db seed        # Carga datos de demostración
npm run dev

# Terminal 2 — Frontend (UI, :8080)
cd frontend
npm run dev
```

Abre **http://localhost:8080** en el navegador.

### Credenciales de demostración

| Campo | Valor |
|-------|-------|
| Email | `demo@circularaqp.pe` |
| Contraseña | `demo1234` |
| Restaurante | El Buen Sabor AQP |

---

## 📂 Estructura de carpetas

```
turiston-project/
├── src/                          # Backend (Next.js 16)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/             # Login, register, session, logout
│   │   │   ├── health/           # Health check
│   │   │   └── restaurantes/[id]/
│   │   │       ├── asistente/    # POST — Asistente conversacional IA
│   │   │       ├── acciones/     # CRUD acciones aplicadas
│   │   │       ├── colaboradores/# CRUD personal
│   │   │       ├── dashboard/    # KPIs agregados
│   │   │       ├── entregas/     # CRUD entregas/trazabilidad
│   │   │       ├── indicadores/  # 6 indicadores del PDF
│   │   │       ├── operaciones/  # CRUD registros de operación
│   │   │       ├── predicciones/ # Entrenamiento + predicción (Python)
│   │   │       ├── productos/    # CRUD productos con costo
│   │   │       ├── recomendaciones/ # Motor de reglas R1–R10
│   │   │       ├── reportes/     # Generación y listado
│   │   │       ├── residuos/     # CRUD residuos
│   │   │       └── tendencias/   # Tendencia semanal
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── ai/                   # Capa de IA del asistente
│   │   │   ├── provider.ts       # Cascada Gemini → Groq → null
│   │   │   ├── flujos.ts         # Definición de flujos conversacionales
│   │   │   ├── contexto.ts       # Contexto del tenant para el prompt
│   │   │   ├── prompt.ts         # System prompt en español
│   │   │   └── dialogo.ts        # Motor determinista (fallback)
│   │   ├── validation/           # Schemas Zod compartidos
│   │   ├── estadisticas.ts       # KPIs del PDF
│   │   ├── recomendaciones.ts    # Motor R1–R10
│   │   ├── costo.ts              # Conversión kg → S/
│   │   ├── prediccion.ts         # Bridge al predictor Python
│   │   └── ...
│   └── generated/prisma/         # Cliente Prisma generado
├── frontend/                     # Frontend (Vite + TanStack)
│   ├── src/
│   │   ├── routes/               # Páginas de la app
│   │   │   ├── dashboard.tsx     # Panel principal
│   │   │   ├── register.tsx      # Registro multi-ítem
│   │   │   ├── entregas.tsx      # Trazabilidad
│   │   │   ├── catalogo.tsx      # Productos + personal
│   │   │   ├── analytics.tsx     # Indicadores + recomendaciones
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── asistente/        # Widget del chat IA
│   │   │   └── AppShell.tsx      # Layout con navegación
│   │   ├── hooks/
│   │   │   └── useAsistente.ts   # Estado del chat
│   │   └── lib/
│   │       ├── api.ts            # Cliente HTTP tipado
│   │       ├── asistente.ts      # Tipos + flujos del asistente
│   │       └── etiquetas.ts      # Enums en español
│   └── vite.config.ts
├── prisma/
│   ├── schema.prisma             # Modelo de datos (14 tablas)
│   ├── migrations/               # Migraciones SQLite
│   └── seed.ts                   # Datos de demostración
├── predictor/                    # ⚠️ INTOCABLE — Modelo ML
│   ├── train.py
│   ├── predict.py
│   └── requirements.txt
├── .env.example
└── README.md                     # Este archivo
```

---

## 🔄 Flujo de funcionamiento

### Asistente conversacional

```
Usuario abre el widget → Elige flujo (ej. "Operación del turno")
  → Escribe en lenguaje natural: "ayer en la noche vendimos 40 lomo
     saltado y 25 ceviche, botamos 3 kg de arroz por sobreproducción"
  → Backend:
      1. requireSession() — verifica autenticación
      2. Obtiene contexto del restaurante (productos, platos, colaboradores)
      3. Intenta Gemini → si falla, Groq → si falla, modo guiado
      4. Valida la salida con el schema Zod del flujo
      5. Devuelve borrador + campos faltantes + resumen
  → Widget muestra borrador editable
  → Si faltan campos, el asistente pregunta
  → Cuando está completo: resumen + Confirmar / Editar / Cancelar
  → Al confirmar: llama a POST /api/restaurantes/:id/operaciones (endpoint existente)
  → Redirige al historial
```

### Registro manual (formulario)

```
Usuario abre /register → Selecciona fecha, turno
  → Añade ventas (concepto + cantidad + monto) — multi-ítem con "+"
  → Añade desperdicios (producto, categoría, kg, motivo, área, destino) — multi-ítem
  → Envía → POST /api/restaurantes/:id/operaciones
  → Redirige al historial
```

---

## 📸 Capturas de pantalla

> _Espacio reservado para capturas de la aplicación en funcionamiento._

<!-- TODO: Agregar capturas del dashboard, asistente, analytics, entregas -->

---

## 🗺️ Roadmap

Basado en el cuadrante _How_ del Lienzo 7 (PDF TURISTÓN):

| Fase | Funcionalidad | Impacto |
|------|---------------|---------|
| **Now** | ✅ Registro inteligente + cálculo de costos + recomendaciones | Alto |
| **Next** | Integración con POS para captura automática de ventas | Alto |
| **Next** | Balanza digital para pesaje automático de residuos | Medio |
| **Later** | Marketplace de subproductos valorizables | Medio |
| **Later** | Dashboard comparativo entre restaurantes (benchmarking) | Bajo |

---

## 🔮 Mejoras futuras

- **Streaming del asistente** — respuesta del chat en tiempo real (SSE).
- **Voz a texto** — registro hablado usando Web Speech API.
- **OCR de tickets** — escaneo de comprobantes de compra para calcular costos automáticamente.
- **Alertas por WhatsApp** — notificaciones cuando el desperdicio supera umbrales.
- **Multi-idioma** — soporte para inglés/quechua además de español.
- **PWA** — instalable en móvil con funcionalidad offline.

---

## 👥 Créditos

Proyecto desarrollado para el reto **TURISTÓN 2026** — Arequipa, Perú.

| Rol | Nombre |
|-----|--------|
| Desarrollo | Equipo restora |

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
