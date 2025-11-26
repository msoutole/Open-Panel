# User Stories

## Installation & Setup

### Auto-Installation
**As a** new user,
**I want** to run a single script to set up the project,
**So that** I don't have to manually install dependencies and configure the environment.

**Acceptance Criteria:**
- Script detects OS (Windows vs Linux/macOS).
- Script checks for Node.js and Docker.
- Script installs missing prerequisites automatically.
- Script sets up `.env` file.
- Script starts necessary services (DB, Redis).
- Script prepares the database.

## Development & Operations

### Windows Development Environment
**As a** developer on Windows,
**I want** the API and health checks to work seamlessly on Windows,
**So that** I can develop and test the application locally without compatibility issues.

**Acceptance Criteria:**
- Docker service connects via Windows named pipes.
- Health checks (disk space, Docker) work on Windows.
- System reports "healthy" status on Windows environment.
- No Unix-specific commands cause failures.
