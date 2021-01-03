FROM ubuntu:18.04

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y npm nodejs memcached

COPY . .

RUN npm i

EXPOSE 3000

CMD [ "npm", "run", "start" ]
