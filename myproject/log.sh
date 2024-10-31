#!/bin/bash

# COLORS
YELLOW_N='\033[0;33m'
PURPLE_N='\033[0;35m'
GREEN_N='\033[0;32m'
BLUE_N='\033[0;34m' 
RED_N='\033[0;31m'

YELLOW='\033[1;33m'
PURPLE='\033[1;35m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
RED='\033[1;31m'
NC='\033[0m'

# HELP
if [ $# -ne 1 ]; then
    echo -e "${BLUE}[ COMMANDES ]${NC}"
    echo -e "\n├ ${PURPLE_N}BUILD${NC}"

    echo -e "│\t> ${BLUE_N}b-all${NC}       ${PURPLE}|${NC} Construction complète :"
    echo -e "│\t\t\tCrée les images Docker et les volumes, nécessaire pour un premier setup."
    
    echo -e "│\n│\t> ${BLUE_N}b${NC}           ${PURPLE}|${NC} Construction partielle :"
    echo -e "│\t\t\tCrée uniquement les images Docker, utile pour les mises à jour sans toucher aux volumes."
   
    echo -e "\n├ ${PURPLE_N}REMOVE${NC}"

    echo -e "│\t> ${BLUE_N}r-all${NC}       ${PURPLE}|${NC} Suppression totale :"
    echo -e "│\t\t\tEnlève toutes les images et volumes Docker,"
    echo -e "│\t\t\t${RED_N}Attention${NC}, toutes les données seront perdues. Utilisez 'b-all' pour un nouveau setup après."
    
    echo -e "│\n│\t> ${BLUE_N}r${NC}           ${PURPLE}|${NC} Suppression partielle :"
    echo -e "│\t\t\tEnlève uniquement l'image Docker, les volumes restent intacts."
    
    echo -e "\n├ ${PURPLE_N}LAUNCH${NC}"

    echo -e "│\t> ${BLUE_N}l${NC}           ${PURPLE}|${NC} Lancement de l'application :"
    echo -e "│\t\t\tDémarre les services Docker et ouvre l'application dans le navigateur."

    echo -e "\n"
    exit 1
fi


# FULL BUILD
if [ "$1" == "b-all" ]; then

    echo -e "${BLUE}> Building docker image... ${NC}"
    sudo docker-compose build

    echo -e "${PURPLE}> Launching services...${NC}"
    sudo docker-compose up -d # démarre en arrière-plan

    echo -e "${YELLOW}> Making Django migrations...${NC}"

    sudo docker-compose run web python3 manage.py migrate

    echo -e "> ${GREEN}Ready${NC} to use. Next cmd > ./log launch OR http://127.0.0.1:8000 "

fi

# SIMPLE BUILD
if [ "$1" == "b" ]; then
    echo -e "${BLUE}> Building docker image...${NC}"
    sudo docker-compose build
    echo -e "${PURPLE}> Launching services...${NC}"
    sudo docker-compose up -d
    echo -e "> ${GREEN}Ready${NC} to use. Next cmd > ./log l OR http://127.0.0.1:8000 "
fi

# FULL REMOVE
if [ "$1" == "r-all" ]; then
    echo -e "${BLUE}> Removing docker image and volume...${NC}"
    sudo docker-compose down -v
    echo -e "${GREEN}> Done.${NC} [For full rebuild] > ./log.sh b-all"
fi

# SIMPLE REMOVE
if [ "$1" == "r" ]; then
    echo -e "${BLUE}> Removing docker image...${NC}"
    sudo docker-compose down
    echo -e "${GREEN}> Done.${NC} [For simple rebuild] > ./log.sh b"
fi

# LAUNCH
if [ "$1" == "l" ]; then

    echo -e ">> Checking if we have already start docker's services..."
    if [ "$(sudo docker-compose ps -q | xargs -r sudo docker inspect -f '{{.State.Running}}')" != "true" ]; then
        echo -e "${BLUE}>${NC} Docker services are not running. ${BLUE}Starting them...${NC}"
        sudo docker-compose up -d
    else
        echo -e "${GREEN}> Docker services are already running.${NC}"
    fi

    echo -e "${PURPLE}> Launching ...${NC}"
    open http://127.0.0.1:8000

    # Attendre que le navigateur soit fermé
    while pgrep -f "http://127.0.0.1:8000" > /dev/null; do
        sleep 1
    done

    echo -e "${BLUE}> Stopping docker services...${NC}"
    sudo docker-compose stop
fi

