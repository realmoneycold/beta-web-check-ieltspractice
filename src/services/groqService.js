/**
 * Groq AI Service
 * Handles all AI interactions with Groq API for IELTS writing assessment and mentoring
 */

const Groq = require('groq-sdk');
const logger = require('./loggerService');

// Initialize Groq client lazily
let groq = null;

function initGroqClient() {
  if (groq) {
    logger.info('Groq client already initialized, returning cached instance');
    return groq;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.error('GROQ_API_KEY environment variable is not set');
    throw new Error('GROQ_API_KEY is required but not configured');
  }

  logger.info('Initializing Groq client with API key:', apiKey.substring(0, 10) + '...');

  try {
    groq = new Groq({
      apiKey: apiKey,
    });

    // Verify the client has the expected structure
    if (!groq || !groq.chat || !groq.chat.completions) {
      logger.error('Groq client initialization failed - unexpected structure');
      logger.error('groq object:', Object.keys(groq || {}));
      throw new Error('Groq client initialization failed');
    }

    logger.info('Groq client initialized successfully');
    return groq;
  } catch (error) {
    logger.error('Failed to initialize Groq client:', error.message);
    throw error;
  }
}

// Reset function for debugging
function resetGroqClient() {
  groq = null;
  logger.info('Groq client reset');
}

// ═══════════════════════════════════════════════════════════════
// IELTS EVALUATION PROMPTS
// ═══════════════════════════════════════════════════════════════

const IELTS_WRITING_SYSTEM_PROMPT = `You are an expert IELTS Writing examiner with 10+ years of experience. 

Your task is to evaluate student writing based on IELTS band descriptors.

RESPONSE FORMAT - ALWAYS respond in this JSON format:
{
  "taskFulfillment": {
    "band": 7,
    "score": "7.0",
    "feedback": "Clear main points, but some minor details missing"
  },
  "coherenceAndCohesion": {
    "band": 6.5,
    "score": "6.5",
    "feedback": "Good use of discourse markers, logical flow"
  },
  "lexicalRange": {
    "band": 7,
    "score": "7.0",
    "feedback": "Good range of vocabulary with minor errors"
  },
  "grammaticalAccuracy": {
    "band": 6.5,
    "score": "6.5",
    "feedback": "Generally accurate, some complex structures with errors"
  },
  "overallBand": "6.75",
  "overallBandRounded": 7,
  "strengths": ["Clear structure", "Good vocabulary", "Logical flow"],
  "weaknesses": ["Some grammatical errors", "Could vary sentence structure more"],
  "improvements": ["Practice complex sentence structures", "Review prepositions"],
  "estimatedScore": "6.5-7.0"
}

BAND DESCRIPTORS:
- Band 9: Expert user - very few errors, natural flow, sophisticated vocabulary
- Band 8: Very good - most requirements met, occasional errors, good range
- Band 7: Good - clearly organized, minor errors, adequate vocabulary
- Band 6: Competent - main points covered, some errors, acceptable range
- Band 5: Modest - main ideas present, limited organization, basic vocabulary
- Band 4: Limited - some organization issues, frequent errors, restricted range
- Below 4: Inadequate

Remember: Be encouraging but honest. Provide specific examples.`;

const IELTS_MENTOR_SYSTEM_PROMPT = `You are a supportive and knowledgeable IELTS mentor.

Your student has come to you with questions about IELTS writing, speaking, reading, or listening.

Provide:
1. Clear, practical advice
2. Specific examples when relevant
3. Study strategies that work
4. Encouragement and realistic timelines
5. Common mistakes to avoid

IMPORTANT:
- Consider the student's performance history: {studentContext}
- Give personalized advice based on their weak areas
- Be encouraging but realistic
- Suggest incremental improvements
- Reference IELTS band descriptors when relevant

Format your response naturally as a mentor conversation, not bullet points.`;

// ═══════════════════════════════════════════════════════════════
// MAIN SERVICE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate IELTS writing based on student performance history
 * @param {string} writingText - Student's writing to evaluate
 * @param {Object} studentContext - Student's performance data
 * @returns {Promise<Object>} Evaluation result with bands and feedback
 */
async function evaluateIELTSWriting(writingText, studentContext = {}) {
  try {
    if (!writingText || writingText.trim().length < 50) {
      throw new Error('Writing sample must be at least 50 characters');
    }

    const client = initGroqClient();

    // Build context string
    const contextString = formatStudentContext(studentContext);

    const fullPrompt = `${IELTS_WRITING_SYSTEM_PROMPT}

---

Please evaluate this IELTS writing sample from a student${
      contextString ? ` with this background: ${contextString}` : ''
    }:

"${writingText}"

Provide a detailed evaluation in JSON format with band scores for each criteria.`;

    const message = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    // Parse response
    const responseText = message.choices[0].message.content;
    const evaluation = parseJSONResponse(responseText);

    logger.info('IELTS writing evaluation completed', { studentId: studentContext.id });
    return evaluation;
  } catch (error) {
    logger.error('Error evaluating IELTS writing:', error);
    throw new Error(`Writing evaluation failed: ${error.message}`);
  }
}

/**
 * Get AI mentoring response for student questions
 * @param {string} question - Student's question
 * @param {Object} studentContext - Student's performance data
 * @returns {Promise<Object>} Mentor response
 */
async function getIELTSMentoring(question, studentContext = {}) {
  try {
    if (!question || question.trim().length < 5) {
      throw new Error('Question must be at least 5 characters');
    }

    logger.info('Initializing Groq client for mentoring...');
    const client = initGroqClient();

    // Debug: Check client structure
    logger.info('Groq client structure:', {
      hasClient: !!client,
      hasChat: !!(client && client.chat),
      hasCompletions: !!(client && client.chat && client.chat.completions),
      completionsMethods: client && client.chat && client.chat.completions ? Object.keys(client.chat.completions) : 'N/A'
    });

    const contextString = formatStudentContext(studentContext);
    const systemPrompt = IELTS_MENTOR_SYSTEM_PROMPT.replace(
      '{studentContext}',
      contextString || 'Limited data available'
    );

    // Combine system prompt with user question (Groq doesn't support 'system' parameter)
    const fullPrompt = `${systemPrompt}\n\nStudent Question: ${question}`;

    logger.info('Calling Groq API with model: llama-3.1-8b-instant');

    // Verify client has required methods
    if (!client.chat || !client.chat.completions || typeof client.chat.completions.create !== 'function') {
      logger.error('Groq client missing chat.completions.create method');
      logger.error('client.chat:', Object.keys(client.chat || {}));
      throw new Error('Groq client not properly initialized');
    }

    const message = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 1000,
    });

    const response = message.choices[0].message.content;

    logger.info('IELTS mentoring response generated', { studentId: studentContext.id });
    return {
      response,
      model: 'llama-3.1-8b-instant',
      tokens_used: message.usage?.total_tokens || 0,
    };
  } catch (error) {
    logger.error('Error generating mentoring response:', error);
    throw new Error(`Mentoring failed: ${error.message}`);
  }
}

/**
 * Get detailed writing tips based on student's weak areas
 * @param {string[]} weakAreas - Array of weak areas (e.g., ['grammar', 'vocabulary'])
 * @param {Object} studentContext - Student's data
 * @returns {Promise<Object>} Tips and strategies
 */
async function getWritingTips(weakAreas = [], studentContext = {}) {
  try {
    if (!weakAreas || weakAreas.length === 0) {
      weakAreas = ['all writing skills'];
    }

    const client = initGroqClient();

    const weakAreasList = weakAreas.join(', ');
    const contextString = formatStudentContext(studentContext);

    const prompt = `As an IELTS mentor, provide specific, actionable tips for improving these areas: ${weakAreasList}
${contextString ? `This student background: ${contextString}` : ''}

Provide 5-7 concrete exercises and strategies that work. Be specific and practical.`;

    const message = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1200,
    });

    const tips = message.choices[0].message.content;

    logger.info('Writing tips generated', { areas: weakAreas });
    return {
      tips,
      weakAreas,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Error generating writing tips:', error);
    throw new Error(`Tips generation failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Format student performance context for AI prompts
 * @param {Object} studentContext - Student data
 * @returns {string} Formatted context string
 */
function formatStudentContext(studentContext) {
  if (!studentContext || Object.keys(studentContext).length === 0) {
    return '';
  }

  const parts = [];

  if (studentContext.currentBand) {
    parts.push(`Currently at Band ${studentContext.currentBand}`);
  }

  if (studentContext.previousSubmissions) {
    parts.push(`Previous submissions: ${studentContext.previousSubmissions}`);
  }

  if (studentContext.weakAreas && studentContext.weakAreas.length > 0) {
    parts.push(`Weak areas: ${studentContext.weakAreas.join(', ')}`);
  }

  if (studentContext.strongAreas && studentContext.strongAreas.length > 0) {
    parts.push(`Strong areas: ${studentContext.strongAreas.join(', ')}`);
  }

  if (studentContext.practiceHours) {
    parts.push(`Practice hours: ${studentContext.practiceHours}`);
  }

  return parts.join('; ');
}

/**
 * Parse JSON from Groq response (handles markdown code blocks)
 * @param {string} text - Response text from Groq
 * @returns {Object} Parsed JSON
 */
function parseJSONResponse(text) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Handle markdown code blocks
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Handle plain JSON blocks
    const plainJsonMatch = text.match(/\{[\s\S]*\}/);
    if (plainJsonMatch) {
      return JSON.parse(plainJsonMatch[0]);
    }

    throw new Error('Could not parse JSON from response');
  }
}

/**
 * Check if Groq API is available
 * @returns {Promise<boolean>}
 */
async function isGroqAvailable() {
  try {
    if (!process.env.GROQ_API_KEY) {
      logger.warn('GROQ_API_KEY not configured');
      return false;
    }

    const client = initGroqClient();

    // Quick test call
    await client.chat.completions.create({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 10,
    });

    return true;
  } catch (error) {
    logger.error('Groq API unavailable:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  evaluateIELTSWriting,
  getIELTSMentoring,
  getWritingTips,
  isGroqAvailable,
  parseJSONResponse,
  formatStudentContext,
  initGroqClient,
  resetGroqClient,
};
