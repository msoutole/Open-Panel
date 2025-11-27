# Features

## Core Features

- **Auto-Install Scripts**: Cross-platform scripts (`setup.sh`, `setup.ps1`) for one-click setup.
  - Automatic dependency detection and installation (Node.js, Docker).
  - Environment configuration.
  - Database initialization.

## Cross-Platform Compatibility

- **Windows Support**: Full compatibility with Windows environments.
  - Docker connection via Windows named pipes (`//./pipe/docker_engine`).
  - Disk space monitoring using `fs.statfs` (Node 18+) or PowerShell fallback.
  - Health checks adapted for Windows command availability.

