FROM node:16-alpine3.14
USER root

WORKDIR /app
COPY ./package* ./

RUN npm i

COPY . .

CMD [ "npm", "run", "start" ]