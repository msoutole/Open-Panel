#!/usr/bin/env python3
"""
OpenPanel - Cross-Platform Installation Script (Python)

This script provides automated installation for OpenPanel across all platforms.
It's a lightweight alternative to the bash and PowerShell scripts.

Features:
- Works on Linux, macOS, and Windows
- Auto-detects OS and installs dependencies
- Configures environment
- Starts services
- Comprehensive error handling

Usage:
    python install.py                # Fresh installation
    python install.py --update       # Update existing installation
    python install.py --dev          # Development mode
    python install.py --no-docker    # Skip Docker

Requirements:
    - Python 3.7+
"""

import sys
import os
import platform
import subprocess
import shutil
import argparse
import logging
from pathlib import Path
from datetime import datetime
import json
import re

# ============================================
# CONSTANTS
# ============================================
MIN_PYTHON_VERSION = (3, 7)
MIN_NODE_VERSION = "18.0.0"
MIN_NPM_VERSION = "10.0.0"
MIN_DOCKER_VERSION = "20.10.0"

# Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Icons
CHECK = f"{Colors.GREEN}✓{Colors.ENDC}"
CROSS = f"{Colors.RED}✗{Colors.ENDC}"
WARN = f"{Colors.YELLOW}⚠{Colors.ENDC}"
INFO = f"{Colors.CYAN}ℹ{Colors.ENDC}"

# ============================================
# LOGGING SETUP
# ============================================
def setup_logging(script_dir):
    """Setup logging to file and console"""
    log_file = script_dir / "install.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

    return logging.getLogger(__name__)

# ============================================
# UTILITY FUNCTIONS
# ============================================
def print_header():
    """Print installation header"""
    os.system('cls' if platform.system() == 'Windows' else 'clear')
    print(f"{Colors.BLUE}")
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║                                                               ║")
    print("║   ██████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗║")
    print("║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║║")
    print("║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██████╔╝███████║██╔██╗ ██║║")
    print("║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║╚██╗██║║")
    print("║  ╚██████╔╝██║     ███████╗██║ ╚████║██║     ██║  ██║██║ ╚████║║")
    print("║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝║")
    print("║                                                               ║")
    print("║            Cross-Platform Installation Script                ║")
    print("║                     Python Edition                           ║")
    print("║                                                               ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")

def run_command(cmd, check=True, capture_output=True, shell=False):
    """Run shell command and return result"""
    try:
        if isinstance(cmd, str) and not shell:
            cmd = cmd.split()

        result = subprocess.run(
            cmd,
            check=check,
            capture_output=capture_output,
            text=True,
            shell=shell
        )
        return result
    except subprocess.CalledProcessError as e:
        if check:
            raise
        return e
    except FileNotFoundError:
        return None

def command_exists(cmd):
    """Check if a command exists"""
    return shutil.which(cmd) is not None

def compare_versions(version1, version2):
    """Compare two version strings"""
    def normalize(v):
        return [int(x) for x in re.sub(r'(\.0+)*$','', v).split(".")]

    return normalize(version1) >= normalize(version2)

def get_installed_version(cmd):
    """Get installed version of a command"""
    try:
        if cmd == 'node':
            result = run_command(['node', '-v'], check=False)
            if result and result.returncode == 0:
                return result.stdout.strip().replace('v', '')

        elif cmd == 'npm':
            result = run_command(['npm', '-v'], check=False)
            if result and result.returncode == 0:
                return result.stdout.strip()

        elif cmd == 'docker':
            result = run_command(['docker', '--version'], check=False)
            if result and result.returncode == 0:
                match = re.search(r'(\d+\.\d+\.\d+)', result.stdout)
                if match:
                    return match.group(1)

    except Exception:
        pass

    return None

# ============================================
# OS DETECTION
# ============================================
class OSDetector:
    def __init__(self):
        self.system = platform.system()
        self.machine = platform.machine()
        self.dist = None
        self.version = None
        self.package_manager = None

        self._detect()

    def _detect(self):
        """Detect OS and package manager"""
        if self.system == 'Linux':
            self._detect_linux()
        elif self.system == 'Darwin':
            self._detect_macos()
        elif self.system == 'Windows':
            self._detect_windows()

    def _detect_linux(self):
        """Detect Linux distribution"""
        try:
            with open('/etc/os-release') as f:
                lines = f.readlines()
                info = {}
                for line in lines:
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        info[key] = value.strip('"')

                self.dist = info.get('ID', 'unknown')
                self.version = info.get('VERSION_ID', 'unknown')

                # Determine package manager
                if self.dist in ['ubuntu', 'debian']:
                    self.package_manager = 'apt'
                elif self.dist in ['fedora', 'rhel', 'centos']:
                    self.package_manager = 'dnf'
                elif self.dist in ['arch', 'manjaro']:
                    self.package_manager = 'pacman'
                elif self.dist == 'alpine':
                    self.package_manager = 'apk'
                else:
                    self.package_manager = 'unknown'

        except FileNotFoundError:
            self.dist = 'unknown'
            self.package_manager = 'unknown'

    def _detect_macos(self):
        """Detect macOS version"""
        self.dist = 'macos'
        self.version = platform.mac_ver()[0]
        self.package_manager = 'brew'

    def _detect_windows(self):
        """Detect Windows version"""
        self.dist = 'windows'
        self.version = platform.version()
        self.package_manager = 'choco'

    def __str__(self):
        return f"{self.system} ({self.dist} {self.version})"

# ============================================
# INSTALLER CLASS
# ============================================
class OpenPanelInstaller:
    def __init__(self, args, logger):
        self.args = args
        self.logger = logger
        self.os = OSDetector()
        self.script_dir = Path(__file__).parent.absolute()
        self.backup_dir = None

    def log(self, level, message, icon=None):
        """Log message with icon"""
        if icon:
            print(f"{icon} {message}")
        else:
            if level == 'success':
                print(f"{CHECK} {message}")
            elif level == 'error':
                print(f"{CROSS} {Colors.RED}{message}{Colors.ENDC}")
            elif level == 'warn':
                print(f"{WARN} {Colors.YELLOW}{message}{Colors.ENDC}")
            elif level == 'info':
                print(f"{INFO} {Colors.CYAN}{message}{Colors.ENDC}")

        # Also log to file
        if level == 'error':
            self.logger.error(message)
        elif level == 'warn':
            self.logger.warning(message)
        else:
            self.logger.info(message)

    def install_nodejs(self):
        """Install or update Node.js"""
        self.log('info', "Checking Node.js installation...")

        current_version = get_installed_version('node')

        if current_version:
            self.log('info', f"Node.js {current_version} is installed")

            if compare_versions(current_version, MIN_NODE_VERSION):
                self.log('success', f"Node.js version is sufficient (>= {MIN_NODE_VERSION})")
                return

        self.log('warn', "Node.js not found or outdated. Please install Node.js manually.")
        self.log('info', "Visit: https://nodejs.org/")

        if self.os.system != 'Windows':
            self.log('info', "Or use your package manager:")
            if self.os.package_manager == 'apt':
                self.log('info', "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -")
                self.log('info', "  sudo apt-get install -y nodejs")
            elif self.os.package_manager == 'brew':
                self.log('info', "  brew install node@20")
            elif self.os.package_manager == 'dnf':
                self.log('info', "  sudo dnf install nodejs")

        sys.exit(1)

    def update_npm(self):
        """Update npm"""
        self.log('info', "Checking npm version...")

        current_version = get_installed_version('npm')

        if current_version:
            self.log('info', f"npm {current_version} is installed")

            if compare_versions(current_version, MIN_NPM_VERSION):
                self.log('success', f"npm version is sufficient (>= {MIN_NPM_VERSION})")
            else:
                self.log('warn', "npm version is too old. Updating...")
                run_command(['npm', 'install', '-g', 'npm@latest'])
                self.log('success', "npm updated")

    def check_docker(self):
        """Check Docker installation"""
        if self.args.no_docker:
            self.log('info', "Skipping Docker check (--no-docker flag)")
            return

        self.log('info', "Checking Docker installation...")

        if command_exists('docker'):
            # Check if Docker daemon is running
            try:
                run_command(['docker', 'info'], capture_output=True)
                self.log('success', "Docker is installed and running")
            except:
                self.log('warn', "Docker is installed but not running")
                self.log('info', "Please start Docker Desktop manually")
        else:
            self.log('warn', "Docker not found")
            self.log('info', "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop")

            if not self.args.no_docker:
                response = input("Continue without Docker? (y/N): ")
                if response.lower() != 'y':
                    sys.exit(1)

    def setup_environment(self):
        """Setup environment files"""
        self.log('info', "Setting up environment variables...")

        # Create .env
        env_file = self.script_dir / '.env'
        env_example = self.script_dir / '.env.example'

        if not env_file.exists():
            if env_example.exists():
                shutil.copy(env_example, env_file)
                self.log('success', ".env created from .env.example")

                # Generate JWT secret in production mode
                if not self.args.dev:
                    self.log('info', "Generating secure JWT secret...")
                    import secrets
                    jwt_secret = secrets.token_hex(64)

                    # Replace JWT_SECRET in .env
                    with open(env_file, 'r') as f:
                        content = f.read()
                    content = re.sub(r'JWT_SECRET=.*', f'JWT_SECRET={jwt_secret}', content)
                    with open(env_file, 'w') as f:
                        f.write(content)

                    self.log('success', "Secure JWT secret generated")
            else:
                self.log('error', ".env.example not found")
                sys.exit(1)
        else:
            self.log('info', ".env already exists")

        # Create frontend .env.local
        web_env = self.script_dir / 'apps' / 'web' / '.env.local'

        if not web_env.exists():
            self.log('info', "Creating frontend .env.local...")
            content = """# Frontend Environment Variables
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=OpenPanel
VITE_APP_VERSION=0.3.0
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_MONITORING=true
"""
            web_env.write_text(content)
            self.log('success', "Frontend .env.local created")
        else:
            self.log('info', "Frontend .env.local already exists")

    def install_dependencies(self):
        """Install npm dependencies"""
        self.log('info', "Installing project dependencies...")

        os.chdir(self.script_dir)

        try:
            if self.args.update:
                self.log('info', "Update mode: Running npm ci...")
                run_command(['npm', 'ci'], capture_output=False)
            else:
                run_command(['npm', 'install'], capture_output=False)

            self.log('success', "Dependencies installed")
        except Exception as e:
            self.log('error', f"Failed to install dependencies: {e}")
            sys.exit(1)

    def start_docker_services(self):
        """Start Docker services"""
        if self.args.no_docker:
            return

        self.log('info', "Starting Docker services...")

        try:
            # Try docker compose v2 first, then v1
            try:
                run_command(['docker', 'compose', 'up', '-d'], capture_output=False)
            except:
                run_command(['docker-compose', 'up', '-d'], capture_output=False)

            self.log('success', "Docker services started")
        except Exception as e:
            self.log('warn', f"Failed to start Docker services: {e}")
            self.log('info', "You may need to start services manually with: docker compose up -d")

    def setup_database(self):
        """Setup database"""
        if self.args.no_docker:
            self.log('info', "Skipping database setup (--no-docker flag)")
            return

        self.log('info', "Setting up database...")

        import time

        # Wait for PostgreSQL
        self.log('info', "Waiting for PostgreSQL to be ready...")
        max_wait = 60
        waited = 0

        while waited < max_wait:
            try:
                result = run_command(['docker', 'inspect', '--format={{.State.Health.Status}}', 'openpanel-postgres'], check=False)
                if result and 'healthy' in result.stdout:
                    self.log('success', "PostgreSQL is ready")
                    break
            except:
                pass

            time.sleep(2)
            waited += 2
            print(".", end="", flush=True)

        print()

        if waited >= max_wait:
            self.log('warn', "PostgreSQL did not become healthy in time")
            return

        # Generate Prisma client
        self.log('info', "Generating Prisma Client...")
        os.environ['PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING'] = '1'

        try:
            run_command(['npm', 'run', 'db:generate'], capture_output=False)
            self.log('success', "Prisma Client generated")
        except:
            self.log('warn', "Prisma Client generation failed (may need manual setup)")

        # Push schema
        self.log('info', "Syncing database schema...")
        try:
            run_command(['npm', 'run', 'db:push'], capture_output=False)
            self.log('success', "Database schema synced")
        except:
            self.log('warn', "Database schema sync failed (may need manual setup)")

    def verify_installation(self):
        """Verify installation"""
        self.log('info', "Verifying installation...")

        all_ok = True

        # Check Node.js
        if command_exists('node'):
            version = get_installed_version('node')
            self.log('success', f"Node.js {version} ✓")
        else:
            self.log('error', "Node.js not found ✗")
            all_ok = False

        # Check npm
        if command_exists('npm'):
            version = get_installed_version('npm')
            self.log('success', f"npm {version} ✓")
        else:
            self.log('error', "npm not found ✗")
            all_ok = False

        # Check Docker
        if not self.args.no_docker:
            if command_exists('docker'):
                try:
                    run_command(['docker', 'info'], capture_output=True)
                    version = get_installed_version('docker')
                    self.log('success', f"Docker {version} ✓")
                except:
                    self.log('warn', "Docker installed but not running ⚠")
            else:
                self.log('warn', "Docker not found ⚠")

        # Check env files
        if (self.script_dir / '.env').exists() and (self.script_dir / 'apps' / 'web' / '.env.local').exists():
            self.log('success', "Environment files ✓")
        else:
            self.log('error', "Environment files missing ✗")
            all_ok = False

        return all_ok

    def print_summary(self):
        """Print installation summary"""
        print()
        print(f"{Colors.GREEN}╔═══════════════════════════════════════════════════════════════╗{Colors.ENDC}")
        print(f"{Colors.GREEN}║                 INSTALLATION COMPLETED! 🎉                    ║{Colors.ENDC}")
        print(f"{Colors.GREEN}╚═══════════════════════════════════════════════════════════════╝{Colors.ENDC}")
        print()

        print(f"{Colors.CYAN}📋 Summary:{Colors.ENDC}")
        print(f"   {CHECK} Operating System: {self.os}")
        print(f"   {CHECK} Node.js: {get_installed_version('node')}")
        print(f"   {CHECK} npm: {get_installed_version('npm')}")

        if not self.args.no_docker and command_exists('docker'):
            print(f"   {CHECK} Docker: {get_installed_version('docker')}")

        print()
        print(f"{Colors.CYAN}🌐 Access URLs:{Colors.ENDC}")
        print(f"   {INFO} Frontend:    http://localhost:3000")
        print(f"   {INFO} API:         http://localhost:3001")
        print(f"   {INFO} API Health:  http://localhost:3001/health")

        if not self.args.no_docker:
            print(f"   {INFO} Traefik:     http://localhost:8080")

        print()
        print(f"{Colors.CYAN}🚀 Next Steps:{Colors.ENDC}")
        print(f"   {INFO} Start development: npm run dev")
        print(f"   {INFO} Check services:    python check-services.py")
        print(f"   {INFO} View logs:         tail -f install.log")

        print()
        print(f"{Colors.CYAN}📚 Documentation:{Colors.ENDC}")
        print(f"   {INFO} Quick Start: QUICKSTART.md")
        print(f"   {INFO} Full Guide:  SETUP_GUIDE.md")
        print()

    def run(self):
        """Main installation flow"""
        try:
            # Step 1: Install/check Node.js
            self.install_nodejs()

            # Step 2: Update npm
            self.update_npm()

            # Step 3: Check Docker
            self.check_docker()

            # Step 4: Setup environment
            self.setup_environment()

            # Step 5: Install dependencies
            self.install_dependencies()

            # Step 6: Start Docker services
            self.start_docker_services()

            # Step 7: Setup database
            self.setup_database()

            # Step 8: Verify installation
            success = self.verify_installation()

            # Step 9: Print summary
            self.print_summary()

            return 0 if success else 1

        except KeyboardInterrupt:
            print()
            self.log('warn', "Installation cancelled by user")
            return 1
        except Exception as e:
            self.log('error', f"Installation failed: {e}")
            self.logger.exception("Installation error")
            return 1

# ============================================
# MAIN
# ============================================
def main():
    # Check Python version
    if sys.version_info < MIN_PYTHON_VERSION:
        print(f"{CROSS} Python {MIN_PYTHON_VERSION[0]}.{MIN_PYTHON_VERSION[1]}+ is required")
        sys.exit(1)

    # Parse arguments
    parser = argparse.ArgumentParser(description='OpenPanel Installation Script')
    parser.add_argument('--update', action='store_true', help='Update existing installation')
    parser.add_argument('--dev', action='store_true', help='Development mode')
    parser.add_argument('--no-docker', action='store_true', help='Skip Docker installation')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    args = parser.parse_args()

    # Setup logging
    script_dir = Path(__file__).parent.absolute()
    logger = setup_logging(script_dir)

    # Print header
    print_header()

    # Show mode
    if args.update:
        print(f"{INFO} Running in UPDATE mode")
    else:
        print(f"{INFO} Running in INSTALL mode")

    if args.dev:
        print(f"{INFO} Development mode enabled")

    print()

    # Run installer
    installer = OpenPanelInstaller(args, logger)
    exit_code = installer.run()

    sys.exit(exit_code)

if __name__ == '__main__':
    main()
