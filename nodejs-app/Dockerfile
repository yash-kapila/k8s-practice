# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

ARG PORT_NUMBER

ENV PORT $PORT_NUMBER

RUN npm install

COPY . .

EXPOSE $PORT_NUMBER

CMD [ "node", "index.js" ]