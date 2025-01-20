apt install openssl -y

# openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 365 -keyout localhost.key -out transcandance.42.paris

# openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/C=FR/L=PR/O=42/OU=trans/CN=[transcandance.42.paris](http://transcandance.42.paris/)"