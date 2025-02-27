FROM nginx:alpine


RUN apk add --no-cache openssl

# Copie des fichiers nécessaires
COPY nginx.conf /etc/nginx/conf.d/nginx.conf 
COPY mime.types /etc/nginx/
COPY entrypoint.sh /entrypoint.sh

# Suppression des logs Nginx existants
RUN rm -f /var/log/nginx/*

# Rendre le script exécutable
RUN chmod +x /entrypoint.sh

CMD [ "./entrypoint.sh" ]
