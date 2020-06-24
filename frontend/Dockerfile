FROM node:latest

WORKDIR /app
COPY ./package* ./

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]