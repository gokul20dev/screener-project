/**
 * Exam Maker Page Object Model
 * Contains exam creation and MCQ functionality
 */

class ExamMakerPage {
  constructor(page, env) {
    this.page = page;
    this.env = env;
    
    // Selectors - Update based on actual application structure
    this.selectors = {
      // Exam basic info
      examNameInput: 'input[name="examName"], #examName, [data-testid="exam-name"]',
      examDescriptionInput: 'textarea[name="description"], #description, [data-testid="exam-description"]',
      examDurationInput: 'input[name="duration"], #duration, [data-testid="exam-duration"]',
      
      // Question controls
      addQuestionButton: '.add-question, button:has-text("Add Question"), [data-testid="add-question"]',
      questionTypeDropdown: 'select[name="questionType"], .question-type, [data-testid="question-type"]',
      
      // MCQ specific elements
      mcqOption: 'select option[value="MCQ"], option:has-text("MCQ")',
      questionTextInput: 'textarea[name="questionText"], .question-text, [data-testid="question-text"]',
      
      // MCQ Options
      optionAInput: 'input[name="optionA"], .option-a, [data-testid="option-a"]',
      optionBInput: 'input[name="optionB"], .option-b, [data-testid="option-b"]', 
      optionCInput: 'input[name="optionC"], .option-c, [data-testid="option-c"]',
      optionDInput: 'input[name="optionD"], .option-d, [data-testid="option-d"]',
      
      // Correct answer selection
      correctAnswerA: 'input[name="correctAnswer"][value="A"], .correct-answer-a',
      correctAnswerB: 'input[name="correctAnswer"][value="B"], .correct-answer-b',
      correctAnswerC: 'input[name="correctAnswer"][value="C"], .correct-answer-c',
      correctAnswerD: 'input[name="correctAnswer"][value="D"], .correct-answer-d',
      
      // Question management
      saveQuestionButton: 'button:has-text("Save Question"), .save-question, [data-testid="save-question"]',
      addAnotherQuestionButton: 'button:has-text("Add Another"), .add-another, [data-testid="add-another"]',
      
      // Exam management
      saveExamButton: 'button:has-text("Save Exam"), .save-exam, [data-testid="save-exam"]',
      publishExamButton: 'button:has-text("Publish"), .publish-exam, [data-testid="publish-exam"]',
      
      // Question list
      questionsList: '.questions-list, .question-items',
      questionItem: '.question-item, .question-row',
      
      // Success/Error messages
      successMessage: '.success-message, .alert-success, [data-testid="success"]',
      errorMessage: '.error-message, .alert-danger, [data-testid="error"]',
      
      // Loading
      loadingSpinner: '.loading, .spinner, [data-testid="loading"]'
    };
  }

  /**
   * Navigate to exam maker page
   */
  async goto() {
    await this.page.goto(`${this.env.webUrl}/fullscreenexam/exam-configure/create.html`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a new exam with basic information
   * @param {Object} examData - Exam configuration data
   */
  async createExam(examData) {
    console.log('📝 Creating new exam...');
    
    // Fill basic exam information
    await this.fillExamBasicInfo(examData);
    
    // Add questions if provided
    if (examData.questions && examData.questions.length > 0) {
      for (const question of examData.questions) {
        await this.addQuestion(question);
      }
    }
    
    console.log('✅ Exam created successfully');
  }

  /**
   * Fill exam basic information
   * @param {Object} examData - Exam data object
   */
  async fillExamBasicInfo(examData) {
    console.log('📋 Filling exam basic information...');
    
    // Fill exam name
    if (examData.name) {
      await this.page.fill(this.selectors.examNameInput, examData.name);
    }
    
    // Fill exam description
    if (examData.description) {
      await this.page.fill(this.selectors.examDescriptionInput, examData.description);
    }
    
    // Fill exam duration
    if (examData.duration) {
      await this.page.fill(this.selectors.examDurationInput, examData.duration.toString());
    }
  }

  /**
   * Add a new question to the exam
   * @param {Object} questionData - Question data object
   */
  async addQuestion(questionData) {
    console.log(`➕ Adding ${questionData.type} question...`);
    
    // Click add question button
    await this.page.click(this.selectors.addQuestionButton);
    await this.page.waitForTimeout(1000); // Wait for form to appear
    
    // Select question type
    await this.selectQuestionType(questionData.type);
    
    // Handle different question types
    switch (questionData.type) {
      case 'MCQ':
        await this.fillMCQQuestion(questionData);
        break;
      case 'SAQ':
        await this.fillSAQQuestion(questionData);
        break;
      default:
        throw new Error(`Question type ${questionData.type} not yet implemented`);
    }
    
    // Save the question
    await this.saveQuestion();
  }

  /**
   * Select question type from dropdown
   * @param {string} type - Question type (MCQ, FTB, etc.)
   */
  async selectQuestionType(type) {
    console.log(`🎯 Selecting question type: ${type}`);
    
    // Try different approaches to select question type
    try {
      // Method 1: Direct dropdown selection
      await this.page.selectOption(this.selectors.questionTypeDropdown, type);
    } catch (error) {
      console.log('🔄 Trying alternative selection method...');
      
      // Method 2: Click dropdown and select option
      await this.page.click(this.selectors.questionTypeDropdown);
      await this.page.click(`option:has-text("${type}")`);
    }
  }

  /**
   * Fill MCQ question details
   * @param {Object} mcqData - MCQ question data
   */
  async fillMCQQuestion(mcqData) {
    console.log('📝 Filling MCQ question details...');
    
    // Fill question text
    await this.page.fill(this.selectors.questionTextInput, mcqData.question);
    
    // Fill options
    if (mcqData.options && mcqData.options.length >= 4) {
      await this.page.fill(this.selectors.optionAInput, mcqData.options[0]);
      await this.page.fill(this.selectors.optionBInput, mcqData.options[1]); 
      await this.page.fill(this.selectors.optionCInput, mcqData.options[2]);
      await this.page.fill(this.selectors.optionDInput, mcqData.options[3]);
    }
    
    // Select correct answer
    if (mcqData.correctAnswer !== undefined) {
      await this.selectCorrectAnswer(mcqData.correctAnswer);
    }
  }

  /**
   * Fill SAQ question details with multiple attachments
   * @param {Object} saqData - SAQ question data
   */
  async fillSAQQuestion(saqData) {
    console.log('📝 Filling SAQ question details...');
    // Fill question text
    await this.page.fill('textarea[name="questionText"], .question-text, [data-testid="question-text"]', saqData.question);
    // Attach files if provided
    if (saqData.attachments && saqData.attachments.length > 0) {
      for (const [i, filePath] of saqData.attachments.entries()) {
        // Try to find the file input for attachments (update selector as needed)
        const fileInputSelector = `input[type="file"][name="attachment${i+1}"]`;
        if (await this.page.isVisible(fileInputSelector)) {
          await this.page.setInputFiles(fileInputSelector, filePath);
          console.log(`📎 Attached file: ${filePath}`);
        } else {
          // Try a generic file input if specific not found
          const genericFileInput = 'input[type="file"], [data-testid="attachment"]';
          if (await this.page.isVisible(genericFileInput)) {
            await this.page.setInputFiles(genericFileInput, filePath);
            console.log(`📎 Attached file: ${filePath}`);
          }
        }
      }
    }
  }

  /**
   * Select the correct answer for MCQ
   * @param {number} answerIndex - Index of correct answer (0-based)
   */
  async selectCorrectAnswer(answerIndex) {
    console.log(`✓ Selecting correct answer: ${answerIndex}`);
    
    const answerSelectors = [
      this.selectors.correctAnswerA,
      this.selectors.correctAnswerB, 
      this.selectors.correctAnswerC,
      this.selectors.correctAnswerD
    ];
    
    if (answerIndex >= 0 && answerIndex < answerSelectors.length) {
      await this.page.check(answerSelectors[answerIndex]);
    }
  }

  /**
   * Save the current question
   */
  async saveQuestion() {
    console.log('💾 Saving question...');
    await this.page.click(this.selectors.saveQuestionButton);
    
    // Wait for success message or question to appear in list
    try {
      await this.page.waitForSelector(this.selectors.successMessage, { timeout: 5000 });
      console.log('✅ Question saved successfully');
    } catch (error) {
      console.log('⚠️ No success message found, continuing...');
    }
  }

  /**
   * Add a sample MCQ question using test data
   */
  async addSampleMCQ() {
    console.log('🎯 Adding sample MCQ question...');
    
    const mcqData = {
      type: 'MCQ',
      question: this.env.testData.mcqQuestion,
      options: this.env.testData.mcqOptions,
      correctAnswer: this.env.testData.correctAnswer
    };
    
    await this.addQuestion(mcqData);
    return mcqData;
  }

  /**
   * Save the entire exam
   */
  async saveExam() {
    console.log('💾 Saving exam...');
    await this.page.click(this.selectors.saveExamButton);
    
    // Wait for success message
    try {
      await this.page.waitForSelector(this.selectors.successMessage, { timeout: 10000 });
      console.log('✅ Exam saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save exam');
      return false;
    }
  }

  /**
   * Publish the exam
   */
  async publishExam() {
    console.log('🚀 Publishing exam...');
    await this.page.click(this.selectors.publishExamButton);
    
    // Wait for confirmation
    try {
      await this.page.waitForSelector(this.selectors.successMessage, { timeout: 10000 });
      console.log('✅ Exam published successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to publish exam');
      return false;
    }
  }

  /**
   * Verify that MCQ was added successfully
   * @param {Object} mcqData - Expected MCQ data to verify
   */
  async verifyMCQAdded(mcqData) {
    console.log('🔍 Verifying MCQ was added...');
    
    // Look for the question in the questions list
    const questionItems = await this.page.locator(this.selectors.questionItem).all();
    
    for (const item of questionItems) {
      const questionText = await item.textContent();
      if (questionText && questionText.includes(mcqData.question)) {
        console.log('✅ MCQ found in questions list');
        return true;
      }
    }
    
    console.warn('⚠️ MCQ not found in questions list');
    return false;
  }

  /**
   * Get questions count
   */
  async getQuestionsCount() {
    const questionItems = await this.page.locator(this.selectors.questionItem).all();
    return questionItems.length;
  }

  /**
   * Check if exam maker page is loaded
   */
  async isPageLoaded() {
    return await this.page.isVisible(this.selectors.examNameInput);
  }

  /**
   * Get success message text
   */
  async getSuccessMessage() {
    try {
      const element = await this.page.waitForSelector(this.selectors.successMessage, { timeout: 5000 });
      return await element.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    try {
      const element = await this.page.waitForSelector(this.selectors.errorMessage, { timeout: 5000 });
      return await element.textContent();
    } catch {
      return null;
    }
  }
}

module.exports = ExamMakerPage; 