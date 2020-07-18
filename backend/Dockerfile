# Needed for local development for certain binaries
FROM node:current-buster

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD ["npx", "ts-node-dev", "src/api/dev.ts"]
