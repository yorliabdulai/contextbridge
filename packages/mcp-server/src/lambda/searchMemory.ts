import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleSearchMemory } from '../tools/searchMemory';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.userId;
    const query = event.queryStringParameters?.query;
    const tags = event.queryStringParameters?.tags?.split(',');

    if (!userId || !query) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId and query are required' }) };
    }

    const result = await handleSearchMemory({ userId, query, tags });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('searchMemory error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};