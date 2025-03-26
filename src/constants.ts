export const DEBUG = true;

// Default values for OpenAI Chat Completion parameters
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt-4o-mini';
export const DEFAULT_SYSTEM_PROMPT = process.env.DEFAULT_SYSTEM_PROMPT || 'You are a helpful assistant.';
export const DEFAULT_MAX_TOKENS = parseInt(process.env.DEFAULT_MAX_TOKENS || '50000', 10);
export const DEFAULT_TEMPERATURE = parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7');
export const DEFAULT_TOP_P = parseFloat(process.env.DEFAULT_TOP_P || '1.0');
export const DEFAULT_FREQUENCY_PENALTY = parseFloat(process.env.DEFAULT_FREQUENCY_PENALTY || '0.0');
export const DEFAULT_PRESENCE_PENALTY = parseFloat(process.env.DEFAULT_PRESENCE_PENALTY || '0.0');

// Timeout and progress settings
export const CHAT_TIMEOUT_MS = 420000; // 7 minutes
export const PROGRESS_UPDATE_INTERVAL_MS = 500; // 0.5 seconds

// Server info
export const SERVER_NAME = 'mcp-chat-adapter';
export const SERVER_VERSION = '1.0.8';

// Conversation storage
export const CONVERSATION_DIR = process.env.CONVERSATION_DIR || './convos';
export const MAX_CONVERSATIONS = parseInt(process.env.MAX_CONVERSATIONS || '1000', 10); 