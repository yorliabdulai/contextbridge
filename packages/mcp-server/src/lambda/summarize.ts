import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: 'eu-west-2',
});

interface SummarizeRequest {
  content: string;
  source: string;
}

interface StructuredContext {
  summary: string;
  projects: string[];
  decisions: string[];
  skills: string[];
  tags: string[];
}

async function summarizeWithBedrock(
  content: string,
  source: string
): Promise<StructuredContext> {
  const prompt = `Analyze this AI conversation and extract structured knowledge. Return ONLY valid JSON, no other text.

Conversation from ${source}:
${content.slice(0, 3000)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence summary of what was discussed and accomplished",
  "projects": ["list of project names mentioned"],
  "decisions": ["list of key decisions made"],
  "skills": ["list of technical skills or tools discussed"],
  "tags": ["5-8 relevant tags for categorization"]
}`;

  const command = new InvokeModelCommand({
    modelId: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const text = responseBody.content?.[0]?.text || '{}';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: content.slice(0, 120),
      projects: [],
      decisions: [],
      skills: [],
      tags: [source, 'session'],
    };
  }
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Body required' }) };
    }

    const { content, source }: SummarizeRequest = JSON.parse(event.body);

    if (!content || !source) {
      return { statusCode: 400, body: JSON.stringify({ error: 'content and source required' }) };
    }

    const structured = await summarizeWithBedrock(content, source);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structured),
    };
  } catch (error) {
    console.error('summarize error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};