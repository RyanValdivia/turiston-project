# Frontend (Vite + TanStack Start). Every data-fetching route has ssr:false
# (see frontend/src/routes/*.tsx), so this server never calls the backend
# directly — only the browser does, same-origin via Traefik path routing.
FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# @lovable.dev/vite-tanstack-config defaults nitro's build target to the
# Cloudflare Workers format outside of the Lovable sandbox unless overridden —
# force a plain Node server output instead (verified: produces .output/server/index.mjs).
ENV NITRO_PRESET=node-server
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output /app/.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
