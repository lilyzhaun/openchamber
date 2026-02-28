import React from 'react';
import { DraggableWindow } from '@/components/shared/DraggableWindow';
import { usePixelOfficeState } from '@/hooks/usePixelOfficeState';
import type { PixelOfficeState } from '@/hooks/usePixelOfficeState';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/contexts/useI18n';

// Pixel art character rendered with CSS divs
const PixelCharacter: React.FC<{ pose: PixelOfficeState['agentPose'] }> = ({ pose }) => {
  const baseStyle: React.CSSProperties = {
    imageRendering: 'pixelated',
    position: 'relative',
    width: 48,
    height: 56,
    margin: '0 auto',
  };

  // Simple pixel art using div blocks
  // Each pose shows a different arrangement
  const headColor = 'var(--primary-base)';
  const bodyColor = 'var(--interactive-selection)';
  const accentColor = 'var(--status-info)';

  const pixel = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): React.CSSProperties => ({
    position: 'absolute',
    left: x,
    top: y,
    width: w,
    height: h,
    backgroundColor: color,
  });

  const renderPose = () => {
    switch (pose) {
      case 'typing':
        return (
          <>
            {/* Head */}
            <div style={pixel(16, 0, 16, 16, headColor)} />
            {/* Eyes */}
            <div style={pixel(18, 4, 4, 4, 'var(--surface-elevated)')} />
            <div style={pixel(26, 4, 4, 4, 'var(--surface-elevated)')} />
            {/* Body */}
            <div style={pixel(12, 18, 24, 20, bodyColor)} />
            {/* Arms - extended forward for typing */}
            <div style={pixel(4, 22, 8, 4, bodyColor)} />
            <div style={pixel(36, 22, 8, 4, bodyColor)} />
            {/* Keyboard/desk */}
            <div style={pixel(0, 38, 48, 6, accentColor)} />
            {/* Legs */}
            <div style={pixel(14, 40, 8, 14, bodyColor)} />
            <div style={pixel(26, 40, 8, 14, bodyColor)} />
          </>
        );

      case 'reading':
        return (
          <>
            {/* Head - tilted slightly */}
            <div style={pixel(18, 0, 16, 16, headColor)} />
            {/* Eyes - looking down */}
            <div style={pixel(20, 6, 4, 4, 'var(--surface-elevated)')} />
            <div style={pixel(28, 6, 4, 4, 'var(--surface-elevated)')} />
            {/* Body */}
            <div style={pixel(14, 18, 24, 20, bodyColor)} />
            {/* Arms - holding book */}
            <div style={pixel(8, 24, 6, 4, bodyColor)} />
            <div style={pixel(38, 24, 6, 4, bodyColor)} />
            {/* Book */}
            <div style={pixel(10, 28, 28, 8, accentColor)} />
            <div style={pixel(24, 28, 2, 8, 'var(--surface-elevated)')} />
            {/* Legs */}
            <div style={pixel(16, 40, 8, 14, bodyColor)} />
            <div style={pixel(28, 40, 8, 14, bodyColor)} />
          </>
        );

      case 'thinking':
        return (
          <>
            {/* Head */}
            <div style={pixel(16, 2, 16, 16, headColor)} />
            {/* Eyes - looking up */}
            <div style={pixel(18, 4, 4, 4, 'var(--surface-elevated)')} />
            <div style={pixel(26, 4, 4, 4, 'var(--surface-elevated)')} />
            {/* Body */}
            <div style={pixel(12, 20, 24, 20, bodyColor)} />
            {/* Arm - hand on chin */}
            <div style={pixel(4, 24, 8, 4, bodyColor)} />
            <div style={pixel(4, 14, 4, 10, bodyColor)} />
            <div style={pixel(36, 28, 8, 4, bodyColor)} />
            {/* Thought bubbles */}
            <div style={pixel(40, 2, 4, 4, 'var(--surface-muted-foreground)')} />
            <div style={pixel(42, 8, 6, 6, 'var(--surface-muted-foreground)')} />
            {/* Legs */}
            <div style={pixel(14, 42, 8, 12, bodyColor)} />
            <div style={pixel(26, 42, 8, 12, bodyColor)} />
          </>
        );

      case 'coffee':
        return (
          <>
            {/* Head */}
            <div style={pixel(16, 0, 16, 16, headColor)} />
            {/* Eyes - happy/closed */}
            <div style={pixel(18, 6, 4, 2, 'var(--surface-elevated)')} />
            <div style={pixel(26, 6, 4, 2, 'var(--surface-elevated)')} />
            {/* Smile */}
            <div style={pixel(20, 10, 8, 2, 'var(--surface-elevated)')} />
            {/* Body */}
            <div style={pixel(12, 18, 24, 20, bodyColor)} />
            {/* Arms - holding cup */}
            <div style={pixel(36, 22, 8, 4, bodyColor)} />
            {/* Coffee cup */}
            <div style={pixel(38, 16, 8, 6, 'var(--status-warning)')} />
            {/* Steam */}
            <div style={pixel(40, 10, 2, 4, 'var(--surface-muted-foreground)')} />
            <div style={pixel(44, 8, 2, 4, 'var(--surface-muted-foreground)')} />
            <div style={pixel(4, 26, 8, 4, bodyColor)} />
            {/* Legs */}
            <div style={pixel(14, 40, 8, 14, bodyColor)} />
            <div style={pixel(26, 40, 8, 14, bodyColor)} />
          </>
        );

      default: // idle
        return (
          <>
            {/* Head */}
            <div style={pixel(16, 0, 16, 16, headColor)} />
            {/* Eyes */}
            <div style={pixel(18, 4, 4, 4, 'var(--surface-elevated)')} />
            <div style={pixel(26, 4, 4, 4, 'var(--surface-elevated)')} />
            {/* Body */}
            <div style={pixel(12, 18, 24, 20, bodyColor)} />
            {/* Arms - relaxed */}
            <div style={pixel(4, 22, 8, 4, bodyColor)} />
            <div style={pixel(36, 22, 8, 4, bodyColor)} />
            {/* Legs */}
            <div style={pixel(14, 40, 8, 14, bodyColor)} />
            <div style={pixel(26, 40, 8, 14, bodyColor)} />
          </>
        );
    }
  };

  return <div style={baseStyle}>{renderPose()}</div>;
};

// Speech bubble component
const SpeechBubble: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: 'relative',
      backgroundColor: 'var(--surface-elevated)',
      border: '2px solid var(--interactive-border)',
      borderRadius: 2,
      padding: '2px 6px',
      marginTop: 4,
      maxWidth: '100%',
      textAlign: 'center',
    }}
  >
    {/* Arrow */}
    <div
      style={{
        position: 'absolute',
        top: -6,
        left: '50%',
        marginLeft: -4,
        width: 0,
        height: 0,
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: '4px solid var(--interactive-border)',
      }}
    />
    <span
      className="typography-micro"
      style={{
        color: 'var(--surface-foreground)',
        fontSize: 9,
        lineHeight: 1.2,
        wordBreak: 'break-all',
        display: 'block',
      }}
    >
      {text}
    </span>
  </div>
);

export const PixelOffice: React.FC = () => {
  const { t } = useI18n();
  const isOpen = useUIStore((state) => state.isPixelOfficeOpen);
  const togglePixelOffice = useUIStore((state) => state.togglePixelOffice);
  const state = usePixelOfficeState();

  return (
    <DraggableWindow
      open={isOpen}
      onClose={togglePixelOffice}
      title={t('pixelOffice.title')}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 8,
          backgroundColor: 'var(--surface-elevated)',
          gap: 4,
        }}
      >
        {/* Activity indicator dot */}
        {state.isWorking && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--status-success)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Pixel character */}
        <PixelCharacter pose={state.agentPose} />

        {/* Speech bubble */}
        {state.speechBubble && <SpeechBubble text={state.speechBubble} />}

        {/* Pose label */}
        <span
          className="typography-micro"
          style={{
            color: 'var(--surface-muted-foreground)',
            fontSize: 9,
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {t(`pixelOffice.pose.${state.agentPose}`)}
        </span>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </DraggableWindow>
  );
};
