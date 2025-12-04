// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('../../playwright.config.js');

/**
 * Production Environment Configuration
 */
module.exports = defineConfig({
  ...baseConfig,
  
  use: {
    ...baseConfig.use,
    baseURL: 'https://screener.digi-val.com/',
  },

  /* Environment specific settings */
  projects: [
    {
      name: 'prod-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://screener.digi-val.com/',
        extraHTTPHeaders: {
          'x-api-key': 'd>A9~5I+65jk'
        }
      },
    },
  ],

  /* Test environment variables */
  define: {
    ENV: 'production',
    API_BASE_URL: 'https://api.screener.digi-val.com/api/v1',
    WEB_BASE_URL: 'https://screener.digi-val.com/',
    API_KEY: 'd>A9~5I+65jk'
  }
}); 