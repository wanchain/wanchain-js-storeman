FROM node:8

WORKDIR /wanchain-storeman
COPY . /wanchain-storeman

RUN npm install

RUN npm install -g pm2 --registry https://registry.npm.taobao.org

RUN apt-get update
RUN apt-get install vim -y

EXPOSE 1000

ENV MONGO_USER root
ENV MONGO_PWD Wanchain888

ENTRYPOINT pm2-runtime start.sh $0 $@
#CMD pm2-runtime start.sh

