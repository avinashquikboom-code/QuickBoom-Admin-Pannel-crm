/**
 * Integration provider definitions (UI-only phase).
 * Field `secret: true` values are kept in memory on the integrations page — never localStorage.
 */

export const INTEGRATION_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  CONFIGURED: 'configured',
  CONNECTED: 'connected',
  CONNECTION_FAILED: 'connection_failed',
  TESTING: 'testing',
};

export const INTEGRATION_PROVIDERS = [
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'File, document, image and media storage.',
    category: 'Storage',
    drawerSize: 'large',
    testPanel: null,
    displayKeys: ['region', 'bucket'],
    fields: [
      { key: 'accessKeyId', label: 'AWS Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'AWS Secret Access Key', type: 'password', required: true, secret: true },
      { key: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'ap-south-1' },
      { key: 'bucket', label: 'S3 Bucket Name', type: 'text', required: true },
      { key: 'prefix', label: 'S3 Folder Prefix', type: 'text', required: false },
      { key: 'cloudFrontUrl', label: 'CloudFront URL', type: 'text', required: false },
    ],
    actions: ['save', 'testConnection', 'disconnect'],
  },
  {
    id: 'msg91',
    name: 'MSG91',
    description: 'SMS notifications and OTP delivery.',
    category: 'Messaging',
    drawerSize: 'large',
    testPanel: 'sms',
    fields: [
      { key: 'authKey', label: 'Auth Key', type: 'password', required: true, secret: true },
      { key: 'senderId', label: 'Sender ID', type: 'text', required: true },
      { key: 'templateId', label: 'Template ID', type: 'text', required: true },
      { key: 'dltEntityId', label: 'DLT Entity ID', type: 'text', required: false },
      { key: 'route', label: 'Route / Service Type', type: 'text', required: true, placeholder: 'Transactional' },
      { key: 'countryCode', label: 'Country Code', type: 'text', required: true, placeholder: '+91' },
    ],
    actions: ['save', 'testConnection', 'testSms', 'disconnect'],
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Location, geofencing, address lookup and maps.',
    category: 'Maps',
    drawerSize: 'large',
    testPanel: null,
    displayKeys: [],
    fields: [
      { key: 'apiKey', label: 'Google Maps API Key', type: 'password', required: true, secret: true },
      { key: 'mapsJs', label: 'Maps JavaScript API', type: 'switch', defaultValue: true },
      { key: 'places', label: 'Places API', type: 'switch', defaultValue: true },
      { key: 'geocoding', label: 'Geocoding API', type: 'switch', defaultValue: true },
      { key: 'directions', label: 'Directions API', type: 'switch', defaultValue: false },
    ],
    actions: ['save', 'testConnection', 'disconnect'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'WhatsApp messaging and business notifications.',
    category: 'Messaging',
    drawerSize: 'xl',
    testPanel: 'whatsapp',
    fields: [
      { key: 'businessAccountId', label: 'WhatsApp Business Account ID', type: 'text', required: true },
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'businessPhone', label: 'WhatsApp Business Phone Number', type: 'text', required: true },
      { key: 'metaAppId', label: 'Meta App ID', type: 'text', required: true },
      { key: 'metaAppSecret', label: 'Meta App Secret', type: 'password', required: true, secret: true },
      { key: 'accessToken', label: 'Permanent Access Token', type: 'password', required: true, secret: true },
      { key: 'webhookVerifyToken', label: 'Webhook Verify Token', type: 'password', required: true, secret: true },
      { key: 'webhookCallbackUrl', label: 'Webhook Callback URL', type: 'text', required: true },
      { key: 'apiVersion', label: 'WhatsApp API Version', type: 'text', required: true, placeholder: 'v21.0' },
    ],
    actions: ['save', 'testConnection', 'sendTestMessage', 'disconnect'],
  },
  {
    id: 'smtp',
    name: 'SMTP Email',
    description: 'System emails, notifications, invoices and password recovery.',
    category: 'Email',
    drawerSize: 'large',
    testPanel: 'email',
    displayKeys: ['host', 'fromEmail'],
    fields: [
      { key: 'host', label: 'SMTP Host', type: 'text', required: true },
      { key: 'port', label: 'SMTP Port', type: 'text', required: true, placeholder: '587' },
      { key: 'username', label: 'SMTP Username', type: 'text', required: true },
      { key: 'password', label: 'SMTP Password', type: 'password', required: true, secret: true },
      {
        key: 'encryption',
        label: 'Encryption',
        type: 'select',
        required: true,
        options: [
          { value: 'none', label: 'None' },
          { value: 'ssl', label: 'SSL' },
          { value: 'starttls', label: 'STARTTLS' },
        ],
        defaultValue: 'starttls',
      },
      { key: 'fromEmail', label: 'From Email', type: 'email', required: true },
      { key: 'fromName', label: 'From Name', type: 'text', required: true },
      { key: 'replyTo', label: 'Reply-To Email', type: 'email', required: false },
    ],
    actions: ['save', 'testConnection', 'sendTestEmail', 'disconnect'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'AI-powered features using Google Gemini.',
    category: 'AI',
    drawerSize: 'medium',
    testPanel: null,
    displayKeys: ['model'],
    fields: [
      { key: 'apiKey', label: 'Gemini API Key', type: 'password', required: true, secret: true },
      {
        key: 'model',
        label: 'Model Selection',
        type: 'select',
        required: true,
        options: [
          { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        ],
        defaultValue: 'gemini-2.0-flash',
      },
      { key: 'temperature', label: 'Temperature', type: 'number', required: true, defaultValue: '0.7', min: 0, max: 2, step: 0.1 },
      { key: 'maxTokens', label: 'Maximum Output Tokens', type: 'number', required: true, defaultValue: '2048' },
    ],
    actions: ['save', 'testConnection', 'disconnect'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI-powered features using OpenAI APIs.',
    category: 'AI',
    drawerSize: 'medium',
    testPanel: null,
    displayKeys: ['model'],
    fields: [
      { key: 'apiKey', label: 'OpenAI API Key', type: 'password', required: true, secret: true },
      {
        key: 'model',
        label: 'Model Selection',
        type: 'select',
        required: true,
        options: [
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        ],
        defaultValue: 'gpt-4o-mini',
      },
      { key: 'temperature', label: 'Temperature', type: 'number', required: true, defaultValue: '0.7', min: 0, max: 2, step: 0.1 },
      { key: 'maxTokens', label: 'Maximum Output Tokens', type: 'number', required: true, defaultValue: '2048' },
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: false },
    ],
    actions: ['save', 'testConnection', 'disconnect'],
  },
];

export function getIntegrationProvider(id) {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id) ?? null;
}

export function createEmptyIntegrationValues(provider) {
  const values = {};
  for (const field of provider.fields) {
    if (field.type === 'switch') {
      values[field.key] = field.defaultValue ?? false;
    } else if (field.defaultValue !== undefined) {
      values[field.key] = String(field.defaultValue);
    } else {
      values[field.key] = '';
    }
  }
  return values;
}

export function isIntegrationConfigured(provider, values) {
  return provider.fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.key];
      if (f.type === 'switch') return true;
      return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
    });
}
