#!/bin/bash
CONTAINER_NAME=$(sudo docker ps --format='{{.Names}}' | grep myproject-web)
exec sudo /usr/bin/docker exec -it "$CONTAINER_NAME" python3 manage.py collectstatic --noinput
