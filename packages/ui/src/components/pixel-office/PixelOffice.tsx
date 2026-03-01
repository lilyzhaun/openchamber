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

/** Display scale: 16px native → ~26px rendered (slightly smaller than background) */
const SCALE = 1.6;
const FRAME_DISPLAY = WORKER_FRAME * SCALE; // ~26

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
// Action types — fine-grained, driven by real activity data
// ---------------------------------------------------------------------------

type AgentAction =
  | 'writing'      // edit/write/multiedit/apply_patch — actively modifying files
  | 'reading'      // read — examining a specific file
  | 'searching'    // grep/glob/list — scanning the codebase
  | 'browsing'     // webfetch/websearch/codesearch — looking things up online
  | 'running'      // bash — executing a shell command
  | 'thinking'     // reasoning partType — deep thought, no tool active
  | 'composing'    // text partType — streaming a response
  | 'delegating'   // task/todowrite — coordinating sub-agents or tasks
  | 'reviewing'    // permission — waiting for user approval
  | 'retrying'     // retry status — something failed, trying again
  | 'arriving'     // session just started, no activity yet but working
  | 'idle';        // not working at all

/** Compact label shown in the action badge — derived from statusText when possible */
const getActionLabel = (card: RealAgentCard, action: AgentAction): string => {
  // If we have a real statusText from the assistant, use it directly
  const st = card.activity.statusText?.trim();
  if (st && st.length > 0 && st.length <= 14) return st;
  if (st && st.length > 14) return st.slice(0, 12) + '…';

  // Otherwise fall back to action-based label
  switch (action) {
    case 'writing':    return '写入文件';
    case 'reading':    return '读取文件';
    case 'searching':  return '搜索代码';
    case 'browsing':   return '查阅资料';
    case 'running':    return '运行命令';
    case 'thinking':   return '思考中';
    case 'composing':  return '编写回复';
    case 'delegating': return '分派任务';
    case 'reviewing':  return '等待确认';
    case 'retrying':   return '重试中';
    case 'arriving':   return '准备中';
    case 'idle':       return '休息中';
  }
};

/** Tool name → action. Most specific mapping. */
const TOOL_ACTION_MAP: Record<string, AgentAction> = {
  write: 'writing',
  edit: 'writing',
  multiedit: 'writing',
  apply_patch: 'writing',
  read: 'reading',
  grep: 'searching',
  glob: 'searching',
  list: 'searching',
  webfetch: 'browsing',
  websearch: 'browsing',
  codesearch: 'browsing',
  bash: 'running',
  task: 'delegating',
  todowrite: 'delegating',
  todoread: 'delegating',
  skill: 'browsing',
  question: 'reviewing',
};

/**
 * Resolve the current visual action for an agent card.
 * Priority: toolName > activePartType > activity phase > session status > fallback
 */
const resolveAgentAction = (card: RealAgentCard): AgentAction => {
  // 1. Active tool takes priority — it's the most concrete signal
  const toolName = card.activity.toolName?.toLowerCase() ?? null;
  if (toolName && TOOL_ACTION_MAP[toolName]) {
    return TOOL_ACTION_MAP[toolName];
  }

  // 2. Check statusText for specific phrases
  const status = `${card.activity.activity} ${card.activity.statusText ?? ''}`.toLowerCase();

  // Retry is a distinct visual state
  if (status.includes('retry')) return 'retrying';

  // Permission waiting
  if (status.includes('permission') || status.includes('waiting')) return 'reviewing';

  // 3. Infer from statusText keywords (these come from useAssistantStatus)
  if (status.includes('thinking') || status.includes('reasoning')) return 'thinking';
  if (status.includes('composing') || status.includes('streaming')) return 'composing';
  if (status.includes('editing') || status.includes('writing')) return 'writing';
  if (status.includes('reading')) return 'reading';
  if (status.includes('searching') || status.includes('finding') || status.includes('listing')) return 'searching';
  if (status.includes('fetching') || status.includes('web') || status.includes('learning')) return 'browsing';
  if (status.includes('running') || status.includes('command')) return 'running';
  if (status.includes('delegat') || status.includes('todo') || status.includes('planning')) return 'delegating';

  // 4. Session-level activity (includes child session statusType values: 'busy', 'retry', 'idle')
  if (card.activity.activity === 'tooling') return 'running';
  if (card.activity.activity === 'streaming') return 'composing';
  if (card.activity.activity === 'cooldown') return 'thinking';
  if (card.activity.activity === 'permission') return 'reviewing';
  if (card.activity.activity === 'busy') return 'composing';  // child session actively working
  if (card.activity.activity === 'retry') return 'retrying';  // child session retrying

  // 5. Source-based fallback — only for truly unknown states
  if (card.activity.source === 'session' && card.activity.activity !== 'idle') {
    return 'composing';  // session is active but we can't determine specifics
  }

  return 'idle';
};

// ---------------------------------------------------------------------------
// Zone layout
// ---------------------------------------------------------------------------

interface ZoneLayout {
  anchors: Array<{ x: number; y: number }>;
}

const ZONES: Record<OfficeZone, ZoneLayout> = {
  desk: { anchors: [{ x: 28, y: 54 }, { x: 134, y: 54 }, { x: 28, y: 86 }, { x: 134, y: 86 }, { x: 54, y: 70 }, { x: 160, y: 70 }] },
  bookshelf: { anchors: [{ x: 22, y: 136 }, { x: 52, y: 146 }, { x: 74, y: 134 }] },
  commons: { anchors: [{ x: 114, y: 132 }, { x: 152, y: 122 }, { x: 178, y: 152 }, { x: 198, y: 126 }] },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map agent name → sprite index. Uses a better distribution hash and ensures
 * lead vs child agents look visually distinct.
 */
const spriteIndexFromName = (name: string, isLead: boolean): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 131 + name.charCodeAt(i)) | 0;
  }
  // Lead agent gets sprite 0 (the 'main character' look)
  // Children distribute across 1-3 so they look different from lead
  if (isLead) return 0;
  return 1 + (Math.abs(hash) % (WORKER_SPRITES.length - 1));
};

/**
 * Map action → { row, speed } in the worker sprite sheet.
 *
 * Sprite rows:
 *   0: walk right   1: walk left
 *   2: walk down    3: walk up
 *   4: typing right 5: typing left
 *   6: idle right   7: idle left
 *   8: idle down    9: action right
 */
const actionToSpriteRow = (action: AgentAction): { row: number; speed: number } => {
  switch (action) {
    case 'writing':     return { row: 4, speed: 1.0 };  // typing animation — actively coding
    case 'reading':     return { row: 6, speed: 0.4 };  // idle right — looking at screen
    case 'searching':   return { row: 0, speed: 0.8 };  // walk right — scanning through files
    case 'browsing':    return { row: 2, speed: 0.6 };  // walk down — browsing the web
    case 'running':     return { row: 9, speed: 1.5 };  // action right — executing something
    case 'thinking':    return { row: 8, speed: 0.3 };  // idle down — deep in thought, slow
    case 'composing':   return { row: 4, speed: 0.6 };  // typing but slower — drafting text
    case 'delegating':  return { row: 3, speed: 0.7 };  // walk up — going to assign work
    case 'reviewing':   return { row: 7, speed: 0.2 };  // idle left — waiting, barely moving
    case 'retrying':    return { row: 9, speed: 2.0 };  // action fast — urgently retrying
    case 'arriving':    return { row: 2, speed: 0.5 };  // walk down — entering the scene
    case 'idle':        return { row: 8, speed: 0.2 };  // idle down — very slow breathing
    default:            return { row: 8, speed: 0.3 };
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
  x: number;
  y: number;
  tick: number;
}> = ({ card, x, y, tick }) => {
  const action = resolveAgentAction(card);
  const { row, speed } = actionToSpriteRow(action);
  const spriteUrl = WORKER_SPRITES[spriteIndexFromName(card.agentName, card.isLead)];
  const label = getActionLabel(card, action);

  // Frame cycling: speed multiplier controls how many ticks per frame change
  const effectiveTick = Math.floor(tick * speed);
  const col = action !== 'idle' ? effectiveTick % WORKER_COLS : effectiveTick % 2;

  // Bounce for active agents, intensity varies by action
  const bounceIntensity = action === 'retrying' ? 2 : action === 'running' ? 1 : action === 'idle' ? 0 : 1;
  const bounceY = bounceIntensity > 0 && action !== 'idle' ? (tick % 2 === 0 ? 0 : -bounceIntensity) : 0;

  // Badge color based on action category
  const badgeColor = (() => {
    switch (action) {
      case 'writing':    return 'var(--status-success)';
      case 'reading':    return 'var(--status-info)';
      case 'searching':  return 'var(--status-info)';
      case 'browsing':   return 'var(--primary-base)';
      case 'running':    return 'var(--status-warning)';
      case 'thinking':   return 'var(--surface-muted-foreground)';
      case 'composing':  return 'var(--status-success)';
      case 'delegating': return 'var(--primary-base)';
      case 'reviewing':  return 'var(--status-warning)';
      case 'retrying':   return 'var(--status-error)';
      case 'arriving':   return 'var(--surface-muted-foreground)';
      case 'idle':       return 'var(--surface-muted-foreground)';
    }
  })();

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

      {/* Contextual indicator — only shown for distinctive states */}
      {action === 'thinking' && (
        /* Thought bubble dots */
        <>
          <div style={{ position: 'absolute', right: -1, top: 6, width: 3, height: 3, backgroundColor: 'var(--surface-muted-foreground)', borderRadius: '50%', opacity: 0.7, animation: 'pixelOfficeFloat 1.5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', right: -4, top: 2, width: 2, height: 2, backgroundColor: 'var(--surface-muted-foreground)', borderRadius: '50%', opacity: 0.4, animation: 'pixelOfficeFloat 2s ease-in-out infinite 0.3s' }} />
        </>
      )}
      {action === 'running' && (
        /* Terminal cursor blink */
        <div style={{ position: 'absolute', right: -2, top: 14, width: 4, height: 5, backgroundColor: 'var(--status-warning)', opacity: tick % 3 === 0 ? 1 : 0.4, transition: 'opacity 150ms' }} />
      )}
      {action === 'retrying' && (
        /* Warning dot */
        <div style={{ position: 'absolute', right: 0, top: 2, width: 4, height: 4, backgroundColor: 'var(--status-error)', borderRadius: '50%', animation: 'pixelOfficeBounce 0.6s ease-in-out infinite' }} />
      )}
      {action === 'reviewing' && (
        /* Question mark indicator */
        <div style={{ position: 'absolute', right: -3, top: 4, fontSize: 7, lineHeight: 1, color: 'var(--status-warning)', fontWeight: 'bold' }}>?</div>
      )}
      {action === 'delegating' && (
        /* Outgoing arrow */
        <div style={{ position: 'absolute', left: -3, top: 10, fontSize: 6, lineHeight: 1, color: 'var(--primary-base)' }}>→</div>
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
          color: badgeColor,
          padding: '1px 4px',
          border: `1px solid ${badgeColor}`,
          backgroundColor: 'var(--surface-elevated)',
          whiteSpace: 'nowrap',
          borderRadius: 3,
          opacity: action === 'idle' ? 0.6 : 1,
          animation: action !== 'idle' ? 'pixelOfficeFloat 2s ease-in-out infinite' : 'none',
        }}
      >
        {label}
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

const OfficeScene: React.FC<{ cards: RealAgentCard[] }> = ({ cards }) => {
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
  const hasAgentInBookshelf = cards.some((c) => c.zone === 'bookshelf');
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'color-mix(in oklab, var(--status-warning-background) 42%, var(--surface-background))',
        }}
      />
      <Furn
        left={0}
        top={100}
        w={SCENE_W}
        h={SCENE_H - 100}
        bg="color-mix(in oklab, var(--status-info-background) 20%, var(--surface-background))"
        border={false}
        z={1}
      />
      <Furn
        left={8}
        top={28}
        w={208}
        h={70}
        bg="color-mix(in oklab, var(--primary-base) 8%, transparent)"
        border={false}
        z={2}
        radius={2}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 100,
          width: SCENE_W,
          height: 2,
          zIndex: 3,
          backgroundColor: 'color-mix(in oklab, var(--interactive-border) 75%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 28,
          width: 208,
          height: 70,
          zIndex: 2,
          backgroundImage:
            `linear-gradient(to right, color-mix(in oklab, var(--status-warning) 12%, transparent) 1px, transparent 1px),
             linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 12%, transparent) 1px, transparent 1px)`,
          backgroundSize: `${TILE}px ${TILE}px`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 100,
          width: SCENE_W,
          height: 76,
          zIndex: 2,
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--status-info) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          pointerEvents: 'none',
        }}
      />

      <Furn left={0} top={0} w={SCENE_W} h={26} bg="var(--surface-elevated)" border={false} z={4} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 24,
          width: SCENE_W,
          height: 2,
          zIndex: 5,
          backgroundColor: 'var(--interactive-border)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 22,
          width: SCENE_W,
          height: 2,
          zIndex: 5,
          backgroundColor: 'color-mix(in oklab, var(--status-warning) 24%, var(--surface-elevated))',
        }}
      />

      <Furn left={10} top={4} w={34} h={15} bg="color-mix(in oklab, var(--status-info-background) 84%, var(--surface-background))" z={6} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 16, top: 0, width: 1, height: 15, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 80%, transparent)' }} />
        <div style={{ position: 'absolute', left: 0, top: 7, width: 34, height: 1, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 65%, transparent)' }} />
      </Furn>
      <Furn left={58} top={4} w={34} h={15} bg="color-mix(in oklab, var(--status-info-background) 84%, var(--surface-background))" z={6} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 16, top: 0, width: 1, height: 15, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 80%, transparent)' }} />
        <div style={{ position: 'absolute', left: 0, top: 7, width: 34, height: 1, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 65%, transparent)' }} />
      </Furn>
      <Furn left={126} top={4} w={34} h={15} bg="color-mix(in oklab, var(--status-info-background) 84%, var(--surface-background))" z={6} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 16, top: 0, width: 1, height: 15, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 80%, transparent)' }} />
        <div style={{ position: 'absolute', left: 0, top: 7, width: 34, height: 1, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 65%, transparent)' }} />
      </Furn>
      <Furn left={174} top={4} w={34} h={15} bg="color-mix(in oklab, var(--status-info-background) 84%, var(--surface-background))" z={6} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 16, top: 0, width: 1, height: 15, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 80%, transparent)' }} />
        <div style={{ position: 'absolute', left: 0, top: 7, width: 34, height: 1, backgroundColor: 'color-mix(in oklab, var(--interactive-border) 65%, transparent)' }} />
      </Furn>

      <Furn left={101} top={3} w={22} h={22} bg="color-mix(in oklab, var(--surface-background) 88%, var(--surface-elevated))" z={7} radius={999}>
        <div style={{ position: 'absolute', inset: 1, border: '1px solid var(--interactive-border)', borderRadius: 999 }} />
        <div style={{ position: 'absolute', left: 11, top: 6, width: 1, height: 6, backgroundColor: 'var(--surface-foreground)' }} />
        <div style={{ position: 'absolute', left: 11, top: 11, width: 4, height: 1, backgroundColor: 'var(--surface-foreground)' }} />
        <div style={{ position: 'absolute', left: 10, top: 10, width: 2, height: 2, backgroundColor: 'var(--surface-foreground)', borderRadius: 999 }} />
      </Furn>

      <Furn left={182} top={4} w={26} h={14} bg="color-mix(in oklab, var(--status-info-background) 28%, var(--surface-elevated))" z={8} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 3, top: 3, width: 20, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-info) 72%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 6, top: 7, width: 10, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-success) 72%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 14, top: 9, width: 8, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 70%, var(--surface-background))' }} />
      </Furn>

      <Furn left={14} top={35} w={34} h={8} bg="color-mix(in oklab, var(--status-warning) 44%, var(--surface-elevated))" border={false} z={8} radius={1} />
      <Furn left={40} top={35} w={8} h={18} bg="color-mix(in oklab, var(--status-warning) 36%, var(--surface-elevated))" border={false} z={7} radius={1} />
      <Furn left={14} top={43} w={34} h={4} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={7} />
      <Furn left={40} top={52} w={8} h={2} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={6} />
      <div style={{ position: 'absolute', left: 24, top: 26, width: 16, height: 10, overflow: 'hidden', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)', backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 28%, var(--surface-elevated))' }} />
        <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={computerCol} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.9 }} />
      </div>
      <Furn left={30} top={36} w={4} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={10} />
      <Furn left={21} top={40} w={12} h={2} bg="color-mix(in oklab, var(--surface-foreground) 18%, var(--surface-elevated))" border={false} z={9} radius={1} />
      <Furn left={16} top={38} w={3} h={3} bg="color-mix(in oklab, var(--status-warning) 64%, var(--surface-background))" border={false} z={9} radius={999} />

      <Furn left={22} top={53} w={12} h={8} bg="color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))" border={false} z={8} radius={2}>
        <div style={{ position: 'absolute', left: 2, top: -5, width: 8, height: 5, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 26%, var(--surface-elevated))', borderRadius: '2px 2px 0 0' }} />
        <div style={{ position: 'absolute', left: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', right: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={25} top={61} w={6} h={2} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" border={false} z={7} />
      <Furn left={22} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={27} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={32} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />

      <Furn left={118} top={35} w={34} h={8} bg="color-mix(in oklab, var(--status-warning) 44%, var(--surface-elevated))" border={false} z={8} radius={1} />
      <Furn left={118} top={35} w={8} h={18} bg="color-mix(in oklab, var(--status-warning) 36%, var(--surface-elevated))" border={false} z={7} radius={1} />
      <Furn left={118} top={43} w={34} h={4} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={7} />
      <Furn left={118} top={52} w={8} h={2} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={6} />
      <div style={{ position: 'absolute', left: 126, top: 26, width: 16, height: 10, overflow: 'hidden', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)', backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 28%, var(--surface-elevated))' }} />
        <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 1) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.9 }} />
      </div>
      <Furn left={132} top={36} w={4} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={10} />
      <Furn left={130} top={40} w={12} h={2} bg="color-mix(in oklab, var(--surface-foreground) 18%, var(--surface-elevated))" border={false} z={9} radius={1} />
      <Furn left={146} top={37} w={4} h={4} bg="color-mix(in oklab, var(--status-success) 70%, var(--surface-background))" border={false} z={9} radius={999}>
        <div style={{ position: 'absolute', left: -1, top: 2, width: 2, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-success) 55%, var(--surface-background))', borderRadius: 999 }} />
        <div style={{ position: 'absolute', right: -1, top: 1, width: 2, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-success) 64%, var(--surface-background))', borderRadius: 999 }} />
      </Furn>

      <Furn left={128} top={53} w={12} h={8} bg="color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))" border={false} z={8} radius={2}>
        <div style={{ position: 'absolute', left: 2, top: -5, width: 8, height: 5, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 26%, var(--surface-elevated))', borderRadius: '2px 2px 0 0' }} />
        <div style={{ position: 'absolute', left: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', right: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={131} top={61} w={6} h={2} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" border={false} z={7} />
      <Furn left={128} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={133} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={138} top={63} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />

      <Furn left={14} top={67} w={34} h={8} bg="color-mix(in oklab, var(--status-warning) 44%, var(--surface-elevated))" border={false} z={8} radius={1} />
      <Furn left={40} top={67} w={8} h={18} bg="color-mix(in oklab, var(--status-warning) 36%, var(--surface-elevated))" border={false} z={7} radius={1} />
      <Furn left={14} top={75} w={34} h={4} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={7} />
      <Furn left={40} top={84} w={8} h={2} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={6} />
      <div style={{ position: 'absolute', left: 24, top: 58, width: 16, height: 10, overflow: 'hidden', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)', backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 28%, var(--surface-elevated))' }} />
        <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 2) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.9 }} />
      </div>
      <Furn left={30} top={68} w={4} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={10} />
      <Furn left={21} top={72} w={12} h={2} bg="color-mix(in oklab, var(--surface-foreground) 18%, var(--surface-elevated))" border={false} z={9} radius={1} />
      <Furn left={16} top={69} w={5} h={3} bg="color-mix(in oklab, var(--status-warning-background) 75%, var(--surface-background))" border={false} z={9}>
        <div style={{ position: 'absolute', left: 1, top: 1, width: 3, height: 1, backgroundColor: 'color-mix(in oklab, var(--status-info) 60%, var(--surface-background))' }} />
      </Furn>

      <Furn left={22} top={85} w={12} h={8} bg="color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))" border={false} z={8} radius={2}>
        <div style={{ position: 'absolute', left: 2, top: -5, width: 8, height: 5, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 26%, var(--surface-elevated))', borderRadius: '2px 2px 0 0' }} />
        <div style={{ position: 'absolute', left: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', right: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={25} top={93} w={6} h={2} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" border={false} z={7} />
      <Furn left={22} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={27} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={32} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />

      <Furn left={118} top={67} w={34} h={8} bg="color-mix(in oklab, var(--status-warning) 44%, var(--surface-elevated))" border={false} z={8} radius={1} />
      <Furn left={118} top={67} w={8} h={18} bg="color-mix(in oklab, var(--status-warning) 36%, var(--surface-elevated))" border={false} z={7} radius={1} />
      <Furn left={118} top={75} w={34} h={4} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={7} />
      <Furn left={118} top={84} w={8} h={2} bg="color-mix(in oklab, var(--status-warning) 58%, var(--surface-background))" border={false} z={6} />
      <div style={{ position: 'absolute', left: 126, top: 58, width: 16, height: 10, overflow: 'hidden', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--interactive-border)', backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 28%, var(--surface-elevated))' }} />
        <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 3) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.9 }} />
      </div>
      <Furn left={132} top={68} w={4} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={10} />
      <Furn left={130} top={72} w={12} h={2} bg="color-mix(in oklab, var(--surface-foreground) 18%, var(--surface-elevated))" border={false} z={9} radius={1} />
      <Furn left={146} top={69} w={5} h={3} bg="color-mix(in oklab, var(--status-info-background) 70%, var(--surface-background))" border={false} z={9}>
        <div style={{ position: 'absolute', left: 1, top: 1, width: 3, height: 1, backgroundColor: 'color-mix(in oklab, var(--status-info) 75%, var(--surface-background))' }} />
      </Furn>

      <Furn left={128} top={85} w={12} h={8} bg="color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))" border={false} z={8} radius={2}>
        <div style={{ position: 'absolute', left: 2, top: -5, width: 8, height: 5, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 26%, var(--surface-elevated))', borderRadius: '2px 2px 0 0' }} />
        <div style={{ position: 'absolute', left: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', right: -2, top: 1, width: 2, height: 4, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={131} top={93} w={6} h={2} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" border={false} z={7} />
      <Furn left={128} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={133} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />
      <Furn left={138} top={95} w={2} h={2} bg="color-mix(in oklab, var(--surface-foreground) 36%, var(--surface-elevated))" border={false} z={7} radius={999} />

      <Furn left={8} top={106} w={20} h={56} bg="color-mix(in oklab, var(--status-warning) 34%, var(--surface-elevated))" z={7}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 20, height: 3, backgroundColor: 'color-mix(in oklab, var(--status-warning) 48%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 0, top: 17, width: 20, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 46%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 0, top: 35, width: 20, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 46%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 2, top: 4, width: 3, height: 11, backgroundColor: 'var(--status-info)' }} />
        <div style={{ position: 'absolute', left: 6, top: 6, width: 2, height: 9, backgroundColor: 'var(--status-success)' }} />
        <div style={{ position: 'absolute', left: 9, top: 5, width: 4, height: 10, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 14, top: 7, width: 3, height: 8, backgroundColor: 'var(--status-error)' }} />
        <div style={{ position: 'absolute', left: 2, top: 20, width: 4, height: 12, backgroundColor: 'var(--status-info)', transform: 'rotate(-8deg)', transformOrigin: 'bottom left' }} />
        <div style={{ position: 'absolute', left: 7, top: 22, width: 3, height: 10, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 11, top: 21, width: 2, height: 11, backgroundColor: 'var(--status-success)' }} />
        <div style={{ position: 'absolute', left: 14, top: 23, width: 3, height: 9, backgroundColor: 'var(--status-info)' }} />
        <div style={{ position: 'absolute', left: 2, top: 39, width: 2, height: 14, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 5, top: 41, width: 3, height: 12, backgroundColor: 'var(--status-success)', transform: 'rotate(7deg)', transformOrigin: 'bottom left' }} />
        <div style={{ position: 'absolute', left: 9, top: 43, width: 2, height: 10, backgroundColor: 'var(--status-error)' }} />
        <div style={{ position: 'absolute', left: 12, top: 42, width: 5, height: 11, backgroundColor: 'var(--status-info)' }} />
      </Furn>
      <Furn left={32} top={106} w={20} h={56} bg="color-mix(in oklab, var(--status-warning) 34%, var(--surface-elevated))" z={7}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 20, height: 3, backgroundColor: 'color-mix(in oklab, var(--status-warning) 48%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 0, top: 17, width: 20, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 46%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 0, top: 35, width: 20, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 46%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 2, top: 5, width: 2, height: 10, backgroundColor: 'var(--status-success)' }} />
        <div style={{ position: 'absolute', left: 5, top: 4, width: 4, height: 11, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 10, top: 6, width: 3, height: 9, backgroundColor: 'var(--status-info)' }} />
        <div style={{ position: 'absolute', left: 14, top: 3, width: 3, height: 12, backgroundColor: 'var(--status-error)' }} />
        <div style={{ position: 'absolute', left: 2, top: 21, width: 3, height: 11, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 6, top: 20, width: 2, height: 12, backgroundColor: 'var(--status-info)' }} />
        <div style={{ position: 'absolute', left: 9, top: 22, width: 4, height: 10, backgroundColor: 'var(--status-success)' }} />
        <div style={{ position: 'absolute', left: 14, top: 24, width: 2, height: 8, backgroundColor: 'var(--status-warning)', transform: 'rotate(9deg)', transformOrigin: 'bottom left' }} />
        <div style={{ position: 'absolute', left: 2, top: 41, width: 4, height: 12, backgroundColor: 'var(--status-info)' }} />
        <div style={{ position: 'absolute', left: 7, top: 43, width: 2, height: 10, backgroundColor: 'var(--status-success)' }} />
        <div style={{ position: 'absolute', left: 10, top: 40, width: 3, height: 13, backgroundColor: 'var(--status-warning)' }} />
        <div style={{ position: 'absolute', left: 14, top: 44, width: 2, height: 9, backgroundColor: 'var(--status-error)' }} />
      </Furn>

      <Furn left={56} top={124} w={28} h={22} bg="color-mix(in oklab, var(--status-info-background) 46%, var(--surface-elevated))" border={false} z={8} radius={4}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 28, height: 8, backgroundColor: 'color-mix(in oklab, var(--status-info) 34%, var(--surface-elevated))', borderRadius: '4px 4px 0 0' }} />
        <div style={{ position: 'absolute', left: 1, top: 8, width: 12, height: 12, backgroundColor: 'color-mix(in oklab, var(--status-info-background) 62%, var(--surface-elevated))', borderRadius: '0 0 0 4px' }} />
        <div style={{ position: 'absolute', right: 1, top: 8, width: 12, height: 12, backgroundColor: 'color-mix(in oklab, var(--status-info-background) 62%, var(--surface-elevated))', borderRadius: '0 0 4px 0' }} />
      </Furn>
      <Furn left={62} top={146} w={16} h={4} bg="color-mix(in oklab, var(--status-warning) 26%, var(--surface-elevated))" border={false} z={7} radius={1} />
      <Furn left={65} top={114} w={4} h={10} bg="color-mix(in oklab, var(--surface-foreground) 22%, var(--surface-elevated))" border={false} z={8} />
      <Furn left={63} top={110} w={8} h={5} bg="color-mix(in oklab, var(--surface-background) 70%, var(--surface-elevated))" border={false} z={9} radius={999} />
      {hasAgentInBookshelf && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 107,
            width: 14,
            height: 10,
            background: 'radial-gradient(circle, color-mix(in oklab, var(--status-warning) 25%, transparent), transparent 70%)',
            zIndex: 6,
            animation: 'pixelOfficePulse 2.4s ease-in-out infinite',
          }}
        />
      )}

      <Furn left={92} top={116} w={46} h={22} bg="color-mix(in oklab, var(--status-warning) 30%, var(--surface-elevated))" border={false} z={8} radius={1}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 46, height: 5, backgroundColor: 'color-mix(in oklab, var(--status-warning) 48%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 4, top: 8, width: 8, height: 10, backgroundColor: 'color-mix(in oklab, var(--status-warning) 18%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 18, top: 8, width: 8, height: 10, backgroundColor: 'color-mix(in oklab, var(--status-warning) 18%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 32, top: 8, width: 10, height: 10, backgroundColor: 'color-mix(in oklab, var(--status-warning) 18%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={96} top={112} w={6} h={4} bg="var(--surface-background)" border={false} z={9} radius={1} />
      <Furn left={106} top={112} w={6} h={4} bg="var(--surface-background)" border={false} z={9} radius={1} />
      <Furn left={116} top={112} w={6} h={4} bg="var(--surface-background)" border={false} z={9} radius={1} />

      <Furn left={104} top={104} w={16} h={13} bg="color-mix(in oklab, var(--surface-foreground) 26%, var(--surface-elevated))" border={false} z={10} radius={1}>
        <div style={{ position: 'absolute', left: 2, top: 2, width: 12, height: 7, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 12%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 4, bottom: 1, width: 8, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 26%, var(--surface-elevated))' }} />
        <div
          style={{
            position: 'absolute',
            right: 2,
            top: 2,
            width: 3,
            height: 3,
            borderRadius: 999,
            backgroundColor: hasAgentInCommons
              ? 'color-mix(in oklab, var(--status-success) 75%, var(--surface-background))'
              : 'color-mix(in oklab, var(--surface-muted-foreground) 35%, var(--surface-background))',
            boxShadow: hasAgentInCommons
              ? `0 0 6px color-mix(in oklab, var(--status-success) ${60 + ((tick % 3) * 10)}%, transparent)`
              : 'none',
          }}
        />
        {hasAgentInCommons && (
          <>
            <div style={{ position: 'absolute', left: 5, top: -4, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.4, borderRadius: 1, animation: 'pixelOfficeFloat 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: 8, top: -6, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.3, borderRadius: 1, animation: 'pixelOfficeFloat 2s ease-in-out infinite 0.3s' }} />
          </>
        )}
      </Furn>

      <div style={{ position: 'absolute', left: 136, top: 100, zIndex: 10, overflow: 'hidden', width: 32, height: 32 }}>
        <SpriteDiv
          src={watercoolerUrl}
          sheetW={COOLER_SHEET_W}
          sheetH={16}
          col={coolerFrame}
          row={0}
          scale={2}
        />
      </div>

      <Furn left={162} top={104} w={54} h={34} bg="var(--surface-background)" z={8} radius={1}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid color-mix(in oklab, var(--interactive-border) 85%, transparent)' }} />
        <div style={{ position: 'absolute', left: 5, top: 6, width: 18, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-info) 80%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 27, top: 6, width: 18, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-success) 75%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 8, top: 13, width: 2, height: 2, borderRadius: 999, backgroundColor: 'color-mix(in oklab, var(--status-warning) 85%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 18, top: 13, width: 2, height: 2, borderRadius: 999, backgroundColor: 'color-mix(in oklab, var(--status-info) 85%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 28, top: 13, width: 2, height: 2, borderRadius: 999, backgroundColor: 'color-mix(in oklab, var(--status-success) 85%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 10, top: 18, width: 14, height: 1, backgroundColor: 'color-mix(in oklab, var(--status-info) 68%, var(--surface-background))', transform: 'rotate(10deg)', transformOrigin: 'left center' }} />
        <div style={{ position: 'absolute', left: 24, top: 20, width: 16, height: 1, backgroundColor: 'color-mix(in oklab, var(--status-warning) 70%, var(--surface-background))', transform: 'rotate(-8deg)', transformOrigin: 'left center' }} />
        <div style={{ position: 'absolute', left: 40, top: 22, width: 8, height: 1, backgroundColor: 'color-mix(in oklab, var(--status-success) 68%, var(--surface-background))' }} />
      </Furn>

      <Furn left={152} top={142} w={52} h={20} bg="color-mix(in oklab, var(--status-info-background) 58%, var(--surface-elevated))" border={false} z={8} radius={4}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 52, height: 7, backgroundColor: 'color-mix(in oklab, var(--status-info) 26%, var(--surface-elevated))', borderRadius: '4px 4px 0 0' }} />
        <div style={{ position: 'absolute', left: 2, top: 7, width: 14, height: 11, backgroundColor: 'color-mix(in oklab, var(--status-info-background) 70%, var(--surface-elevated))', borderRadius: '0 0 0 4px' }} />
        <div style={{ position: 'absolute', left: 19, top: 7, width: 14, height: 11, backgroundColor: 'color-mix(in oklab, var(--status-info-background) 70%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', right: 2, top: 7, width: 14, height: 11, backgroundColor: 'color-mix(in oklab, var(--status-info-background) 70%, var(--surface-elevated))', borderRadius: '0 0 4px 0' }} />
      </Furn>

      <Furn left={146} top={120} w={10} h={7} bg="color-mix(in oklab, var(--status-warning) 44%, var(--surface-elevated))" border={false} z={9} radius={1}>
        <div style={{ position: 'absolute', left: 1, bottom: 1, width: 8, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 25%, var(--surface-elevated))' }} />
      </Furn>
      <Furn left={208} top={145} w={10} h={8} bg="color-mix(in oklab, var(--status-warning) 46%, var(--surface-elevated))" border={false} z={9} radius={1}>
        <div style={{ position: 'absolute', left: 1, top: 1, width: 8, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 28%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 2, top: 2, width: 6, height: 2, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 0, top: -6, width: 4, height: 6, borderRadius: '60% 40% 40% 60%', backgroundColor: 'color-mix(in oklab, var(--status-success) 85%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 3, top: -8, width: 4, height: 7, borderRadius: '50% 60% 50% 50%', backgroundColor: 'color-mix(in oklab, var(--status-success) 76%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', right: -1, top: -7, width: 4, height: 6, borderRadius: '40% 60% 60% 40%', backgroundColor: 'color-mix(in oklab, var(--status-success) 72%, var(--surface-background))' }} />
      </Furn>
      <Furn left={150} top={136} w={10} h={8} bg="color-mix(in oklab, var(--status-warning) 46%, var(--surface-elevated))" border={false} z={9} radius={1}>
        <div style={{ position: 'absolute', left: 1, top: 1, width: 8, height: 2, backgroundColor: 'color-mix(in oklab, var(--status-warning) 28%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 2, top: 2, width: 6, height: 2, backgroundColor: 'color-mix(in oklab, var(--surface-foreground) 16%, var(--surface-elevated))' }} />
        <div style={{ position: 'absolute', left: 0, top: -7, width: 4, height: 7, borderRadius: '60% 40% 40% 60%', backgroundColor: 'color-mix(in oklab, var(--status-success) 85%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', left: 3, top: -9, width: 4, height: 8, borderRadius: '50% 60% 50% 50%', backgroundColor: 'color-mix(in oklab, var(--status-success) 76%, var(--surface-background))' }} />
        <div style={{ position: 'absolute', right: -1, top: -8, width: 4, height: 7, borderRadius: '40% 60% 60% 40%', backgroundColor: 'color-mix(in oklab, var(--status-success) 72%, var(--surface-background))' }} />
      </Furn>

      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 24,
          width: 88,
          height: 40,
          background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 10%, transparent), transparent)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 122,
          top: 24,
          width: 94,
          height: 40,
          background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 8%, transparent), transparent)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* === AGENTS === */}
      {positioned.map(({ card, x, y }) => (
            <AgentSprite key={card.slotId} card={card} x={x} y={y} tick={tick} />
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
      {cards.slice(0, 2).map((card) => {
        const action = resolveAgentAction(card);
        const label = getActionLabel(card, action);
        return (
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
              {label}
            </span>
          </div>
        );
      })}
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
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <OfficeScene cards={state.cards} />

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
