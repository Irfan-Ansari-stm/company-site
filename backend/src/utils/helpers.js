// src/utils/helpers.js
const crypto      = require('crypto');
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcryptjs');
const nodemailer  = require('nodemailer');
const logger      = require('../config/logger');

// ── Token generation ─────────────────────────────────────────
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');
const hashToken           = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ── JWT ──────────────────────────────────────────────────────
const generateAccessToken = (userId, role) =>
  jwt.sign({ userId, role, jti: crypto.randomUUID() }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

// ── Password ─────────────────────────────────────────────────
const hashPassword    = (plain) => bcrypt.hash(plain, 12);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// ── Slug generation ───────────────────────────────────────────
const generateSlug = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

// ── Public ID (short unique) ──────────────────────────────────
const generatePublicId = () => crypto.randomBytes(8).toString('hex').substring(0, 16);

// ── Email transporter ─────────────────────────────────────────
let transporter;
const getMailer = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailer = getMailer();
    await mailer.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Platform'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email send failed to ${to}:`, err.message);
    // Don't throw — email failures shouldn't break the request
  }
};

// ── Response helpers ─────────────────────────────────────────
const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = {}, message = 'Created successfully') =>
  res.status(201).json({ success: true, message, data });

const noContent = (res) => res.status(204).send();

// ── UUID validation ───────────────────────────────────────────
const isUUID = (str) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ── Build dynamic SET clause for UPDATE queries ───────────────
const buildUpdateSet = (fields, startIndex = 1) => {
  const setClauses = [];
  const values     = [];
  let   idx        = startIndex;

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  return { setClauses: setClauses.join(', '), values, nextIdx: idx };
};

// ── JSONB field helper ────────────────────────────────────────
const safeJson = (val, fallback = {}) => {
  if (val && typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val || fallback;
};

module.exports = {
  generateSecureToken, hashToken,
  generateAccessToken, generateRefreshToken,
  hashPassword, comparePassword,
  generateSlug, generatePublicId,
  sendEmail,
  success, created, noContent,
  isUUID, buildUpdateSet, safeJson,
};
