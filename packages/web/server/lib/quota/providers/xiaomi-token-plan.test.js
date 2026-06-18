import { describe, expect, it } from 'vitest';

import { parseXiaomiTokenPlanUsage } from './xiaomi-token-plan.js';

const usagePayload = {
  code: 0,
  data: {
    monthUsage: {
      percent: 0.1233,
      items: [
        {
          name: 'month_total_token',
          used: 16275247321,
          limit: 132000000000,
          percent: 0.1233,
        },
      ],
    },
    usage: {
      percent: 0.12,
      items: [
        {
          name: 'plan_total_token',
          used: 16275247321,
          limit: 132000000000,
          percent: 0.12,
        },
        {
          name: 'other_token',
          used: 1,
          limit: 10,
          percent: 0.1,
        },
      ],
    },
  },
};

const detailPayload = {
  code: 0,
  data: {
    planCode: 'standard:year',
    planName: 'Standard',
    currentPeriodEnd: '2027-05-26 23:59:59',
    expired: false,
  },
};

const balancePayload = {
  code: 0,
  data: {
    balance: '39.52',
    currency: 'USD',
    giftBalance: '39.52',
    cashBalance: '0.00',
  },
};

describe('parseXiaomiTokenPlanUsage', () => {
  it('maps Xiaomi token plan responses to quota windows', () => {
    const windows = parseXiaomiTokenPlanUsage({
      usagePayload,
      detailPayload,
      balancePayload,
    });

    expect(windows.monthly.usedPercent).toBe(12.33);
    expect(windows.monthly.valueLabel).toBe('16,275,247,321 / 132,000,000,000 tokens');
    expect(windows.plan_limit.usedPercent).toBe(12);
    expect(windows.plan_limit.valueLabel).toBe('Standard · 16,275,247,321 / 132,000,000,000 tokens');
    expect(windows.plan_limit.resetAt).toBe(new Date('2027-05-26 23:59:59').getTime());
    expect(windows.credits_balance.valueLabel).toBe('$39.52 USD');
  });
});
