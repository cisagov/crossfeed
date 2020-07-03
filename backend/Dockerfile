# Needed for local development for certain binaries
FROM node:current-buster

WORKDIR /app
COPY ./package* ./

RUN npm ci

COPY . .

CMD [ "npx", "serverless", "offline", "--host", "0.0.0.0", "--httpPort", "3000" ]
