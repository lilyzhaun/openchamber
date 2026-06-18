import { describe, expect, it } from 'vitest';

import { remainingPercentToUsedPercent } from './minimax-cn-coding-plan.js';

describe('remainingPercentToUsedPercent', () => {
  it('converts MiniMax remaining percentages to used percentages for Usage windows', () => {
    expect(remainingPercentToUsedPercent(100)).toBe(0);
    expect(remainingPercentToUsedPercent(94)).toBe(6);
  });

  it('clamps invalid boundaries', () => {
    expect(remainingPercentToUsedPercent(120)).toBe(0);
    expect(remainingPercentToUsedPercent(-20)).toBe(100);
    expect(remainingPercentToUsedPercent(null)).toBeNull();
  });
});
