FROM ubuntu:24.04

# Installer Node.js et npm (creer un serveur pour le chatroom)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y \
    curl \
    gnupg2 \
    lsb-release \
    ca-certificates \
    wget \
    git \
    build-essential \
    && apt-get clean

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

RUN node -v && npm -v

WORKDIR /app/www

COPY . /app/www

RUN npm install

EXPOSE 8000

CMD ["npm", "start"]