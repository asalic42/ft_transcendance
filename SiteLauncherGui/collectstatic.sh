#!/bin/bash
CONTAINER_NAME=$(docker ps --format='{{.Names}}' | grep myproject-web)
exec /usr/bin/docker exec "$CONTAINER_NAME" python3 manage.py collectstatic --noinput

