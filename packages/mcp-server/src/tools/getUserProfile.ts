import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { docClient, TABLES } from '../aws/dynamodb';
import { UserProfile } from '../types';

export const getUserProfileTool: Tool = {
  name: 'get_user_profile',
  description: 'Get or create a user profile containing career info, skills, and preferences. Always call this first in a new conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'Unique identifier for the user',
      },
      createIfMissing: {
        type: 'boolean',
        description: 'If true, creates a blank profile if none exists',
      },
    },
    required: ['userId'],
  },
};

const GetUserProfileSchema = z.object({
  userId: z.string(),
  createIfMissing: z.boolean().optional().default(true),
});

export async function handleGetUserProfile(args: unknown) {
  const input = GetUserProfileSchema.parse(args);

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.PROFILE,
      Key: { userId: input.userId },
    })
  );

  if (result.Item) {
    return {
      content: [
        {
          type: 'text',
          text: `User profile found:\n${JSON.stringify(result.Item, null, 2)}`,
        },
      ],
    };
  }

  if (!input.createIfMissing) {
    return {
      content: [{ type: 'text', text: 'No profile found for this user.' }],
    };
  }

  // Create a blank profile
  const newProfile: UserProfile = {
    userId: input.userId,
    name: '',
    career: '',
    skills: [],
    preferences: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLES.PROFILE,
      Item: newProfile,
    })
  );

  return {
    content: [
      {
        type: 'text',
        text: `New profile created for user: ${input.userId}`,
      },
    ],
  };
}