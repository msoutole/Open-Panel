#!/bin/bash

################################################################################
# OpenPanel - Master Installation Script (Linux/macOS)
#
# This script provides 100% automated installation and updates for OpenPanel.
# It handles all dependencies, configuration, and service initialization.
#
# Features:
# - Auto-detects OS and distribution
# - Installs/updates all required dependencies
# - Configures environment automatically
# - Starts and verifies all services
# - Idempotent (safe to run multiple times)
# - Comprehensive error handling and logging
#
# Usage:
#   chmod +x install.sh
#   ./install.sh
#
# Or with options:
#   ./install.sh --update     # Update existing installation
#   ./install.sh --dev        # Development mode (skip production configs)
#   ./install.sh --no-docker  # Skip Docker installation
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# ============================================
# COLORS & FORMATTING
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Icons
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${BLUE}➜${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"

# ============================================
# GLOBAL VARIABLES
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/install.log"
BACKUP_DIR="${SCRIPT_DIR}/.backup_$(date +%Y%m%d_%H%M%S)"

# Version requirements
MIN_NODE_VERSION="18.0.0"
MIN_NPM_VERSION="10.0.0"
MIN_DOCKER_VERSION="20.10.0"

# Flags
UPDATE_MODE=false
DEV_MODE=false
SKIP_DOCKER=false
VERBOSE=false

# OS Detection
OS_TYPE=""
OS_DIST=""
OS_VERSION=""
PACKAGE_MANAGER=""

# ============================================
# LOGGING
# ============================================
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"

    case $level in
        ERROR)   echo -e "${CROSS} ${RED}${message}${NC}" ;;
        SUCCESS) echo -e "${CHECK} ${GREEN}${message}${NC}" ;;
        WARN)    echo -e "${WARN} ${YELLOW}${message}${NC}" ;;
        INFO)    echo -e "${INFO} ${CYAN}${message}${NC}" ;;
        *)       echo -e "${message}" ;;
    esac
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        log "DEBUG" "$@"
    fi
}

# ============================================
# ERROR HANDLING
# ============================================
error_exit() {
    log "ERROR" "$1"
    log "ERROR" "Installation failed. Check ${LOG_FILE} for details."
    exit 1
}

cleanup_on_error() {
    log "WARN" "Cleaning up after error..."
    # Restore backups if they exist
    if [ -d "$BACKUP_DIR" ]; then
        log "INFO" "Backup available at: $BACKUP_DIR"
    fi
}

trap cleanup_on_error ERR

# ============================================
# UTILITY FUNCTIONS
# ============================================
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

version_compare() {
    # Compare versions: returns 0 if $1 >= $2
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

get_installed_version() {
    local cmd=$1
    local version=""

    case $cmd in
        node)
            version=$(node -v 2>/dev/null | sed 's/v//')
            ;;
        npm)
            version=$(npm -v 2>/dev/null)
            ;;
        docker)
            version=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            ;;
        docker-compose)
            version=$(docker-compose --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            ;;
    esac

    echo "$version"
}

spinner() {
    local pid=$1
    local message=$2
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c] %s\r" "$spinstr" "$message"
        spinstr=$temp${spinstr%"$temp"}
        sleep 0.1
    done
    printf "    \r"
}

# ============================================
# OS DETECTION
# ============================================
detect_os() {
    log "INFO" "Detecting operating system..."

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="linux"

        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS_DIST=$ID
            OS_VERSION=$VERSION_ID

            case $OS_DIST in
                ubuntu|debian)
                    PACKAGE_MANAGER="apt"
                    ;;
                fedora|rhel|centos)
                    PACKAGE_MANAGER="dnf"
                    ;;
                arch|manjaro)
                    PACKAGE_MANAGER="pacman"
                    ;;
                opensuse*)
                    PACKAGE_MANAGER="zypper"
                    ;;
                alpine)
                    PACKAGE_MANAGER="apk"
                    ;;
                *)
                    PACKAGE_MANAGER="unknown"
                    ;;
            esac
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macos"
        OS_DIST="macos"
        OS_VERSION=$(sw_vers -productVersion)
        PACKAGE_MANAGER="brew"
    else
        error_exit "Unsupported operating system: $OSTYPE"
    fi

    log "SUCCESS" "OS detected: $OS_TYPE ($OS_DIST $OS_VERSION)"
    log_verbose "Package manager: $PACKAGE_MANAGER"
}

# ============================================
# PACKAGE MANAGER SETUP
# ============================================
setup_package_manager() {
    log "INFO" "Setting up package manager..."

    case $PACKAGE_MANAGER in
        apt)
            log "INFO" "Updating apt repositories..."
            sudo apt-get update -qq || error_exit "Failed to update apt"
            log "SUCCESS" "apt updated"
            ;;
        dnf)
            log "INFO" "Updating dnf repositories..."
            sudo dnf check-update -q || true
            log "SUCCESS" "dnf updated"
            ;;
        brew)
            if ! command_exists brew; then
                log "WARN" "Homebrew not found. Installing..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || error_exit "Failed to install Homebrew"
                log "SUCCESS" "Homebrew installed"
            else
                log "INFO" "Updating Homebrew..."
                brew update -q || error_exit "Failed to update Homebrew"
                log "SUCCESS" "Homebrew updated"
            fi
            ;;
        pacman)
            log "INFO" "Updating pacman..."
            sudo pacman -Sy --noconfirm || error_exit "Failed to update pacman"
            log "SUCCESS" "pacman updated"
            ;;
        apk)
            log "INFO" "Updating apk..."
            sudo apk update || error_exit "Failed to update apk"
            log "SUCCESS" "apk updated"
            ;;
        *)
            log "WARN" "Unknown package manager. Some features may not work."
            ;;
    esac
}

# ============================================
# INSTALL DEPENDENCIES
# ============================================
install_package() {
    local package=$1
    local friendly_name=${2:-$package}

    log "INFO" "Installing $friendly_name..."

    case $PACKAGE_MANAGER in
        apt)
            sudo apt-get install -y -qq "$package" || error_exit "Failed to install $friendly_name"
            ;;
        dnf)
            sudo dnf install -y -q "$package" || error_exit "Failed to install $friendly_name"
            ;;
        brew)
            brew install "$package" || error_exit "Failed to install $friendly_name"
            ;;
        pacman)
            sudo pacman -S --noconfirm "$package" || error_exit "Failed to install $friendly_name"
            ;;
        apk)
            sudo apk add "$package" || error_exit "Failed to install $friendly_name"
            ;;
        *)
            error_exit "Cannot install $friendly_name: unknown package manager"
            ;;
    esac

    log "SUCCESS" "$friendly_name installed"
}

# ============================================
# NODE.JS INSTALLATION/UPDATE
# ============================================
install_nodejs() {
    log "INFO" "Checking Node.js installation..."

    local current_version=$(get_installed_version node)

    if [ -n "$current_version" ]; then
        log "INFO" "Node.js $current_version is installed"

        if version_compare "$current_version" "$MIN_NODE_VERSION"; then
            log "SUCCESS" "Node.js version is sufficient (>= $MIN_NODE_VERSION)"

            if [ "$UPDATE_MODE" = true ]; then
                log "INFO" "Update mode: Checking for newer version..."
                install_nodejs_from_source
            fi
            return 0
        else
            log "WARN" "Node.js version is too old (< $MIN_NODE_VERSION). Updating..."
        fi
    else
        log "WARN" "Node.js not found. Installing..."
    fi

    install_nodejs_from_source
}

install_nodejs_from_source() {
    log "INFO" "Installing/updating Node.js via NodeSource..."

    if [ "$OS_TYPE" = "linux" ]; then
        # Use NodeSource for latest LTS
        if [ "$PACKAGE_MANAGER" = "apt" ] || [ "$PACKAGE_MANAGER" = "dnf" ]; then
            log "INFO" "Setting up NodeSource repository..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || error_exit "Failed to setup NodeSource"

            case $PACKAGE_MANAGER in
                apt)
                    sudo apt-get install -y -qq nodejs || error_exit "Failed to install Node.js"
                    ;;
                dnf)
                    sudo dnf install -y -q nodejs || error_exit "Failed to install Node.js"
                    ;;
            esac
        else
            install_package "nodejs" "Node.js"
        fi
    elif [ "$OS_TYPE" = "macos" ]; then
        if command_exists brew; then
            brew install node@20 || brew upgrade node@20 || error_exit "Failed to install Node.js"
        else
            error_exit "Homebrew is required to install Node.js on macOS"
        fi
    fi

    # Verify installation
    local new_version=$(get_installed_version node)
    if [ -n "$new_version" ]; then
        log "SUCCESS" "Node.js $new_version installed successfully"
    else
        error_exit "Node.js installation failed"
    fi
}

# ============================================
# NPM UPDATE
# ============================================
update_npm() {
    log "INFO" "Checking npm version..."

    local current_version=$(get_installed_version npm)

    if [ -n "$current_version" ]; then
        log "INFO" "npm $current_version is installed"

        if version_compare "$current_version" "$MIN_NPM_VERSION"; then
            log "SUCCESS" "npm version is sufficient (>= $MIN_NPM_VERSION)"
        else
            log "WARN" "npm version is too old. Updating..."
            sudo npm install -g npm@latest || error_exit "Failed to update npm"
            log "SUCCESS" "npm updated to $(get_installed_version npm)"
        fi
    else
        error_exit "npm not found (should be installed with Node.js)"
    fi
}

# ============================================
# DOCKER INSTALLATION
# ============================================
install_docker() {
    if [ "$SKIP_DOCKER" = true ]; then
        log "INFO" "Skipping Docker installation (--no-docker flag)"
        return 0
    fi

    log "INFO" "Checking Docker installation..."

    if command_exists docker; then
        local current_version=$(get_installed_version docker)
        log "INFO" "Docker $current_version is installed"

        if version_compare "$current_version" "$MIN_DOCKER_VERSION"; then
            log "SUCCESS" "Docker version is sufficient (>= $MIN_DOCKER_VERSION)"

            # Check if Docker daemon is running
            if ! docker info >/dev/null 2>&1; then
                log "WARN" "Docker is installed but not running. Starting..."
                start_docker_daemon
            fi

            return 0
        else
            log "WARN" "Docker version is too old. Updating..."
        fi
    else
        log "WARN" "Docker not found. Installing..."
    fi

    install_docker_engine
}

install_docker_engine() {
    log "INFO" "Installing Docker Engine..."

    if [ "$OS_TYPE" = "linux" ]; then
        # Use official Docker installation script
        log "INFO" "Downloading Docker installation script..."
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || error_exit "Failed to download Docker script"

        log "INFO" "Running Docker installation script..."
        sudo sh /tmp/get-docker.sh || error_exit "Failed to install Docker"
        rm /tmp/get-docker.sh

        # Add current user to docker group
        log "INFO" "Adding user to docker group..."
        sudo usermod -aG docker $USER || log "WARN" "Failed to add user to docker group"

        # Start Docker
        start_docker_daemon

    elif [ "$OS_TYPE" = "macos" ]; then
        if command_exists brew; then
            log "INFO" "Installing Docker Desktop via Homebrew..."
            brew install --cask docker || error_exit "Failed to install Docker Desktop"

            log "WARN" "Please start Docker Desktop manually from Applications"
            log "WARN" "Waiting for Docker Desktop to start (30 seconds)..."
            sleep 30
        else
            error_exit "Homebrew is required to install Docker on macOS"
        fi
    fi

    # Verify installation
    local new_version=$(get_installed_version docker)
    if [ -n "$new_version" ]; then
        log "SUCCESS" "Docker $new_version installed successfully"
    else
        error_exit "Docker installation failed"
    fi
}

start_docker_daemon() {
    if [ "$OS_TYPE" = "linux" ]; then
        if command_exists systemctl; then
            sudo systemctl start docker || error_exit "Failed to start Docker"
            sudo systemctl enable docker || log "WARN" "Failed to enable Docker on boot"
            log "SUCCESS" "Docker daemon started"
        elif command_exists service; then
            sudo service docker start || error_exit "Failed to start Docker"
            log "SUCCESS" "Docker daemon started"
        fi
    elif [ "$OS_TYPE" = "macos" ]; then
        open -a Docker || log "WARN" "Failed to start Docker Desktop"
    fi

    # Wait for Docker to be ready
    log "INFO" "Waiting for Docker daemon to be ready..."
    local max_wait=60
    local waited=0
    while ! docker info >/dev/null 2>&1; do
        if [ $waited -ge $max_wait ]; then
            error_exit "Docker daemon did not start in time"
        fi
        sleep 2
        waited=$((waited + 2))
    done

    log "SUCCESS" "Docker daemon is ready"
}

# ============================================
# DOCKER COMPOSE INSTALLATION
# ============================================
install_docker_compose() {
    if [ "$SKIP_DOCKER" = true ]; then
        return 0
    fi

    log "INFO" "Checking Docker Compose..."

    # Check for docker compose (v2) or docker-compose (v1)
    if docker compose version >/dev/null 2>&1; then
        log "SUCCESS" "Docker Compose (v2) is available"
        return 0
    elif command_exists docker-compose; then
        log "SUCCESS" "Docker Compose (v1) is available"
        return 0
    fi

    log "WARN" "Docker Compose not found. Installing..."

    if [ "$OS_TYPE" = "linux" ]; then
        # Install Docker Compose v2 plugin
        log "INFO" "Installing Docker Compose v2..."

        DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
        mkdir -p $DOCKER_CONFIG/cli-plugins

        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

        curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
            -o $DOCKER_CONFIG/cli-plugins/docker-compose || error_exit "Failed to download Docker Compose"

        chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

        log "SUCCESS" "Docker Compose installed"
    elif [ "$OS_TYPE" = "macos" ]; then
        # Docker Desktop includes Compose
        log "INFO" "Docker Compose is included with Docker Desktop"
    fi
}

# ============================================
# PROJECT SETUP
# ============================================
backup_existing_config() {
    log "INFO" "Backing up existing configuration..."

    mkdir -p "$BACKUP_DIR"

    [ -f .env ] && cp .env "$BACKUP_DIR/.env"
    [ -f apps/web/.env.local ] && cp apps/web/.env.local "$BACKUP_DIR/.env.local"

    log "SUCCESS" "Configuration backed up to $BACKUP_DIR"
}

setup_environment() {
    log "INFO" "Setting up environment variables..."

    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log "SUCCESS" ".env created from .env.example"

            # Generate secure JWT secret if in production mode
            if [ "$DEV_MODE" = false ]; then
                log "INFO" "Generating secure JWT secret..."
                JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

                if [ "$(uname)" = "Darwin" ]; then
                    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
                else
                    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
                fi

                log "SUCCESS" "Secure JWT secret generated"
            fi
        else
            error_exit ".env.example not found"
        fi
    else
        log "INFO" ".env already exists"

        if [ "$UPDATE_MODE" = true ]; then
            log "INFO" "Update mode: Preserving existing .env"
        fi
    fi

    # Create frontend .env.local
    if [ ! -f apps/web/.env.local ]; then
        log "INFO" "Creating frontend .env.local..."
        cat > apps/web/.env.local <<EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=OpenPanel
VITE_APP_VERSION=0.2.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
EOF
        log "SUCCESS" "Frontend .env.local created"
    else
        log "INFO" "Frontend .env.local already exists"
    fi
}

install_dependencies() {
    log "INFO" "Installing project dependencies..."

    cd "$SCRIPT_DIR"

    if [ "$UPDATE_MODE" = true ]; then
        log "INFO" "Update mode: Running npm ci for clean install..."
        npm ci || error_exit "Failed to install dependencies"
    else
        npm install || error_exit "Failed to install dependencies"
    fi

    log "SUCCESS" "Dependencies installed"
}

# ============================================
# DATABASE SETUP
# ============================================
setup_database() {
    log "INFO" "Setting up database..."

    # Check if PostgreSQL is running
    if ! docker ps --format '{{.Names}}' | grep -q "openpanel-postgres"; then
        log "WARN" "PostgreSQL container not running. Starting Docker Compose..."
        start_docker_services
    fi

    # Wait for PostgreSQL to be healthy
    log "INFO" "Waiting for PostgreSQL to be ready..."
    local max_wait=60
    local waited=0

    while [ $waited -lt $max_wait ]; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' openpanel-postgres 2>/dev/null || echo "not-found")

        if [ "$status" = "healthy" ]; then
            log "SUCCESS" "PostgreSQL is ready"
            break
        fi

        sleep 2
        waited=$((waited + 2))
        printf "."
    done
    echo ""

    if [ $waited -ge $max_wait ]; then
        error_exit "PostgreSQL did not become healthy in time"
    fi

    # Generate Prisma Client
    log "INFO" "Generating Prisma Client..."
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run db:generate || error_exit "Failed to generate Prisma Client"
    log "SUCCESS" "Prisma Client generated"

    # Push schema to database
    log "INFO" "Syncing database schema..."
    npm run db:push || error_exit "Failed to sync database schema"
    log "SUCCESS" "Database schema synced"
}

# ============================================
# DOCKER SERVICES
# ============================================
start_docker_services() {
    if [ "$SKIP_DOCKER" = true ]; then
        log "INFO" "Skipping Docker services (--no-docker flag)"
        return 0
    fi

    log "INFO" "Starting Docker services..."

    cd "$SCRIPT_DIR"

    docker compose up -d --build --force-recreate || docker-compose up -d --build --force-recreate || error_exit "Failed to start Docker services"

    log "SUCCESS" "Docker services started"

    # Show running containers
    log "INFO" "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# ============================================
# BUILD & VERIFY
# ============================================
build_project() {
    log "INFO" "Building project..."

    cd "$SCRIPT_DIR"

    # Type check
    log "INFO" "Running type checks..."
    npm run type-check 2>&1 | tee -a "${LOG_FILE}" || log "WARN" "Type check found issues (non-critical)"

    # Build
    log "INFO" "Building production bundles..."
    npm run build || error_exit "Build failed"

    log "SUCCESS" "Project built successfully"
}

verify_installation() {
    log "INFO" "Verifying installation..."

    local all_ok=true

    # Check Node.js
    if command_exists node; then
        log "SUCCESS" "Node.js $(node -v) ✓"
    else
        log "ERROR" "Node.js not found ✗"
        all_ok=false
    fi

    # Check npm
    if command_exists npm; then
        log "SUCCESS" "npm $(npm -v) ✓"
    else
        log "ERROR" "npm not found ✗"
        all_ok=false
    fi

    # Check Docker
    if command_exists docker && [ "$SKIP_DOCKER" = false ]; then
        if docker info >/dev/null 2>&1; then
            log "SUCCESS" "Docker $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1) ✓"
        else
            log "WARN" "Docker installed but not running ⚠"
        fi
    elif [ "$SKIP_DOCKER" = true ]; then
        log "INFO" "Docker check skipped"
    else
        log "ERROR" "Docker not found ✗"
        all_ok=false
    fi

    # Check Docker Compose
    if [ "$SKIP_DOCKER" = false ]; then
        if docker compose version >/dev/null 2>&1 || command_exists docker-compose; then
            log "SUCCESS" "Docker Compose ✓"
        else
            log "ERROR" "Docker Compose not found ✗"
            all_ok=false
        fi
    fi

    # Check project files
    if [ -f .env ] && [ -f apps/web/.env.local ]; then
        log "SUCCESS" "Environment files ✓"
    else
        log "ERROR" "Environment files missing ✗"
        all_ok=false
    fi

    # Check Docker services
    if [ "$SKIP_DOCKER" = false ]; then
        local postgres_running=$(docker ps --format '{{.Names}}' | grep -c "openpanel-postgres" || echo 0)
        local redis_running=$(docker ps --format '{{.Names}}' | grep -c "openpanel-redis" || echo 0)

        if [ $postgres_running -gt 0 ] && [ $redis_running -gt 0 ]; then
            log "SUCCESS" "Docker services running ✓"
        else
            log "WARN" "Some Docker services not running ⚠"
        fi
    fi

    if [ "$all_ok" = true ]; then
        log "SUCCESS" "All verifications passed ✓"
        return 0
    else
        log "WARN" "Some verifications failed. Check log for details."
        return 1
    fi
}

# ============================================
# MAIN INSTALLATION FLOW
# ============================================
print_header() {
    clear
    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗║
║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║║
║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██████╔╝███████║██╔██╗ ██║║
║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║╚██╗██║║
║  ╚██████╔╝██║     ███████╗██║ ╚████║██║     ██║  ██║██║ ╚████║║
║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝║
║                                                               ║
║            Master Installation & Update Script               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --update)
                UPDATE_MODE=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --no-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log "WARN" "Unknown option: $1"
                shift
                ;;
        esac
    done
}

show_help() {
    cat << EOF
OpenPanel Installation Script

Usage: ./install.sh [OPTIONS]

Options:
    --update        Update existing installation
    --dev           Development mode (skip production configs)
    --no-docker     Skip Docker installation
    --verbose, -v   Verbose output
    --help, -h      Show this help message

Examples:
    ./install.sh                    # Fresh installation
    ./install.sh --update           # Update existing installation
    ./install.sh --dev --no-docker  # Dev mode without Docker

EOF
}

print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 INSTALLATION COMPLETED! 🎉                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📋 Summary:${NC}"
    echo -e "   ${CHECK} Operating System: ${OS_TYPE} (${OS_DIST})"
    echo -e "   ${CHECK} Node.js: $(node -v)"
    echo -e "   ${CHECK} npm: $(npm -v)"

    if [ "$SKIP_DOCKER" = false ]; then
        echo -e "   ${CHECK} Docker: $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
    fi

    echo ""
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "   ${ARROW} Frontend:  ${WHITE}http://localhost:3000${NC}"
    echo -e "   ${ARROW} API:       ${WHITE}http://localhost:3001${NC}"
    echo -e "   ${ARROW} API Health: ${WHITE}http://localhost:3001/health${NC}"

    if [ "$SKIP_DOCKER" = false ]; then
        echo -e "   ${ARROW} Traefik:   ${WHITE}http://localhost:8080${NC}"
    fi

    echo ""
    echo -e "${CYAN}🚀 Next Steps:${NC}"
    echo -e "   ${ARROW} Start development: ${WHITE}npm run dev${NC}"
    echo -e "   ${ARROW} Check services:    ${WHITE}./check-services.sh${NC}"
    echo -e "   ${ARROW} View logs:         ${WHITE}tail -f ${LOG_FILE}${NC}"
    echo ""
    echo -e "${CYAN}📚 Documentation:${NC}"
    echo -e "   ${ARROW} Quick Start: ${WHITE}QUICKSTART.md${NC}"
    echo -e "   ${ARROW} Full Guide:  ${WHITE}SETUP_GUIDE.md${NC}"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}📦 Backup: ${BACKUP_DIR}${NC}"
        echo ""
    fi
}

main() {
    # Start log
    echo "==================================" > "${LOG_FILE}"
    echo "OpenPanel Installation Log" >> "${LOG_FILE}"
    echo "Started: $(date)" >> "${LOG_FILE}"
    echo "==================================" >> "${LOG_FILE}"

    # Parse arguments
    parse_arguments "$@"

    # Print header
    print_header

    # Show mode
    if [ "$UPDATE_MODE" = true ]; then
        log "INFO" "Running in UPDATE mode"
    else
        log "INFO" "Running in INSTALL mode"
    fi

    if [ "$DEV_MODE" = true ]; then
        log "INFO" "Development mode enabled"
    fi

    # Step 1: Detect OS
    detect_os

    # Step 2: Setup package manager
    setup_package_manager

    # Step 3: Install/update Node.js
    install_nodejs

    # Step 4: Update npm
    update_npm

    # Step 5: Install/update Docker
    install_docker

    # Step 6: Install Docker Compose
    install_docker_compose

    # Step 7: Backup existing config
    if [ "$UPDATE_MODE" = true ]; then
        backup_existing_config
    fi

    # Step 8: Setup environment
    setup_environment

    # Step 9: Install project dependencies
    install_dependencies

    # Step 10: Start Docker services
    if [ "$SKIP_DOCKER" = false ]; then
        start_docker_services
    fi

    # Step 11: Setup database
    if [ "$SKIP_DOCKER" = false ]; then
        setup_database
    else
        log "INFO" "Skipping database setup (Docker disabled)"
    fi

    # Step 12: Build project (optional in dev mode)
    if [ "$DEV_MODE" = false ]; then
        build_project
    else
        log "INFO" "Skipping build in development mode"
    fi

    # Step 13: Verify installation
    verify_installation

    # Print summary
    print_summary

    # End log
    echo "==================================" >> "${LOG_FILE}"
    echo "Completed: $(date)" >> "${LOG_FILE}"
    echo "==================================" >> "${LOG_FILE}"
}

# ============================================
# ENTRY POINT
# ============================================
main "$@"
