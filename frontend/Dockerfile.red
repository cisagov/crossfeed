FROM node:14-buster-slim

WORKDIR /app
COPY ./package* ./

RUN npm i -g serve

RUN npm ci

COPY . .

RUN cp prod.env .env

RUN npm run build

CMD [ "npm", "run", "red" ]