import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import OpenAI from 'openai';
import { ConversationManager } from '../conversation.js';
import { 
  CHAT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TOP_P,
  DEFAULT_FREQUENCY_PENALTY,
  DEFAULT_PRESENCE_PENALTY
} from '../constants.js';
import { handleToolError } from './error-handler.js';

/**
 * Schema for chat tool
 */
const chatSchema = z.object({
  conversation_id: z.string().describe('The ID of the conversation'),
  message: z.string().describe('The user message to add'),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional().describe('Controls randomness (0-1)').default(DEFAULT_TEMPERATURE),
    max_tokens: z.number().int().positive().optional().describe('Maximum tokens to generate').default(DEFAULT_MAX_TOKENS),
    top_p: z.number().min(0).max(1).optional().describe('Controls diversity via nucleus sampling').default(DEFAULT_TOP_P),
    frequency_penalty: z.number().min(-2).max(2).optional().describe('Decreases repetition of token sequences').default(DEFAULT_FREQUENCY_PENALTY),
    presence_penalty: z.number().min(-2).max(2).optional().describe('Increases likelihood of talking about new topics').default(DEFAULT_PRESENCE_PENALTY),
  }).optional().default({}),
});

/**
 * Register the chat tool with the server
 */
export function registerChatTool(
  server: FastMCP,
  openai: OpenAI,
  conversationManager: ConversationManager
) {
  // Define the tool
  server.addTool({
    name: 'chat',
    description: 'Add a message to a conversation and get a response. As long as you are using the same conversation ID, the conversation will continue. If you want a new conversation with a clean slate, use the `create-conversation` tool again.',
    parameters: chatSchema,
    execute: async ({ conversation_id, message, parameters = {} }, { reportProgress, log }) => {      
      try {
        // Report initial progress
        reportProgress({
          progress: 0,
          total: 100
        });
        
        // Get the conversation
        const conversation = await conversationManager.getConversation(conversation_id, log);
        
        // Add user message to conversation
        await conversationManager.addMessage(conversation.id, 'user', message, log);
        
        // Get parameters, using defaults from conversation if not overridden
        const chatParams = {
          max_tokens: parameters.max_tokens ?? conversation.parameters.max_tokens,
          temperature: parameters.temperature ?? conversation.parameters.temperature,
          top_p: parameters.top_p ?? conversation.parameters.top_p,
          frequency_penalty: parameters.frequency_penalty ?? conversation.parameters.frequency_penalty,
          presence_penalty: parameters.presence_penalty ?? conversation.parameters.presence_penalty,
        };

        // Start API call with timeout and signal for cancellation
        log.info("Chat", `Starting chat request for conversation ${conversation.id}`);
        
        let assistantMessage = "";
        
        // Use streaming for continuous progress updates
        const stream = await openai.chat.completions.create(
          {
            model: conversation.model,
            messages: conversation.messages,
            max_tokens: chatParams.max_tokens,
            temperature: chatParams.temperature,
            top_p: chatParams.top_p,
            frequency_penalty: chatParams.frequency_penalty,
            presence_penalty: chatParams.presence_penalty,
            stream: true,
          },
          { maxRetries: 3, timeout: CHAT_TIMEOUT_MS }
        );
        
        // Progress from 30% to 80% during streaming
        let progressCounter = 30;
        
        // Process each chunk of the stream
        for await (const chunk of stream) {
          // Extract content from the chunk
          const content = chunk.choices[0]?.delta?.content || "";
          assistantMessage += content;
          
          // Update progress counter and report
          if (progressCounter < 80) {
            // Increment progress by a small amount for each chunk
            progressCounter += 1;
            
            // Report progress more frequently at the beginning to show immediate feedback
            if (progressCounter < 40 || progressCounter % 5 === 0) {
              reportProgress({
                progress: progressCounter,
                total: 100
              });
            }
          }
        }
        
        // Report progress after streaming completes
        reportProgress({
          progress: 80,
          total: 100
        });

        // Add assistant message to conversation
        await conversationManager.addMessage(conversation.id, 'assistant', assistantMessage, log);
        
        // Report complete progress
        reportProgress({
          progress: 100,
          total: 100
        });

        // Return the result
        return assistantMessage;
      } catch (error) {        
        // Use the shared error handler
        handleToolError(log, 'Chat', error, 'Failed to process chat request');
      }
    }
  });
} 