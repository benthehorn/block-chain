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
echo " If you have docker and docker-compose installed, press enter to continue."
read -p "Press ENTER now."
echo " Now we will run the docker compose file."
docker-compose up -d
echo " We will now see the 4 peers being initiated."
echo " "
echo " To see the test blocks created :"
curl http://localhost:3001/blocks
echo " "
echo " "
echo " "
echo " "
echo " Lets add a block :"
curl -H "Content-type:application/json" --data '{"data" : "A New Block"}' http://localhost:3001/mineBlock
echo " "
echo " And list the blocks including the new one."
echo " "
curl http://localhost:3001/blocks
echo " That shows that we can add blocks to our chain."
docker-compose down
docker rmi benthehorn/block-chain-project:latest -f
rm ./docker-compose.yml
echo " "
echo "The End. "