FROM node:lts

WORKDIR /app
COPY ./package* ./

RUN npm install

COPY . .

CMD [ "npx", "serverless", "offline", "--host", "0.0.0.0", "--httpPort", "3000" ]
