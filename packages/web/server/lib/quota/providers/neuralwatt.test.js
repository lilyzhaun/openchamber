import { describe, expect, it } from 'vitest';

import { parseNeuralwattQuota } from './neuralwatt.js';

describe('parseNeuralwattQuota', () => {
  it('maps Neuralwatt quota details to usage windows', () => {
    const windows = parseNeuralwattQuota({
      balance: {
        credits_remaining_usd: 1,
        total_credits_usd: 1,
        credits_used_usd: 0,
      },
      usage: {
        current_month: {
          cost_usd: 0.1853,
          requests: 12,
          tokens: 691848,
          energy_kwh: 0.0371,
        },
      },
      subscription: {
        plan: 'basic',
        current_period_end: '2026-07-21T16:42:34Z',
        kwh_included: 6,
        kwh_used: 0.0371,
        kwh_remaining: 5.9629,
        kwh_reset_date: '2026-07-21T16:42:34Z',
      },
    });

    expect(windows.credits_balance.usedPercent).toBe(0);
    expect(windows.credits_balance.remainingPercent).toBe(100);
    expect(windows.credits_balance.valueLabel).toBe('$1.00');
    expect(windows.monthly.usedPercent).toBeCloseTo(0.6183, 4);
    expect(windows.monthly.windowSeconds).toBe(30 * 24 * 60 * 60);
    expect(windows.monthly.resetAt).toBeNull();
    expect(windows.monthly.valueLabel).toBe('$0.19 USD · 37.1 Wh');
    expect(windows.billing_cycle.usedPercent).toBeCloseTo(0.6183, 4);
    expect(windows.billing_cycle.windowSeconds).toBe(30 * 24 * 60 * 60);
    expect(windows.billing_cycle.valueLabel).toBe('1% · 12# · 0.69M');
  });
});
