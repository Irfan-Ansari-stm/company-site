// src/routes/ai.js
const router  = require('express').Router();
const { query } = require('../config/database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/common');
const { success, created, noContent, isUUID } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ════════════════════════════════════════════════════════════
//  AI ASSISTANT CONVERSATIONS
// ════════════════════════════════════════════════════════════
router.get('/conversations', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.title, c.mode, c.created_at, c.updated_at,
            COUNT(m.id) AS message_count
       FROM ai_schema.conversations c
       LEFT JOIN ai_schema.messages m ON m.conversation_id=c.id
      WHERE c.user_id=$1 AND c.deleted_at IS NULL
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 50`,
    [req.userId]
  );
  return success(res, rows);
}));

router.get('/conversations/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM ai_schema.conversations WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [req.params.id, req.userId]
  );
  if (!rows.length) throw new AppError('Conversation not found', 404);
  const messages = await query(
    `SELECT * FROM ai_schema.messages WHERE conversation_id=$1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  return success(res, { ...rows[0], messages: messages.rows });
}));

router.post('/conversations', authenticate, asyncHandler(async (req, res) => {
  const { title, mode, context } = req.body;
  const { rows } = await query(
    `INSERT INTO ai_schema.conversations (user_id, title, mode, context)
     VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
    [req.userId, title || 'New Conversation', mode || 'general', JSON.stringify(context || {})]
  );
  return created(res, rows[0]);
}));

router.delete('/conversations/:id', authenticate, asyncHandler(async (req, res) => {
  await query(
    `UPDATE ai_schema.conversations SET deleted_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.userId]
  );
  return noContent(res);
}));

// ── Chat ──────────────────────────────────────────────────────
router.post('/chat', authenticate, strictLimiter, asyncHandler(async (req, res) => {
  const { message, conversation_id, mode = 'general', context } = req.body;
  if (!message) throw new AppError('message required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('AI service not configured', 503);

  // Get or create conversation
  let convId = conversation_id;
  if (!convId) {
    const { rows: convRows } = await query(
      `INSERT INTO ai_schema.conversations (user_id, title, mode) VALUES ($1,$2,$3) RETURNING id`,
      [req.userId, message.substring(0, 60), mode]
    );
    convId = convRows[0].id;
  }

  // Load conversation history
  const { rows: historyRows } = await query(
    `SELECT role, content FROM ai_schema.messages
      WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 20`,
    [convId]
  );

  // Save user message
  await query(
    `INSERT INTO ai_schema.messages (conversation_id, role, content) VALUES ($1,'user',$2)`,
    [convId, message]
  );

  // Build system prompt based on mode
  const systemPrompts = {
    general:    'You are a helpful business assistant for an enterprise software company.',
    crm:        'You are a CRM assistant. Help with lead management, follow-ups, and sales insights.',
    content:    'You are a content writing assistant. Help create professional blog posts, proposals, and marketing copy.',
    code:       'You are a senior software engineer. Provide clean, well-documented code solutions.',
    analytics:  'You are a data analyst. Help interpret metrics, identify trends, and provide actionable insights.',
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.general;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...historyRows,
    { role: 'user', content: message },
  ];

  // Call OpenAI API
  const axios = require('axios');
  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model:       process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens:  2000,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const assistantMessage = aiResponse.data.choices[0].message.content;
  const tokensUsed       = aiResponse.data.usage?.total_tokens || 0;
  const model            = aiResponse.data.model;

  // Save assistant message
  await query(
    `INSERT INTO ai_schema.messages (conversation_id, role, content, tokens_used, model)
     VALUES ($1,'assistant',$2,$3,$4)`,
    [convId, assistantMessage, tokensUsed, model]
  );

  // Update conversation token count
  await query(
    `UPDATE ai_schema.conversations
        SET total_tokens=total_tokens+$1, message_count=message_count+2, updated_at=NOW()
      WHERE id=$2`,
    [tokensUsed, convId]
  );

  return success(res, {
    conversation_id: convId,
    message: assistantMessage,
    tokens_used: tokensUsed,
    model,
  });
}));

// ── AI Content Generation ─────────────────────────────────────
router.post('/generate/proposal', authenticate, strictLimiter, asyncHandler(async (req, res) => {
  const { lead_data, services, budget, timeline } = req.body;
  if (!lead_data) throw new AppError('lead_data required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('AI service not configured', 503);

  const axios = require('axios');
  const prompt = `Generate a professional business proposal for:
Client: ${lead_data.company || lead_data.full_name}
Services requested: ${Array.isArray(services) ? services.join(', ') : services}
Budget range: ${budget || 'Not specified'}
Timeline: ${timeline || 'Not specified'}
Requirements: ${lead_data.requirements || 'Not specified'}

Return a JSON with: { executive_summary, scope_of_work, deliverables, timeline, investment, terms, next_steps }`;

  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional business proposal writer. Always return valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens:  2500,
      temperature: 0.6,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 40000 }
  );

  let proposalData = {};
  try {
    const text = aiResponse.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) proposalData = JSON.parse(jsonMatch[0]);
  } catch (e) {
    proposalData = { raw: aiResponse.data.choices[0].message.content };
  }

  return success(res, proposalData);
}));

router.post('/generate/blog', authenticate, strictLimiter, asyncHandler(async (req, res) => {
  const { topic, tone, length, keywords, audience } = req.body;
  if (!topic) throw new AppError('topic required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('AI service not configured', 503);

  const axios = require('axios');
  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert content writer for a technology company blog.' },
        {
          role: 'user',
          content: `Write a ${length || 'medium'} blog post about "${topic}".
Tone: ${tone || 'professional'}
Target audience: ${audience || 'business professionals'}
Keywords to include: ${keywords?.join(', ') || 'none specified'}
Return JSON: { title, excerpt, content (markdown), tags, estimated_read_time }`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.75,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 40000 }
  );

  let blogData = {};
  try {
    const text = aiResponse.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) blogData = JSON.parse(jsonMatch[0]);
  } catch {
    blogData = { content: aiResponse.data.choices[0].message.content };
  }

  return success(res, blogData);
}));

router.post('/generate/email', authenticate, strictLimiter, asyncHandler(async (req, res) => {
  const { purpose, recipient_name, recipient_company, context, tone } = req.body;
  if (!purpose) throw new AppError('purpose required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('AI service not configured', 503);

  const axios = require('axios');
  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write professional business emails. Return JSON: { subject, body }' },
        {
          role: 'user',
          content: `Write a ${tone || 'professional'} email.
Purpose: ${purpose}
Recipient: ${recipient_name || 'the recipient'} from ${recipient_company || 'their company'}
Context: ${context || 'none'}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.6,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 20000 }
  );

  let emailData = {};
  try {
    const text = aiResponse.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) emailData = JSON.parse(jsonMatch[0]);
  } catch {
    emailData = { body: aiResponse.data.choices[0].message.content };
  }

  return success(res, emailData);
}));

// ── AI Usage Stats ────────────────────────────────────────────
router.get('/usage', authenticate, requirePermission('analytics.view'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT DATE(c.created_at) AS date,
            COUNT(DISTINCT c.id) AS conversations,
            COUNT(m.id) AS messages,
            SUM(m.tokens_used) AS tokens
       FROM ai_schema.conversations c
       JOIN ai_schema.messages m ON m.conversation_id=c.id
      WHERE c.created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(c.created_at) ORDER BY date DESC`
  );
  return success(res, rows);
}));

module.exports = router;
