#!/usr/bin/env node

import { createServer } from './server.js';

// Create and start the server
async function start() {
  try {
    const server = await createServer();
    
    // Start the server with stdio transport
    server.start({
      transportType: 'stdio'
    });
    
  } catch (error) {
    console.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down...');
  process.exit(0);
});

// Start the server
start().catch(error => {
  console.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});