FROM node:4.6

RUN mkdir /blockchain
ADD package.json /blockchain/
ADD app.js /blockchain/

RUN cd /blockchain && npm install

EXPOSE 3001
EXPOSE 6001

ENTRYPOINT cd /blockchain && npm install && PEERS=$PEERS npm start
