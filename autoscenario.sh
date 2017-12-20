#!/bin/bash
clear

echo " "
echo " This script will run the functionality on our block chain program."
echo " "
echo " Make sure you have docker installed, as well as docker-compose."
echo " "
echo " Now we will download the docker compose file."
echo " "
wget https://raw.githubusercontent.com/benthehorn/block-chain/master/docker-compose.yml
echo " Now we will run the docker compose file."
docker-compose up -d
