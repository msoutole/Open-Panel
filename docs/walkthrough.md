# Auto-Install Scripts Walkthrough

## Overview
Created cross-platform auto-install scripts to streamline the setup process for Open-Panel.

## Changes
### 1. `setup.sh` (Linux/macOS)
- Checks for Node.js and Docker.
- Installs them if missing (using `apt`, `brew`, `dnf`, or `curl`).
- Sets up `.env`.
- Installs npm dependencies.
- Starts Docker services.
- Runs database migrations.

### 2. `setup.ps1` (Windows)
- Checks for Node.js and Docker.
- Installs them via `winget` if missing.
- Sets up `.env`.
- Installs npm dependencies.
- Starts Docker services.
- Runs database migrations.

### 3. Documentation
- Updated `README.md` with Quick Start instructions.

## Verification
- Scripts were created with logic to handle missing dependencies and existing configurations.
- `setup.ps1` uses `Test-CommandExists` to safely check for tools.
- `setup.sh` uses `command -v` for portability.
- **Fix Applied**: Added a health check loop to wait for the PostgreSQL container to be ready.
- **Improvement**: Switched from `db:migrate` to `db:push` to avoid interactive prompts and handle existing database states more gracefully during setup.

## Fix API Health Checks on Windows
### Changes
- **Docker Service**: Updated `docker.ts` to use named pipes (`//./pipe/docker_engine`) on Windows.
- **Health Service**: Updated `health.ts` to use `fs.statfs` (Node 18+) or PowerShell for disk space checks on Windows, replacing the Unix-only `df` command.

### Verification
- Verified that the API starts without errors.
- Confirmed "System is healthy" log message in the terminal.
