# Backend (Next.js API-only) + Python predictor, per CLAUDE.md architecture notes.
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production

# Python venv for predictor/train.py + predict.py (src/lib/pythonBridge.ts spawns PYTHON_BIN).
RUN python3 -m venv /opt/venv
COPY predictor/requirements.txt ./predictor/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir -r predictor/requirements.txt
ENV PYTHON_BIN=/opt/venv/bin/python3

COPY --from=build /app /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
