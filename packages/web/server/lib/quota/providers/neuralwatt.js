import { readAuthFile } from '../../opencode/auth.js';
import {
  buildResult,
  formatMoney,
  getAuthEntry,
  normalizeAuthEntry,
  toNumber,
  toTimestamp,
  toUsageWindow,
} from '../utils/index.js';

export const providerId = 'neuralwatt';
export const providerName = 'Neuralwatt';
export const aliases = ['neuralwatt', 'neural-watt', 'neural_watt'];

const formatUsd = (value) => {
  const number = toNumber(value);
  return number === null ? null : `$${formatMoney(number)} USD`;
};

const formatUsdShort = (value) => {
  const number = toNumber(value);
  return number === null ? null : `$${formatMoney(number)}`;
};

const formatCount = (value) => {
  const number = toNumber(value);
  return number === null ? '0' : new Intl.NumberFormat('en-US').format(number);
};

const formatCompactTokens = (value) => {
  const number = toNumber(value);
  if (number === null) return null;
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 100_000) return `${(number / 1_000_000).toFixed(2)}M`;
  return new Intl.NumberFormat('en-US').format(number);
};

const formatCompactRequests = (value) => {
  const number = toNumber(value);
  if (number === null) return null;
  return `${new Intl.NumberFormat('en-US').format(number)}#`;
};

const usageBrief = (usage) => {
  const parts = [
    formatCompactRequests(usage?.requests),
    formatCompactTokens(usage?.tokens),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
};

const MONTH_WINDOW_SECONDS = 30 * 24 * 60 * 60;

const kwhLabel = (value) => {
  const number = toNumber(value);
  if (number === null) return null;
  if (number < 1) return `${(number * 1000).toFixed(1)} Wh`;
  return `${number.toFixed(4)} kWh`;
};

const monthlyLabel = (usage) => {
  const cost = formatUsd(usage?.cost_usd);
  const energy = kwhLabel(usage?.energy_kwh);
  const parts = [cost, energy].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
};

const percentUsed = (used, total) => {
  const usedNumber = toNumber(used);
  const totalNumber = toNumber(total);
  if (usedNumber === null || totalNumber === null || totalNumber <= 0) return null;
  return Math.max(0, Math.min(100, (usedNumber / totalNumber) * 100));
};

export const parseNeuralwattQuota = (payload) => {
  const balance = payload?.balance;
  const usage = payload?.usage;
  const subscription = payload?.subscription;
  const windows = {};

  const kwhUsed = toNumber(subscription?.kwh_used);
  const kwhIncluded = toNumber(subscription?.kwh_included);
  const resetAt = toTimestamp(subscription?.kwh_reset_date ?? subscription?.current_period_end);
  const currentMonthUsage = usage?.current_month && typeof usage.current_month === 'object' ? usage.current_month : null;

  if (kwhUsed !== null || kwhIncluded !== null) {
    const brief = currentMonthUsage ? usageBrief(currentMonthUsage) : null;
    windows.billing_cycle = toUsageWindow({
      usedPercent: percentUsed(kwhUsed, kwhIncluded),
      windowSeconds: kwhIncluded !== null ? MONTH_WINDOW_SECONDS : null,
      resetAt,
      valueLabel: brief,
    });
  }

  if (currentMonthUsage) {
    windows.monthly = toUsageWindow({
      usedPercent: percentUsed(kwhUsed ?? currentMonthUsage.energy_kwh, kwhIncluded),
      windowSeconds: kwhIncluded !== null ? MONTH_WINDOW_SECONDS : null,
      resetAt: null,
      valueLabel: monthlyLabel(currentMonthUsage) ?? usageSummary(currentMonthUsage),
    });
  }

  const balanceShort = formatUsdShort(balance?.credits_remaining_usd);
  if (balanceShort) {
    windows.credits_balance = toUsageWindow({
      usedPercent: percentUsed(balance?.credits_used_usd, balance?.total_credits_usd),
      windowSeconds: null,
      resetAt: null,
      valueLabel: balanceShort,
    });
  }

  return windows;
};

const getApiKey = () => {
  const auth = readAuthFile();
  const entry = normalizeAuthEntry(getAuthEntry(auth, aliases));
  return entry?.key ?? entry?.token;
};

export const isConfigured = () => Boolean(getApiKey());

export const fetchQuota = async () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return buildResult({
      providerId,
      providerName,
      ok: false,
      configured: false,
      error: 'Not configured',
    });
  }

  try {
    const response = await fetch('https://api.neuralwatt.com/v1/quota', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return buildResult({
        providerId,
        providerName,
        ok: false,
        configured: true,
        error: `API error: ${response.status}`,
      });
    }

    const payload = await response.json();
    const windows = parseNeuralwattQuota(payload);

    return buildResult({
      providerId,
      providerName,
      ok: true,
      configured: true,
      usage: { windows },
    });
  } catch (error) {
    return buildResult({
      providerId,
      providerName,
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Request failed',
    });
  }
};
