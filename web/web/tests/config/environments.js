/**
 * Environment Configuration
 * Contains all environment-specific settings and URLs
 */

const environments = {
  staging: {
    name: 'staging',
    webUrl: 'https://digiscreener-staging.gcp.digivalitsolutions.com/',
    apiUrl: 'https://digiscreener-stagingapi.gcp.digivalitsolutions.com/api/v1',
    apiKey: 'd>A9~5I+65jk',
    
    // Test credentials
    users: {
      admin: {
        email: 'kabeerdev@digivalsolutions.com',
        password: '123',
        role: 'faculty' // updated from 'admin'
      },
      faculty: {
        email: 'kabeerdev@digivalsolutions.com', 
        password: '123',
        role: 'faculty'
      },
      superAdmin: {
        email: 'kabeerdev@digivalsolutions.com',
        password: '123',
        role: 'faculty' // updated from 'superAdmin'
      },
      hctUser: {
        email: 'kabeerdev@digivalsolutions.com',
        password: '123',
        role: 'hctUser',
        collegeCode: 'HCT'
      }
    },

    // Timeouts
    timeouts: {
      short: 5000,
      medium: 15000,
      long: 30000,
      extraLong: 60000
    },

    // Test data
    testData: {
      examName: 'Playwright Test Exam',
      mcqQuestion: 'What is the capital of France?',
      mcqOptions: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2, // Paris (0-based index)
      examDuration: 60, // minutes
      collegeCode: 'HCT',
      collegeName: 'HCT - Higher Colleges of',
      studentEmail: 'kabeer@digivalsolutions.com',
      saqQuestion: 'Describe the process of photosynthesis.',
      saqAttachments: [
        'tests/data/files/sample-image-1.png',
        'tests/data/files/sample-image-2.jpg'
      ]
    }
  },

  production: {
    name: 'production',
    webUrl: 'https://screener.digi-val.com/',
    apiUrl: 'https://api.screener.digi-val.com/api/v1',
    apiKey: 'd>A9~5I+65jk',
    
    // Test credentials (use separate test accounts for prod)
    users: {
      admin: {
        email: 'admin@prod.test',
        password: 'admin123prod',
        role: 'admin'
      },
      faculty: {
        email: 'faculty@prod.test',
        password: 'faculty123prod', 
        role: 'faculty'
      },
      superAdmin: {
        email: 'superadmin@prod.test',
        password: 'superadmin123prod',
        role: 'superAdmin'
      }
    },

    // Timeouts
    timeouts: {
      short: 5000,
      medium: 15000, 
      long: 30000,
      extraLong: 60000
    },

    // Test data
    testData: {
      examName: 'Playwright Production Test Exam',
      mcqQuestion: 'What is 2 + 2?',
      mcqOptions: ['3', '4', '5', '6'],
      correctAnswer: 1, // 4 (0-based index)
      examDuration: 30 // minutes
    }
  }
};

/**
 * Get environment configuration
 * @param {string} env - Environment name (staging, production)
 * @returns {object} Environment configuration
 */
function getEnvironment(env = 'staging') {
  const environment = environments[env];
  if (!environment) {
    throw new Error(`Environment '${env}' not found. Available environments: ${Object.keys(environments).join(', ')}`);
  }
  return environment;
}

/**
 * Get current environment from process env or default to staging
 * @returns {object} Current environment configuration
 */
function getCurrentEnvironment() {
  const env = process.env.TEST_ENV || process.env.NODE_ENV || 'staging';
  return getEnvironment(env);
}

module.exports = {
  environments,
  getEnvironment,
  getCurrentEnvironment
}; 