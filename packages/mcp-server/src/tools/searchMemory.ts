import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { docClient, TABLES } from '../aws/dynamodb';

export const searchMemoryTool: Tool = {
  name: 'search_memory',
  description: 'Search through stored memory by keyword or tags. Use this to find specific past context about a topic.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Unique identifier for the user',
      },
      query: {
        type: 'string',
        description: 'Keyword or phrase to search for in stored context',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by specific tags',
      },
    },
    required: ['userId', 'query'],
  },
};

const SearchMemorySchema = z.object({
  userId: z.string(),
  query: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function handleSearchMemory(args: unknown) {
  const input = SearchMemorySchema.parse(args);
  const queryLower = input.query.toLowerCase();

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLES.CONTEXT,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': input.userId,
      },
    })
  );

  let entries = result.Items || [];

  // Keyword filter
  entries = entries.filter(
    (e) =>
      e.content.toLowerCase().includes(queryLower) ||
      e.summary.toLowerCase().includes(queryLower) ||
      e.tags?.some((t: string) => t.toLowerCase().includes(queryLower))
  );

  // Tag filter
  if (input.tags && input.tags.length > 0) {
    entries = entries.filter((e) =>
      input.tags!.some((tag) => e.tags?.includes(tag))
    );
  }

  if (entries.length === 0) {
    return {
      content: [{ type: 'text', text: `No results found for "${input.query}".` }],
    };
  }

  const formatted = entries
    .map((e) => `[${e.source} | ${e.createdAt} | tags: ${e.tags?.join(', ')}]\n${e.summary}`)
    .join('\n\n---\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${entries.length} matches for "${input.query}":\n\n${formatted}`,
      },
    ],
  };
}