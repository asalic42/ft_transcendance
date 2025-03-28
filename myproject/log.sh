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


########################## FUNCTION ##########################


# Permet d'init une variable d'env au sein du container myproject-web pour la récup avec Django
#
#   [SIGNATURE]: initialize_ip_addr arg1

initialize_ip_addr() {

    if [ $? -eq 0 ] && [ -n "$1" ]; then

        image_name="myproject-web"
        container_name=$(docker ps --filter "ancestor=$image_name" --format "{{.Names}}")

        docker exec -it "$container_name" bash -c "export HOST_IP=$1" 2> /dev/null

    else
        echo "Erreur : Aucune adresse IP 192... trouvée pour l'interface wlo1."
        exit 1
    fi
}

##############################################################

# FULL BUILD
if [ "$1" == "b-all" ]; then
    # scriptmanNotify "C'est parti mon build le projet"

    ################# Récupération de l'addr IP #################


    IP=$(hostname -I | awk '{print $1}')

    if grep -q "^HOST_IP=" .env; then
        # Si HOST_IP existe, mettre à jour sa valeur avec sed
        sed -i "s/^HOST_IP=.*/HOST_IP=\"$IP\"/" .env
        echo "Fichier .env mis à jour"
    else
        # Si HOST_IP n'existe pas, l'ajouter à la fin du fichier
        echo "HOST_IP=\"$IP\"" >> .env
        echo "HOST_IP ajouté au fichier .env"
    fi

    # Vérifier si l'adresse IP a été récupérée
    if [ -z "$IP" ]; then
        echo "Impossible de récupérer l'adresse IP."
        exit 1
    fi

    # Chemin vers le fichier de configuration Nginx
    NGINX_CONF="./nginx/nginx.conf"

    # Vérifier si le fichier de configuration existe
    if [ ! -f "$NGINX_CONF" ]; then
        echo "Le fichier de configuration Nginx n'existe pas : $NGINX_CONF"
        exit 1
    fi

    # Sauvegarder le fichier de configuration original
    cp "$NGINX_CONF" "$NGINX_CONF.bak"

    # Insérer l'adresse IP dans le fichier de configuration
    sed -i "s/^\([[:space:]]*\)server_name[[:space:]]*.*;/\1server_name $IP;/" "$NGINX_CONF"

    # Vérifier si la modification a été effectuée
    if grep -q "server_name $IP;" "$NGINX_CONF"; then
        echo "L'adresse IP a été insérée avec succès dans le fichier de configuration Nginx."
    else
        echo "Échec de l'insertion de l'adresse IP dans le fichier de configuration Nginx."
        exit 1
    fi

    ################# [FIN] Récupération de l'addr IP #################


	rm -rf static/;

	pip install --no-cache-dir -r requirements.txt

    echo -e "${BLUE}> Building docker image and Launching services...${NC}"
    docker-compose up --build -d

    # sleep 10
    # echo -e "${PURPLE}> Initialisation de la [VE] HOST_IP${NC}"
    # initialize_ip_addr $IP

    open https://$IP:5000

    echo -e "> ${GREEN}Ready${NC} to use. Next cmd > ./log launch OR https://$IP:5000"
fi

# FULL REMOVE
if [ "$1" == "r-all" ]; then
    echo -e "${BLUE}> Stopping docker services...${NC}"
    docker-compose stop
    echo -e "${BLUE}> Removing docker image and volume...${NC}"
    docker system prune --volumes --force
    echo -e "${BLUE}> Removing django cache...${NC}"
	find . -type d -name "__pycache__" -exec rm -r {} +
    echo -e "${GREEN}> Done.${NC} [For full rebuild] > ./log.sh b-all"
fi
