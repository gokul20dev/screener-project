// AI Prompt Generator - Dynamic prompt formation based on settings
// This file handles the creation of AI prompts based on user settings

/**
 * Bloom's Taxonomy levels with descriptions
 */
const BLOOMS_TAXONOMY = {
  remember: {
    name: "Remember",
    description: "Recall facts, basic concepts, and answers",
    keywords: ["define", "list", "recall", "identify", "name", "state"]
  },
  understand: {
    name: "Understand", 
    description: "Explain ideas or concepts",
    keywords: ["explain", "describe", "summarize", "interpret", "classify"]
  },
  apply: {
    name: "Apply",
    description: "Use information in new situations",
    keywords: ["apply", "demonstrate", "calculate", "solve", "use"]
  },
  analyze: {
    name: "Analyze",
    description: "Draw connections among ideas",
    keywords: ["analyze", "compare", "contrast", "examine", "break down"]
  },
  evaluate: {
    name: "Evaluate",
    description: "Justify a stand or decision",
    keywords: ["evaluate", "judge", "critique", "assess", "defend"]
  },
  create: {
    name: "Create",
    description: "Produce new or original work",
    keywords: ["create", "design", "construct", "develop", "formulate"]
  }
};

/**
 * Complexity levels for questions
 */
const COMPLEXITY_LEVELS = {
  basic: {
    name: "Basic",
    description: "Fundamental concepts and simple recall"
  },
  intermediate: {
    name: "Intermediate", 
    description: "Application and analysis of concepts"
  },
  advanced: {
    name: "Advanced",
    description: "Complex problem-solving and synthesis"
  }
};

/**
 * Get question type specific instructions for the application
 * @param {string} questionType - Type of question
 * @returns {string} Specific instructions for the question type
 */
function getQuestionTypeInstructions(questionType) {
  switch (questionType) {
    case 'MCQ':
      return `
MCQ (Multiple Choice Question) Instructions:
- Create exactly 4 options (A, B, C, D)
- Only ONE option should be correct (isCorrect: true)
- All other options should be plausible but incorrect
- Include "correctAnswerKey" field with the letter of the correct answer
- Make distractors (wrong answers) realistic and commonly confused concepts
- Avoid "All of the above" or "None of the above" options unless specifically needed`;
    
    case 'FTB':
      return `
FTB (Fill in the Blanks) Instructions:
- Use _____ to indicate blank spaces in the question text
- Provide the complete question with blanks in "questionText" field
- Each blank should have an "identity" number starting from 1
- Provide correct answer(s) in the "values" array
- Accept multiple valid answers if applicable
- Make blanks test key concepts, not trivial details`;
    
    case 'SAQ':
      return `
SAQ (Short Answer Question) Instructions:
- Questions should require 2-5 sentence answers
- Provide a comprehensive "correctAnswer" that demonstrates expected quality
- Include "maxMarks" field (typically 3-10 marks)
- Add "keywords" array with key terms expected in answers
- Focus on understanding, application, or analysis rather than memorization
- Questions should be open-ended but have clear evaluation criteria`;
    
    case 'TF':
      return `
TF (True/False) Instructions:
- Create a clear, unambiguous statement
- Avoid absolute terms like "always" or "never" unless factually accurate
- The statement should test understanding of key concepts
- Provide "correctAnswer" as boolean (true/false)
- Include the complete statement in "statement" field
- Avoid trick questions or overly complex statements`;
    
    case 'MAQ':
      return `
MAQ (Multiple Answer Question) Instructions:
- Create 4-6 options where 2-4 can be correct
- Clearly indicate which options are correct with isCorrect: true
- Provide "correctAnswerKeys" array with all correct option letters
- Include "minSelections" and "maxSelections" to guide students
- Make sure incorrect options are plausible but clearly wrong
- Test comprehensive understanding of the topic`;
    
    case 'ORD':
      return `
ORD (Ordering/Sequencing) Instructions:
- Create 3-5 items that need to be arranged in correct sequence
- Each item should have unique "id" and descriptive "text"
- Provide "correctOrder" field for each item (1, 2, 3, etc.)
- Items should represent logical sequence (chronological, process steps, etc.)
- Make the sequence clear and unambiguous
- Test understanding of processes, timelines, or logical flow`;
    
    case 'MTF':
      return `
MTF (Match the Following) Instructions:
- Create 3-4 items for left column and corresponding matches for right column
- Left column items should have numeric ids (1, 2, 3)
- Right column items should have letter ids (A, B, C)
- Provide "correctMatches" with left-right pairings
- Ensure one-to-one matching (each left item matches exactly one right item)
- Test relationships, definitions, examples, or associations
- Avoid ambiguous matches`;
    
    default:
      return `
General Instructions:
- Follow the specified question type format exactly
- Ensure questions are appropriate for the educational level
- Test meaningful understanding rather than trivial recall
- Provide clear, unambiguous questions and answers`;
  }
}

/**
 * Generate AI prompt based on settings
 * @param {Object} settings - Question generation settings
 * @param {string} settings.questionType - Type of question (MCQ, SAQ, FTB, TF, MAQ, ORD, MTF)
 * @param {string} settings.content - PDF or user content
 * @param {string} settings.userPrompt - User's custom prompt
 * @param {string} settings.bloomsLevel - Bloom's taxonomy level
 * @param {string} settings.complexity - Complexity level
 * @param {boolean} settings.includeReasoning - Whether to include reasoning for correct answers
 * @param {boolean} settings.caseBased - Whether to create case-based questions
 * @param {number} settings.questionCount - Number of questions to generate
 * @returns {string} Formatted prompt for AI
 */
function generateAIPrompt(settings) {
  const {
    questionType,
    content,
    userPrompt,
    bloomsLevel = 'understand',
    complexity = 'intermediate',
    includeReasoning = false,
    caseBased = false,
    questionCount = 1
  } = settings;

  // Get Bloom's taxonomy details
  const bloomsData = BLOOMS_TAXONOMY[bloomsLevel];
  const complexityData = COMPLEXITY_LEVELS[complexity];

  // Build the main prompt
  let prompt = `You are an expert educational question generator. Create ${questionCount} ${questionType} question(s) based on the following requirements:

CONTENT CONTEXT:
${content ? `Content: ${content}` : ''}
${userPrompt ? `Additional Instructions: ${userPrompt}` : ''}

QUESTION SPECIFICATIONS:
- Question Type: ${questionType}
- Bloom's Taxonomy Level: ${bloomsData.name} (${bloomsData.description})
- Complexity Level: ${complexityData.name} (${complexityData.description})
- Use action words like: ${bloomsData.keywords.join(', ')}
${caseBased ? '- Create case-based/scenario questions with realistic situations' : ''}
${includeReasoning ? '- Include detailed explanations for correct answers' : ''}

${getQuestionTypeInstructions(questionType)}

FORMATTING REQUIREMENTS:
Generate questions in the following JSON format exactly as specified:
[
  {
    "type": "${questionType}",
    "question": "Question text here",
    ${getQuestionTypeSpecificFormat(questionType, includeReasoning)}
  }
]

QUALITY GUIDELINES:
1. Questions should be clear, unambiguous, and professionally written
2. Align with the specified Bloom's taxonomy level using appropriate action words
3. Match the complexity level requested (${complexityData.description})
4. Avoid trivial or overly obvious questions
5. Ensure cultural sensitivity and inclusivity
6. Test meaningful understanding rather than memorization
${caseBased ? '7. Create realistic scenarios that require practical application' : ''}
${includeReasoning ? '8. Provide comprehensive explanations that aid learning' : ''}

CRITICAL: Generate exactly ${questionCount} question(s) following the exact JSON structure above. Do not deviate from the specified format for ${questionType} questions.`;

  return prompt;
}

/**
 * Get question type specific formatting requirements for the application
 * @param {string} questionType - Type of question
 * @param {boolean} includeReasoning - Whether to include reasoning
 * @returns {string} Format specification matching application format
 */
function getQuestionTypeSpecificFormat(questionType, includeReasoning) {
  switch (questionType) {
    case 'MCQ':
      return `"choices": [
      {"key": "A", "label": "First option text", "isCorrect": false},
      {"key": "B", "label": "Correct option text", "isCorrect": true},
      {"key": "C", "label": "Third option text", "isCorrect": false},
      {"key": "D", "label": "Fourth option text", "isCorrect": false}
    ],
    "correctAnswerKey": "B"${includeReasoning ? ',\n    "explanation": "Detailed explanation of why option B is correct and why other options are incorrect"' : ''}`;
    
    case 'FTB':
      return `"blanks": [
      {"identity": 1, "values": [{"value": "correct answer", "isCorrect": true}]}
    ],
    "questionText": "Complete this sentence: The main concept is _____ because it helps in understanding."${includeReasoning ? ',\n    "explanation": "Explanation of the correct answer and its significance in the context"' : ''}`;
    
    case 'SAQ':
      return `"correctAnswer": "Detailed sample answer that demonstrates the expected response quality and key points",
    "maxMarks": 5,
    "keywords": ["key concept 1", "key concept 2", "important term"]${includeReasoning ? ',\n    "explanation": "Detailed explanation of what constitutes a good answer and key points to look for in student responses"' : ''}`;
    
    case 'TF':
      return `"correctAnswer": true,
    "statement": "The statement to be evaluated as true or false"${includeReasoning ? ',\n    "explanation": "Detailed explanation of why the statement is true/false with supporting evidence"' : ''}`;
    
    case 'MAQ':
      return `"choices": [
      {"key": "A", "label": "First option", "isCorrect": true},
      {"key": "B", "label": "Second option", "isCorrect": false},
      {"key": "C", "label": "Third option", "isCorrect": true},
      {"key": "D", "label": "Fourth option", "isCorrect": false}
    ],
    "correctAnswerKeys": ["A", "C"],
    "minSelections": 1,
    "maxSelections": 2${includeReasoning ? ',\n    "explanation": "Detailed explanation of why options A and C are correct and why B and D are incorrect"' : ''}`;
    
    case 'ORD':
      return `"items": [
      {"id": 1, "text": "First item in sequence", "correctOrder": 1},
      {"id": 2, "text": "Second item in sequence", "correctOrder": 2},
      {"id": 3, "text": "Third item in sequence", "correctOrder": 3},
      {"id": 4, "text": "Fourth item in sequence", "correctOrder": 4}
    ]${includeReasoning ? ',\n    "explanation": "Detailed explanation of the correct sequence and reasoning behind the ordering"' : ''}`;
    
    case 'MTF':
      return `"leftColumn": [
      {"id": 1, "text": "Item 1 from left column"},
      {"id": 2, "text": "Item 2 from left column"},
      {"id": 3, "text": "Item 3 from left column"}
    ],
    "rightColumn": [
      {"id": "A", "text": "Matching item A"},
      {"id": "B", "text": "Matching item B"},
      {"id": "C", "text": "Matching item C"}
    ],
    "correctMatches": [
      {"left": 1, "right": "B"},
      {"left": 2, "right": "A"},
      {"left": 3, "right": "C"}
    ]${includeReasoning ? ',\n    "explanation": "Detailed explanation of why each pair matches and the reasoning behind the connections"' : ''}`;
    
    default:
      return `"correctAnswer": "Answer text here"${includeReasoning ? ',\n    "explanation": "Explanation of the correct answer"' : ''}`;
  }
}

/**
 * Generate case-based scenario prompt
 * @param {string} subject - Subject area
 * @param {string} content - Content context
 * @returns {string} Case-based scenario
 */
function generateCaseBasedScenario(subject, content) {
  return `Create a realistic case study or scenario related to ${subject}. The scenario should:
1. Present a practical situation that professionals might encounter
2. Include relevant details and context
3. Require application of concepts from the provided content
4. Be engaging and relatable to learners

Base the scenario on this content: ${content}`;
}

/**
 * Validate prompt settings
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validatePromptSettings(settings) {
  const errors = [];
  
  if (!settings.questionType) {
    errors.push("Question type is required");
  }
  
  if (!settings.content && !settings.userPrompt) {
    errors.push("Either content or user prompt is required");
  }
  
  if (settings.bloomsLevel && !BLOOMS_TAXONOMY[settings.bloomsLevel]) {
    errors.push("Invalid Bloom's taxonomy level");
  }
  
  if (settings.complexity && !COMPLEXITY_LEVELS[settings.complexity]) {
    errors.push("Invalid complexity level");
  }
  
  if (settings.questionCount && (settings.questionCount < 1 || settings.questionCount > 10)) {
    errors.push("Question count must be between 1 and 10");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get available options for dropdowns
 */
function getPromptGenerationOptions() {
  return {
    bloomsTaxonomy: Object.entries(BLOOMS_TAXONOMY).map(([key, value]) => ({
      value: key,
      label: value.name,
      description: value.description
    })),
    complexityLevels: Object.entries(COMPLEXITY_LEVELS).map(([key, value]) => ({
      value: key,
      label: value.name,
      description: value.description
    }))
  };
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateAIPrompt,
    generateCaseBasedScenario,
    validatePromptSettings,
    getPromptGenerationOptions,
    getQuestionTypeInstructions,
    getQuestionTypeSpecificFormat,
    BLOOMS_TAXONOMY,
    COMPLEXITY_LEVELS
  };
} 