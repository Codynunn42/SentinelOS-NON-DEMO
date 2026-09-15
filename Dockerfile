# SentinelOS NON-DEMO API container
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@10.33.4 && pnpm install --frozen-lockfile

COPY . .

ENV PORT=3000
ENV SENTINEL_DATA_DIR=/var/lib/sentinelos
ENV SENTINEL_REPOSITORY_SCAN_SCOPE=runtime_image

RUN mkdir -p "${SENTINEL_DATA_DIR}" \
    && chown -R node:node "${SENTINEL_DATA_DIR}"

EXPOSE 3000

USER node

CMD ["node", "apps/api/server.js"]
