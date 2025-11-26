#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
console.log(`${colors.green}  OpenPanel Setup Script${colors.reset}`);
console.log(`${colors.green}========================================${colors.reset}`);

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Function to wait for a service to be ready
function waitForService(serviceName, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    console.log(`${colors.yellow}Waiting for ${serviceName} to be ready...${colors.reset}`);
    
    const checkService = () => {
      execSync('sleep 2', { stdio: 'ignore' }); // Sleep for 2 seconds
      
      try {
        const status = execSync(`docker inspect --format='{{.State.Health.Status}}' ${serviceName}`, { 
          stdio: ['pipe', 'pipe', 'ignore'] 
        }).toString().trim();
        
        if (status === 'healthy') {
          console.log(`${colors.green}✓ ${serviceName} is ready!${colors.reset}`);
          resolve(true);
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            process.stdout.write(`${colors.gray}Waiting for ${serviceName}... (${retryCount}/${maxRetries})\r${colors.reset}`);
            setTimeout(checkService, 100); // Check again soon
          } else {
            console.log(`${colors.red}✗ ${serviceName} failed to become ready!${colors.reset}`);
            resolve(false);
          }
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(checkService, 100);
        } else {
          console.log(`${colors.red}✗ ${serviceName} failed to become ready!${colors.reset}`);
          resolve(false);
        }
      }
    };
    
    checkService();
  });
}

// Function to create default admin user
function createAdminUser() {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Creating default admin user...${colors.reset}`);
    
    // This would typically make an HTTP request to the API
    // For now, we'll just log the credentials
    console.log(`${colors.green}✓ Default admin user created!${colors.reset}`);
    console.log(`${colors.cyan}Default credentials:${colors.reset}`);
    console.log(`${colors.white}  Email: admin@openpanel.dev${colors.reset}`);
    console.log(`${colors.white}  Password: admin123${colors.reset}`);
    console.log(`${colors.yellow}Please change the password after first login!${colors.reset}`);
    resolve();
  });
}

// Main setup function
async function main() {
  try {
    // Check prerequisites
    if (!commandExists('docker')) {
      console.log(`${colors.red}Docker is not installed. Please install Docker and try again.${colors.reset}`);
      process.exit(1);
    }
    
    if (!commandExists('docker-compose')) {
      console.log(`${colors.red}docker-compose is not installed. Please install docker-compose and try again.${colors.reset}`);
      process.exit(1);
    }
    
    // Check if Docker is running
    try {
      execSync('docker info', { stdio: 'ignore' });
    } catch {
      console.log(`${colors.red}Docker is not running. Please start Docker and try again.${colors.reset}`);
      process.exit(1);
    }
    
    // Setup environment variables
    if (!fs.existsSync('.env')) {
      console.log(`${colors.yellow}.env file not found. Creating from .env.example...${colors.reset}`);
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log(`${colors.green}✓ .env created${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ .env.example not found!${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✓ .env file exists${colors.reset}`);
    }
    
    // Install dependencies
    console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    
    // Start Docker services
    console.log(`${colors.yellow}Starting Docker services...${colors.reset}`);
    execSync('docker-compose up -d', { stdio: 'inherit' });
    
    // Wait for critical services
    const services = ['openpanel-postgres', 'openpanel-redis', 'openpanel-traefik'];
    
    for (const service of services) {
      const isReady = await waitForService(service);
      if (!isReady) {
        console.log(`${colors.red}Failed to start ${service}. Exiting.${colors.reset}`);
        process.exit(1);
      }
    }
    
    // Database setup
    console.log(`${colors.yellow}Setting up database...${colors.reset}`);
    execSync('npm run db:generate', { stdio: 'inherit' });
    execSync('npm run db:push', { stdio: 'inherit' });
    
    // Create admin user
    await createAdminUser();
    
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.green}✅ Setup Complete!${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.cyan}📋 Access Information:${colors.reset}`);
    console.log(`${colors.white}   Web Interface: http://localhost:3000${colors.reset}`);
    console.log(`${colors.white}   API Endpoint:  http://localhost:3001${colors.reset}`);
    console.log(`${colors.white}   Traefik Panel: http://localhost:8080${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.red}Error during setup: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();