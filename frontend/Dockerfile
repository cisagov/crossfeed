FROM node:18-alpine3.17
USER root

RUN apk update && apk upgrade

WORKDIR /app

COPY ./package* ./

RUN npm install -g npm@9 --legacy-peer-deps

RUN npm ci --legacy-peer-deps

COPY . .

CMD [ "npm", "run", "start" ]