import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../opencode/auth.js', () => ({
  readAuthFile: () => ({ 'minimax-cn-coding-plan': { key: 'test-key' } }),
}));

import { fetchQuota } from './minimax-cn-coding-plan.js';

const quotaResponse = (remainingPercent) => ({
  ok: true,
  json: async () => ({
    base_resp: { status_code: 0 },
    model_remains: [{
      model_name: 'MiniMax-M2.5',
      current_interval_remaining_percent: remainingPercent,
      current_weekly_status: 3,
    }],
  }),
});

describe('MiniMax CN quota percentages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts remaining percentages to used percentages in the quota result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotaResponse(94)));

    const result = await fetchQuota();

    expect(result.usage.windows['5h'].usedPercent).toBe(6);
  });

  it.each([
    [120, 0],
    [-20, 100],
  ])('clamps remaining percentage %s to used percentage %s', async (remainingPercent, expected) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotaResponse(remainingPercent)));

    const result = await fetchQuota();

    expect(result.usage.windows['5h'].usedPercent).toBe(expected);
  });
});
