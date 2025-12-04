# Digi Screener - Playwright Test Automation Framework

A comprehensive Playwright testing framework for the Digi Screener platform, supporting multiple environments and test scenarios.

## 🚀 Features

- ✅ **Multi-Environment Support**: Staging and Production environments
- ✅ **Page Object Model**: Maintainable and reusable page objects
- ✅ **Comprehensive Test Coverage**: Login, Navigation, MCQ Creation, and Verification
- ✅ **Advanced Reporting**: HTML, JUnit, and JSON reports
- ✅ **Screenshot & Video Recording**: On failure and success
- ✅ **Cross-Browser Testing**: Chromium, Firefox, Safari, and mobile
- ✅ **CI/CD Ready**: Configured for continuous integration
- ✅ **Test Data Management**: Dynamic and configurable test data

## 📋 Prerequisites

- Node.js 16+ installed
- Git
- Valid test accounts for the environments

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd digi-screener/web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Playwright browsers**:
   ```bash
   npm run install:browsers
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your test credentials and configuration
   ```

## 🎯 Test Execution

### Quick Start

Run all tests on staging environment:
```bash
npm run test:staging
```

Run all tests on production environment:
```bash
npm run test:prod
```

### Specific Test Suites

Run login tests only:
```bash
npm run test:login
```

Run MCQ creation tests only:
```bash
npm run test:mcq
```

Run smoke tests:
```bash
npm run test:smoke
```

Run regression tests:
```bash
npm run test:regression
```

### Debug Mode

Run tests in headed mode (browser visible):
```bash
npm run test:headed
```

Debug specific test:
```bash
npm run test:debug
```

### Interactive Mode

Run tests in UI mode:
```bash
npm run test:ui
```

## 🏗️ Project Structure

```
tests/
├── config/
│   ├── environments.js          # Environment configurations
│   ├── staging.config.js        # Staging-specific config
│   ├── prod.config.js           # Production-specific config
│   ├── global-setup.js          # Global test setup
│   └── global-teardown.js       # Global test cleanup
├── fixtures/
│   └── auth.fixture.js          # Authentication fixtures
├── pages/
│   ├── LoginPage.js             # Login page object model
│   ├── DashboardPage.js         # Dashboard page object model
│   └── ExamMakerPage.js         # Exam maker page object model
├── specs/
│   ├── login.spec.js            # Login test scenarios
│   └── mcq-creation.spec.js     # MCQ creation test scenarios
├── utils/
│   ├── test-data.js             # Test data generation utilities
│   └── helpers.js               # Common helper functions
└── data/
    └── files/                   # Test files for upload scenarios
```

## 🌍 Environment Configuration

The framework supports multiple environments with different configurations:

### Staging Environment
- **URL**: https://digiscreener-staging.gcp.digivalitsolutions.com/
- **API**: https://digiscreener-stagingapi.gcp.digivalitsolutions.com/api/v1
- **Usage**: Development and testing

### Production Environment  
- **URL**: https://screener.digi-val.com/
- **API**: https://api.screener.digi-val.com/api/v1
- **Usage**: Live environment testing

### Switch Between Environments

Set environment via environment variable:
```bash
export TEST_ENV=staging
npm test

export TEST_ENV=production
npm test
```

Or use specific commands:
```bash
npm run test:staging
npm run test:prod
```

## 🧪 Test Scenarios

### Login Tests (`login.spec.js`)

| Test Case | Description | Tags |
|-----------|-------------|------|
| Admin Login | Successful login with admin credentials | `@smoke` |
| Faculty Login | Successful login with faculty credentials | `@regression` |
| Invalid Login | Failed login with invalid credentials | `@smoke` |
| Logout Flow | Complete logout functionality | `@regression` |

### MCQ Creation Tests (`mcq-creation.spec.js`)

| Test Case | Description | Tags |
|-----------|-------------|------|
| Navigate to Exam Maker | Access exam creation interface | `@smoke` |
| Create Basic Exam | Create exam with basic information | `@regression` |
| Add Single MCQ | Create and verify MCQ question | `@smoke` |
| Add Multiple MCQs | Create exam with multiple questions | `@regression` |
| Complete E2E Workflow | Full end-to-end MCQ creation | `@smoke @e2e` |

## 📊 Test Reports

After test execution, reports are generated in multiple formats:

### HTML Report (Recommended)
```bash
npm run test:report
```
Opens interactive HTML report with:
- Test results overview
- Screenshots and videos
- Step-by-step execution details
- Error logs and traces

### Generate Reports
```bash
npm run generate:report
```

### Report Locations
- HTML Report: `playwright-report/index.html`
- JUnit Report: `test-results/junit-report.xml`
- JSON Report: `test-results/json-report.json`
- Screenshots: `test-results/`
- Videos: `test-results/`

## 🔧 Configuration Options

### Playwright Configuration

Key configuration options in `playwright.config.js`:

```javascript
// Browser options
projects: ['chromium', 'firefox', 'webkit', 'mobile-chrome']

// Test execution
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 1 : undefined

// Artifacts
screenshot: 'only-on-failure'
video: 'retain-on-failure'
trace: 'on-first-retry'
```

### Environment Variables

Create `.env` file with:

```bash
TEST_ENV=staging                    # Target environment
HEADLESS=false                     # Browser visibility
BROWSER=chromium                   # Default browser
TIMEOUT=30000                      # Default timeout
RETRIES=2                          # Retry attempts
ENABLE_VIDEO=true                  # Video recording
ENABLE_SCREENSHOTS=true            # Screenshots
ENABLE_TRACE=true                  # Trace collection
```

## 🎛️ Page Object Models

### LoginPage Methods
```javascript
const loginPage = new LoginPage(page, env);

await loginPage.goto()                    // Navigate to login
await loginPage.login(email, password)    // Login with credentials
await loginPage.loginAs('admin')          // Login with predefined user
await loginPage.logout()                  // Logout from application
```

### DashboardPage Methods
```javascript
const dashboardPage = new DashboardPage(page, env);

await dashboardPage.navigateToExamMaker() // Go to exam creation
await dashboardPage.navigateToReports()   // Go to reports
await dashboardPage.logout()              // Logout
```

### ExamMakerPage Methods
```javascript
const examMakerPage = new ExamMakerPage(page, env);

await examMakerPage.createExam(examData)     // Create new exam
await examMakerPage.addQuestion(mcqData)     // Add MCQ question
await examMakerPage.saveExam()              // Save exam
await examMakerPage.verifyMCQAdded(mcqData) // Verify question added
```

## 📝 Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { getCurrentEnvironment } = require('../config/environments');
const LoginPage = require('../pages/LoginPage');

test.describe('My Test Suite', () => {
  let env, loginPage;

  test.beforeEach(async ({ page }) => {
    env = getCurrentEnvironment();
    loginPage = new LoginPage(page, env);
  });

  test('should do something @smoke', async ({ page }) => {
    await test.step('Step 1', async () => {
      await loginPage.goto();
      // Test logic here
    });
  });
});
```

### Using Test Data

```javascript
const { testDataGenerator } = require('../utils/test-data');

// Generate dynamic test data
const examData = testDataGenerator.generateExamData({
  name: 'My Custom Exam',
  duration: 60
});

// Use predefined scenarios  
const testData = testDataGenerator.getScenarioTestData('simple_mcq');
```

### Using Helpers

```javascript
const TestHelpers = require('../utils/helpers');

const helpers = new TestHelpers(page, env);
await helpers.safeClick(selector);
await helpers.takeScreenshot('my-screenshot');
await helpers.verifyVisible(selector, 'Element should be visible');
```

## 🚨 Debugging

### Debug Failed Tests

1. **Check Screenshots**: Look in `test-results/` for failure screenshots
2. **Watch Videos**: Review recorded videos for failed tests
3. **Examine Traces**: Use Playwright trace viewer for detailed debugging
4. **Console Logs**: Check browser console logs in test output

### Debug Commands

```bash
# Run single test in debug mode
npx playwright test tests/specs/login.spec.js --debug

# Run with browser visible
npx playwright test --headed

# Generate trace for debugging
npx playwright test --trace on
```

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

## ⚡ Performance

### Test Execution Tips

1. **Parallel Execution**: Tests run in parallel by default
2. **Browser Reuse**: Contexts are reused for better performance  
3. **Selective Testing**: Use tags to run specific test suites
4. **Environment Optimization**: Use appropriate timeouts per environment

### CI/CD Optimization

```bash
# Fast CI execution
npx playwright test --reporter=junit --workers=2

# Full regression suite
npx playwright test --grep="@regression"
```

## 🔐 Security

### Test Credentials

- Never commit real passwords to version control
- Use environment variables for credentials
- Create separate test accounts for each environment
- Rotate test credentials regularly

### API Keys

- Store API keys in environment variables
- Use different keys for different environments
- Monitor API key usage

## 🤝 Contributing

### Test Development Guidelines

1. **Follow Page Object Pattern**: Create page objects for new pages
2. **Use Descriptive Names**: Test names should clearly describe what they test
3. **Add Proper Tags**: Use tags for test categorization (@smoke, @regression)
4. **Include Test Steps**: Break tests into logical steps
5. **Add Assertions**: Verify expected outcomes
6. **Handle Failures**: Include proper error handling and cleanup

### Code Standards

```javascript
// Good: Descriptive and clear
test('should login successfully with valid admin credentials @smoke', async ({ page }) => {
  await test.step('Navigate to login page', async () => {
    await loginPage.goto();
  });
  
  await test.step('Login with admin credentials', async () => {
    const success = await loginPage.loginAs('admin');
    expect(success).toBeTruthy();
  });
});
```

## 🆘 Troubleshooting

### Common Issues

**Issue**: Tests fail with timeout
```bash
Solution: Increase timeout in playwright.config.js or use environment variables
```

**Issue**: Browser doesn't launch
```bash
Solution: Run `npm run install:browsers`
```

**Issue**: Authentication fails
```bash
Solution: Check credentials in .env file and verify test accounts
```

**Issue**: Elements not found
```bash
Solution: Update selectors in page object models
```

### Getting Help

1. Check test output and screenshots
2. Review Playwright documentation
3. Examine browser developer tools
4. Check application logs
5. Verify environment configuration

## 📞 Support

For issues and questions:
- Review this documentation
- Check test logs and reports
- Examine screenshots and videos
- Contact the development team

---

## 🎯 Quick Command Reference

```bash
# Installation
npm install
npm run install:browsers

# Test Execution  
npm run test:staging          # Run all tests on staging
npm run test:prod            # Run all tests on production
npm run test:login           # Run login tests only
npm run test:mcq            # Run MCQ creation tests only
npm run test:smoke          # Run smoke tests
npm run test:headed         # Run with browser visible
npm run test:debug          # Run in debug mode

# Reports
npm run test:report         # Open HTML report
npm run generate:report     # Generate all reports

# Utilities
npm run lint               # Check code quality
npm run format             # Format code
```

Happy Testing! 🚀 