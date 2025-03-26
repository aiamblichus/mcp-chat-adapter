import { ChatTimeoutError, ConversationNotFoundError } from '../types.js';
import { Logger } from '../utils.js';

/**
 * Standard error handler for tool functions
 * 
 * This function:
 * 1. Logs the error with consistent formatting
 * 2. Handles specific error types (like ConversationNotFoundError)
 * 3. Provides standardized error messages
 * 
 * @param context - Context identifier for the log entry
 * @param error - The error to handle
 * @param customMessage - Optional custom error message prefix
 */
export function handleToolError(
  log: Logger,
  context: string, 
  error: unknown, 
  customMessage?: string
): never {
  // Get a readable error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log the error
  log.error(context, `${customMessage || 'Error'}: ${errorMessage}`);
  
  // Handle specific error types
  if (error instanceof ConversationNotFoundError) {
    // ConversationNotFoundError should be passed through directly
    throw error;
  }
  
  if (error instanceof ChatTimeoutError) {
    // ChatTimeoutError should be passed through directly
    throw error;
  }
  
  if (error instanceof Error && error.name === 'AbortError') {
    // Convert AbortError to ChatTimeoutError for consistency
    log.error(context, "Request timed out or was cancelled");
    throw new ChatTimeoutError();
  }
  
  // For other errors, throw a generic error with context
  throw new Error(`${customMessage || 'Error in'} ${context}: ${errorMessage}`);
} 