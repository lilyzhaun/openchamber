import { describe, expect, it } from 'vitest';

import { parseOllamaSettingsHtml } from './ollama-cloud.js';

describe('parseOllamaSettingsHtml', () => {
  it('captures reset labels from Ollama cloud usage text', () => {
    const html = `
      Cloud usage
      Session usage
      0.4% used

      Resets in 3 hours.
      Weekly usage
      23.5% used
      deepseek-v4-pro
      31 requests

      Resets in 3 days.
    `;

    const windows = parseOllamaSettingsHtml(html);

    expect(windows.session?.resetAfterFormatted).toBe('in 3 hours');
    expect(windows.weekly?.resetAfterFormatted).toBe('in 3 days');
  });
});
