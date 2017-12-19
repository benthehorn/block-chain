FROM node:4.6

RUN mkdir /blockchain
ADD package.json /blockchain/
ADD main.js /blockchain/

RUN cd /blockchain && npm install

EXPOSE 3001
EXPOSE 6001

ENTRYPOINT cd /naivechain && npm install && PEERS=$PEERS npm start
