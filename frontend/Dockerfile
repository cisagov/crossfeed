FROM node:latest

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "start" ]