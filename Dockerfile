FROM node:24-alpine

WORKDIR /srv/app

COPY . .

RUN npm i

EXPOSE 80 443

CMD ["node", "index.js"]