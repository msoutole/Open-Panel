# 🔧 Troubleshooting Guide - Open Panel

This guide covers common issues you might encounter during installation, setup, and operation of Open Panel.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Network and Port Issues](#network-and-port-issues)
- [Authentication Issues](#authentication-issues)
- [AI Provider Issues](#ai-provider-issues)
- [Performance Issues](#performance-issues)
- [Logging and Debugging](#logging-and-debugging)

---

## Installation Issues

### ❌ Problem: Setup script fails with "Permission denied"

**Symptoms:**
`bash
bash: ./scripts/setup/setup.sh: Permission denied
`

**Solution:**
`bash

# Make the script executable
chmod +x scripts/setup/setup.sh
./scripts/setup/setup.sh
`

---

### ❌ Problem: "command not found: node" or "command not found: npm"

**Symptoms:**
`bash
node: command not found
npm: command not found
`

**Solution:**

**Linux (Ubuntu/Debian):**
`bash

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
`

**macOS:**
`bash

# Install using Homebrew
brew install node@20
`

**Windows:**
Download and install from: https://nodejs.org/

---

### ❌ Problem: Setup script stops at "Waiting for services to be healthy"

**Symptoms:**
`
⏳ Waiting for services to be healthy...
[Times out after 120 seconds]
`

**Solution:**

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check individual container status:**
   ```bash
   docker-compose ps
   docker-compose logs postgres
   docker-compose logs redis
   ```

3. **Restart Docker services:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **Check port conflicts:**
   ```bash
   # Check if ports are already in use
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   lsof -i :11434 # Ollama
   lsof -i :8080  # Traefik
   ```

---

### ❌ Problem: npm install fails with EACCES or permission errors

**Symptoms:**
`
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
`

**Solution:**

**Option 1: Fix npm permissions (Recommended)**
`bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
`

**Option 2: Use sudo (Not recommended for security)**
`bash
sudo npm install
`

---

## Docker Issues

### ❌ Problem: "Cannot connect to Docker daemon"

**Symptoms:**
`
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
Is the docker daemon running?
`

**Solution:**

**Linux:**
`bash

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# Log out and log back in for this to take effect
`

**macOS:**
`bash

# Start Docker Desktop
open -a Docker
`

**Windows:**
`powershell

# Start Docker Desktop from Start Menu
`

---

### ❌ Problem: Docker Compose version incompatibility

**Symptoms:**
`
ERROR: The Compose file './docker-compose.yml' is invalid
`

**Solution:**

1. **Check Docker Compose version:**
   ```bash
   docker-compose --version
   ```

2. **Update Docker Compose:**
   ```bash
   # Linux
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Or use Docker Compose V2 (plugin)
   docker compose version
   ```

---

### ❌ Problem: Container keeps restarting

**Symptoms:**
`bash
docker ps

# Shows container with "Restarting" status
`

**Solution:**

1. **Check container logs:**
   ```bash
   docker logs <container-name>
   # Example:
   docker logs openpanel-postgres
   docker logs openpanel-redis
   ```

2. **Common causes:**
   - Port already in use
   - Incorrect environment variables
   - Insufficient memory/resources
   - Volume mount permission issues

3. **Fix volume permissions (Linux):**
   ```bash
   sudo chown -R $USER:$USER ./data
   ```

---

## Database Issues

### ❌ Problem: "FATAL: password authentication failed"

**Symptoms:**
`
Error: P1001: Can't reach database server
FATAL: password authentication failed for user "openpanel"
`

**Solution:**

1. **Check DATABASE_URL in .env:**
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Verify password matches .credentials/postgres.password:**
   ```bash
   cat .credentials/postgres.password
   ```

3. **Update DATABASE_URL with correct password:**
   ```bash
   # In .env file:
   DATABASE_URL="postgresql://openpanel:<password>@localhost:5432/openpanel"
   ```

4. **Restart PostgreSQL:**
   ```bash
   docker-compose restart postgres
   ```

---

### ❌ Problem: Prisma migration fails

**Symptoms:**
`
Error: P3009: Failed to migrate
Migration file ... failed to apply
`

**Solution:**

1. **Reset database (⚠️ DELETES ALL DATA):**
   ```bash
   cd apps/api
   npx prisma migrate reset --force
   ```

2. **Push schema manually:**
   ```bash
   cd apps/api
   npx prisma db push --force-reset
   ```

3. **Check PostgreSQL is accessible:**
   ```bash
   docker exec -it openpanel-postgres psql -U openpanel -d openpanel
   # If successful, type \q to quit
   ```

---

### ❌ Problem: "Table does not exist" errors

**Symptoms:**
`
Error: P2021: The table `main.User` does not exist
`

**Solution:**

1. **Generate Prisma client:**
   ```bash
   cd apps/api
   npm run db:generate
   ```

2. **Apply migrations:**
   ```bash
   npm run db:push
   ```

3. **Verify tables exist:**
   ```bash
   docker exec -it openpanel-postgres psql -U openpanel -d openpanel -c "\dt"
   ```

---

## Network and Port Issues

### ❌ Problem: Port already in use

**Symptoms:**
`
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::8000
`

**Solution:**

1. **Find process using the port:**
   ```bash
   # Linux/macOS
   lsof -i :3000
   lsof -i :8000

   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   ```

2. **Kill the process:**
   ```bash
   # Linux/macOS
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. **Or change the port in .env:**
   ```bash
   # .env file
   API_PORT=8001
   WEB_PORT=3001
   ```

---

### ❌ Problem: Cannot access web UI from other machines

**Symptoms:**
- http://localhost:3000 works locally
- http://192.168.1.x:3000 doesn't work from other devices

**Solution:**

1. **Change Vite host binding:**
   ```bash
   # In apps/web/package.json
   "dev": "vite --host 0.0.0.0"
   ```

2. **Update CORS_ORIGIN:**
   ```bash
   # In .env
   CORS_ORIGIN=http://192.168.1.x:3000
   ```

3. **Check firewall:**
   ```bash
   # Linux (UFW)
   sudo ufw allow 3000/tcp
   sudo ufw allow 8000/tcp

   # macOS (Disable firewall temporarily for testing)
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
   ```

---

## Authentication Issues

### ❌ Problem: "Invalid credentials" on first login

**Symptoms:**
`
Login failed: Invalid email or password
`

**Solution:**

1. **Verify admin credentials:**
   - Email: `admin@admin.com.br`
   - Password: `admin123`

2. **Check admin user exists:**
   ```bash
   docker exec -it openpanel-postgres psql -U openpanel -d openpanel -c "SELECT email, \"mustChangePassword\" FROM \"User\" WHERE email='admin@admin.com.br';"
   ```

3. **Recreate admin user:**
   ```bash
   npm run create:admin
   ```

---

### ❌ Problem: JWT token expired or invalid

**Symptoms:**
`
401 Unauthorized
Error: Invalid token
`

**Solution:**

1. **Clear browser localStorage:**
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   location.reload();
   ```

2. **Check JWT_SECRET is set:**
   ```bash
   cat .env | grep JWT_SECRET
   # Should be at least 32 characters
   ```

3. **Logout and login again**

---

### ❌ Problem: Cannot change password during onboarding

**Symptoms:**
`
Error: Password validation failed
`

**Solution:**

Ensure your password meets requirements:
- ✅ At least 8 characters
- ✅ Contains uppercase letter (A-Z)
- ✅ Contains lowercase letter (a-z)
- ✅ Contains number (0-9)
- ✅ Contains special character (!@#$%^&*)

**Valid examples:**
- `SecurePass123!`
- `MyNewP@ssw0rd`
- `Admin2024#Strong`

---

## AI Provider Issues

### ❌ Problem: "Invalid API key" for Google Gemini

**Symptoms:**
`
Gemini: Invalid API key
`

**Solution:**

1. **Verify API key is correct:**
   - Go to: https://makersuite.google.com/app/apikey
   - Create new API key
   - Copy exactly (no spaces)

2. **Check API is enabled:**
   - Enable Generative Language API in Google Cloud Console

3. **Validate manually:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
   ```

---

### ❌ Problem: Ollama connection failed

**Symptoms:**
`
Cannot connect to Ollama
Connection refused
`

**Solution:**

1. **Check Ollama is running:**
   ```bash
   docker ps | grep ollama
   curl http://localhost:11434/api/tags
   ```

2. **Start Ollama container:**
   ```bash
   docker-compose up -d ollama
   ```

3. **Use cloud models (no local Ollama needed):**
   - During onboarding, Ollama validates even without local models
   - Cloud models are always available:
     - `gpt-oss:120b-cloud`
     - `qwen3-vl:235b-cloud`
     - `deepseek-v3.1:671b-cloud`

---

### ❌ Problem: Claude API validation timeout

**Symptoms:**
`
Claude: Connection failed
Request timeout
`

**Solution:**

1. **Check network connectivity:**
   ```bash
   curl https://api.anthropic.com/v1/messages
   ```

2. **Verify API key format:**
   - Should start with `sk-ant-`
   - Get from: https://console.anthropic.com/settings/keys

3. **Check rate limits:**
   - Wait a few minutes and try again

---

## Performance Issues

### ❌ Problem: Slow application startup

**Symptoms:**
- API takes 10+ seconds to respond
- Web UI is very slow to load

**Solution:**

1. **Check system resources:**
   ```bash
   docker stats
   ```

2. **Increase Docker memory limit:**
   - Docker Desktop → Settings → Resources → Memory
   - Increase to at least 4GB

3. **Check for heavy containers:**
   ```bash
   docker stats --no-stream | sort -k 4 -h
   ```

---

### ❌ Problem: High memory usage

**Symptoms:**
`
docker stats

# Shows >90% memory usage
`

**Solution:**

1. **Stop unused containers:**
   ```bash
   docker-compose stop ollama  # If not using local models
   ```

2. **Restart services:**
   ```bash
   docker-compose restart
   ```

3. **Prune unused Docker resources:**
   ```bash
   docker system prune -a --volumes
   # ⚠️ This removes all unused containers, images, and volumes
   ```

---

## Logging and Debugging

### 📝 Where to find logs

**Application Logs:**
`bash

# API logs
tail -f apps/api/logs/combined.log
tail -f apps/api/logs/error.log

# Or check .logs/ directory
ls -lah .logs/
`

**Docker Logs:**
`bash

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f ollama

# Last 100 lines
docker-compose logs --tail=100
`

**System Logs:**
`bash

# Linux
journalctl -xe | grep -i docker

# macOS
log show --predicate 'eventMessage contains "docker"' --last 1h
`

---

### 🔍 Enable Debug Mode

**Backend (API):**
`bash

# In .env
NODE_ENV=development
LOG_LEVEL=debug
`

**Frontend (Web):**
`bash

# In .env.local
VITE_DEBUG=true
`

**Prisma:**
`bash

# In .env
DEBUG="prisma:query,prisma:error"
`

---

### 🧪 Test Database Connection

`bash

# Test PostgreSQL
docker exec -it openpanel-postgres pg_isready -U openpanel

# Test Redis
docker exec -it openpanel-redis redis-cli ping

# Should return: PONG
`

---

### 🔧 Reset Everything (Nuclear Option)

**⚠️ WARNING: This will DELETE ALL DATA**

`bash

# Stop all services
docker-compose down -v

# Remove all volumes
docker volume prune -f

# Remove .credentials and .env
rm -rf .credentials/
rm .env

# Re-run setup
./scripts/setup/setup.sh
`

---

## Still Having Issues?

### 📧 Get Help

1. **Check existing issues:**
   - GitHub: https://github.com/msoutole/openpanel/issues

2. **Create a new issue:**
   - Include error messages
   - Include relevant logs
   - Include your OS and versions (node, docker, npm)

3. **Email support:**
   - msoutole@hotmail.com
   - Include steps to reproduce the issue

### 📊 Useful Debug Information

When reporting issues, include:

`bash

# System info
uname -a
node --version
npm --version
docker --version
docker-compose --version

# Container status
docker-compose ps

# Recent logs
docker-compose logs --tail=50

# Environment (sanitized)
cat .env | grep -v "PASSWORD\|SECRET\|KEY"
`

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0

