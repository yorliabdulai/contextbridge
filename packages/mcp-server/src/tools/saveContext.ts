import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../aws/dynamodb';
import { ContextEntry } from '../types';

export const saveContextTool: Tool = {
  name: 'save_context',
  description: 'Save a conversation or context entry to MemoryMesh. Call this at the end of meaningful conversations to persist knowledge about the user.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Unique identifier for the user',
      },
      source: {
        type: 'string',
        enum: ['claude', 'chatgpt', 'gemini', 'other'],
        description: 'Which AI tool this context came from',
      },
      content: {
        type: 'string',
        description: 'The full context or conversation summary to save',
      },
      summary: {
        type: 'string',
        description: 'A short 1-2 sentence summary of this context',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags to categorize this context (e.g. ["career", "aws", "project"])',
      },
    },
    required: ['userId', 'source', 'content', 'summary'],
  },
};

const SaveContextSchema = z.object({
  userId: z.string(),
  source: z.enum(['claude', 'chatgpt', 'gemini', 'other']),
  content: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export async function handleSaveContext(args: unknown) {
  const input = SaveContextSchema.parse(args);

  const entry: ContextEntry = {
    entryId: uuidv4(),
    userId: input.userId,
    source: input.source,
    content: input.content,
    summary: input.summary,
    tags: input.tags,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLES.CONTEXT,
      Item: entry,
    })
  );

  return {
    content: [
      {
        type: 'text',
        text: `Context saved successfully. Entry ID: ${entry.entryId}`,
      },
    ],
  };
}