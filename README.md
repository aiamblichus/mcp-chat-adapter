# OpenAI Chat MCP Server

An MCP (Model Context Protocol) server that provides a clean interface for LLMs to use chat completion capabilities through the MCP protocol. This server acts as a bridge between an LLM client and any OpenAI-compatible API. The primary use case is for **chat models**, as the server does not provide support for text completions.

## Overview

The OpenAI Chat MCP Server implements the Model Context Protocol (MCP), allowing language models to interact with OpenAI's chat completion API in a standardized way. It enables seamless conversations between users and language models while handling the complexities of API interactions, conversation management, and state persistence.

## Features

- Built with FastMCP for robust and clean implementation
- Provides tools for conversation management and chat completion
- Proper error handling and timeouts
- Supports conversation persistence with local storage
- Easy setup with minimal configuration
- Configurable model parameters and defaults
- Compatible with OpenAI and OpenAI-compatible APIs

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-chat-adapter

# Install dependencies
yarn install

# Build the project
yarn build
```

## Configuration

### Required Environment Variables

These environment variables must be set for the server to function:

```sh
OPENAI_API_KEY=your-api-key  # Your API key for OpenAI or compatible service
OPENAI_API_BASE=https://openrouter.ai/api/v1 # The base URL for the API (can be changed for compatible services)
```

You should also set the `CONVERSATION_DIR` environment variable to the directory where you want to store the conversation data. Use an absolute path.

### Optional Environment Variables

The following environment variables are optional and have default values:

```sh
# Model Configuration
DEFAULT_MODEL=google/gemini-2.0-flash-001 # Default model to use if not specified
DEFAULT_SYSTEM_PROMPT="You are an unhelpful assistant."  # Default system prompt
DEFAULT_MAX_TOKENS=50000 # Default maximum tokens for completion
DEFAULT_TEMPERATURE=0.7  # Default temperature setting
DEFAULT_TOP_P=1.0 # Default top_p setting
DEFAULT_FREQUENCY_PENALTY=0.0 # Default frequency penalty
DEFAULT_PRESENCE_PENALTY=0.0  # Default presence penalty

# Storage Configuration
CONVERSATION_DIR=./convos # Directory to store conversation data
MAX_CONVERSATIONS=1000 # Maximum number of conversations to store
```

## Usage

### Integrating with MCP Clients

This server is designed to be used with MCP clients that can communicate using the Model Context Protocol. The server exposes several tools that clients can invoke to manage conversations and interact with language models.

### Integrating with Claude UI etc.

Your `mcp.json` file should look like this:

```json
{
  "mcpServers": {
    "chat-adapter": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-chat-adapter"
      ],
      "env": {
          "CONVERSATION_DIR": "/Users/aiamblichus/mcp-convos",
          "OPENAI_API_KEY": "xoxoxo",
          "OPENAI_API_BASE": "https://openrouter.ai/api/v1",
          "DEFAULT_MODEL": "qwen/qwq-32b"
      }
    }
  }
}
```

## Available Tools

### 1. Create Conversation

Creates a new chat conversation.

```json
{
  "name": "create_conversation",
  "arguments": {
    "model": "gpt-4",
    "system_prompt": "You are a helpful assistant.",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 1000
    },
    "metadata": {
      "title": "My conversation",
      "tags": ["important", "work"]
    }
  }
}
```

### 2. Chat

Adds a message to a conversation and gets a response.

```json
{
  "name": "chat",
  "arguments": {
    "conversation_id": "123",
    "message": "Hello, how are you?",
    "parameters": {
      "temperature": 0.8
    }
  }
}
```

### 3. List Conversations

Gets a list of available conversations.

```json
{
  "name": "list_conversations",
  "arguments": {
    "filter": {
      "tags": ["important"]
    },
    "limit": 10,
    "offset": 0
  }
}
```

### 4. Get Conversation

Gets the full content of a conversation.

```json
{
  "name": "get_conversation",
  "arguments": {
    "conversation_id": "123"
  }
}
```

### 5. Delete Conversation

Deletes a conversation.

```json
{
  "name": "delete_conversation",
  "arguments": {
    "conversation_id": "123"
  }
}
```

## Development

For FastMCP cli run:

```bash
yarn dev
```

For FastMCP inspect run:

```bash
yarn inspect
```

### Project Structure

The server is organized into modules that handle different aspects of the MCP implementation, conversation management, and API interactions. The codebase follows best practices for TypeScript development and MCP implementation.

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 