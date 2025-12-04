/**
 * MCQ Exam Creation Test Specification
 * Tests for creating an exam with MCQ questions
 * 
 * @tags: @exam @mcq @creation
 */

const { test, expect } = require('@playwright/test');
const { getCurrentEnvironment } = require('../config/environments');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const TestHelpers = require('../utils/helpers');

// Test setup
test.describe('MCQ Exam Creation', () => {
  let env;
  let loginPage;
  let dashboardPage;
  let helpers;

  test.beforeEach(async ({ page }) => {
    env = getCurrentEnvironment();
    loginPage = new LoginPage(page, env);
    dashboardPage = new DashboardPage(page, env);
    helpers = new TestHelpers(page, env);

    console.log(`🌐 Testing on environment: ${env.name}`);
    console.log(`🔗 Base URL: ${env.webUrl}`);
  });

  test('should create exam with 1 MCQ question', async ({ page }) => {
    // Get dynamic values from environment
    const examListUrl = `${env.webUrl}fullscreenexam/exam-list/`;
    const collegeCode = env.testData.collegeCode;
    const collegeCodePrefix = collegeCode;
    const collegeName = env.testData.collegeName;
    const user = env.users.hctUser || env.users.faculty;
    
    // Generate unique exam name with Indian Standard Time
    const indianTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    const currentDate = new Date(indianTime);
    
    // Format date as DD-MM-YYYY
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    // Format time as h.mm am/pm
    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedTime = `${hours}.${minutes}${ampm}`;
    
    const examName = `automation ${formattedDate} ${formattedTime}`;
    
    console.log(`📋 Test Configuration:`);
    console.log(`   - Exam Name: ${examName}`);
    console.log(`   - Current IST Time: ${currentDate.toLocaleString('en-IN')}`);
    console.log(`   - User: ${user.email}`);

    // Step 1: Login flow
    console.log('\n========== STEP 1: LOGIN TO APPLICATION ==========');
    await test.step('Login with college code', async () => {
      console.log('1.1 - Navigating to exam list URL...');
      await page.goto(examListUrl);
      console.log('✓ Navigation complete');
      
      // Enter college code
      console.log('1.2 - Clicking college code textbox...');
      await page.getByRole('textbox', { name: 'College Code' }).click();
      console.log('✓ College code textbox clicked');
      
      console.log(`1.3 - Entering college code prefix: ${collegeCodePrefix}...`);
      await page.getByRole('textbox', { name: 'College Code' }).fill(collegeCodePrefix);
      console.log('✓ College code entered');
      
      console.log(`1.4 - Selecting college: ${collegeName}...`);
      await page.getByText(collegeName).click();
      console.log('✓ College selected from dropdown');
      
      // Click Go button
      console.log('1.5 - Clicking Go button...');
      await page.getByRole('button', { name: 'Go Send' }).click();
      console.log('✓ Go button clicked');
      
      // Enter credentials
      console.log('1.6 - Double-clicking email textbox...');
      await page.getByRole('textbox', { name: 'Email address' }).dblclick();
      console.log('✓ Email textbox activated');
      
      console.log(`1.7 - Entering email: ${user.email}...`);
      await page.getByRole('textbox', { name: 'Email address' }).fill(user.email);
      console.log('✓ Email entered');
      
      console.log('1.8 - Pressing Tab to move to password field...');
      await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
      console.log('✓ Moved to password field');
      
      console.log('1.9 - Entering password...');
      await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
      console.log('✓ Password entered');
      
      // Login
      console.log('1.10 - Clicking Login button...');
      await page.getByRole('button', { name: 'Login' }).click();
      console.log('✓ Login button clicked');
      
      console.log('1.11 - Verifying login by clicking column header...');
      await page.getByRole('columnheader', { name: 'No.' }).click();
      console.log('✓ Column header clicked - Login successful');
      
      helpers.logSuccess('Login successful - exam list displayed');
    });

    // Step 2: Create new exam
    console.log('\n========== STEP 2: CREATE NEW EXAM ==========');
    await test.step('Navigate to exam creation', async () => {
      console.log('2.1 - Looking for CREATE NEW EXAM button...');
      await page.getByRole('button', { name: ' CREATE NEW EXAM' }).click();
      console.log('✓ CREATE NEW EXAM button clicked');
      helpers.logStep('Navigated to exam creation page');
    });

    // Step 3: Fill exam details
    console.log('\n========== STEP 3: FILL EXAM DETAILS ==========');
    await test.step('Enter exam information', async () => {
      // Exam name
      console.log('3.1 - Clicking exam name textbox...');
      await page.getByRole('textbox', { name: 'Exam Name * Email Id Pass Code' }).click();
      console.log('✓ Exam name textbox clicked');
      
      console.log(`3.2 - Entering exam name: ${examName}...`);
      await page.getByRole('textbox', { name: 'Exam Name * Email Id Pass Code' }).fill(examName);
      console.log('✓ Exam name entered');
      
      console.log('3.3 - Pressing Tab to move to next field...');
      await page.getByRole('textbox', { name: 'Exam Name * Email Id Pass Code' }).press('Tab');
      console.log('✓ Moved to next field');
      
      // Select course
      console.log('3.4 - Clicking course selection box...');
      await page.locator('#selectedCoursesBox').click();
      console.log('✓ Course selection box clicked');
      
      console.log('3.5 - Selecting first course...');
      await page.locator('.card-body').first().click();
      console.log('✓ Course selected');
      
      // Set date in YYYY-MM-DD format for date input
      const dateForInput = `${year}-${month}-${day}`;
      console.log(`3.6 - Setting exam date: ${dateForInput}...`);
      await page.getByPlaceholder('Enter Start Date').fill(dateForInput);
      console.log('✓ Exam date set');
      
      // Set time (5 minutes from now in IST)
      const futureTime = new Date(currentDate.getTime() + 5 * 60000);
      let futureHours = futureTime.getHours();
      const futureMinutes = futureTime.getMinutes();
      const futureAmPm = futureHours >= 12 ? 'PM' : 'AM';
      futureHours = futureHours % 12;
      futureHours = futureHours ? futureHours : 12;
      
      // Round to nearest 5 minutes for time picker
      const roundedMinutes = Math.ceil(futureMinutes / 5) * 5;
      const timeString = `${futureHours}:${roundedMinutes.toString().padStart(2, '0')} ${futureAmPm}`;
      
      console.log('3.7 - Clicking time picker...');
      await page.getByRole('textbox', { name: 'Please Select a time zone' }).click();

      await page.getByRole('textbox', { name: 'Enter Start Time' }).click();
      console.log('✓ Time picker opened');
      
      console.log(`3.8 - Selecting time: ${timeString}...`);
     // await page.getByText(timeString).click();
      console.log('✓ Time selected');
      

      
      console.log('3.10 - Setting duration to 60 minutes...');
      await page.getByPlaceholder('Duration').fill('60');
      console.log('✓ Duration set');
      
      // Timezone
      // console.log('3.11 - Clicking timezone selector...');
      // await page.getByRole('textbox', { name: 'Please Select a time zone' }).click();
      // console.log('✓ Timezone selector opened');
      
      // console.log('3.12 - Selecting all text in timezone field...');
      // await page.getByRole('textbox', { name: 'Please Select a time zone' }).press('ControlOrMeta+a');
      // console.log('✓ Text selected');
      
      // console.log('3.13 - Typing "india" to search timezone...');
      // await page.getByRole('textbox', { name: 'Please Select a time zone' }).fill('india');
      // console.log('✓ Timezone search entered');
      
      // console.log('3.14 - Selecting India timezone...');
      // await page.getByText('(UTC+05:30) Chennai, Kolkata').click();
      // console.log('✓ India timezone selected');
      
      // Next
      console.log('3.15 - Clicking Next button...');
      await page.getByRole('button', { name: 'Next' }).click();
      console.log('✓ Moved to question creation');
      
      helpers.logStep('Exam details filled successfully');
    });

    // Step 4: Add MCQ question
    console.log('\n========== STEP 4: ADD MCQ QUESTION ==========');
    await test.step('Create MCQ question', async () => {
      console.log('4.1 - Clicking Add Question button...');
      await page.getByRole('button', { name: 'Add Question' }).click();
   
      console.log('✓ Add Question button clicked');
      
      // Add question text
      console.log('4.2 - Clicking question text editor...');
      await page.getByRole('textbox', { name: 'Editor editing area: main' }).first().click();
      console.log('✓ Question editor clicked');
      
      console.log('4.3 - Entering question: "What is 2 + 2?"...');
      await page.getByRole('textbox', { name: 'Editor editing area: main' }).first().fill('What is 2 + 2?');
      console.log('✓ Question text entered');
      
      // Add choices
      console.log('4.4 - Clicking choice A editor...');
      await page.locator('#choice-A-1').getByRole('textbox', { name: 'Editor editing area: main' }).click();
      console.log('✓ Choice A editor clicked');
      
      console.log('4.5 - Entering choice A: "3"...');
      await page.locator('#choice-A-1').getByRole('textbox', { name: 'Editor editing area: main' }).fill('3');
      console.log('✓ Choice A entered');
      
      console.log('4.6 - Clicking choice B editor...');
      await page.locator('#choice-B-1').getByRole('textbox', { name: 'Editor editing area: main' }).click();
      console.log('✓ Choice B editor clicked');
      
      console.log('4.7 - Entering choice B: "4"...');
      await page.locator('#choice-B-1').getByRole('textbox', { name: 'Editor editing area: main' }).fill('4');
      console.log('✓ Choice B entered');
      
      console.log('4.8 - Clicking choice C editor...');
      await page.locator('#choice-C-1').getByRole('textbox', { name: 'Editor editing area: main' }).click();
      console.log('✓ Choice C editor clicked');
      
      console.log('4.9 - Entering choice C: "5"...');
      await page.locator('#choice-C-1').getByRole('textbox', { name: 'Editor editing area: main' }).fill('5');
      console.log('✓ Choice C entered');
      
      console.log('4.10 - Clicking choice D editor...');
      await page.locator('#choice-D-1').getByRole('textbox', { name: 'Editor editing area: main' }).click();
      console.log('✓ Choice D editor clicked');
      
      console.log('4.11 - Entering choice D: "6"...');
      await page.locator('#choice-D-1').getByRole('textbox', { name: 'Editor editing area: main' }).fill('6');
      console.log('✓ Choice D entered');
      
      // // Select correct answer (B - which is 4)
       console.log('4.12 - Selecting correct answer (B - "4")...');
     // await page.locator('#choice-D-1').getByRole('radio').check();
   
       await page.locator('input[type=radio][name="correct-1"][value="B"]').check();
 

       console.log('✓ Correct answer selected');
      
      // Next
      console.log('4.13 - Clicking Next button...');
  
      await page.locator('#next-to-step-2').click(); // This ensures you click the correct 'Next' button

      
      console.log('✓ Question saved, moving to preview');
      
      helpers.logStep('MCQ question added successfully');
    });

    // Step 5: Preview and continue
    console.log('\n========== STEP 5: PREVIEW QUESTIONS ==========');
    await test.step('Preview and continue', async () => {
      console.log('5.1 - Waiting for preview dialog...');
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      console.log('✓ Preview dialog visible');
      
      console.log('5.2 - Clicking Next button in preview...');
      //await page.getByLabel('Preview Questions').getByRole('button', { name: 'Next' }).click();
      await page.getByRole('dialog', { name: 'Preview Questions' })
          .getByRole('button', { name: 'Next', exact: true })
          .click();
      console.log('✓ Preview completed, moving to student registration');
      
      helpers.logStep('Preview completed successfully');
    });

    // Step 6: Add student
    console.log('\n========== STEP 6: ADD STUDENT ==========');
    await test.step('Add student to exam', async () => {
      const studentEmail = env.testData.studentEmail || 'kabeer@digivalsolutions.com';
      
      console.log('6.1 - Clicking email textbox...');
      await page.getByRole('textbox', { name: 'Enter Email Id' }).click();
      console.log('✓ Email textbox clicked');
      
      console.log(`6.2 - Entering student email: ${studentEmail}...`);
      await page.getByRole('textbox', { name: 'Enter Email Id' }).fill(studentEmail);
      console.log('✓ Student email entered');
      
      console.log('6.3 - Clicking pass code textbox...');
      await page.getByRole('textbox', { name: 'Enter Pass Code' }).click();
      console.log('✓ Pass code textbox clicked');
      
      console.log('6.4 - Entering pass code: 123...');
      await page.getByRole('textbox', { name: 'Enter Pass Code' }).fill('123');
      console.log('✓ Pass code entered');
      
      console.log('6.5 - Clicking Add button...');
      await page.getByRole('button', { name: 'Add' }).click();
      console.log('✓ Student added to exam');
      
      helpers.logStep('Student added successfully');
    });

    // Step 7: Finalize exam
    console.log('\n========== STEP 7: FINALIZE EXAM ==========');
    await test.step('Finalize exam creation', async () => {
      console.log('7.1 - Clicking Finalize button...');
      await page.getByRole('button', { name: 'Finalize' }).click();
      console.log('✓ Finalize button clicked');
      
      console.log('\n========== EXAM CREATION COMPLETED ==========');
      helpers.logSuccess(`Exam "${examName}" created successfully`);
    });
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    // Take screenshot on failure
    if (test.info().status !== test.info().expectedStatus) {
      await helpers.takeScreenshot(`failed-${test.info().title}`);
    }

    // Attempt logout if still logged in
    try {
      const isLoggedIn = await loginPage.isLoggedIn();
      if (isLoggedIn) {
        await loginPage.logout();
        helpers.logStep('Cleaned up: Logged out after test');
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

});