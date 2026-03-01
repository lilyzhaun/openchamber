import type { AssistantMessage, Message, Part, ReasoningPart, TextPart, ToolPart } from '@opencode-ai/sdk/v2';

import { isFullySyntheticMessage } from './synthetic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSessionActivity {
  activePartType: 'text' | 'tool' | 'reasoning' | 'editing' | undefined;
  activeToolName: string | undefined;
  statusText: string;
  isGenericStatus: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers (mirrored from useAssistantStatus to keep it pure)
// ---------------------------------------------------------------------------

const isAssistantMessage = (message: Message): message is AssistantMessage =>
  message.role === 'assistant';

const isReasoningPart = (part: Part): part is ReasoningPart => part.type === 'reasoning';

const isTextPart = (part: Part): part is TextPart => part.type === 'text';

const getLegacyTextContent = (part: Part): string | undefined => {
  if (isTextPart(part)) {
    return part.text;
  }
  const candidate = part as Partial<{ text?: unknown; content?: unknown; value?: unknown }>;
  if (typeof candidate.text === 'string') return candidate.text;
  if (typeof candidate.content === 'string') return candidate.content;
  if (typeof candidate.value === 'string') return candidate.value;
  return undefined;
};

const getPartTimeInfo = (part: Part): { end?: number } | undefined => {
  if (isTextPart(part) || isReasoningPart(part)) {
    return part.time;
  }
  const candidate = part as Partial<{ time?: { end?: number } }>;
  return candidate.time;
};

const getToolDisplayName = (part: ToolPart): string => {
  if (part.tool) return part.tool;
  const candidate = part as ToolPart & Partial<{ name?: unknown }>;
  return typeof candidate.name === 'string' ? candidate.name : 'tool';
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EDITING_TOOLS = new Set(['edit', 'write', 'apply_patch']);

const TOOL_STATUS_PHRASES: Record<string, string> = {
  read: 'reading file',
  write: 'writing file',
  edit: 'editing file',
  multiedit: 'editing files',
  apply_patch: 'applying patch',
  bash: 'running command',
  grep: 'searching content',
  glob: 'finding files',
  list: 'listing directory',
  task: 'delegating task',
  webfetch: 'fetching URL',
  websearch: 'searching web',
  codesearch: 'web code search',
  todowrite: 'updating todos',
  todoread: 'reading todos',
  skill: 'learning skill',
  question: 'asking question',
  plan_enter: 'switching to planning',
  plan_exit: 'switching to building',
};

const WORKING_PHRASES = [
  'working',
  'processing',
  'preparing',
  'warming up',
  'gears turning',
  'computing',
  'calculating',
  'analyzing',
  'wheels spinning',
  'calibrating',
  'synthesizing',
  'connecting dots',
  'inspecting logic',
  'weighing options',
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a session's messages to determine the current activity.
 *
 * This is a **pure function** — no hooks, no store access — so it can be
 * called for any session (lead *or* child) as long as the caller provides
 * the message records.
 */
export function parseSessionActivity(
  sessionMessages: ReadonlyArray<{ info: Message; parts: Part[] }>,
): ParsedSessionActivity {
  if (sessionMessages.length === 0) {
    return { activePartType: undefined, activeToolName: undefined, statusText: 'working', isGenericStatus: true };
  }

  type AssistantRecord = { info: AssistantMessage; parts: Part[] };

  const assistantMessages = sessionMessages.filter(
    (msg): msg is AssistantRecord =>
      isAssistantMessage(msg.info) && !isFullySyntheticMessage(msg.parts),
  );

  if (assistantMessages.length === 0) {
    return { activePartType: undefined, activeToolName: undefined, statusText: 'working', isGenericStatus: true };
  }

  const sortedAssistantMessages = [...assistantMessages].sort((a, b) => {
    const aCreated = typeof a.info.time?.created === 'number' ? a.info.time.created : null;
    const bCreated = typeof b.info.time?.created === 'number' ? b.info.time.created : null;
    if (aCreated !== null && bCreated !== null && aCreated !== bCreated) {
      return aCreated - bCreated;
    }
    return a.info.id.localeCompare(b.info.id);
  });

  const lastAssistant = sortedAssistantMessages[sortedAssistantMessages.length - 1];

  let activePartType: 'text' | 'tool' | 'reasoning' | 'editing' | undefined = undefined;
  let activeToolName: string | undefined = undefined;

  for (let i = (lastAssistant.parts ?? []).length - 1; i >= 0; i -= 1) {
    const part = lastAssistant.parts?.[i];
    if (!part) continue;

    switch (part.type) {
      case 'reasoning': {
        const time = part.time ?? getPartTimeInfo(part);
        const stillRunning = !time || typeof time.end === 'undefined';
        if (stillRunning && !activePartType) {
          activePartType = 'reasoning';
        }
        break;
      }
      case 'tool': {
        const toolStatus = part.state?.status;
        if ((toolStatus === 'running' || toolStatus === 'pending') && !activePartType) {
          const toolName = getToolDisplayName(part);
          if (EDITING_TOOLS.has(toolName)) {
            activePartType = 'editing';
          } else {
            activePartType = 'tool';
            activeToolName = toolName;
          }
        }
        break;
      }
      case 'text': {
        const rawContent = getLegacyTextContent(part) ?? '';
        if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
          const time = getPartTimeInfo(part);
          const streamingPart = !time || typeof time.end === 'undefined';
          if (streamingPart && !activePartType) {
            activePartType = 'text';
          }
        }
        break;
      }
      default:
        break;
    }
  }

  const getToolStatusPhrase = (name: string): string =>
    TOOL_STATUS_PHRASES[name] ?? `using ${name}`;

  const getRandomWorkingPhrase = (): string =>
    WORKING_PHRASES[Math.floor(Math.random() * WORKING_PHRASES.length)];

  const isGenericStatus = activePartType === undefined;
  const statusText = (() => {
    if (activePartType === 'editing') return 'editing file';
    if (activePartType === 'tool' && activeToolName) return getToolStatusPhrase(activeToolName);
    if (activePartType === 'reasoning') return 'thinking';
    if (activePartType === 'text') return 'composing';
    return getRandomWorkingPhrase();
  })();

  return { activePartType, activeToolName, statusText, isGenericStatus };
}
