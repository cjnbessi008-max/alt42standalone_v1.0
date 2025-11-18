import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠ ANTHROPIC_API_KEY not set. AI features will be disabled.');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';

export default anthropic;
