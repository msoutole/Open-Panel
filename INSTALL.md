# 📦 OpenPanel - Installation Guide

## 🚀 Automated Installation (Recommended)

OpenPanel provides **100% automated installation scripts** for all major operating systems. Choose the method that best fits your platform:

### 🐧 Linux & macOS

The master installation script handles everything automatically:

```bash
# Make executable
chmod +x install.sh

# Run installation
./install.sh
```

**Features:**
- ✅ Auto-detects OS and distribution
- ✅ Installs Node.js, Docker, and all dependencies
- ✅ Configures environment variables
- ✅ Starts all services
- ✅ Sets up database
- ✅ Verifies installation

**Options:**
```bash
./install.sh --update     # Update existing installation
./install.sh --dev        # Development mode (skip production configs)
./install.sh --no-docker  # Skip Docker installation
./install.sh --verbose    # Verbose output
```

**Supported Distributions:**
- Ubuntu 20.04+
- Debian 11+
- Fedora 36+
- CentOS Stream 9+
- Arch Linux
- Alpine Linux 3.17+
- macOS 11+ (Big Sur and later)

---

### 🪟 Windows

The PowerShell installation script provides the same automated experience:

```powershell
# Run PowerShell as Administrator

# Set execution policy (first time only)
Set-ExecutionPolicy Bypass -Scope Process -Force

# Run installation
.\install.ps1
```

**Features:**
- ✅ Installs Chocolatey package manager
- ✅ Installs Node.js LTS via Chocolatey
- ✅ Installs Docker Desktop
- ✅ Configures environment
- ✅ Starts all services

**Options:**
```powershell
.\install.ps1 -Update       # Update existing installation
.\install.ps1 -Dev          # Development mode
.\install.ps1 -NoDocker     # Skip Docker installation
.\install.ps1 -VerboseMode  # Verbose output
```

**Requirements:**
- Windows 10 (1809+) or Windows 11
- Windows Server 2019+
- PowerShell 5.1+
- Administrator privileges

---

### 🐍 Cross-Platform (Python)

A lightweight Python alternative that works on all platforms:

```bash
# Requires Python 3.7+
python install.py

# Or with Python 3 specifically
python3 install.py
```

**Features:**
- ✅ Pure Python (no shell dependencies)
- ✅ Works on Linux, macOS, and Windows
- ✅ Lightweight and portable
- ✅ Easy to customize

**Options:**
```bash
python install.py --update     # Update installation
python install.py --dev        # Development mode
python install.py --no-docker  # Skip Docker
python install.py --verbose    # Verbose output
```

---

## 📋 System Requirements

### Minimum Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | >= 18.0.0 | LTS version recommended (20.11.0+) |
| **npm** | >= 10.0.0 | Included with Node.js |
| **Docker** | >= 20.10.0 | Docker Desktop on Windows/macOS |
| **Docker Compose** | >= 2.0.0 | Usually included with Docker |
| **RAM** | 4 GB | 8 GB recommended |
| **Disk Space** | 10 GB | 20 GB recommended |

### Recommended Requirements

- **Node.js**: 20.11.0 (LTS)
- **npm**: 10.4.0+
- **Docker**: 24.0.0+
- **RAM**: 8 GB
- **CPU**: 2+ cores
- **Disk**: SSD with 20+ GB free

---

## 🎯 Installation Methods Comparison

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **install.sh** | Linux/macOS users | Full automation, best integration | Bash only |
| **install.ps1** | Windows users | Native PowerShell, Chocolatey | Requires Admin |
| **install.py** | Cross-platform, Python devs | Portable, customizable | Requires Python |
| **setup.sh** | Docker pre-installed | Quick, simple | Manual dependencies |

---

## 🔧 Manual Installation

If you prefer manual control or automated scripts fail:

### Step 1: Install Prerequisites

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt update

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
```

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install Docker Desktop
brew install --cask docker
```

#### Windows
```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js LTS
choco install nodejs-lts -y

# Install Docker Desktop
choco install docker-desktop -y
```

### Step 2: Clone Repository

```bash
git clone https://github.com/msoutole/openpanel.git
cd openpanel
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # or vim, code, etc.

# Create frontend environment
cat > apps/web/.env.local <<EOF
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=OpenPanel
VITE_APP_VERSION=0.1.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
EOF
```

### Step 4: Install Dependencies

```bash
# Install npm dependencies
npm install
```

### Step 5: Start Services

```bash
# Start Docker services
docker compose up -d

# Wait for PostgreSQL (30-60 seconds)
# Check with: docker inspect --format='{{.State.Health.Status}}' openpanel-postgres

# Generate Prisma Client
npm run db:generate

# Sync database schema
npm run db:push
```

### Step 6: Start Application

```bash
# Start development servers
npm run dev

# Or start separately:
# Terminal 1:
npm run dev:api

# Terminal 2:
npm run dev:web
```

---

## ✅ Verification

After installation, verify everything is working:

### Automated Check

```bash
# Linux/macOS
./check-services.sh

# Windows (PowerShell)
.\check-services.ps1

# Python
python check-services.py
```

### Manual Verification

```bash
# Check Node.js
node -v  # Should show v18.0.0 or higher

# Check npm
npm -v   # Should show 10.0.0 or higher

# Check Docker
docker --version

# Check Docker is running
docker ps

# Check API
curl http://localhost:3001/health

# Check Frontend (in browser)
# Open http://localhost:3000
```

Expected output for health check:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T...",
  "version": "0.1.0"
}
```

---

## 🔄 Updating OpenPanel

### Automated Update

```bash
# Linux/macOS
./install.sh --update

# Windows
.\install.ps1 -Update

# Python
python install.py --update
```

### Manual Update

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Update Docker images
docker compose pull

# Restart services
docker compose up -d

# Update database schema
npm run db:push

# Rebuild application
npm run build
```

---

## 🐛 Troubleshooting

### Prisma Client Issues

**Error:** `Failed to fetch sha256 checksum`

```bash
# Set environment variable and regenerate
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run db:generate
```

### Docker Not Running

**Error:** `Cannot connect to Docker daemon`

```bash
# Linux
sudo systemctl start docker

# macOS
open -a Docker

# Windows
# Start Docker Desktop from Start Menu
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

```bash
# Find process using port (Linux/macOS)
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
echo "API_PORT=3002" >> .env
```

### PostgreSQL Not Healthy

```bash
# Check logs
docker logs openpanel-postgres

# Restart container
docker compose restart postgres

# If persistent, recreate
docker compose down
docker volume rm openpanel_postgres-data
docker compose up -d
```

### Permission Denied (Linux)

```bash
# Make scripts executable
chmod +x install.sh setup.sh check-services.sh

# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.config
sudo chown -R $USER:$(id -gn $USER) ~/.npm
```

---

## 📚 Next Steps

After successful installation:

1. **Create an account:**
   - Open http://localhost:3000
   - Click "Register"
   - Create your admin account

2. **Explore the dashboard:**
   - View system status
   - Check Docker containers
   - Configure settings

3. **Create your first project:**
   - Click "New Project"
   - Configure deployment
   - Deploy your application

4. **Read the documentation:**
   - [Quick Start Guide](QUICKSTART.md)
   - [Full Setup Guide](SETUP_GUIDE.md)
   - [Architecture Overview](CLAUDE.md)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs:**
   ```bash
   # Installation log
   cat install.log

   # API logs
   docker compose logs api

   # All service logs
   docker compose logs
   ```

2. **Run diagnostics:**
   ```bash
   ./check-services.sh  # Linux/macOS
   .\check-services.ps1  # Windows
   ```

3. **Check documentation:**
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed troubleshooting
   - [QUICKSTART.md](QUICKSTART.md) - Common issues

4. **Get support:**
   - GitHub Issues: https://github.com/msoutole/openpanel/issues
   - Discussions: https://github.com/msoutole/openpanel/discussions

---

## 🔐 Security Notes

### Before Production Deployment

⚠️ **IMPORTANT:** The default configuration uses insecure passwords. Before deploying to production:

1. **Generate secure JWT secret:**
   ```bash
   # Linux/macOS
   openssl rand -hex 64

   # Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Update `.env`:
   ```bash
   JWT_SECRET=<your-generated-secret>
   ```

2. **Change database password:**
   ```bash
   # In .env, replace:
   POSTGRES_PASSWORD=<strong-password>
   DATABASE_URL=postgresql://openpanel:<strong-password>@localhost:5432/openpanel
   ```

3. **Change Redis password:**
   ```bash
   # In .env, replace:
   REDIS_PASSWORD=<strong-password>
   REDIS_URL=redis://:<strong-password>@localhost:6379
   ```

4. **Configure CORS properly:**
   ```bash
   # In .env, set your production domain:
   CORS_ORIGIN=https://yourdomain.com
   ```

5. **Enable HTTPS:**
   - Configure SSL certificates
   - Use Let's Encrypt with Traefik
   - Update frontend URL to HTTPS

---

## 📦 Installation Scripts Summary

| Script | Platform | Command | Use Case |
|--------|----------|---------|----------|
| `install.sh` | Linux/macOS | `./install.sh` | **Recommended** for Unix systems |
| `install.ps1` | Windows | `.\install.ps1` | **Recommended** for Windows |
| `install.py` | Cross-platform | `python install.py` | Alternative for all platforms |
| `setup.sh` | Linux/macOS | `./setup.sh` | Quick setup (Docker required) |
| `check-services.sh` | Linux/macOS | `./check-services.sh` | Verify services status |

---

## 🎉 Success!

If you see the OpenPanel dashboard at http://localhost:3000, congratulations! Your installation is complete.

**What's next?**
- Deploy your first application
- Explore container management
- Set up automated backups
- Configure AI assistant (Ollama)
- Add custom domains

Happy deploying! 🚀
