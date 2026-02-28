import React from 'react';

import { useAssistantStatus } from '@/hooks/useAssistantStatus';
import { useCurrentSessionActivity } from '@/hooks/useSessionActivity';

const COFFEE_THRESHOLD_MS = 5_000;
const READING_TOOLS = new Set(['read', 'grep', 'glob', 'list', 'webfetch', 'websearch', 'codesearch']);
const TYPING_TOOLS = new Set(['write', 'edit', 'apply_patch', 'multiedit', 'bash']);

export interface PixelOfficeState {
  agentPose: 'idle' | 'typing' | 'reading' | 'thinking' | 'coffee';
  speechBubble: string | null;
  isWorking: boolean;
}

const mapToolToPose = (toolName: string | undefined): PixelOfficeState['agentPose'] => {
  if (!toolName) {
    return 'thinking';
  }

  if (READING_TOOLS.has(toolName)) {
    return 'reading';
  }

  if (TYPING_TOOLS.has(toolName)) {
    return 'typing';
  }

  if (toolName === 'task') {
    return 'thinking';
  }

  return 'thinking';
};

const truncateSpeech = (value: string, limit: number): string => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
};

export function usePixelOfficeState(): PixelOfficeState {
  const { working } = useAssistantStatus();
  const sessionActivity = useCurrentSessionActivity();

  const idleStartRef = React.useRef<number | null>(null);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCoffee, setShowCoffee] = React.useState(false);

  React.useEffect(() => {
    if (working.activity !== 'idle') {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      idleStartRef.current = null;
      setShowCoffee(false);
      return;
    }

    const now = Date.now();
    if (!idleStartRef.current) {
      idleStartRef.current = now;
    }

    const elapsed = now - idleStartRef.current;
    if (elapsed >= COFFEE_THRESHOLD_MS) {
      setShowCoffee(true);
      return;
    }

    setShowCoffee(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      setShowCoffee(true);
    }, COFFEE_THRESHOLD_MS - elapsed);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [working.activity]);

  const agentPose = React.useMemo<PixelOfficeState['agentPose']>(() => {
    switch (working.activity) {
      case 'idle':
        return showCoffee ? 'coffee' : 'idle';
      case 'streaming':
        return 'typing';
      case 'tooling':
        return mapToolToPose(working.activeToolName);
      case 'cooldown':
        return 'thinking';
      case 'permission':
        return 'idle';
      default:
        return 'thinking';
    }
  }, [working.activity, working.activeToolName, showCoffee]);

  const speechBubble = React.useMemo<string | null>(() => {
    if (working.activity === 'idle') {
      return null;
    }

    const rawText = working.statusText?.trim();
    if (!rawText) {
      return null;
    }

    return truncateSpeech(rawText, 30);
  }, [working.activity, working.statusText]);

  const isWorking = React.useMemo<boolean>(() => working.isWorking || sessionActivity.isBusy, [working.isWorking, sessionActivity.isBusy]);

  return React.useMemo<PixelOfficeState>
    (() => ({
      agentPose,
      speechBubble,
      isWorking,
    }), [agentPose, speechBubble, isWorking]);
}
