FROM node:14-buster-slim

WORKDIR /tmp

RUN apt-get update && apt-get install -y \
    wget \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN wget --quiet https://github.com/Edu4rdSHL/findomain/releases/download/1.7.0/findomain-linux -O /usr/bin/findomain && chmod +x /usr/bin/findomain

RUN wget --quiet https://github.com/OWASP/Amass/releases/download/v3.7.3/amass_linux_i386.zip -O amass.zip && unzip -q amass.zip && cp amass_linux_i386/amass /usr/bin && chmod +x /usr/bin/amass

WORKDIR /app

RUN findomain --version

RUN amass --version

CMD ["amass", "--version"]
