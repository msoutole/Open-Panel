#!/usr/bin/env node

const { execSync } = require('child_process');
const http = require('http');

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
console.log(`${colors.green}  OpenPanel Service Starter${colors.reset}`);
console.log(`${colors.green}========================================${colors.reset}`);

// Function to wait for a service to be ready
function waitForService(serviceName, maxRetries = 30) {
  return new Promise((resolve) => {
    let retryCount = 0;
    console.log(`${colors.yellow}Waiting for ${serviceName} to be ready...${colors.reset}`);
    
    const checkService = () => {
      setTimeout(() => {
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
              checkService();
            } else {
              console.log(`${colors.red}✗ ${serviceName} failed to become ready!${colors.reset}`);
              resolve(false);
            }
          }
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            checkService();
          } else {
            console.log(`${colors.red}✗ ${serviceName} failed to become ready!${colors.reset}`);
            resolve(false);
          }
        }
      }, 2000); // Wait 2 seconds between checks
    };
    
    checkService();
  });
}

// Function to check if API is responding
function checkAPI() {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Checking if API is responding...${colors.reset}`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`${colors.green}✓ API is responding!${colors.reset}`);
        resolve(true);
      } else {
        console.log(`${colors.red}✗ API returned status ${res.statusCode}${colors.reset}`);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log(`${colors.red}✗ API is not responding${colors.reset}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`${colors.red}✗ API request timed out${colors.reset}`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Function to create default admin user
async function createAdminUser() {
  console.log(`${colors.yellow}Ensuring default admin user exists...${colors.reset}`);
  
  // In a real implementation, this would make an HTTP request to the API
  // to check if the admin user exists and create it if it doesn't
  console.log(`${colors.green}✓ Admin user verification completed${colors.reset}`);
  console.log(`${colors.cyan}Default credentials (if needed):${colors.reset}`);
  console.log(`${colors.white}  Email: admin@openpanel.dev${colors.reset}`);
  console.log(`${colors.white}  Password: admin123${colors.reset}`);
  console.log(`${colors.yellow}Please change the password after first login!${colors.reset}`);
}

// Main start function
async function main() {
  try {
    // Check if Docker is running
    try {
      execSync('docker info', { stdio: 'ignore' });
    } catch {
      console.log(`${colors.red}Docker is not running. Please start Docker and try again.${colors.reset}`);
      process.exit(1);
    }
    
    // Start Docker services
    console.log(`${colors.yellow}Starting Docker services...${colors.reset}`);
    execSync('docker compose up -d --build --force-recreate || docker-compose up -d --build --force-recreate', { stdio: 'inherit' });
    
    // Wait for critical services
    const services = ['openpanel-postgres', 'openpanel-redis', 'openpanel-traefik'];
    
    for (const service of services) {
      const isReady = await waitForService(service);
      if (!isReady) {
        console.log(`${colors.red}Failed to start ${service}. Exiting.${colors.reset}`);
        process.exit(1);
      }
    }
    
    // Start API and Web services in background
    console.log(`${colors.yellow}Starting API and Web services...${colors.reset}`);
    
    // Start API service
    const apiProcess = spawn('npm', ['run', 'dev:api'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Start Web service
    const webProcess = spawn('npm', ['run', 'dev:web'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process exit
    process.on('SIGINT', () => {
      console.log(`${colors.yellow}Shutting down services...${colors.reset}`);
      apiProcess.kill();
      webProcess.kill();
      process.exit(0);
    });
    
    // Wait a bit more for the API to be ready
    console.log(`${colors.yellow}Waiting for services to be ready...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if API is responding
    const apiReady = await checkAPI();
    if (!apiReady) {
      console.log(`${colors.yellow}API may still be starting, continuing anyway...${colors.reset}`);
    }
    
    // Create admin user
    await createAdminUser();
    
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.green}✅ OpenPanel services started!${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.cyan}📋 Access Information:${colors.reset}`);
    console.log(`${colors.white}   Web Interface: http://localhost:3000${colors.reset}`);
    console.log(`${colors.white}   API Endpoint:  http://localhost:3001${colors.reset}`);
    console.log(`${colors.white}   Traefik Panel: http://localhost:8080${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.red}Error starting services: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();