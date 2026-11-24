import crypto from 'crypto';
import cookieSession from 'cookie-session';
import type { RequestHandler } from 'express';
import { isProductionLike } from '../helpers/config.js';

// Fail closed in production/staging: a missing APP_SECRET_KEY must abort startup.
// Outside production, fall back to an ephemeral per-process key rather than a
// public constant, so cookies from a previous run can never be forged or replayed.
const resolveSessionKey = (): string => {
  const configured = process.env.APP_SECRET_KEY;
  if (configured && configured.trim().length > 0) {
    return configured;
  }
  if (isProductionLike()) {
    throw new Error('Environment variable APP_SECRET_KEY is required');
  }
  console.warn(
    '[session] APP_SECRET_KEY is not set; using an ephemeral key (non-production environment).',
  );
  return crypto.randomBytes(32).toString('hex');
};

export const session: RequestHandler = cookieSession({
  name: 'session',
  keys: [resolveSessionKey()],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'lax',
  secure: true,
  httpOnly: true,
});
