FROM node:18-alpine3.17
USER root

WORKDIR /app
COPY ./package* ./

RUN npm i

COPY . .

CMD [ "npm", "run", "start" ]