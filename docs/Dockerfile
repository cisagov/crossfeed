FROM node:latest

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "develop", "--", "-H", "0.0.0.0", "--port", "4000"]