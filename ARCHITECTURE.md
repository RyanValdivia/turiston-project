# RESTORA / CircularAQP — Arquitectura del sistema

Monorepo con tres piezas: un frontend TanStack Start que habla con una API REST en Next.js
por un proxy de desarrollo, persistencia en SQLite vía Prisma, y un modelo de predicción de
demanda en Python invocado como subproceso desde Node.

**Stack**: Next.js 16 (App Router) · TanStack Start + React Query · Prisma 7 + SQLite · Python / scikit-learn (RandomForest) · Sesión JWT en cookie httpOnly.

## Componentes y flujo de datos

```mermaid
flowchart TB
    User(("Usuario<br/>del restaurante"))

    subgraph FE["FRONTEND — RESTORA · TanStack Start · :8080"]
        Routes["9 rutas<br/>auth · register · dashboard · history<br/>analytics · reports · predict · profile · index"]
        ApiClient["lib/api.ts<br/>cliente fetch tipado"]
        Sess["lib/session.ts<br/>useSession() + requireSession()<br/>rutas protegidas con ssr:false"]
    end

    Proxy{{"Vite dev proxy<br/>/api/* → localhost:3000"}}

    subgraph BE["BACKEND — Next.js 16 App Router · :3000"]
        AuthR["/api/auth/*<br/>register · login · logout<br/>forgot-password · reset-password · me"]
        Guard["lib/auth.ts<br/>requireSession() en cada handler"]
        RestoR["/api/restaurantes/[id]/*<br/>operaciones · colaboradores · productos<br/>indicadores · recomendaciones · tendencias<br/>dashboard · reportes · predicciones"]
        Logic["lib/estadisticas.ts<br/>lib/recomendaciones.ts<br/>lib/reporte.ts"]
    end

    subgraph Data["PERSISTENCIA"]
        Prisma["Prisma 7<br/>driver adapter"]
        DB[("SQLite<br/>dev.db")]
    end

    subgraph ML["PREDICCIÓN DE DEMANDA · subproceso Python"]
        Bridge["lib/pythonBridge.ts<br/>spawn · JSON por stdin/stdout"]
        Train["predictor/train.py<br/>RandomForest + GridSearchCV"]
        Pred["predictor/predict.py"]
        Model[("modelo .joblib<br/>por restaurante")]
    end

    User --> Routes
    Routes --> ApiClient
    Routes --> Sess
    ApiClient -->|"fetch · credentials: include"| Proxy
    Proxy --> AuthR
    Proxy --> RestoR
    AuthR --> Guard
    RestoR --> Guard
    Guard --> Prisma
    RestoR --> Logic
    Logic --> Prisma
    RestoR --> Bridge
    Bridge -.->|spawn| Train
    Bridge -.->|spawn| Pred
    Train --> Model
    Model --> Pred
    Prisma --> DB

    classDef fe fill:#fdeef1,stroke:#7a1f3d,stroke-width:1.5px,color:#1f1b17;
    classDef be fill:#fff8f5,stroke:#8a7478,stroke-width:1.5px,color:#1f1b17;
    classDef data fill:#eaf5ec,stroke:#2f5b3d,stroke-width:1.5px,color:#1f1b17;
    classDef ml fill:#fdf3de,stroke:#a5760a,stroke-width:1.5px,color:#1f1b17;
    classDef actor fill:#ffffff,stroke:#1f1b17,stroke-width:1.5px,color:#1f1b17;

    class Routes,ApiClient,Sess fe;
    class AuthR,Guard,RestoR,Logic be;
    class Prisma,DB data;
    class Bridge,Train,Pred,Model ml;
    class User actor;
```

**Leyenda**: rosa = frontend · crema = backend/API · verde = persistencia · dorado = modelo predictivo. Línea sólida = llamada HTTP/JSON · línea punteada = `spawn` de subproceso.

## Ciclo de una petición protegida

1. El navegador llama `fetch("/api/...")` con `credentials: include` desde `lib/api.ts`.
2. El proxy de Vite reenvía todo `/api/*` a `localhost:3000` — mismo origen para el navegador, así la cookie de sesión viaja sin fricción de CORS.
3. El route handler llama `requireSession(request, restauranteId)`: valida el JWT y que la sesión pertenece a ese restaurante.
4. La lógica de negocio corre — Prisma para datos, o `pythonBridge.ts` si la ruta es de predicciones.
5. La respuesta JSON vuelve por el mismo camino; React Query cachea y re-renderiza.

## Estructura del repositorio

```
turiston-project/              # backend Next.js (raíz)
├── src/app/api/                rutas REST
├── src/lib/                    sesión, reglas, cliente Python
├── prisma/                     schema + seed
├── predictor/                  train.py · predict.py · common.py
│   └── models/                 *.joblib por restaurante (gitignored)
└── frontend/                   TanStack Start (app aparte)
    └── src/routes/              9 pantallas
```

---
CircularAQP — TURISTÓN 2026 · Hackathon de Innovación Turística, Arequipa
