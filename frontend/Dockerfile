FROM node:18-alpine3.17
USER root

WORKDIR /app

RUN apk update && apk upgrade

COPY ./package* ./

RUN npm install -g npm@9

RUN npm i

COPY . .

CMD [ "npm", "run", "start" ]