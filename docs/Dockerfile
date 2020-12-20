# This file is built with Docker context in the main directory (not ./docs)
# so that ./backend is accessible.

FROM node:14-buster-slim

WORKDIR /app/docs
COPY ./docs/package* ./

RUN npm ci

# Generate swagger definitions
COPY ./backend ../backend
RUN npm run codegen

COPY ./docs .

CMD [ "npm", "run", "develop", "--", "-H", "0.0.0.0", "--port", "4000"]