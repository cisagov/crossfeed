# Needed for local development for certain binaries
FROM node:current-buster

WORKDIR /app
COPY ./package* ./

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci

COPY . .

ENV IS_OFFLINE "true"

CMD ["npx", "ts-node-dev", "src/api-dev.ts"]
