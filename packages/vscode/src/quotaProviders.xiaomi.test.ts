import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';

import { parseXiaomiTokenPlanUsage } from './quotaProviders';

describe('parseXiaomiTokenPlanUsage', () => {
  test('maps Xiaomi token plan responses to quota windows', () => {
    const windows = parseXiaomiTokenPlanUsage({
      usagePayload: {
        code: 0,
        data: {
          monthUsage: {
            percent: 0.1233,
            items: [{ name: 'month_total_token', used: 16275247321, limit: 132000000000, percent: 0.1233 }],
          },
          usage: {
            percent: 0.12,
            items: [{ name: 'plan_total_token', used: 16275247321, limit: 132000000000, percent: 0.12 }],
          },
        },
      },
      detailPayload: {
        code: 0,
        data: {
          planName: 'Standard',
          currentPeriodEnd: '2027-05-26 23:59:59',
        },
      },
      balancePayload: {
        code: 0,
        data: {
          balance: '39.52',
          currency: 'USD',
        },
      },
    });

    assert.equal(windows.monthly.usedPercent, 12.33);
    assert.equal(windows.monthly.valueLabel, '16,275,247,321 / 132,000,000,000 tokens');
    assert.equal(windows.plan_limit.usedPercent, 12);
    assert.equal(windows.plan_limit.valueLabel, 'Standard · 16,275,247,321 / 132,000,000,000 tokens');
    assert.equal(windows.credits_balance.valueLabel, '$39.52 USD');
  });
});
