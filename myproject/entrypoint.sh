PURPLE_N='\033[0;35m'
NC='\033[0m'
RED_N='\033[0;31m'


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
echo "${RED_N}Continuing server start-up...${NC}";

#? Launch server
gunicorn myproject.wsgi:application --bind 0.0.0.0:8000;
