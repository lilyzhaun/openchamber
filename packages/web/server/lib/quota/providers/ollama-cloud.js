import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildResult, toUsageWindow, toNumber } from '../utils/index.js';

const COOKIE_PATH = join(homedir(), '.config', 'ollama-quota', 'cookie');

export const providerId = 'ollama-cloud';
export const providerName = 'Ollama Cloud';
export const aliases = ['ollama-cloud', 'ollamacloud'];

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

const normalizeSettingsText = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const parseUsageSection = (text, label) => {
  const sectionMatch = text.match(new RegExp(`${label}\\s+usage([\\s\\S]*?)(?=(?:Session|Weekly|Extra)\\s+usage|Balance\\s+remaining|Notify\\s+me|$)`, 'i'));
  if (!sectionMatch) return null;
  const section = sectionMatch[1] ?? '';
  const percentMatch = section.match(/([0-9.]+)%\s*used/i);
  if (!percentMatch) return null;
  const resetMatch = section.match(/Resets\s+(in\s+[^.]+)/i);
  return {
    usedPercent: toNumber(percentMatch[1]),
    resetAfterFormatted: resetMatch?.[1]?.trim() ?? null
  };
};

export const parseOllamaSettingsHtml = (html) => {
  const text = normalizeSettingsText(html);
  const windows = {};
  const sessionUsage = parseUsageSection(text, 'Session');
  if (sessionUsage) {
    windows.session = toUsageWindow({
      usedPercent: sessionUsage.usedPercent,
      windowSeconds: null,
      resetAt: null,
      resetAfterFormatted: sessionUsage.resetAfterFormatted
    });
  }
  const weeklyUsage = parseUsageSection(text, 'Weekly');
  if (weeklyUsage) {
    windows.weekly = toUsageWindow({
      usedPercent: weeklyUsage.usedPercent,
      windowSeconds: null,
      resetAt: null,
      resetAfterFormatted: weeklyUsage.resetAfterFormatted
    });
  }
  const premiumMatch = text.match(/Premium[^0-9]*([0-9]+)\s*\/\s*([0-9]+)/i);
  if (premiumMatch) {
    const used = toNumber(premiumMatch[1]);
    const total = toNumber(premiumMatch[2]);
    const usedPercent = total && used !== null ? Math.min(100, (used / total) * 100) : null;
    windows.premium = toUsageWindow({
      usedPercent,
      windowSeconds: null,
      resetAt: null,
      valueLabel: `${used ?? 0} / ${total ?? 0}`
    });
  }
  return windows;
};

export const isConfigured = () => {
  const cookie = readCookieFile();
  return Boolean(cookie);
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
    const response = await fetch('https://ollama.com/settings', {
      method: 'GET',
      headers: {
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return buildResult({
        providerId,
        providerName,
        ok: false,
        configured: true,
        error: `API error: ${response.status}`
      });
    }

    const html = await response.text();
    const windows = parseOllamaSettingsHtml(html);

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
