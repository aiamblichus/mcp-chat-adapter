import { FastMCP } from 'fastmcp';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { 
  DEFAULT_MODEL, 
  DEFAULT_SYSTEM_PROMPT,
  SERVER_NAME,
  SERVER_VERSION,
  CHAT_TIMEOUT_MS
} from './constants.js';
import { ConversationManager } from './conversation.js';

// Load environment variables
dotenv.config();

/**
 * Configure and create the FastMCP server
 */
export async function createServer() {
  // Validate configuration
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBaseUrl = process.env.OPENAI_API_BASE;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    console.error("Config", "OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: apiBaseUrl,
  });

  // Initialize the conversation manager
  const conversationManager = new ConversationManager();

  // Configure FastMCP Server
  const server = new FastMCP({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register tools
  await registerTools(server, openai, conversationManager, model);

  // Add general error handling
  process.on('uncaughtException', (error) => {
    console.error(`Uncaught exception: ${error instanceof Error ? error.stack : String(error)}`);
  });

  return server;
}

/**
 * Register all tools with the server
 */
async function registerTools(
  server: FastMCP, 
  openai: OpenAI, 
  conversationManager: ConversationManager,
  defaultModel: string
) {
  // Import and register all tools
  const createConvTool = await import('./tools/create-conversation.js');
  const chatTool = await import('./tools/chat.js');
  const convTools = await import('./tools/conversation-management.js');

  // Register tools with their dependencies
  createConvTool.registerCreateConversationTool(server, conversationManager, defaultModel);
  chatTool.registerChatTool(server, openai, conversationManager);
  convTools.registerConversationTools(server, conversationManager);
} 