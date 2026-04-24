# SentinelOS NON-DEMO API container
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/api/server.js"]
