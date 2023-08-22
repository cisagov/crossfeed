FROM node:18-alpine3.17
USER root

RUN apk add --update python3 make g++\ && rm -rf /var/cache/apk/*

RUN apk update && apk upgrade

WORKDIR /app
COPY ./package* ./

RUN npm install -g npm@9
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci

COPY . .

ENV IS_OFFLINE "true"

CMD ["npx", "ts-node-dev", "src/api-dev.ts"]
