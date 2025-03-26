import { 
  Conversation, 
  ConversationMetadata, 
  CreateConversationArgs,
  ConversationCreateError,
  ConversationNotFoundError,
  ConversationStorageError,
} from './types.js';
import { 
  readConversation, 
  writeConversation, 
  listConversations,
  deleteConversation,
  ensureConversationDir,
  getNextConversationId,
  Logger
} from './utils.js';
import { DEFAULT_MODEL } from './constants.js';

/**
 * Conversation Manager class
 * 
 * Handles creating, retrieving, updating, and deleting conversations
 */
export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();

  constructor() {
    // Ensure conversation directory exists
    ensureConversationDir().catch((error) => {
      console.error('ConversationManager', `Failed to create conversation directory: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(args: CreateConversationArgs, log: Logger): Promise<Conversation> {
    try {
      const model = args.model || DEFAULT_MODEL;
      const now = new Date().toISOString();
      
      // Set default parameters
      const parameters = {
        temperature: args.parameters?.temperature ?? 0.7,
        max_tokens: args.parameters?.max_tokens ?? 1000,
        top_p: args.parameters?.top_p ?? 1.0,
        frequency_penalty: args.parameters?.frequency_penalty ?? 0.0,
        presence_penalty: args.parameters?.presence_penalty ?? 0.0,
      };
      
      // Initialize messages array with system message if provided
      const messages: Conversation['messages'] = [];
      if (args.system_prompt) {
        messages.push({
          role: 'system',
          content: args.system_prompt,
        });
      }
      
      // Generate a sequential numeric ID instead of UUID
      const id = await getNextConversationId();
      
      // Create new conversation object
      const conversation: Conversation = {
        id,
        model,
        created_at: now,
        updated_at: now,
        parameters,
        messages,
        metadata: args.metadata,
      };
      
      // Save to memory cache and disk
      this.conversations.set(conversation.id, conversation);
      await writeConversation(conversation);
      
      log.debug('ConversationManager', `Created new conversation: ${conversation.id}`);
      return conversation;
    } catch (error) {
      log.error('ConversationManager', `Error creating conversation: ${error instanceof Error ? error.message : String(error)}`);
      throw new ConversationCreateError(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string, log: Logger): Promise<Conversation> {
    // Check memory cache first
    if (this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }
    
    try {
      // Try to load from disk
      const conversation = await readConversation(conversationId);
      
      // Add to memory cache
      this.conversations.set(conversationId, conversation);
      
      return conversation;
    } catch (error) {
      log.error('ConversationManager', `Error loading conversation ${conversationId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new ConversationNotFoundError(conversationId);
    }
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversation: Conversation, log: Logger): Promise<void> {
    try {
      // Update the timestamp
      conversation.updated_at = new Date().toISOString();
      
      // Update cache and persist to disk
      this.conversations.set(conversation.id, conversation);
      await writeConversation(conversation);
      
      log.debug('ConversationManager', `Updated conversation: ${conversation.id}`);
    } catch (error) {
      log.error('ConversationManager', `Error updating conversation ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`);
      throw new ConversationStorageError(`Failed to update conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, log: Logger): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId, log);
    
    conversation.messages.push({
      role,
      content,
    });
    
    await this.updateConversation(conversation, log);
    return conversation;
  }

  /**
   * List all conversations (metadata only)
   */
  async listConversations(log: Logger): Promise<ConversationMetadata[]> {
    try {
      return await listConversations(log);
    } catch (error) {
      log.error('ConversationManager', `Error listing conversations: ${error instanceof Error ? error.message : String(error)}`);
      throw new ConversationStorageError(`Failed to list conversations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, log: Logger): Promise<boolean> {
    try {
      // Remove from memory cache
      this.conversations.delete(conversationId);
      
      // Remove from disk
      await deleteConversation(conversationId);
      
      log.debug('ConversationManager', `Deleted conversation: ${conversationId}`);
      return true;
    } catch (error) {
      log.error('ConversationManager', `Error deleting conversation ${conversationId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
} 