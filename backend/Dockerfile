FROM node:14-buster-slim

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

ENV IS_OFFLINE "true"

CMD ["npx", "ts-node-dev", "src/api-dev.ts"]
