import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { ConversationManager } from '../conversation.js';
import { handleToolError } from './error-handler.js';

/**
 * Schema for list conversations tool
 */
const listConversationsSchema = z.object({
  filter: z.object({
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    created_after: z.string().optional().describe('Filter by creation date (ISO string)'),
    created_before: z.string().optional().describe('Filter by creation date (ISO string)'),
  }).optional().describe('Filter criteria'),
  limit: z.number().int().positive().optional().describe('Max number of conversations to return'),
  offset: z.number().int().min(0).optional().describe('Pagination offset'),
});

/**
 * Schema for get conversation tool
 */
const getConversationSchema = z.object({
  conversation_id: z.string().describe('The ID of the conversation'),
});

/**
 * Schema for delete conversation tool
 */
const deleteConversationSchema = z.object({
  conversation_id: z.string().describe('The ID of the conversation'),
});

/**
 * Register conversation management tools with the server
 */
export function registerConversationTools(
  server: FastMCP,
  conversationManager: ConversationManager
) {
  // List Conversations Tool
  server.addTool({
    name: 'list_conversations',
    description: 'Get a list of available conversations',
    parameters: listConversationsSchema,
    execute: async ({ filter, limit, offset }, { log }) => {
      try {
        // Get raw list
        let conversations = await conversationManager.listConversations(log);
        
        // Apply filters if provided
        if (filter) {
          // Filter by tags
          if (filter.tags && Array.isArray(filter.tags)) {
            conversations = conversations.filter(conv => 
              conv.metadata?.tags?.some(tag => filter.tags?.includes(tag))
            );
          }
          
          // Filter by creation date
          if (filter.created_after) {
            const afterDate = new Date(filter.created_after).getTime();
            conversations = conversations.filter(conv => 
              new Date(conv.created_at).getTime() >= afterDate
            );
          }
          
          if (filter.created_before) {
            const beforeDate = new Date(filter.created_before).getTime();
            conversations = conversations.filter(conv => 
              new Date(conv.created_at).getTime() <= beforeDate
            );
          }
        }
        
        // Apply pagination
        const offsetValue = offset ?? 0;
        const limitValue = limit ?? conversations.length;
        
        conversations = conversations.slice(offsetValue, offsetValue + limitValue);
        
        return JSON.stringify(conversations);
      } catch (error) {
        handleToolError(log, 'ListConversations', error, 'Failed to list conversations');
      }
    }
  });

  // Get Conversation Tool
  server.addTool({
    name: 'get_conversation',
    description: 'Get the full content of a conversation',
    parameters: getConversationSchema,
    execute: async ({ conversation_id }, { log }) => {
      try {
        const conversation = await conversationManager.getConversation(conversation_id, log);
        return JSON.stringify(conversation);
      } catch (error) {
        handleToolError(log, 'GetConversation', error, 'Failed to get conversation');
      }
    }
  });

  // Delete Conversation Tool
  server.addTool({
    name: 'delete_conversation',
    description: 'Delete a conversation',
    parameters: deleteConversationSchema,
    execute: async ({ conversation_id }, { log }) => {
      try {
        const success = await conversationManager.deleteConversation(conversation_id, log);
        return "Conversation deleted";
      } catch (error) {
        handleToolError(log, 'DeleteConversation', error, 'Failed to delete conversation');
      }
    }
  });
} 