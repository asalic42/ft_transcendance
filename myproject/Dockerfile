# Utiliser une image Python comme base
FROM python:3.10.12

# Définir le répertoire de travail
WORKDIR /app

# On copie le fichier de dépendances
COPY requirements.txt .

# Ici on installe les dépendances bb
RUN apt-get update && apt-get install -y libpq-dev gcc python3-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

# On copie tout le reste du code
COPY . .

# On expose le port de l'appli (django)
EXPOSE 8000

# Et ici on renseigne les commandes par défauts pour lancer notre petit serveur Django
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
# CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000"]