FROM node:14-buster-slim

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "start" ]