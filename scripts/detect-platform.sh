#!/bin/bash

# Detect platform and configure environment variables
# This script detects the OS and sets the appropriate DOCKER_SOCK value

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows (native or Git Bash)
    PLATFORM="windows"
    DOCKER_SOCK="//./pipe/docker_engine"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PLATFORM="linux"
    DOCKER_SOCK="/var/run/docker.sock"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PLATFORM="macos"
    DOCKER_SOCK="/var/run/docker.sock"
elif grep -qi "microsoft" /proc/version 2>/dev/null; then
    # WSL2
    PLATFORM="wsl2"
    DOCKER_SOCK="/var/run/docker.sock"
else
    # Default to Linux
    PLATFORM="linux"
    DOCKER_SOCK="/var/run/docker.sock"
fi

echo "Detected Platform: $PLATFORM"
echo "Docker Socket: $DOCKER_SOCK"

# Update .env file with DOCKER_SOCK value
if [ -f "$ENV_FILE" ]; then
    # Check if DOCKER_SOCK is already in the file
    if grep -q "^DOCKER_SOCK=" "$ENV_FILE"; then
        # Replace existing value
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^DOCKER_SOCK=.*|DOCKER_SOCK=$DOCKER_SOCK|" "$ENV_FILE"
        else
            sed -i "s|^DOCKER_SOCK=.*|DOCKER_SOCK=$DOCKER_SOCK|" "$ENV_FILE"
        fi
        echo "✓ Updated DOCKER_SOCK in .env"
    else
        # Add new line (shouldn't happen if .env is properly set up)
        echo "DOCKER_SOCK=$DOCKER_SOCK" >> "$ENV_FILE"
        echo "✓ Added DOCKER_SOCK to .env"
    fi
else
    echo "✗ .env file not found. Please create it from .env.example first."
    exit 1
fi

echo "Platform detection complete!"
