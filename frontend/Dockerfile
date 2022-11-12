FROM node:14-alpine3.14
USER root

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "start" ]