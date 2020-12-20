FROM ubuntu:18.04


RUN apt-get update

RUN apt-get install -y npm nodejs memcached

WORKDIR /usr/src/app

COPY . .

ENV NODE_ENV=production

RUN npm i

EXPOSE 3000

CMD [ "npm", "run", "start" ]


