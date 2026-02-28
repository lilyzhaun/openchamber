import React from 'react';

import type { Session } from '@opencode-ai/sdk/v2';

import { useAssistantStatus } from '@/hooks/useAssistantStatus';
import { useCurrentSessionActivity } from '@/hooks/useSessionActivity';
import { getAgentColor } from '@/lib/agentColors';
import { useConfigStore } from '@/stores/useConfigStore';
import { useSessionStore } from '@/stores/useSessionStore';

export type OfficeZone = 'desk' | 'bookshelf' | 'commons';
export type AgentConfidence = 'confirmed' | 'inferred' | 'unknown';

export interface AgentActivity {
  toolName: string | null;
  activity: string;
  statusText: string | null;
  source: 'tool' | 'session' | 'fallback';
}

export interface RealAgentCard {
  slotId: 'lead' | 'child-1' | 'child-2';
  sessionId: string;
  sessionTitle: string;
  agentName: string;
  confidence: AgentConfidence;
  zone: OfficeZone;
  activityLabel: string;
  activity: AgentActivity;
  colorVar: string;
  isLead: boolean;
}

export interface RealActivityRow {
  sessionId: string;
  sessionTitle: string;
  agentName: string;
  statusType: 'busy' | 'retry' | 'idle';
  toolName: string | null;
  activity: string;
  source: 'tool' | 'session' | 'fallback';
}

export interface PixelOfficeState {
  leadZone: OfficeZone;
  cards: RealAgentCard[];
  speechBubble: string | null;
  isWorking: boolean;
}

const toolToZone = (toolName: string | null): OfficeZone => {
  if (!toolName) return 'commons';
  const t = toolName.toLowerCase();
  if (['read', 'grep', 'glob', 'list', 'webfetch', 'websearch', 'codesearch'].includes(t)) return 'bookshelf';
  if (['write', 'edit', 'multiedit', 'apply_patch'].includes(t)) return 'desk';
  if (t === 'bash') return 'commons';
  return 'commons';
};

const toolToLabel = (toolName: string | null): string => {
  if (!toolName) return 'session-status';
  return toolName;
};

const resolveAgentFromSession = (
  session: Session,
  getSessionAgentSelection: (sessionId: string) => string | null,
  currentAgentContext: Map<string, string>,
  fallbackAgent: string,
): { name: string; confidence: AgentConfidence } => {
  const direct = (session as { agent?: string }).agent;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return { name: direct.trim(), confidence: 'confirmed' };
  }

  const selected = getSessionAgentSelection(session.id);
  if (selected && selected.trim().length > 0) {
    return { name: selected.trim(), confidence: 'inferred' };
  }

  const contextual = currentAgentContext.get(session.id);
  if (contextual && contextual.trim().length > 0) {
    return { name: contextual.trim(), confidence: 'inferred' };
  }

  return { name: fallbackAgent, confidence: 'unknown' };
};

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

export function usePixelOfficeState(): PixelOfficeState {
  const { working } = useAssistantStatus();
  const sessionActivity = useCurrentSessionActivity();

  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const getSessionAgentSelection = useSessionStore((state) => state.getSessionAgentSelection);
  const currentAgentContext = useSessionStore((state) => state.currentAgentContext);
  const agents = useConfigStore((state) => state.agents);

  const fallbackAgent = React.useMemo(() => agents[0]?.name ?? 'agent', [agents]);

  const currentSession = React.useMemo(() => {
    if (!currentSessionId) return null;
    return sessions.find((s) => s.id === currentSessionId) ?? null;
  }, [currentSessionId, sessions]);

  const childSessions = React.useMemo(() => {
    if (!currentSessionId) return [] as Session[];
    return sessions.filter((s) => s.parentID === currentSessionId).slice(0, 2);
  }, [currentSessionId, sessions]);

  const cards = React.useMemo<RealAgentCard[]>(() => {
    if (!currentSession) {
      const fallbackTool = working.activeToolName ?? null;
      const zone = fallbackTool ? toolToZone(fallbackTool) : 'commons';
      return [
        {
          slotId: 'lead',
          sessionId: currentSessionId ?? 'no-session',
          sessionTitle: 'Current session',
          agentName: fallbackAgent,
          confidence: 'unknown',
          zone,
          activityLabel: fallbackTool ? `tool:${toolToLabel(fallbackTool)}` : `session:${working.activity}`,
          activity: {
            toolName: fallbackTool,
            activity: working.activity,
            statusText: working.statusText ?? null,
            source: fallbackTool ? 'tool' : 'fallback',
          },
          colorVar: getAgentColor(fallbackAgent).var,
          isLead: true,
        },
      ];
    }

    const toCard = (session: Session, slotId: RealAgentCard['slotId'], isLead: boolean): RealAgentCard => {
      const resolved = resolveAgentFromSession(session, getSessionAgentSelection, currentAgentContext, fallbackAgent);
      const statusType = (sessionStatus?.get(session.id)?.type ?? 'idle') as 'busy' | 'retry' | 'idle';

      const leadTool = isLead ? (working.activeToolName ?? null) : null;
      const source: AgentActivity['source'] = isLead
        ? (leadTool ? 'tool' : 'session')
        : (statusType !== 'idle' ? 'session' : 'fallback');
      const toolName = isLead ? leadTool : null;
      const zone = toolName ? toolToZone(toolName) : (statusType === 'idle' ? 'commons' : 'desk');

      const activityLabel =
        source === 'tool'
          ? `tool:${toolToLabel(toolName)}`
          : source === 'session'
            ? `session:${statusType}`
            : 'fallback:idle';

      const color = getAgentColor(resolved.name);

      return {
        slotId,
        sessionId: session.id,
        sessionTitle: session.title?.trim() || 'Untitled',
        agentName: resolved.name,
        confidence: resolved.confidence,
        zone,
        activityLabel,
        activity: {
          toolName,
          activity: isLead ? working.activity : statusType,
          statusText: isLead ? (working.statusText ?? null) : null,
          source,
        },
        colorVar: color.var,
        isLead,
      };
    };

    const result: RealAgentCard[] = [toCard(currentSession, 'lead', true)];

    if (childSessions[0]) result.push(toCard(childSessions[0], 'child-1', false));
    if (childSessions[1]) result.push(toCard(childSessions[1], 'child-2', false));

    return result;
  }, [
    currentSession,
    currentSessionId,
    childSessions,
    fallbackAgent,
    getSessionAgentSelection,
    currentAgentContext,
    sessionStatus,
    working.activeToolName,
    working.activity,
    working.statusText,
  ]);

  const leadZone = cards[0]?.zone ?? 'commons';

  const speechBubble = React.useMemo(() => {
    const raw = working.statusText?.trim();
    if (!raw) return null;
    return truncate(raw, 38);
  }, [working.statusText]);

  const isWorking = working.isWorking || sessionActivity.isBusy;

  return React.useMemo(
    () => ({
      leadZone,
      cards,
      speechBubble,
      isWorking,
    }),
    [leadZone, cards, speechBubble, isWorking],
  );
}
