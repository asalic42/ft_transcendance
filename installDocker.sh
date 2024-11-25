#!/bin/bash

# Mettre à jour le gestionnaire de paquets
echo "Mise à jour du gestionnaire de paquets..."
sudo apt-get update

# Installer Docker
echo "Installation de Docker..."
sudo apt-get install -y docker.io

# Démarrer et activer Docker
echo "Démarrage de Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Installer Docker Compose
echo "Installation de Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo apt-get install docker-compose-plugin
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
echo "Vérification de l'installation de Docker..."
docker --version
echo "Vérification de l'installation de Docker Compose..."
docker-compose --version

echo "Installation terminée !"
