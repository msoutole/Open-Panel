# Implementation Plans

## [COMPLETED] Fix API Health Checks for Windows

### Goal
Fix API health checks to be compatible with Windows environment.

### Completed Changes
- **Docker Service**: Updated to use Windows named pipes (`//./pipe/docker_engine`).
- **Health Service**: Updated to use `fs.statfs` or PowerShell for disk checks.
- **Status**: ✅ System now reports "healthy" on Windows.

---

## Auto-Install Scripts Implementation Plan

### Goal Description
Create auto-install scripts to simplify the setup process of Open-Panel on Windows, Linux, and macOS.

## User Review Required
- [ ] Confirm if specific prerequisites (like Docker, Node.js version) should be checked or installed by the script.

## Proposed Changes

### Scripts
#### [NEW] [setup.sh](file:///d:/Open-Panel/setup.sh)
- **Prerequisites Check & Auto-Install**: 
    - Check for Node.js. If missing, attempt to install using `nvm` (if available) or system package manager (`apt`, `brew`, etc.).
    - Check for Docker. If missing, attempt to install using official Docker convenience script or system package manager.
- **Dependency Installation**: `npm install`.
- **Environment Setup**: 
    - Check if `.env` exists. If not, copy `.env.example`.
    - If `.env` exists, ensure critical keys are present (basic check).
- **Docker Services**: 
    - Check if containers are already running.
    - Run `docker-compose up -d` (idempotent, will reuse existing containers if config matches).
- **Database Setup**: 
    - Run `npm run db:generate`.
    - Run `npm run db:migrate` (safe for existing data).
- **Completion**: Print success message.

#### [NEW] [setup.ps1](file:///d:/Open-Panel/setup.ps1)
- **Prerequisites Check & Auto-Install**: 
    - Check for Node.js. If missing, try `winget install OpenJS.NodeJS`.
    - Check for Docker. If missing, try `winget install Docker.DockerDesktop`.
- **Dependency Installation**: `npm install`.
- **Environment Setup**: Copy `.env.example` to `.env` if missing.
- **Docker Services**: `docker-compose up -d`.
- **Database Setup**: 
    - `npm run db:generate`
    - `npm run db:migrate`
- **Completion**: Write-Host success message.

### Documentation
#### [MODIFY] [README.md](file:///d:/Open-Panel/README.md)
- Add "Quick Start" section with auto-install details.

## Verification Plan
### Manual Verification
- Review script logic.
- User to test on their respective OS.
