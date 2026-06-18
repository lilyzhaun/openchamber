import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildResult, toUsageWindow, toNumber, toTimestamp } from '../utils/index.js';

const COOKIE_PATH = join(homedir(), '.config', 'xiaomi-token-plan', 'cookie');
const API_BASE = 'https://platform.xiaomimimo.com/api/v1';

export const providerId = 'xiaomi-token-plan';
export const providerName = 'Xiaomi Token Plan';
export const aliases = ['xiaomi-token-plan', 'xiaomi', 'xiaomi-mimo'];

const readCookieFile = () => {
  try {
    if (!existsSync(COOKIE_PATH)) return null;
    const content = readFileSync(COOKIE_PATH, 'utf-8');
    const trimmed = content.trim();
    return trimmed || null;
  } catch {
    return null;
  }
};

const isSuccessPayload = (payload) => payload?.code === 0 && payload?.data && typeof payload.data === 'object';

const ratioToPercent = (value) => {
  const ratio = toNumber(value);
  if (ratio === null) return null;
  return Math.max(0, Math.min(100, ratio * 100));
};

const formatTokenCount = (value) => {
  const number = toNumber(value);
  return number === null ? '0' : new Intl.NumberFormat('en-US').format(number);
};

const formatTokenValueLabel = (item, prefix = null) => {
  const label = `${formatTokenCount(item?.used)} / ${formatTokenCount(item?.limit)} tokens`;
  return prefix ? `${prefix} · ${label}` : label;
};

const findUsageItem = (items, name) => {
  if (!Array.isArray(items)) return null;
  return items.find((item) => item?.name === name) ?? null;
};

const parseWindowFromItem = ({ item, fallbackPercent, resetAt = null, valuePrefix = null }) => {
  if (!item) return null;
  return toUsageWindow({
    usedPercent: ratioToPercent(item.percent ?? fallbackPercent),
    windowSeconds: null,
    resetAt,
    valueLabel: formatTokenValueLabel(item, valuePrefix)
  });
};

export const parseXiaomiTokenPlanUsage = ({ usagePayload, detailPayload, balancePayload }) => {
  const windows = {};
  const usageData = isSuccessPayload(usagePayload) ? usagePayload.data : null;
  const detailData = isSuccessPayload(detailPayload) ? detailPayload.data : null;
  const balanceData = isSuccessPayload(balancePayload) ? balancePayload.data : null;
  const resetAt = toTimestamp(detailData?.currentPeriodEnd);
  const planName = typeof detailData?.planName === 'string' && detailData.planName.trim()
    ? detailData.planName.trim()
    : null;

  const monthlyItem = findUsageItem(usageData?.monthUsage?.items, 'month_total_token');
  const monthlyWindow = parseWindowFromItem({
    item: monthlyItem,
    fallbackPercent: usageData?.monthUsage?.percent,
    resetAt
  });
  if (monthlyWindow) {
    windows.monthly = monthlyWindow;
  }

  const planItem = findUsageItem(usageData?.usage?.items, 'plan_total_token');
  const planWindow = parseWindowFromItem({
    item: planItem,
    fallbackPercent: usageData?.usage?.percent,
    resetAt,
    valuePrefix: planName
  });
  if (planWindow) {
    windows.plan_limit = planWindow;
  }

  const balance = toNumber(balanceData?.balance);
  const currency = typeof balanceData?.currency === 'string' && balanceData.currency.trim()
    ? balanceData.currency.trim()
    : 'USD';
  if (balance !== null) {
    windows.credits_balance = toUsageWindow({
      usedPercent: null,
      windowSeconds: null,
      resetAt: null,
      valueLabel: `$${balance.toFixed(2)} ${currency}`
    });
  }

  return windows;
};

export const isConfigured = () => Boolean(readCookieFile());

const fetchJson = async (path, cookie) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://platform.xiaomimimo.com/',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const fetchQuota = async () => {
  const cookie = readCookieFile();

  if (!cookie) {
    return buildResult({
      providerId,
      providerName,
      ok: false,
      configured: false,
      error: 'Not configured'
    });
  }

  try {
    const [usagePayload, detailPayload, balancePayload] = await Promise.all([
      fetchJson('/tokenPlan/usage', cookie),
      fetchJson('/tokenPlan/detail', cookie),
      fetchJson('/balance', cookie)
    ]);
    const windows = parseXiaomiTokenPlanUsage({ usagePayload, detailPayload, balancePayload });

    return buildResult({
      providerId,
      providerName,
      ok: true,
      configured: true,
      usage: { windows }
    });
  } catch (error) {
    return buildResult({
      providerId,
      providerName,
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Request failed'
    });
  }
};
