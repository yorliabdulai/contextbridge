import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { docClient, TABLES } from '../aws/dynamodb';

export const getContextTool: Tool = {
  name: 'get_context',
  description: 'Retrieve recent context entries for a user. Use this at the start of a conversation to load the user\'s history and preferences.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Unique identifier for the user',
      },
      limit: {
        type: 'number',
        description: 'Number of recent entries to retrieve (default: 10)',
      },
    },
    required: ['userId'],
  },
};

const GetContextSchema = z.object({
  userId: z.string(),
  limit: z.number().optional().default(10),
});

export async function handleGetContext(args: unknown) {
  const input = GetContextSchema.parse(args);

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.CONTEXT,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': input.userId,
      },
      Limit: input.limit,
      ScanIndexForward: false, // newest first
    })
  );

  const entries = result.Items || [];

  if (entries.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No context found for this user.',
        },
      ],
    };
  }

  const formatted = entries
    .map((e) => `[${e.source} | ${e.createdAt}]\n${e.summary}`)
    .join('\n\n---\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${entries.length} context entries:\n\n${formatted}`,
      },
    ],
  };
}