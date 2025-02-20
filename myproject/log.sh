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
    echo -e "\n├ ${PURPLE_N}REMOVE + BUILD + LAUNCH${NC}"

    echo -e "│\t> ${YELLOW_N}ev${NC}          ${PURPLE}|${NC} Déconstruction, construction et lancement :"
    echo -e "│\t\t\tÉquivalent au combo de commandes :  r-all + b-all + l"
    
    echo -e "\n├ ${PURPLE_N}BUILD${NC}"

    echo -e "│\t> ${YELLOW_N}b-all${NC}       ${PURPLE}|${NC} Construction complète :"
    echo -e "│\t\t\tCrée les images Docker et les volumes, nécessaire pour un premier setup."
    
    echo -e "│\n│\t> ${YELLOW_N}b${NC}           ${PURPLE}|${NC} Construction partielle :"
    echo -e "│\t\t\tCrée uniquement les images Docker, utile pour les mises à jour sans toucher aux volumes."
   
    echo -e "\n├ ${PURPLE_N}REMOVE${NC}"

    echo -e "│\t> ${YELLOW_N}r-all${NC}       ${PURPLE}|${NC} Suppression totale :"
    echo -e "│\t\t\tEnlève toutes les images et volumes Docker,"
    echo -e "│\t\t\t${RED_N}Attention${NC}, toutes les données seront perdues. Utilisez 'b-all' pour un nouveau setup après."
    
    echo -e "│\n│\t> ${YELLOW_N}r${NC}           ${PURPLE}|${NC} Suppression partielle :"
    echo -e "│\t\t\tEnlève uniquement l'image Docker, les volumes restent intacts."
    
    echo -e "\n├ ${PURPLE_N}LAUNCH${NC}"

    echo -e "│\t> ${YELLOW_N}l${NC}           ${PURPLE}|${NC} Lancement de l'application :"
    echo -e "│\t\t\tDémarre les services Docker et ouvre l'application dans le navigateur."

    echo -e "\n"
    exit 1
fi


# scriptmanNotify () {
#     notify-send -r 1000 -i $PWD/script_img/script_pp.png "ScriptMan" "$1" -t 27000
# }


# FULL REMOVE + BUILD + LAUNCH
if [ "$1" == "ev" ];then
    ./log.sh r-all
    ./log.sh b-all
    ./log.sh l
fi

# FULL BUILD
if [ "$1" == "b-all" ]; then
    # scriptmanNotify "C'est parti mon build le projet"

	rm -rf static/;
	echo -e "${BLUE}>Adding line to /etc/hosts... ${NC}"

    # scriptmanNotify "[1/3] J'installe les requirements..."

	pip install --no-cache-dir -r requirements.txt
	LINE='127.0.0.1	transcendance.42.paris'
	FILE='/etc/hosts'
	sudo grep -qF "$LINE" "$FILE" ||  echo "$LINE" | sudo tee -a "$FILE"

    # scriptmanNotify "[2/3] Je build les images docker..."

    echo -e "${BLUE}> Building docker image... ${NC}"
    sudo docker-compose build

    # scriptmanNotify "[3/3] Lancement des services rien que pour toi mon cochon. Refresh quand je disparaitrais."
    
    echo -e "${PURPLE}> Launching services...${NC}"
    sudo docker-compose up # démarre en arrière-plan

    # scriptmanNotify "Fin de la règle b-all bb !"

    echo -e "> ${GREEN}Ready${NC} to use. Next cmd > ./log launch OR https://transcendance.42.paris"
fi

# SIMPLE BUILD
if [ "$1" == "b" ]; then
    echo -e "${BLUE}> Building docker image...${NC}"
    sudo docker-compose build
    echo -e "${PURPLE}> Launching services...${NC}"
    sudo docker-compose up -d
    echo -e "> ${GREEN}Ready${NC} to use. Next cmd > ./log l OR https://transcendance.42.paris"
fi

# FULL REMOVE
if [ "$1" == "r-all" ]; then
    echo -e "${BLUE}> Stopping docker services...${NC}"
    sudo docker-compose stop
    echo -e "${BLUE}> Removing docker image and volume...${NC}"
    sudo docker system prune --volumes
    # sudo rm -rf static/
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

    # Attendre que le service soit accessible
    # until $(curl --output /dev/null --silent --head --fail http://0.0.0.0:8000); do
    #     printf '.'
    #     sleep 1
    # done

    echo -e "${GREEN}> Service is up! Opening browser...${NC}"
    open https://transcendance.42.paris/signin/
fi
