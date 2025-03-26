import fs from 'fs/promises';
import path from 'path';
import fsSync from 'fs';
import { DEBUG, CONVERSATION_DIR } from './constants.js';
import { 
  ChatArgs, 
  CreateConversationArgs, 
  Conversation,
  ConversationMetadata,
  ConversationStorageError
} from './types.js';
import { SerializableValue } from 'fastmcp';

export type Logger = {
  debug: (message: string, data?: SerializableValue) => void;
  error: (message: string, data?: SerializableValue) => void;
  info: (message: string, data?: SerializableValue) => void;
  warn: (message: string, data?: SerializableValue) => void;
};

/**
 * Sleep for a specified number of milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validate create conversation arguments
 */
export const isValidCreateConversationArgs = (args: unknown): args is CreateConversationArgs => {
  if (typeof args !== 'object' || args === null) {
    return false;
  }

  const candidate = args as CreateConversationArgs;
  
  // Check optional string parameters
  if (candidate.model !== undefined && typeof candidate.model !== 'string') {
    return false;
  }

  if (candidate.system_prompt !== undefined && typeof candidate.system_prompt !== 'string') {
    return false;
  }
  
  // Check optional parameters object
  if (candidate.parameters !== undefined) {
    if (typeof candidate.parameters !== 'object' || candidate.parameters === null) {
      return false;
    }
    
    const optionalNumericParams = [
      'max_tokens',
      'temperature',
      'top_p',
      'frequency_penalty',
      'presence_penalty',
    ];
    
    for (const param of optionalNumericParams) {
      if (
        candidate.parameters[param as keyof typeof candidate.parameters] !== undefined && 
        typeof candidate.parameters[param as keyof typeof candidate.parameters] !== 'number'
      ) {
        return false;
      }
    }
  }
  
  // Check optional metadata object
  if (candidate.metadata !== undefined) {
    if (typeof candidate.metadata !== 'object' || candidate.metadata === null) {
      return false;
    }
    
    // Check title if present
    if (candidate.metadata.title !== undefined && typeof candidate.metadata.title !== 'string') {
      return false;
    }
    
    // Check tags if present
    if (candidate.metadata.tags !== undefined) {
      if (!Array.isArray(candidate.metadata.tags)) {
        return false;
      }
      
      // Ensure all tags are strings
      if (candidate.metadata.tags.some(tag => typeof tag !== 'string')) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Validate chat arguments
 */
export const isValidChatArgs = (args: unknown): args is ChatArgs => {

  if (typeof args !== 'object' || args === null) {
    return false;
  }

  const candidate = args as ChatArgs;
  
  // conversation_id and message are required
  if (typeof candidate.conversation_id !== 'string') {
    return false;
  }

  if (typeof candidate.message !== 'string') {
    return false;
  }
  
  // Check optional parameters object
  if (candidate.parameters !== undefined) {
    if (typeof candidate.parameters !== 'object' || candidate.parameters === null) {
      return false;
    }
    
    const optionalNumericParams = [
      'max_tokens',
      'temperature',
      'top_p',
      'frequency_penalty',
      'presence_penalty',
    ];
    
    for (const param of optionalNumericParams) {
      if (
        candidate.parameters[param as keyof typeof candidate.parameters] !== undefined && 
        typeof candidate.parameters[param as keyof typeof candidate.parameters] !== 'number'
      ) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Ensure the conversations directory exists
 */
export const ensureConversationDir = async (): Promise<void> => {
  try {
    await fs.mkdir(CONVERSATION_DIR, { recursive: true });
  } catch (error) {
    throw new ConversationStorageError(`Failed to create conversations directory: ${(error as Error).message}`);
  }
};

/**
 * Get conversation filename from ID
 */
export const getConversationFilePath = (conversationId: string): string => {
  return path.join(CONVERSATION_DIR, `${conversationId}.json`);
};

/**
 * Read conversation from disk
 */
export const readConversation = async (conversationId: string): Promise<Conversation> => {
  try {
    const filePath = getConversationFilePath(conversationId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Conversation;
  } catch (error) {
    throw new ConversationStorageError(`Failed to read conversation: ${(error as Error).message}`);
  }
};

/**
 * Write conversation to disk
 */
export const writeConversation = async (conversation: Conversation): Promise<void> => {
  try {
    await ensureConversationDir();
    const filePath = getConversationFilePath(conversation.id);
    const data = JSON.stringify(conversation, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
  } catch (error) {
    throw new ConversationStorageError(`Failed to write conversation: ${(error as Error).message}`);
  }
};

/**
 * List all conversations
 */
export const listConversations = async (log: Logger): Promise<ConversationMetadata[]> => {
  try {
    await ensureConversationDir();
    const files = await fs.readdir(CONVERSATION_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const metadataList: ConversationMetadata[] = [];
    
    for (const file of jsonFiles) {
      try {
        const conversationId = path.basename(file, '.json');
        const conversationData = await readConversation(conversationId);
        
        metadataList.push({
          id: conversationData.id,
          model: conversationData.model,
          created_at: conversationData.created_at,
          updated_at: conversationData.updated_at,
          message_count: conversationData.messages.length,
          metadata: conversationData.metadata
        });
      } catch (error) {
        log.warn('Storage', `Error reading conversation file ${file}: ${(error as Error).message}`);
        // Skip invalid files
      }
    }
    
    // Sort by updated_at timestamp, newest first
    return metadataList.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    throw new ConversationStorageError(`Failed to list conversations: ${(error as Error).message}`);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    const filePath = getConversationFilePath(conversationId);
    await fs.unlink(filePath);
  } catch (error) {
    throw new ConversationStorageError(`Failed to delete conversation: ${(error as Error).message}`);
  }
};

/**
 * Get the next available conversation ID by finding the highest existing ID and incrementing it
 * 
 * Using sequential IDs (1, 2, 3, ...) instead of UUIDs makes for a better user experience,
 * as they are easier to remember, type, and reference. This is especially helpful when users
 * need to manually specify conversation IDs in the chat tool.
 */
export const getNextConversationId = async (): Promise<string> => {
  try {
    await ensureConversationDir();
    const files = await fs.readdir(CONVERSATION_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let highestId = 0;
    
    for (const file of jsonFiles) {
      const fileBaseName = path.basename(file, '.json');
      const idNumber = parseInt(fileBaseName, 10);
      
      // Check if the filename is a valid integer
      if (!isNaN(idNumber) && String(idNumber) === fileBaseName) {
        highestId = Math.max(highestId, idNumber);
      }
    }
    
    // Return the next ID as a string
    return String(highestId + 1);
  } catch (error) {
    throw new ConversationStorageError(`Failed to get next conversation ID: ${(error as Error).message}`);
  }
}; 