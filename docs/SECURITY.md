# Security Policy

## Data Storage

All conversation data is stored in **your own AWS account**. The MemoryMesh project maintainers, Anthropic, OpenAI, and Google have no access to your data at any point.

Each user's DynamoDB partition is keyed by a randomly generated UUID. No data is shared across users.

## Identity Model

The Chrome extension generates a random UUID (`mm-<uuid-v4>`) on first install and stores it in `chrome.storage.local`. There is no login, no email address, and no personally identifiable information collected or transmitted. The UUID is used solely as a DynamoDB partition key.

## AWS Credentials

AWS credentials for the MCP server are stored locally in the Claude Desktop configuration file. For production use, create a dedicated IAM user with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:eu-west-2:*:table/memorymesh-*"
    },
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:eu-west-2::foundation-model/eu.anthropic.claude-haiku-4-5-20251001-v1:0"
    }
  ]
}
```

Do not commit your `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to version control.

## Reporting a Vulnerability

If you discover a security vulnerability in MemoryMesh, please do **not** open a public GitHub issue.

Instead, email the maintainer directly: **[yorliabdulai1@gmail.com]**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 72 hours. Vulnerabilities that are confirmed will be patched promptly and credited in the changelog unless you prefer to remain anonymous.