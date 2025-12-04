/**
 * Global Setup - Runs once before all tests
 * Handles environment configuration
 */

const { getCurrentEnvironment } = require('./environments');

async function globalSetup() {
  console.log('🚀 Starting global setup...');
  
  const env = getCurrentEnvironment();
  console.log(`📍 Testing environment: ${env.name}`);
  console.log(`🌐 Base URL: ${env.webUrl}`);

  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;