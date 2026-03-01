import React from 'react';

import { useI18n } from '@/contexts/useI18n';
import type { OfficeZone, RealAgentCard } from '@/hooks/usePixelOfficeState';
import { usePixelOfficeState } from '@/hooks/usePixelOfficeState';

import worker1Url from '@/assets/stardew-office/worker_1.png';
import worker2Url from '@/assets/stardew-office/worker_2.png';
import worker3Url from '@/assets/stardew-office/worker_3.png';
import worker4Url from '@/assets/stardew-office/worker_4.png';
import computerUrl from '@/assets/stardew-office/computer.png';
import watercoolerUrl from '@/assets/stardew-office/watercooler.png';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Worker sprite sheets: 64×160, 4 cols × 10 rows, 16×16 per frame */
const WORKER_SPRITES = [worker1Url, worker2Url, worker3Url, worker4Url];
const WORKER_FRAME = 16;
const WORKER_COLS = 4;
const WORKER_SHEET_W = 64;
const WORKER_SHEET_H = 160;

/** Computer sprite sheet: 80×160, 5 cols × 10 rows, 16×16 per frame */
const COMPUTER_COLS = 5;
const COMPUTER_SHEET_W = 80;
const COMPUTER_SHEET_H = 160;

/** Watercooler sprite sheet: 112×16, 7 frames in 1 row, 16×16 per frame */
const COOLER_FRAMES = 7;
const COOLER_SHEET_W = 112;

/** Display scale: 16px native → 32px rendered */
const SCALE = 2;
const FRAME_DISPLAY = WORKER_FRAME * SCALE; // 32

/** Scene dimensions (in display pixels) */
const SCENE_W = 224;
const SCENE_H = 176;

/** Tile size for the floor grid (display) */
const TILE = 16;

// ---------------------------------------------------------------------------
// Sprite-row semantics for worker sheets
// ---------------------------------------------------------------------------
// Row 0: walk right   Row 1: walk left
// Row 2: walk down    Row 3: walk up
// Row 4: typing right Row 5: typing left
// Row 6: idle right   Row 7: idle left
// Row 8: idle down    Row 9: action right

// ---------------------------------------------------------------------------
// Action types & mappings (kept from original)
// ---------------------------------------------------------------------------

type AgentAction = 'coding' | 'researching' | 'executing' | 'collaborating' | 'troubleshooting' | 'idle';

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

// ---------------------------------------------------------------------------
// Zone layout
// ---------------------------------------------------------------------------

interface ZoneLayout {
  anchors: Array<{ x: number; y: number }>;
}

const ZONES: Record<OfficeZone, ZoneLayout> = {
  desk: { anchors: [{ x: 48, y: 52 }, { x: 80, y: 52 }, { x: 64, y: 68 }] },
  bookshelf: { anchors: [{ x: 32, y: 136 }, { x: 64, y: 136 }, { x: 48, y: 148 }] },
  commons: { anchors: [{ x: 164, y: 56 }, { x: 164, y: 136 }, { x: 180, y: 96 }] },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const spriteIndexFromName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % WORKER_SPRITES.length;
};

/** Map action → { row, speed } in the worker sprite sheet. */
const actionToSpriteRow = (action: AgentAction): { row: number; speed: number } => {
  switch (action) {
    case 'coding':
      return { row: 4, speed: 1 };        // typing right, normal speed
    case 'researching':
      return { row: 8, speed: 0.5 };      // idle front-facing, slow
    case 'executing':
      return { row: 2, speed: 1 };        // walk down, normal
    case 'collaborating':
      return { row: 6, speed: 0.7 };      // idle right, medium
    case 'troubleshooting':
      return { row: 9, speed: 2 };        // action, fast
    case 'idle':
    default:
      return { row: 8, speed: 0.3 };      // idle front, very slow
  }
};

// ---------------------------------------------------------------------------
// Animation tick hook
// ---------------------------------------------------------------------------

const useAnimationTick = (intervalMs = 280): number => {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
};

// ---------------------------------------------------------------------------
// SpriteDiv — renders one frame from a sprite sheet
// ---------------------------------------------------------------------------

interface SpriteDivProps {
  src: string;
  sheetW: number;
  sheetH: number;
  col: number;
  row: number;
  frameSize?: number;
  scale?: number;
  style?: React.CSSProperties;
}

const SpriteDiv: React.FC<SpriteDivProps> = ({ src, sheetW, sheetH, col, row, frameSize = 16, scale = SCALE, style }) => {
  const displaySize = frameSize * scale;
  return (
    <div
      aria-hidden
      style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${src})`,
        backgroundSize: `${sheetW * scale}px ${sheetH * scale}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// AgentSprite — a character in the scene
// ---------------------------------------------------------------------------

const AgentSprite: React.FC<{
  card: RealAgentCard;
  isWorking: boolean;
  x: number;
  y: number;
  tick: number;
}> = ({ card, isWorking, x, y, tick }) => {
  const action = resolveAgentAction(card);
  const { row, speed } = actionToSpriteRow(action);
  const spriteUrl = WORKER_SPRITES[spriteIndexFromName(card.agentName)];

  // Frame cycling: speed multiplier controls how many ticks per frame change
  const effectiveTick = Math.floor(tick * speed);
  const col = isWorking || action !== 'idle' ? effectiveTick % WORKER_COLS : effectiveTick % 2;

  // Subtle bounce for active agents
  const bounceY = isWorking && action !== 'idle' ? (tick % 2 === 0 ? 0 : -1) : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + bounceY,
        transform: 'translate(-50%, -100%)',
        transition: 'left 400ms ease, top 400ms ease',
        zIndex: 20,
      }}
    >
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          left: FRAME_DISPLAY / 2 - 6,
          top: FRAME_DISPLAY - 2,
          width: 12,
          height: 4,
          borderRadius: '50%',
          backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 18%, transparent)',
        }}
      />

      {/* Character sprite */}
      <SpriteDiv
        src={spriteUrl}
        sheetW={WORKER_SHEET_W}
        sheetH={WORKER_SHEET_H}
        col={col}
        row={row}
      />

      {/* Lead crown indicator */}
      {card.isLead && (
        <div
          style={{
            position: 'absolute',
            left: FRAME_DISPLAY / 2 - 4,
            top: -4,
            width: 8,
            height: 5,
            clipPath: 'polygon(0% 100%, 15% 30%, 30% 70%, 50% 0%, 70% 70%, 85% 30%, 100% 100%)',
            backgroundColor: 'var(--status-success)',
          }}
        />
      )}

      {/* Action indicators */}
      {action === 'researching' && (
        <div style={{ position: 'absolute', left: -2, top: 14, width: 5, height: 7, backgroundColor: 'var(--status-info)', border: '1px solid var(--interactive-border)', borderRadius: 1 }} />
      )}
      {action === 'executing' && (
        <div style={{ position: 'absolute', right: -2, top: 14, width: 5, height: 5, backgroundColor: 'var(--status-success)', boxShadow: '0 0 2px var(--status-success)' }} />
      )}
      {action === 'troubleshooting' && (
        <div style={{ position: 'absolute', right: 0, top: 2, width: 4, height: 4, backgroundColor: 'var(--status-warning)', borderRadius: '50%' }} />
      )}
      {action === 'collaborating' && (
        <>
          <div style={{ position: 'absolute', left: -3, top: 4, width: 3, height: 3, backgroundColor: 'var(--primary-base)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', left: -5, top: 8, width: 2, height: 2, backgroundColor: 'var(--primary-base)', borderRadius: '50%', opacity: 0.6 }} />
        </>
      )}

      {/* Action label badge */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -14,
          transform: 'translateX(-50%)',
          fontSize: 7,
          lineHeight: 1,
          color: 'var(--surface-foreground)',
          padding: '1px 4px',
          border: '1px solid var(--interactive-border)',
          backgroundColor: 'var(--surface-elevated)',
          whiteSpace: 'nowrap',
          borderRadius: 3,
          animation: 'pixelOfficeFloat 2s ease-in-out infinite',
        }}
      >
        {ACTION_LABEL[action]}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Furniture components
// ---------------------------------------------------------------------------

/** Absolute-positioned furniture helper */
const Furn: React.FC<{
  left: number;
  top: number;
  w: number;
  h: number;
  bg: string;
  border?: boolean;
  z?: number;
  radius?: number;
  children?: React.ReactNode;
}> = ({ left, top, w, h, bg, border = true, z = 5, radius = 0, children }) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      width: w,
      height: h,
      backgroundColor: bg,
      border: border ? '1px solid var(--interactive-border)' : 'none',
      zIndex: z,
      borderRadius: radius,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// OfficeScene — the Stardew Valley–style room
// ---------------------------------------------------------------------------

const OfficeScene: React.FC<{ cards: RealAgentCard[]; isWorking: boolean }> = ({ cards, isWorking }) => {
  const tick = useAnimationTick(280);

  // Position agents in their zones
  const positioned = React.useMemo(() => {
    const zoneUsage: Record<OfficeZone, number> = { desk: 0, bookshelf: 0, commons: 0 };
    return cards.map((card) => {
      const zone = ZONES[card.zone];
      const index = zoneUsage[card.zone];
      const anchor = zone.anchors[index] ?? zone.anchors[zone.anchors.length - 1];
      zoneUsage[card.zone] = index + 1;
      return { card, x: anchor.x, y: anchor.y };
    });
  }, [cards]);

  // Check if any agent is in each zone (for object animations)
  const hasAgentInDesk = cards.some((c) => c.zone === 'desk');
  const hasAgentInCommons = cards.some((c) => c.zone === 'commons');

  const computerCol = hasAgentInDesk ? tick % COMPUTER_COLS : 0;
  const computerRow = hasAgentInDesk ? Math.floor(tick / COMPUTER_COLS) % 3 : 0;
  const coolerFrame = hasAgentInCommons ? tick % COOLER_FRAMES : 0;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: SCENE_W,
        height: SCENE_H,
        border: '2px solid var(--interactive-border)',
        borderRadius: 4,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        margin: '0 auto',
      }}
    >
      {/* === FLOOR === */}
      {/* Base warm wooden floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'color-mix(in oklab, var(--status-warning-background) 45%, var(--surface-background))',
        }}
      />
      {/* Floor tile grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            `linear-gradient(to right, color-mix(in oklab, var(--status-warning) 12%, transparent) 1px, transparent 1px),
             linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 12%, transparent) 1px, transparent 1px)`,
          backgroundSize: `${TILE}px ${TILE}px`,
          pointerEvents: 'none',
        }}
      />

      {/* === WALL (top strip) === */}
      <Furn left={0} top={0} w={SCENE_W} h={24} bg="var(--surface-elevated)" border={false} z={2} />
      {/* Wall bottom edge */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 24, height: 2, backgroundColor: 'var(--interactive-border)', zIndex: 3 }} />
      {/* Wall baseboard */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 24, height: 4, backgroundColor: 'color-mix(in oklab, var(--status-warning) 30%, var(--surface-elevated))', zIndex: 2 }} />

      {/* === WINDOWS on wall === */}
      {/* Window 1 */}
      <Furn left={16} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        {/* Window cross */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        {/* Curtain */}
        <div style={{ position: 'absolute', left: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>
      {/* Window 2 */}
      <Furn left={60} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>
      {/* Window 3 (commons side) */}
      <Furn left={148} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>

      {/* === ZONE SEPARATOR: vertical divider === */}
      <div
        style={{
          position: 'absolute',
          left: 112,
          top: 24,
          width: 2,
          height: SCENE_H - 24,
          backgroundColor: 'var(--interactive-border)',
          zIndex: 4,
          opacity: 0.5,
        }}
      />
      {/* Horizontal separator between desk and bookshelf zones */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 92,
          width: 112,
          height: 2,
          backgroundColor: 'var(--interactive-border)',
          zIndex: 4,
          opacity: 0.4,
        }}
      />

      {/* === DESK ZONE (top-left) === */}
      {/* Carpet under desk area */}
      <Furn left={8} top={28} w={96} h={60} bg="color-mix(in oklab, var(--primary-base) 8%, transparent)" border={false} z={1} radius={2} />

      {/* Desk 1 */}
      <Furn left={16} top={34} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        {/* Monitor on desk */}
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={computerCol} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      {/* Chair 1 */}
      <Furn left={24} top={50} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* Desk 2 */}
      <Furn left={62} top={34} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        {/* Monitor on desk */}
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 2) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      {/* Chair 2 */}
      <Furn left={70} top={50} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* === BOOKSHELF ZONE (bottom-left) === */}
      {/* Carpet under bookshelf area */}
      <Furn left={8} top={96} w={96} h={72} bg="color-mix(in oklab, var(--status-info) 6%, transparent)" border={false} z={1} radius={2} />

      {/* Bookshelf 1 */}
      <Furn left={8} top={98} w={14} h={40} bg="var(--surface-elevated)" z={8}>
        {/* Book spines */}
        <div style={{ position: 'absolute', left: 2, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 6, top: 4, width: 2, height: 10, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 9, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-success)', borderRadius: 1 }} />
        {/* Shelf divider */}
        <div style={{ position: 'absolute', left: 1, top: 16, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 2, top: 19, width: 4, height: 8, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 7, top: 19, width: 3, height: 8, backgroundColor: 'var(--primary-base)', borderRadius: 1 }} />
        {/* Shelf divider */}
        <div style={{ position: 'absolute', left: 1, top: 29, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 3, top: 31, width: 8, height: 6, backgroundColor: 'color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>

      {/* Bookshelf 2 */}
      <Furn left={26} top={98} w={14} h={40} bg="var(--surface-elevated)" z={8}>
        <div style={{ position: 'absolute', left: 2, top: 4, width: 2, height: 10, backgroundColor: 'var(--primary-base)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 5, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-success)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 9, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 16, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 2, top: 19, width: 5, height: 8, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 8, top: 19, width: 4, height: 8, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 29, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 2, top: 31, width: 3, height: 6, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 6, top: 31, width: 6, height: 6, backgroundColor: 'color-mix(in oklab, var(--primary-base) 30%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>

      {/* Reading table */}
      <Furn left={50} top={112} w={40} h={16} bg="color-mix(in oklab, var(--status-warning) 28%, var(--surface-elevated))" z={7} radius={2}>
        {/* Books on table */}
        <div style={{ position: 'absolute', left: 4, top: 3, width: 8, height: 5, backgroundColor: 'var(--status-info)', borderRadius: 1, transform: 'rotate(-5deg)' }} />
        <div style={{ position: 'absolute', left: 14, top: 4, width: 6, height: 4, backgroundColor: 'var(--status-success)', borderRadius: 1, transform: 'rotate(3deg)' }} />
        <div style={{ position: 'absolute', right: 4, top: 3, width: 7, height: 5, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
      </Furn>
      {/* Chair at reading table */}
      <Furn left={64} top={130} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* === COMMONS ZONE (right side) === */}
      {/* Carpet in commons */}
      <Furn left={118} top={28} w={100} h={144} bg="color-mix(in oklab, var(--status-success) 6%, transparent)" border={false} z={1} radius={2} />

      {/* Watercooler */}
      <div style={{ position: 'absolute', left: 196, top: 28, zIndex: 9, overflow: 'hidden', width: 16 * SCALE, height: 16 * SCALE }}>
        <SpriteDiv
          src={watercoolerUrl}
          sheetW={COOLER_SHEET_W}
          sheetH={16}
          col={coolerFrame}
          row={0}
        />
      </div>

      {/* Coffee machine next to watercooler */}
      <Furn left={186} top={32} w={8} h={12} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" z={8} radius={1}>
        {/* Steam when active */}
        {hasAgentInCommons && (
          <>
            <div style={{ position: 'absolute', left: 2, top: -4, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.4, borderRadius: 1, animation: 'pixelOfficeFloat 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: 5, top: -6, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.3, borderRadius: 1, animation: 'pixelOfficeFloat 2s ease-in-out infinite 0.3s' }} />
          </>
        )}
      </Furn>

      {/* Sofa (top-right) */}
      <Furn left={124} top={34} w={36} h={16} bg="color-mix(in oklab, var(--status-success-background) 60%, var(--surface-elevated))" z={7} radius={3}>
        {/* Sofa back */}
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 5, backgroundColor: 'color-mix(in oklab, var(--status-success) 25%, var(--surface-elevated))', borderRadius: '3px 3px 0 0' }} />
        {/* Cushion divider */}
        <div style={{ position: 'absolute', left: '50%', top: 5, width: 1, height: 9, backgroundColor: 'var(--interactive-border)', opacity: 0.4 }} />
      </Furn>

      {/* Coffee table */}
      <Furn left={130} top={56} w={24} h={10} bg="color-mix(in oklab, var(--status-warning) 30%, var(--surface-elevated))" z={7} radius={2}>
        {/* Coffee cup */}
        <div style={{ position: 'absolute', left: 4, top: 2, width: 5, height: 5, backgroundColor: 'var(--surface-background)', border: '1px solid var(--interactive-border)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: 5, top: 3, width: 3, height: 3, backgroundColor: 'color-mix(in oklab, var(--status-warning) 60%, var(--surface-background))', borderRadius: '50%' }} />
      </Furn>

      {/* Plants */}
      {/* Potted plant 1 */}
      <Furn left={120} top={92} w={10} h={6} bg="color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))" z={8} radius={1}>
        {/* Leaves */}
        <div style={{ position: 'absolute', left: 1, top: -8, width: 8, height: 8, backgroundColor: 'var(--status-success)', borderRadius: '50% 50% 20% 20%' }} />
        <div style={{ position: 'absolute', left: -2, top: -6, width: 6, height: 6, backgroundColor: 'color-mix(in oklab, var(--status-success) 80%, var(--surface-background))', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: -2, top: -5, width: 5, height: 5, backgroundColor: 'color-mix(in oklab, var(--status-success) 70%, var(--surface-background))', borderRadius: '50%' }} />
      </Furn>

      {/* Potted plant 2 (small) */}
      <Furn left={200} top={148} w={8} h={5} bg="color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))" z={8} radius={1}>
        <div style={{ position: 'absolute', left: 1, top: -5, width: 6, height: 5, backgroundColor: 'var(--status-success)', borderRadius: '40%' }} />
      </Furn>

      {/* Bean bag chairs (bottom-right commons) */}
      <Furn left={140} top={120} w={16} h={12} bg="color-mix(in oklab, var(--status-info-background) 60%, var(--surface-elevated))" z={7} radius={6} />
      <Furn left={164} top={124} w={14} h={10} bg="color-mix(in oklab, var(--status-warning-background) 60%, var(--surface-elevated))" z={7} radius={6} />

      {/* Small side table between bean bags */}
      <Furn left={158} top={116} w={8} h={8} bg="color-mix(in oklab, var(--status-warning) 25%, var(--surface-elevated))" z={8} radius={1} />

      {/* Whiteboard on right wall */}
      <Furn left={186} top={70} w={28} h={20} bg="var(--surface-background)" z={8} radius={1}>
        {/* Whiteboard content lines */}
        <div style={{ position: 'absolute', left: 3, top: 4, width: 18, height: 2, backgroundColor: 'var(--status-info)', opacity: 0.5, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 3, top: 8, width: 14, height: 2, backgroundColor: 'var(--status-success)', opacity: 0.5, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 3, top: 12, width: 20, height: 2, backgroundColor: 'var(--status-warning)', opacity: 0.4, borderRadius: 1 }} />
        {/* Marker */}
        <div style={{ position: 'absolute', right: 2, bottom: 2, width: 2, height: 6, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
      </Furn>

      {/* === FLOOR DETAILS === */}
      {/* Door mat */}
      <Furn left={100} top={164} w={24} h={8} bg="color-mix(in oklab, var(--status-warning) 20%, var(--surface-elevated))" border={false} z={1} radius={2} />

      {/* Subtle warm light overlay from windows */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 24,
          width: 80,
          height: 40,
          background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 8%, transparent), transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 148,
          top: 24,
          width: 40,
          height: 30,
          background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 6%, transparent), transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* === AGENTS === */}
      {positioned.map(({ card, x, y }) => (
        <AgentSprite key={card.slotId} card={card} isWorking={isWorking} x={x} y={y} tick={tick} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// AgentCards — compact list below the scene
// ---------------------------------------------------------------------------

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
            borderRadius: 2,
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

// ---------------------------------------------------------------------------
// PixelOfficePanel — main exported component
// ---------------------------------------------------------------------------

export const PixelOfficePanel: React.FC = () => {
  const { t } = useI18n();
  const state = usePixelOfficeState();

  return (
    <div style={{ width: SCENE_W }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <OfficeScene cards={state.cards} isWorking={state.isWorking} />

        {state.speechBubble && (
          <div
            style={{
              border: '1px solid var(--interactive-border)',
              backgroundColor: 'var(--surface-elevated)',
              padding: '3px 6px',
              borderRadius: 4,
              animation: 'pixelOfficeFloat 2s ease-in-out infinite',
            }}
          >
            <div className="typography-micro" style={{ fontSize: 8, color: 'var(--surface-foreground)', lineHeight: 1.15 }}>
              💬 {state.speechBubble}
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
        @keyframes pixelOfficeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes pixelOfficeBounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          75% { transform: translateY(1px); }
        }
      `}</style>
    </div>
  );
};

export const PixelOffice = PixelOfficePanel;
