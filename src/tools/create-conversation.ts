import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { ConversationManager } from '../conversation.js';
import { DEFAULT_SYSTEM_PROMPT } from '../constants.js';
import { handleToolError } from './error-handler.js';

/**
 * Schema for create conversation tool
 */
const createConversationSchema = z.object({
  model: z.string().optional().describe('The model to use, defaults to env variable'),
  system_prompt: z.string().optional().describe('Initial system message').default(DEFAULT_SYSTEM_PROMPT),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional().describe('Controls randomness (0-1)').default(0.7),
    max_tokens: z.number().int().positive().optional().describe('Maximum tokens to generate').default(1000),
    top_p: z.number().min(0).max(1).optional().describe('Controls diversity via nucleus sampling').default(1.0),
    frequency_penalty: z.number().min(-2).max(2).optional().describe('Decreases repetition of token sequences').default(0.0),
    presence_penalty: z.number().min(-2).max(2).optional().describe('Increases likelihood of talking about new topics').default(0.0),
  }).optional().default({}),
  metadata: z.object({
    title: z.string().optional().describe('Title for the conversation'),
    tags: z.array(z.string()).optional().describe('Tags for categorizing the conversation'),
  }).passthrough().optional().default({}),
});

/**
 * Register the create conversation tool with the server
 */
export function registerCreateConversationTool(
  server: FastMCP,
  conversationManager: ConversationManager,
  defaultModel: string
) {
  // Define the tool
  server.addTool({
    name: 'create_conversation',
    description: 'Initialize a new chat conversation',
    parameters: createConversationSchema,
    execute: async ({ model, system_prompt, parameters, metadata }, { log }) => {
      try {
        // Create the conversation
        const conversation = await conversationManager.createConversation({
          model: model || defaultModel,
          system_prompt,
          parameters,
          metadata,
        }, log);

        // Return success message
        return `Conversation created: ${conversation.id}`;
      } catch (error) {
        handleToolError(log, 'CreateConversation', error, 'Failed to create conversation');
      }
    }
  });
} 