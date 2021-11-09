FROM node:16-bullseye-slim

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "start" ]