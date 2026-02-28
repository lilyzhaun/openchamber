import React from 'react';

import { useI18n } from '@/contexts/useI18n';
import type { OfficeZone, RealAgentCard } from '@/hooks/usePixelOfficeState';
import { usePixelOfficeState } from '@/hooks/usePixelOfficeState';

const SPRITE_SIZE = 12;
const PIXEL_AGENTS_SCENE = 'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/Screenshot.jpg';

const PIXEL_AGENTS_CHARACTERS = [
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_0.png',
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_1.png',
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_2.png',
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_3.png',
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_4.png',
  'https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/characters/char_5.png',
];

type AgentAction = 'coding' | 'researching' | 'executing' | 'collaborating' | 'troubleshooting' | 'idle';

interface ZoneLayout {
  anchors: Array<{ x: number; y: number }>;
}

const ZONES: Record<OfficeZone, ZoneLayout> = {
  desk: { anchors: [{ x: 32, y: 44 }, { x: 48, y: 58 }, { x: 58, y: 72 }] },
  bookshelf: { anchors: [{ x: 16, y: 132 }, { x: 32, y: 136 }, { x: 48, y: 136 }] },
  commons: { anchors: [{ x: 96, y: 46 }, { x: 96, y: 130 }, { x: 118, y: 130 }] },
};

const spriteIndexFromName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PIXEL_AGENTS_CHARACTERS.length;
};

const ACTION_LABEL: Record<AgentAction, string> = {
  coding: '编码',
  researching: '查阅',
  executing: '执行',
  collaborating: '协作',
  troubleshooting: '重试',
  idle: '空闲',
};

const TOOL_ACTION_MAP: Record<string, AgentAction> = {
  write: 'coding',
  edit: 'coding',
  multiedit: 'coding',
  apply_patch: 'coding',
  read: 'researching',
  grep: 'researching',
  glob: 'researching',
  list: 'researching',
  webfetch: 'researching',
  websearch: 'researching',
  codesearch: 'researching',
  bash: 'executing',
};

const resolveAgentAction = (card: RealAgentCard): AgentAction => {
  const toolName = card.activity.toolName?.toLowerCase() ?? null;
  if (toolName && TOOL_ACTION_MAP[toolName]) {
    return TOOL_ACTION_MAP[toolName];
  }

  const status = `${card.activity.activity} ${card.activity.statusText ?? ''}`.toLowerCase();
  if (status.includes('retry')) return 'troubleshooting';
  if (status.includes('busy') || status.includes('working')) return 'collaborating';
  if (status.includes('idle')) return 'idle';

  return card.activity.source === 'fallback' ? 'idle' : 'collaborating';
};

const actionAnimation = (action: AgentAction, isWorking: boolean, isLead: boolean): string => {
  if (!isWorking && action === 'idle' && !isLead) return 'pixelOfficeIdle 2.4s ease-in-out infinite';
  switch (action) {
    case 'coding':
      return 'pixelOfficeType 0.8s steps(2, end) infinite';
    case 'researching':
      return 'pixelOfficeRead 1.4s ease-in-out infinite';
    case 'executing':
      return 'pixelOfficeExecute 1.1s ease-in-out infinite';
    case 'collaborating':
      return 'pixelOfficeTalk 1.2s ease-in-out infinite';
    case 'troubleshooting':
      return 'pixelOfficeRetry 0.7s steps(2, end) infinite';
    case 'idle':
    default:
      return 'pixelOfficeIdle 2.4s ease-in-out infinite';
  }
};

const AgentSprite: React.FC<{ card: RealAgentCard; isWorking: boolean; x: number; y: number }> = ({ card, isWorking, x, y }) => {
  const action = resolveAgentAction(card);
  const movement = actionAnimation(action, isWorking, card.isLead);
  const sprite = PIXEL_AGENTS_CHARACTERS[spriteIndexFromName(card.agentName)];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        transition: 'left 320ms ease, top 320ms ease',
      }}
    >
        <div
          aria-hidden
          style={{
            width: SPRITE_SIZE,
            height: SPRITE_SIZE + 12,
            position: 'relative',
            imageRendering: 'pixelated',
            animation: movement,
            transformOrigin: 'bottom center',
          }}
        >
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 21,
            width: 8,
            height: 2,
            backgroundColor: 'rgba(0,0,0,0.28)',
            filter: 'blur(0.5px)',
          }}
        />

        <img
          src={sprite}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            left: -4,
            top: -4,
            width: 20,
            height: 24,
            imageRendering: 'pixelated',
            objectFit: 'cover',
            filter: card.isLead ? 'drop-shadow(0 0 1px var(--status-success))' : 'none',
          }}
        />

        {action === 'researching' && (
          <div style={{ position: 'absolute', left: -4, top: 9, width: 3, height: 4, backgroundColor: 'var(--status-info)', border: '1px solid var(--interactive-border)' }} />
        )}
        {action === 'executing' && (
          <div style={{ position: 'absolute', left: 12, top: 9, width: 3, height: 3, backgroundColor: 'var(--status-success)', boxShadow: '0 0 0 1px var(--interactive-border)' }} />
        )}
        {action === 'troubleshooting' && (
          <div style={{ position: 'absolute', left: 12, top: 2, width: 2, height: 2, backgroundColor: 'var(--status-warning)' }} />
        )}
        {action === 'collaborating' && (
          <div style={{ position: 'absolute', left: -3, top: 2, width: 2, height: 2, backgroundColor: 'var(--primary-base)' }} />
        )}

        {card.isLead && (
          <div
            style={{
              position: 'absolute',
              left: 4,
              top: -3,
              width: 4,
              height: 2,
              backgroundColor: 'var(--status-success)',
              boxShadow: '0 0 0 1px var(--surface-background)',
            }}
          />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -13,
          transform: 'translateX(-50%)',
          fontSize: 6,
          lineHeight: 1,
          color: 'var(--surface-foreground)',
          padding: '1px 3px',
          border: '1px solid var(--interactive-border)',
          backgroundColor: 'color-mix(in oklab, var(--surface-background) 86%, white)',
          whiteSpace: 'nowrap',
          borderRadius: 999,
        }}
      >
        {ACTION_LABEL[action]}
      </div>
    </div>
  );
};

const OfficeScene: React.FC<{ cards: RealAgentCard[]; isWorking: boolean }> = ({ cards, isWorking }) => {
  const positioned = React.useMemo(() => {
    const zoneUsage: Record<OfficeZone, number> = {
      desk: 0,
      bookshelf: 0,
      commons: 0,
    };

    return cards.map((card) => {
      const zone = ZONES[card.zone];
      const index = zoneUsage[card.zone];
      const anchor = zone.anchors[index] ?? zone.anchors[zone.anchors.length - 1];
      zoneUsage[card.zone] = index + 1;
      return {
        card,
        x: anchor.x,
        y: anchor.y,
      };
    });
  }, [cards]);

  return (
    <div
      style={{
        position: 'relative',
        height: 164,
        width: '100%',
        border: '1px solid var(--interactive-border)',
        backgroundColor: 'var(--surface-background)',
        backgroundImage: `url(${PIXEL_AGENTS_SCENE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        imageRendering: 'pixelated',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8, 12, 24, 0.16)' }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />

      {positioned.map(({ card, x, y }) => (
        <AgentSprite key={card.slotId} card={card} isWorking={isWorking} x={x} y={y} />
      ))}
    </div>
  );
};

const AgentCards: React.FC<{ cards: RealAgentCard[] }> = ({ cards }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 36, overflowY: 'auto' }}>
      {cards.slice(0, 2).map((card) => (
        <div
          key={card.slotId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
            padding: '1px 4px',
            border: '1px solid var(--interactive-border)',
            backgroundColor: card.isLead ? 'var(--interactive-selection)' : 'var(--surface-elevated)',
            color: card.isLead ? 'var(--interactive-selection-foreground)' : 'var(--surface-foreground)',
          }}
        >
          <span className="typography-micro" style={{ fontSize: 8 }}>
            @{card.agentName}
          </span>
          <span className="typography-micro" style={{ fontSize: 8, opacity: 0.82 }}>
            {ACTION_LABEL[resolveAgentAction(card)]}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PixelOfficePanel: React.FC = () => {
  const { t } = useI18n();
  const state = usePixelOfficeState();

  return (
    <div
      style={{
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <OfficeScene cards={state.cards} isWorking={state.isWorking} />

        {state.speechBubble && (
          <div
            style={{
              border: '1px solid var(--interactive-border)',
              backgroundColor: 'var(--surface-background)',
              padding: '3px 5px',
            }}
          >
            <div className="typography-micro" style={{ fontSize: 8, color: 'var(--surface-foreground)', lineHeight: 1.15 }}>
              {state.speechBubble}
            </div>
          </div>
        )}

        <div
          className="typography-micro"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 2,
            fontSize: 8,
          }}
        >
          <span style={{ color: 'var(--surface-muted-foreground)' }}>
            {t('pixelOffice.zoneLabel')}: {t(`pixelOffice.zone.${state.leadZone}`)}
          </span>
        </div>

        <AgentCards cards={state.cards} />
      </div>

      <style>{`
        @keyframes pixelOfficeStep {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes pixelOfficeType {
          0%, 100% { transform: translateY(0); }
          25% { transform: translate(-1px, -1px); }
          50% { transform: translate(0, -1px); }
          75% { transform: translate(1px, -1px); }
        }

        @keyframes pixelOfficeRead {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px) rotate(-1deg); }
        }

        @keyframes pixelOfficeExecute {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px) scale(1.02); }
        }

        @keyframes pixelOfficeTalk {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-1px) translateX(-1px); }
          66% { transform: translateY(-1px) translateX(1px); }
        }

        @keyframes pixelOfficeRetry {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-1px) translateX(-1px); }
          50% { transform: translateY(0) translateX(1px); }
          75% { transform: translateY(-1px) translateX(-1px); }
        }

        @keyframes pixelOfficeIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
    </div>
  );
};

export const PixelOffice = PixelOfficePanel;
