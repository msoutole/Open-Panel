#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
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
console.log(`${colors.green}  OpenPanel All Services Starter${colors.reset}`);
console.log(`${colors.green}========================================${colors.reset}`);

// Function to check if Docker is running
function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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

// Main function to start all services
async function main() {
  try {
    // Check if Docker is running
    if (!checkDocker()) {
      console.log(`${colors.red}Docker is not running. Please start Docker and try again.${colors.reset}`);
      process.exit(1);
    }
    
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
    
    // Start API service in background
    console.log(`${colors.yellow}Starting API service...${colors.reset}`);
    const apiProcess = spawn('npm', ['run', 'dev:api'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });
    
    // Start Web service in background
    console.log(`${colors.yellow}Starting Web service...${colors.reset}`);
    const webProcess = spawn('npm', ['run', 'dev:web'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });
    
    // Handle process exit
    const shutdown = () => {
      console.log(`${colors.yellow}Shutting down services...${colors.reset}`);
      try {
        apiProcess.kill();
      } catch (e) {
        // Ignore errors when killing process
      }
      try {
        webProcess.kill();
      } catch (e) {
        // Ignore errors when killing process
      }
      
      // Stop Docker containers
      try {
        execSync('docker-compose down', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
      } catch (e) {
        // Ignore errors when stopping containers
      }
      
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Wait a bit for services to start
    console.log(`${colors.yellow}Waiting for services to be ready...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.green}✅ All OpenPanel services started!${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.cyan}📋 Access Information:${colors.reset}`);
    console.log(`${colors.white}   Web Interface: http://localhost:3000${colors.reset}`);
    console.log(`${colors.white}   API Endpoint:  http://localhost:3001${colors.reset}`);
    console.log(`${colors.white}   Traefik Panel: http://localhost:8080${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to stop all services${colors.reset}`);
    
    // Keep the process alive
    setInterval(() => {}, 1000);
    
  } catch (error) {
    console.log(`${colors.red}Error starting services: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();