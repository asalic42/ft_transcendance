# Utiliser une image Python comme base
FROM python:3.10.12

# Définir le répertoire de travail
WORKDIR /app/

# On copie le fichier de dépendances
COPY requirements.txt .

# Ici on installe les dépendances bb
RUN apt-get update && apt-get install -y libpq-dev gcc python3-dev
RUN pip install -r --no-cache-dir requirements.txt

# On copie tout le reste du code
COPY . .

# Launch entrypoint script
CMD ["sh", "entrypoint.sh"]
