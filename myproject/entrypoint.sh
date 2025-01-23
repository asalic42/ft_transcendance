#? migarions
echo "Making migrations...";
python3 manage.py makemigrations --noinput;
python3 manage.py migrate --noinput;
echo "Migrations done.";

#? for gunicorn
echo "Making static...";
mkdir static;
chmod -R 777 static/;
python3 manage.py collectstatic --noinput;
echo "Static done.";

#? Launch server
# gunicorn myproject.wsgi:application --bind 0.0.0.0:8000;
#? Launch server with Daphne
daphne myproject.asgi:application --bind 0.0.0.0 --port 8000;
