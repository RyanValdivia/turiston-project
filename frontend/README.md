# restora — Frontend

Cliente web de **restora**, construido con [Vite](https://vitejs.dev/), [TanStack Start](https://tanstack.com/start), [React 19](https://react.dev/) y [Tailwind CSS 4](https://tailwindcss.com/).

## Conexión con el backend

El frontend corre en `:8080` y usa un **proxy** en `vite.config.ts` para redirigir todas las llamadas a `/api/*` al backend Next.js en `:3000`. Esto mantiene las cookies httpOnly del JWT funcionando sin CORS.

```
Frontend (:8080)  ── /api/* ──►  Backend Next.js (:3000)
```

## Desarrollo

```bash
# Desde la raíz del proyecto
cd frontend
npm install
npm run dev
```

> ⚠️ El backend debe estar corriendo en `:3000` para que las llamadas a la API funcionen.

## Estructura

```
src/
├── routes/          # Páginas (TanStack file-based routing)
├── components/
│   ├── AppShell.tsx # Layout con navegación lateral + bottom nav
│   ├── asistente/   # Widget de chat IA (flotante, global)
│   └── ui/          # Componentes shadcn/ui (base instalada)
├── hooks/           # useAsistente, use-mobile
├── lib/
│   ├── api.ts       # Cliente HTTP tipado para todos los endpoints
│   ├── asistente.ts # Tipos y flujos del asistente conversacional
│   ├── etiquetas.ts # Mapeo de enums del backend a etiquetas en español
│   └── session.ts   # Gestión de sesión vía TanStack Query
└── styles.css       # Tokens del design system (Material Design 3)
```

## Notas

- La UI está **completamente en español**, alineada con el usuario final (administradores de restaurantes en Arequipa).
- Los enums del backend (`CategoriaResiduo`, `AreaProceso`, etc.) se muestran con etiquetas legibles definidas en `lib/etiquetas.ts`.
- El widget del asistente IA está montado globalmente en `AppShell.tsx` y aparece en todas las pantallas autenticadas.
