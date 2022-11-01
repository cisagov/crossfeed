FROM node:14-alpine3.14
USER root

WORKDIR /app
COPY ./package* ./

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci

COPY . .

ENV IS_OFFLINE "true"

CMD ["npx", "ts-node-dev", "src/api-dev.ts"]
