/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

/** Use the configured API host, without duplicating an existing /v1 suffix. */
export function getApiBaseURL(serverAddress, origin) {
  try {
    const url = new URL(serverAddress || origin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      throw new Error('Invalid API address');
    }
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1';
  } catch {
    return new URL('/v1', origin).href;
  }
}

export function createCodeExamples(baseURL) {
  const quoteShell = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
  return {
    curl: [
      'curl ' + quoteShell(baseURL + '/chat/completions') + ' \\',
      '  -H "Authorization: Bearer YOUR_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{",
      '    "model": "YOUR_MODEL_ID",',
      '    "messages": [{"role": "user", "content": "Hello"}]',
      "  }'",
    ].join('\n'),
    python: [
      'from openai import OpenAI',
      '',
      'client = OpenAI(',
      '    base_url=' + JSON.stringify(baseURL) + ',',
      '    api_key="YOUR_API_KEY",',
      ')',
      'response = client.chat.completions.create(',
      '    model="YOUR_MODEL_ID",',
      '    messages=[{"role": "user", "content": "Hello"}],',
      ')',
      'print(response.choices[0].message.content)',
    ].join('\n'),
    node: [
      "import OpenAI from 'openai';",
      '',
      'const client = new OpenAI({',
      '  baseURL: ' + JSON.stringify(baseURL) + ',',
      "  apiKey: 'YOUR_API_KEY',",
      '});',
      'const response = await client.chat.completions.create({',
      "  model: 'YOUR_MODEL_ID',",
      "  messages: [{ role: 'user', content: 'Hello' }],",
      '});',
      'console.log(response.choices[0].message.content);',
    ].join('\n'),
  };
}
