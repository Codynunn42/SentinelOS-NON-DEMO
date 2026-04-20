# SentinelOS NON-DEMO API container
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps ./apps
COPY scripts ./scripts

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
