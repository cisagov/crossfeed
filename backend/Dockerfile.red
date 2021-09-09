FROM node:14-buster-slim

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

ENV IS_OFFLINE "false"


# TODO: use SAM local

CMD ["npx", "ts-node-dev", "src/api-red.ts"]
