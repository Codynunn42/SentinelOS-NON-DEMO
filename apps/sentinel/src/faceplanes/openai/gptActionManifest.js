function trimBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/$/, '');
}

function buildSentinelGPTActionOpenAPI({ baseUrl = 'https://sentinelos.example.com' } = {}) {
  const url = trimBaseUrl(baseUrl) || 'https://sentinelos.example.com';

  return {
    openapi: '3.1.0',
    info: {
      title: 'SentinelOS GPT Action Connector',
      version: '1.0.0',
      description: 'Governed GPT action surface for connecting a configured GPT to SentinelOS through the OpenAI faceplane.'
    },
    servers: [
      {
        url,
        description: 'SentinelOS API base URL'
      }
    ],
    components: {
      securitySchemes: {
        SentinelApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'SentinelOS API key scoped for openai:read and openai:execute.'
        }
      },
      schemas: {
        OpenAIWorkflowRequest: {
          type: 'object',
          required: ['tenantId', 'prompt'],
          properties: {
            tenantId: {
              type: 'string',
              description: 'Tenant registered for the OpenAI faceplane.'
            },
            workflowId: {
              type: 'string',
              description: 'Optional caller-supplied workflow identifier for audit correlation.'
            },
            prompt: {
              type: 'string',
              description: 'Prompt or task instruction submitted through the governed GPT action.'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              description: 'Risk metadata such as confidenceScore, impactRating, domainTier, verifiabilityScore, and domainSensitivity.'
            }
          }
        }
      }
    },
    security: [{ SentinelApiKey: [] }],
    paths: {
      '/faceplane/openai/gpt-actions/connection': {
        get: {
          operationId: 'getSentinelGPTConnectionStatus',
          summary: 'Verify GPT connectivity to SentinelOS',
          parameters: [
            {
              name: 'tenantId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Optional tenant filter for platform keys. Non-platform keys resolve to their own tenant.'
            }
          ],
          responses: {
            200: { description: 'SentinelOS, authority, and OpenAI faceplane connection state returned.' },
            401: { description: 'Missing or invalid SentinelOS API key.' },
            403: { description: 'API key does not have the required read scope.' }
          }
        }
      },
      '/health': {
        get: {
          operationId: 'getSentinelHealth',
          summary: 'Check SentinelOS API health',
          responses: {
            200: { description: 'SentinelOS API health returned.' }
          }
        }
      },
      '/ready': {
        get: {
          operationId: 'getSentinelReadiness',
          summary: 'Check SentinelOS governance readiness',
          responses: {
            200: { description: 'SentinelOS is ready.' },
            503: { description: 'SentinelOS is reachable but degraded.' }
          }
        }
      },
      '/faceplane/openai/status': {
        get: {
          operationId: 'getOpenAIFaceplaneStatus',
          summary: 'Check SentinelOS OpenAI faceplane status',
          parameters: [
            {
              name: 'tenantId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Optional tenant filter. Non-platform keys are automatically scoped to their tenant.'
            }
          ],
          responses: {
            200: { description: 'Faceplane status returned.' },
            401: { description: 'Missing or invalid SentinelOS API key.' },
            403: { description: 'Tenant or scope policy blocked the request.' }
          }
        }
      },
      '/faceplane/openai/config': {
        get: {
          operationId: 'getOpenAIFaceplaneConfig',
          summary: 'Read tenant OpenAI faceplane configuration',
          parameters: [
            {
              name: 'tenantId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Tenant registered for the OpenAI faceplane.'
            }
          ],
          responses: {
            200: { description: 'Tenant configuration returned.' },
            401: { description: 'Missing or invalid SentinelOS API key.' },
            403: { description: 'Tenant or scope policy blocked the request.' },
            404: { description: 'Tenant is not active on the OpenAI faceplane.' }
          }
        }
      },
      '/faceplane/openai/execute': {
        post: {
          operationId: 'executeOpenAIGovernedWorkflow',
          summary: 'Submit a GPT task through SentinelOS governance',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/OpenAIWorkflowRequest' }
              }
            }
          },
          responses: {
            200: { description: 'Governed task executed without escalation.' },
            202: { description: 'Task accepted and routed for operator review.' },
            400: { description: 'Invalid prompt, tenant, or token limit.' },
            401: { description: 'Missing or invalid SentinelOS API key.' },
            403: { description: 'Tenant or scope policy blocked the request.' }
          }
        }
      }
    }
  };
}

module.exports = {
  buildSentinelGPTActionOpenAPI
};
