/**
 * Test Data Utilities
 * Contains functions for generating and managing test data
 */

const moment = require('moment');

class TestDataGenerator {
  constructor() {
    this.uniqueSuffix = Date.now();
  }

  /**
   * Generate unique exam name
   */
  generateExamName(prefix = 'Test Exam') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    return `${prefix} - ${timestamp}`;
  }

  /**
   * Generate MCQ test data
   */
  generateMCQData(questionText, options, correctAnswerIndex) {
    return {
      type: 'MCQ',
      question: questionText || this.getRandomMCQQuestion(),
      options: options || this.getRandomMCQOptions(),
      correctAnswer: correctAnswerIndex !== undefined ? correctAnswerIndex : Math.floor(Math.random() * 4)
    };
  }

  /**
   * Get random MCQ question
   */
  getRandomMCQQuestion() {
    const questions = [
      'What is the capital of France?',
      'Which programming language is known for its use in web development?',
      'What does HTML stand for?',
      'Which of the following is a database management system?',
      'What is the result of 2 + 2?',
      'Which planet is closest to the Sun?',
      'What year did World War II end?',
      'Which is the largest ocean on Earth?'
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Get random MCQ options based on question type
   */
  getRandomMCQOptions() {
    const optionSets = [
      ['London', 'Berlin', 'Paris', 'Madrid'],
      ['JavaScript', 'Python', 'Java', 'All of the above'],
      ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
      ['MySQL', 'PostgreSQL', 'MongoDB', 'All of the above'],
      ['3', '4', '5', '22'],
      ['Mercury', 'Venus', 'Earth', 'Mars'],
      ['1943', '1944', '1945', '1946'],
      ['Atlantic', 'Pacific', 'Indian', 'Arctic']
    ];
    return optionSets[Math.floor(Math.random() * optionSets.length)];
  }

  /**
   * Generate exam data with multiple questions
   */
  generateExamData(options = {}) {
    const defaultOptions = {
      name: this.generateExamName(),
      description: 'Automated test exam created by Playwright',
      duration: 60,
      questionCount: 1
    };

    const examData = { ...defaultOptions, ...options };
    
    // Generate questions
    examData.questions = [];
    for (let i = 0; i < examData.questionCount; i++) {
      examData.questions.push(this.generateMCQData());
    }

    return examData;
  }

  /**
   * Generate user credentials for testing
   */
  generateUserCredentials(role = 'faculty') {
    const timestamp = Date.now();
    return {
      email: `test_${role}_${timestamp}@example.com`,
      password: `Test${role}123!`,
      role: role
    };
  }

  /**
   * Get test data for specific scenarios
   */
  getScenarioTestData(scenario) {
    const testData = {
      'simple_mcq': {
        exam: {
          name: this.generateExamName('Simple MCQ Test'),
          description: 'Simple MCQ test for automation',
          duration: 30,
          questionCount: 1
        },
        mcq: {
          type: 'MCQ',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2 // Paris
        }
      },

      'multiple_mcq': {
        exam: {
          name: this.generateExamName('Multiple MCQ Test'),
          description: 'Multiple MCQ test for automation',
          duration: 60,
          questionCount: 3
        },
        mcqs: [
          {
            type: 'MCQ',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          },
          {
            type: 'MCQ',
            question: 'Which programming language runs in browsers?',
            options: ['Python', 'JavaScript', 'C++', 'Java'],
            correctAnswer: 1
          },
          {
            type: 'MCQ',
            question: 'What does CSS stand for?',
            options: ['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'],
            correctAnswer: 2
          }
        ]
      },

      'complex_exam': {
        exam: {
          name: this.generateExamName('Complex Test Exam'),
          description: 'Complex exam with various question types',
          duration: 120,
          questionCount: 5
        }
      }
    };

    return testData[scenario] || testData['simple_mcq'];
  }

  /**
   * Generate random string for unique identification
   */
  generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate test file path for uploads
   */
  generateTestFilePath(fileName) {
    return `tests/data/files/${fileName}`;
  }

  /**
   * Get current timestamp in various formats
   */
  getTimestamp(format = 'YYYY-MM-DD_HH-mm-ss') {
    return moment().format(format);
  }

  /**
   * Generate test data for API calls
   */
  generateApiTestData(endpoint) {
    const apiData = {
      'login': {
        email: 'test@example.com',
        password: 'password123'
      },
      'create_exam': {
        name: this.generateExamName(),
        description: 'API test exam',
        duration: 60,
        status: 'draft'
      },
      'create_question': {
        type: 'MCQ',
        question: this.getRandomMCQQuestion(),
        options: this.getRandomMCQOptions(),
        correctAnswer: 0
      }
    };

    return apiData[endpoint] || {};
  }
}

// Singleton instance for consistent data generation
const testDataGenerator = new TestDataGenerator();

module.exports = {
  TestDataGenerator,
  testDataGenerator
}; 