import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleGetUserProfile } from '../tools/getUserProfile';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId is required' }) };
    }

    const result = await handleGetUserProfile({ userId, createIfMissing: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('getUserProfile error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};