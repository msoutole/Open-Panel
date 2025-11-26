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
