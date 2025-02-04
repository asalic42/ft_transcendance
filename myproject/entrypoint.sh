PURPLE_N='\033[0;35m'
NC='\033[0m'
GREEN_N='\033[0;32m'

#? migrations
echo "${PURPLE_N}Making migrations...${NC}";
python3 manage.py makemigrations --noinput;
python3 manage.py migrate --noinput;
echo "${PURPLE_N}Migrations done.${NC}";

#? for gunicorn
echo "${PURPLE_N}Making static...${NC}";
mkdir static;
chmod -R 777 static/;
python3 manage.py collectstatic --noinput;
echo "${PURPLE_N}Static done.${NC}";
echo "${GREEN_N}Continuing server start-up...${NC}";


#? Launch server
# uvicorn myproject.asgi:application --host 0.0.0.0 --port 8000;
#? Launch server with Daphne
daphne --bind 0.0.0.0 --port 8000 myproject.asgi:application;