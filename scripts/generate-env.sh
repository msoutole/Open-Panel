#!/bin/bash
# Generates .env file with default values if it doesn't exist

echo "🔧 Generating .env configuration..."

if [ -f .env ]; then
    echo "   .env already exists. Skipping generation."
    exit 0
fi

cat > .env << EOL
# OpenPanel Environment Configuration
POSTGRES_USER=openpanel
POSTGRES_PASSWORD=changeme
POSTGRES_DB=openpanel
REDIS_PASSWORD=changeme
JWT_SECRET=changeme
DOMAIN=localhost
SSL_EMAIL=admin@localhost
MONGO_USER=admin
MONGO_PASSWORD=changeme
OLLAMA_PORT=11434

# App URLs
APP_URL_DEV=http://dev.localhost
APP_URL_PROD=http://localhost

# AI Service
AI_SERVICE_URL=http://localhost:8000
EOL

echo "   ✅ .env created successfully."
