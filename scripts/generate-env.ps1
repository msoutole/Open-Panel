Write-Host "🔧 Generating .env configuration..." -ForegroundColor Cyan

# Default Values
$DEFAULTS = @{
    "POSTGRES_USER" = "openpanel"
    "POSTGRES_PASSWORD" = "changeme"
    "POSTGRES_DB" = "openpanel"
    "REDIS_PASSWORD" = "changeme"
    "JWT_SECRET" = "changeme"
    "DOMAIN" = "localhost"
    "SSL_EMAIL" = "admin@localhost"
    "MONGO_USER" = "admin"
    "MONGO_PASSWORD" = "changeme"
    "OLLAMA_PORT" = "11434"
}

# Check if .env exists
if (Test-Path .env) {
    Write-Host "   .env already exists. Skipping generation." -ForegroundColor Yellow
    exit
}

# Generate .env content
$content = "# OpenPanel Environment Configuration`n"
foreach ($key in $DEFAULTS.Keys) {
    $val = $DEFAULTS[$key]
    $content += "$key=$val`n"
}

# Additional sections
$content += "`n# App URLs`n"
$content += "APP_URL_DEV=http://dev.localhost`n"
$content += "APP_URL_PROD=http://localhost`n"
$content += "`n# AI Service`n"
$content += "AI_SERVICE_URL=http://localhost:8000`n"

Set-Content -Path .env -Value $content
Write-Host "   ✅ .env created successfully." -ForegroundColor Green
