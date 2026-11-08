/**
 * Future admin integration API (not called in UI-only phase).
 *
 * Suggested backend routes:
 * GET    /api/v1/admin/integrations
 * GET    /api/v1/admin/integrations/:provider
 * PUT    /api/v1/admin/integrations/:provider
 * POST   /api/v1/admin/integrations/:provider/test
 * DELETE /api/v1/admin/integrations/:provider
 */

export const INTEGRATION_API_PATHS = {
  list: '/api/v1/admin/integrations',
  detail: (provider) => `/api/v1/admin/integrations/${provider}`,
  upsert: (provider) => `/api/v1/admin/integrations/${provider}`,
  test: (provider) => `/api/v1/admin/integrations/${provider}/test`,
  remove: (provider) => `/api/v1/admin/integrations/${provider}`,
};

/** @typedef {'aws-s3'|'msg91'|'google-maps'|'whatsapp'|'smtp'|'gemini'|'openai'} IntegrationProviderId */

/**
 * @param {IntegrationProviderId} _provider
 * @param {Record<string, unknown>} _payload
 */
export async function saveIntegrationConfig(_provider, _payload) {
  throw new Error('Integration API is not connected. UI-only phase.');
}

/**
 * @param {IntegrationProviderId} _provider
 * @param {Record<string, unknown>} [_testPayload]
 */
export async function testIntegrationConnection(_provider, _testPayload) {
  throw new Error('Integration API is not connected. UI-only phase.');
}
