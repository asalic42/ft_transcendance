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
# uvicorn myproject.asgi:application --host 0.0.0.0 --port 8000;
#? Launch server with Daphne
daphne --bind 0.0.0.0 --port 8000 myproject.asgi:application;