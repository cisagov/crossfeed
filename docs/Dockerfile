# This file is built with Docker context in the main directory (not ./docs)
# so that ./backend is accessible.

FROM node:14-bullseye-slim

WORKDIR /app/docs

RUN apt-get update && apt-get install -y \
    libvips-dev \
    glib2.0-dev \
 && rm -rf /var/lib/apt/lists/*

COPY ./docs/package* ./

RUN npm ci

# Generate swagger definitions
COPY ./backend ../backend
COPY ./docs .
RUN npm run codegen

# Configure port used by Gatsby
ENV INTERNAL_STATUS_PORT=44475

CMD [ "npm", "run", "develop", "--", "-H", "0.0.0.0", "--port", "4000"]