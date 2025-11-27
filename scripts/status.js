#!/usr/bin/env node

const { execSync } = require('child_process');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

console.log(`${colors.green}========================================${colors.reset}`);
console.log(`${colors.green}  OpenPanel Status Checker${colors.reset}`);
console.log(`${colors.green}========================================${colors.reset}`);

// Function to check if Docker is running
function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    console.log(`${colors.green}✓ Docker is running${colors.reset}`);
    return true;
  } catch {
    console.log(`${colors.red}✗ Docker is not running${colors.reset}`);
    return false;
  }
}

// Function to check Docker services status
function checkDockerServices() {
  console.log(`\n${colors.cyan}Checking Docker services...${colors.reset}`);
  
  const services = ['openpanel-postgres', 'openpanel-redis', 'openpanel-ollama', 'openpanel-traefik'];
  
  services.forEach(service => {
    try {
      const status = execSync(`docker inspect --format='{{.State.Status}}' ${service}`, { 
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).toString().trim();
      
      const health = execSync(`docker inspect --format='{{.State.Health.Status}}' ${service}`, { 
        stdio: ['pipe', 'pipe', 'ignore'] 
      }).toString().trim();
      
      if (status === 'running') {
        if (health && health !== '<no value>') {
          if (health === 'healthy') {
            console.log(`${colors.green}✓ ${service} is running and healthy${colors.reset}`);
          } else {
            console.log(`${colors.yellow}⚠ ${service} is running but ${health}${colors.reset}`);
          }
        } else {
          console.log(`${colors.green}✓ ${service} is running${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}✗ ${service} is not running (Status: ${status})${colors.reset}`);
      }
    } catch {
      console.log(`${colors.red}✗ ${service} is not found or not running${colors.reset}`);
    }
  });
}

// Function to check if a port is listening
function checkPort(port, name) {
  try {
    // Try different methods to check port depending on OS
    if (process.platform === 'win32') {
      // On Windows, use PowerShell to check for listening ports
      execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port}"`, { stdio: 'ignore' });
    } else {
      // On Unix-like systems, use nc or ss
      try {
        execSync(`nc -z localhost ${port}`, { stdio: 'ignore' });
      } catch {
        execSync(`ss -tuln | grep :${port}`, { stdio: 'ignore' });
      }
    }
    console.log(`${colors.green}✓ ${name} is listening on port ${port}${colors.reset}`);
    return true;
  } catch {
    console.log(`${colors.yellow}⚠ ${name} is not listening on port ${port}${colors.reset}`);
    return false;
  }
}

// Function to check API endpoints
function checkAPIEndpoints() {
  console.log(`\n${colors.cyan}Checking API endpoints...${colors.reset}`);
  
  // Simple port checks for now
  checkPort(3001, 'API Server');
  checkPort(3000, 'Web Interface');
  checkPort(8080, 'Traefik Dashboard');
}

// Main execution
function main() {
  if (checkDocker()) {
    checkDockerServices();
    checkAPIEndpoints();
    
    console.log(`\n${colors.green}========================================${colors.reset}`);
    console.log(`${colors.cyan}📋 Summary:${colors.reset}`);
    console.log(`${colors.white}   Web Interface: http://localhost:3000${colors.reset}`);
    console.log(`${colors.white}   API Endpoint:  http://localhost:3001${colors.reset}`);
    console.log(`${colors.white}   Traefik Panel: http://localhost:8080${colors.reset}`);
    console.log(`${colors.white}   Default Admin: admin@openpanel.dev / admin123${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Please ensure Docker is installed and running.${colors.reset}`);
    console.log(`${colors.yellow}Then run this script again.${colors.reset}`);
  }
}

main();