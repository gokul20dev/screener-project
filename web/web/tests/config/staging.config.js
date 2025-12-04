// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('../../playwright.config.js');

/**
 * Staging Environment Configuration
 */
module.exports = defineConfig({
  ...baseConfig,
  
  use: {
    ...baseConfig.use,
    baseURL: 'https://digiscreener-staging.gcp.digivalitsolutions.com/',
  },

  /* Environment specific settings */
  projects: [
    {
      name: 'staging-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://digiscreener-staging.gcp.digivalitsolutions.com/',
        extraHTTPHeaders: {
          'x-api-key': 'd>A9~5I+65jk'
        }
      },
    },
  ],

  /* Test environment variables */
  define: {
    ENV: 'staging',
    API_BASE_URL: 'https://digiscreener-stagingapi.gcp.digivalitsolutions.com/api/v1',
    WEB_BASE_URL: 'https://digiscreener-staging.gcp.digivalitsolutions.com/',
    API_KEY: 'd>A9~5I+65jk'
  }
}); 