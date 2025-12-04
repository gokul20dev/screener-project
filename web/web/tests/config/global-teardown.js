/**
 * Global Teardown - Runs once after all tests complete
 * Handles cleanup
 */

async function globalTeardown() {
  console.log('🧹 Global teardown completed');
}

module.exports = globalTeardown;