import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import { parseNeuralwattQuota } from './quotaProviders';

describe('parseNeuralwattQuota', () => {
  test('maps Neuralwatt quota details to usage windows', () => {
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

    assert.equal(windows.credits_balance.usedPercent, 0);
    assert.equal(windows.credits_balance.remainingPercent, 100);
    assert.equal(windows.credits_balance.valueLabel, '$1.00');
    assert.equal(Math.round((windows.monthly.usedPercent ?? 0) * 10000) / 10000, 0.6183);
    assert.equal(windows.monthly.windowSeconds, 30 * 24 * 60 * 60);
    assert.equal(windows.monthly.resetAt, null);
    assert.equal(windows.monthly.valueLabel, '$0.19 USD · 37.1 Wh');
    assert.equal(Math.round((windows.billing_cycle.usedPercent ?? 0) * 10000) / 10000, 0.6183);
    assert.equal(windows.billing_cycle.windowSeconds, 30 * 24 * 60 * 60);
    assert.equal(windows.billing_cycle.valueLabel, '12# · 0.69M');
  });
});
