import { type ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/** Status enum for chat task states */
export enum ChatTaskStatusEnum {
  /** Task has been created but not started */
  Pending = 'pending',
  /** Task is currently being processed */
  Processing = 'processing',
  /** Task has completed successfully */
  Complete = 'complete',
  /** Task encountered an error */
  Error = 'error',
}

/** Conversation structure for persisting chat history */
export interface Conversation {
  id: string;
  model: string;
  created_at: string;
  updated_at: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
  messages: ChatCompletionMessageParam[];
  metadata?: {
    title?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/** Metadata about a conversation (without messages) */
export interface ConversationMetadata {
  id: string;
  model: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  metadata?: {
    title?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/** Arguments for creating a new conversation */
export interface CreateConversationArgs {
  /** Model to use */
  model?: string;
  /** Initial system message */
  system_prompt?: string;
  /** Default parameters for the conversation */
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  /** User-defined metadata */
  metadata?: {
    title?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/** Arguments for the chat tool */
export interface ChatArgs {
  /** The ID of the conversation */
  conversation_id: string;
  /** The user message to add */
  message: string;
  /** Override default parameters for this request */
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

/** Arguments for listing conversations */
export interface ListConversationsArgs {
  /** Filter criteria */
  filter?: {
    tags?: string[];
    created_after?: string;
    created_before?: string;
    [key: string]: any;
  };
  /** Max number of conversations to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/** Chat completion response data */
export interface ChatResponse {
  /** The generated text */
  response: string;
  /** Token usage statistics */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Information about an ongoing chat task */
export interface ChatTask {
  /** Current status of the task */
  status: ChatTaskStatusEnum;
  /** Result of the completion if successful */
  result?: ChatResponse;
  /** Error message if task failed */
  error?: string;
  /** Timestamp when the task was created */
  created_at: number;
  /** Timestamp when the task will timeout */
  timeout_at: number;
  /** Progress of the task (0-100) */
  progress: number;
  /** Abort controller to cancel the task */
  abortController: AbortController;
}

/** Base class for chat related errors */
export class ChatError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.InvalidRequest
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

/** Error thrown when a chat request times out */
export class ChatTimeoutError extends ChatError {
  constructor(message = 'OpenAI API request timed out') {
    super(message, ErrorCode.InvalidRequest);
    this.name = 'ChatTimeoutError';
  }
}

/** Error thrown when a chat request is cancelled */
export class ChatCancelledError extends ChatError {
  constructor(message = 'OpenAI API request was cancelled') {
    super(message, ErrorCode.InvalidRequest);
    this.name = 'ChatCancelledError';
  }
}

/** Error thrown when a conversation is not found */
export class ConversationNotFoundError extends ChatError {
  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`, ErrorCode.InvalidRequest);
    this.name = 'ConversationNotFoundError';
  }
}

/** Error thrown when conversation creation fails */
export class ConversationCreateError extends ChatError {
  constructor(message = 'Failed to create conversation') {
    super(message, ErrorCode.InternalError);
    this.name = 'ConversationCreateError';
  }
}

/** Error thrown when conversation storage operations fail */
export class ConversationStorageError extends ChatError {
  constructor(message = 'Failed to store conversation') {
    super(message, ErrorCode.InternalError);
    this.name = 'ConversationStorageError';
  }
}

/** Error thrown when conversation data is invalid */
export class ConversationValidationError extends ChatError {
  constructor(message = 'Invalid conversation data') {
    super(message, ErrorCode.InvalidRequest);
    this.name = 'ConversationValidationError';
  }
} 