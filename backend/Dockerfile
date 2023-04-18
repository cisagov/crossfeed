FROM node:18-alpine3.17
USER root

WORKDIR /app
COPY ./package* ./

RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm i

COPY . .

ENV IS_OFFLINE "true"

CMD ["npx", "ts-node-dev", "src/api-dev.ts"]
