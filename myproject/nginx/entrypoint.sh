apt install openssl -y

CERT_DIR="/etc/nginx/certs"

# Create directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate certificate if it doesn't exist
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
  echo "Generating self-signed certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -subj "/CN=localhost" \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt"
else
  echo "Certificate already exists. Skipping generation."
fi

# Start NGINX
nginx -g "daemon off;"