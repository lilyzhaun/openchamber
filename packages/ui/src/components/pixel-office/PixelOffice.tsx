import React from 'react';

import { useI18n } from '@/contexts/useI18n';
import type { OfficeZone, RealAgentCard } from '@/hooks/usePixelOfficeState';
import { usePixelOfficeState } from '@/hooks/usePixelOfficeState';

const SPRITE_SIZE = 12;

interface ZoneLayout {
  anchors: Array<{ x: number; y: number }>;
}

const ZONES: Record<OfficeZone, ZoneLayout> = {
  desk: { anchors: [{ x: 20, y: 104 }, { x: 36, y: 104 }, { x: 52, y: 104 }] },
  bookshelf: { anchors: [{ x: 92, y: 70 }, { x: 108, y: 70 }, { x: 124, y: 70 }] },
  commons: { anchors: [{ x: 94, y: 116 }, { x: 110, y: 116 }, { x: 126, y: 116 }] },
};

const AgentSprite: React.FC<{ card: RealAgentCard; isWorking: boolean; x: number; y: number }> = ({ card, isWorking, x, y }) => {
  const movement = isWorking || card.isLead ? 'pixelOfficeStep 1s steps(2, end) infinite' : 'none';

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
          height: SPRITE_SIZE + 8,
          position: 'relative',
          imageRendering: 'pixelated',
          animation: movement,
          transformOrigin: 'bottom center',
        }}
      >
        <div style={{ position: 'absolute', left: 3, top: 0, width: 6, height: 5, backgroundColor: `var(${card.colorVar})` }} />
        <div style={{ position: 'absolute', left: 2, top: 6, width: 8, height: 7, backgroundColor: `var(${card.colorVar})` }} />
        <div style={{ position: 'absolute', left: 1, top: 13, width: 3, height: 7, backgroundColor: `var(${card.colorVar})` }} />
        <div style={{ position: 'absolute', left: 8, top: 13, width: 3, height: 7, backgroundColor: `var(${card.colorVar})` }} />
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
        height: 132,
        width: '100%',
        border: '1px solid var(--interactive-border)',
        backgroundColor: 'var(--surface-muted)',
        imageRendering: 'pixelated',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, top: 56, height: 2, backgroundColor: 'var(--interactive-border)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 96, height: 2, backgroundColor: 'var(--interactive-border)' }} />

      <div style={{ position: 'absolute', left: 8, top: 88, width: 56, height: 16, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-elevated)' }} />
      <div style={{ position: 'absolute', left: 14, top: 72, width: 18, height: 12, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-background)' }} />
      <div style={{ position: 'absolute', left: 36, top: 72, width: 18, height: 12, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-background)' }} />

      <div style={{ position: 'absolute', left: 82, top: 14, width: 54, height: 58, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-elevated)' }} />
      <div style={{ position: 'absolute', left: 82, top: 32, width: 54, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      <div style={{ position: 'absolute', left: 82, top: 50, width: 54, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      <div style={{ position: 'absolute', left: 88, top: 18, width: 3, height: 10, backgroundColor: 'var(--status-info)' }} />
      <div style={{ position: 'absolute', left: 94, top: 18, width: 3, height: 10, backgroundColor: 'var(--primary-base)' }} />
      <div style={{ position: 'absolute', left: 100, top: 18, width: 3, height: 10, backgroundColor: 'var(--status-warning)' }} />
      <div style={{ position: 'absolute', left: 106, top: 18, width: 3, height: 10, backgroundColor: 'var(--status-success)' }} />

      <div style={{ position: 'absolute', left: 84, top: 102, width: 18, height: 10, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-elevated)' }} />
      <div style={{ position: 'absolute', left: 110, top: 102, width: 18, height: 10, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-elevated)' }} />
      <div style={{ position: 'absolute', left: 96, top: 108, width: 20, height: 8, border: '1px solid var(--interactive-border)', backgroundColor: 'var(--surface-background)' }} />

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
            {card.activityLabel}
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
        width: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '3px',
          backgroundColor: 'var(--surface-elevated)',
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
      `}</style>
    </div>
  );
};

export const PixelOffice = PixelOfficePanel;
