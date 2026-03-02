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
import deskLargeUrl from '@/assets/stardew-office/desk_large.png';
import chairOfficeUrl from '@/assets/stardew-office/chair_office.png';
import bookshelfTallUrl from '@/assets/stardew-office/bookshelf_tall.png';
import sofaModularUrl from '@/assets/stardew-office/sofa_modular.png';
import whiteboardWallUrl from '@/assets/stardew-office/whiteboard_wall.png';
import plantPotUrl from '@/assets/stardew-office/plant_pot.png';
import clockWallUrl from '@/assets/stardew-office/clock_wall.png';
import chartBoardUrl from '@/assets/stardew-office/chart_board.png';
import printerUrl from '@/assets/stardew-office/printer.png';
import filingCabinetUrl from '@/assets/stardew-office/filing_cabinet.png';
import conferenceTableUrl from '@/assets/stardew-office/conference_table.png';
import wallFrameUrl from '@/assets/stardew-office/wall_frame.png';
import wallMonitorUrl from '@/assets/stardew-office/wall_monitor.png';
import coffeeMachineUrl from '@/assets/stardew-office/coffee_machine.png';
import rugUrl from '@/assets/stardew-office/rug.png';
import smallTableUrl from '@/assets/stardew-office/small_table.png';
import trashCanUrl from '@/assets/stardew-office/trash_can.png';
import ceilingLampUrl from '@/assets/stardew-office/ceiling_lamp.png';

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
const SCALE = 1.5;
const FRAME_DISPLAY = WORKER_FRAME * SCALE; // ~26

/** Scene dimensions (in display pixels) */
const SCENE_W = 400;
const SCENE_H = 280;

/** Tile size for the floor grid (display) */
const TILE = 20;

const FURNITURE_FRAMES = 4;
const FURNITURE_FRAME = 32;
const FURNITURE_SHEET_W = 128;
const FURNITURE_SHEET_H = 32;

type FurnitureKey =
  | 'desk_large' | 'chair_office' | 'bookshelf_tall' | 'sofa_modular'
  | 'whiteboard_wall' | 'plant_pot' | 'clock_wall' | 'chart_board'
  | 'printer' | 'filing_cabinet' | 'conference_table' | 'wall_frame'
  | 'wall_monitor' | 'coffee_machine' | 'rug' | 'small_table'
  | 'trash_can' | 'ceiling_lamp';

type SceneFurnitureKey = FurnitureKey | 'computer' | 'watercooler';

const FURNITURE_SPRITES: Record<FurnitureKey, string> = {
  desk_large: deskLargeUrl,
  chair_office: chairOfficeUrl,
  bookshelf_tall: bookshelfTallUrl,
  sofa_modular: sofaModularUrl,
  whiteboard_wall: whiteboardWallUrl,
  plant_pot: plantPotUrl,
  clock_wall: clockWallUrl,
  chart_board: chartBoardUrl,
  printer: printerUrl,
  filing_cabinet: filingCabinetUrl,
  conference_table: conferenceTableUrl,
  wall_frame: wallFrameUrl,
  wall_monitor: wallMonitorUrl,
  coffee_machine: coffeeMachineUrl,
  rug: rugUrl,
  small_table: smallTableUrl,
  trash_can: trashCanUrl,
  ceiling_lamp: ceilingLampUrl,
};

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
  desk: { anchors: [
    { x: 50, y: 90 }, { x: 130, y: 90 }, { x: 50, y: 120 },
    { x: 130, y: 120 }, { x: 80, y: 105 }, { x: 160, y: 105 },
  ]},
  bookshelf: { anchors: [
    { x: 60, y: 230 }, { x: 100, y: 240 }, { x: 140, y: 230 },
  ]},
  commons: { anchors: [
    { x: 260, y: 90 }, { x: 310, y: 100 }, { x: 350, y: 90 },
    { x: 280, y: 230 }, { x: 340, y: 240 },
  ]},
};

type RoomId = 'workspace' | 'conference' | 'library' | 'breakroom';

interface RoomLayout {
  id: RoomId;
  zone: OfficeZone;
  x: number; y: number;
  w: number; h: number;
  wallHeight: number;
  wallColor: string;
  floorColor: string;
  baseboardColor: string;
}

const CORRIDOR = {
  thickness: 6,
  horizontalY: 137,
  verticalX: 197,
  color: 'color-mix(in oklab, var(--surface-foreground) 85%, var(--surface-background))',
  borderColor: 'color-mix(in oklab, var(--interactive-border) 90%, transparent)',
} as const;

const ROOMS: RoomLayout[] = [
  {
    id: 'workspace', zone: 'desk',
    x: 0, y: 0, w: 197, h: 137, wallHeight: 28,
    wallColor: 'color-mix(in oklab, var(--status-warning-background) 58%, var(--surface-background))',
    floorColor: 'color-mix(in oklab, var(--status-info-background) 34%, var(--surface-background))',
    baseboardColor: 'color-mix(in oklab, var(--status-warning) 36%, var(--surface-elevated))',
  },
  {
    id: 'conference', zone: 'commons',
    x: 203, y: 0, w: 197, h: 137, wallHeight: 28,
    wallColor: 'color-mix(in oklab, var(--status-success-background) 50%, var(--surface-background))',
    floorColor: 'color-mix(in oklab, var(--status-success-background) 28%, var(--surface-background))',
    baseboardColor: 'color-mix(in oklab, var(--status-success) 40%, var(--surface-elevated))',
  },
  {
    id: 'library', zone: 'bookshelf',
    x: 0, y: 143, w: 197, h: 137, wallHeight: 28,
    wallColor: 'color-mix(in oklab, var(--primary-background) 50%, var(--surface-background))',
    floorColor: 'color-mix(in oklab, var(--primary-background) 28%, var(--surface-background))',
    baseboardColor: 'color-mix(in oklab, var(--primary-base) 30%, var(--surface-elevated))',
  },
  {
    id: 'breakroom', zone: 'commons',
    x: 203, y: 143, w: 197, h: 137, wallHeight: 28,
    wallColor: 'color-mix(in oklab, var(--status-warning) 25%, var(--surface-elevated))',
    floorColor: 'color-mix(in oklab, var(--status-warning-background) 38%, var(--surface-background))',
    baseboardColor: 'color-mix(in oklab, var(--status-warning) 45%, var(--surface-elevated))',
  },
];

interface SceneObject {
  key: SceneFurnitureKey;
  x: number;
  y: number;
  z: number;
  scale?: number;
  animated?: boolean;
  frameOffset?: number;
}

const ROOM_OBJECTS: Record<RoomId, SceneObject[]> = {
  workspace: [
    { key: 'desk_large', x: 20, y: 40, z: 9, scale: 1.08 },
    { key: 'chair_office', x: 34, y: 78, z: 9 },
    { key: 'computer', x: 30, y: 38, z: 10, scale: 1.3, animated: true },
    { key: 'desk_large', x: 100, y: 40, z: 9, scale: 1.08, frameOffset: 1 },
    { key: 'chair_office', x: 114, y: 78, z: 9 },
    { key: 'computer', x: 110, y: 38, z: 10, scale: 1.3, animated: true, frameOffset: 1 },
    { key: 'filing_cabinet', x: 160, y: 52, z: 8 },
    { key: 'printer', x: 160, y: 92, z: 8, animated: true },
  ],
  conference: [
    { key: 'conference_table', x: 60, y: 60, z: 9, scale: 1.1 },
    { key: 'chair_office', x: 40, y: 80, z: 9 },
    { key: 'chair_office', x: 90, y: 80, z: 9, frameOffset: 1 },
    { key: 'chair_office', x: 140, y: 80, z: 9, frameOffset: 2 },
    { key: 'whiteboard_wall', x: 80, y: 6, z: 7 },
    { key: 'wall_monitor', x: 140, y: 6, z: 7, animated: true },
    { key: 'plant_pot', x: 165, y: 100, z: 9, animated: true },
  ],
  library: [
    { key: 'bookshelf_tall', x: 10, y: 18, z: 8, scale: 1.05 },
    { key: 'bookshelf_tall', x: 10, y: 68, z: 8, scale: 1.05, frameOffset: 2 },
    { key: 'small_table', x: 80, y: 60, z: 9 },
    { key: 'chair_office', x: 90, y: 90, z: 9 },
    { key: 'wall_frame', x: 60, y: 6, z: 7 },
    { key: 'clock_wall', x: 130, y: 6, z: 7, animated: true },
    { key: 'plant_pot', x: 160, y: 100, z: 9, animated: true, frameOffset: 1 },
  ],
  breakroom: [
    { key: 'sofa_modular', x: 30, y: 70, z: 8, scale: 1.08 },
    { key: 'coffee_machine', x: 150, y: 40, z: 9, animated: true },
    { key: 'small_table', x: 80, y: 60, z: 9, frameOffset: 1 },
    { key: 'watercooler', x: 120, y: 80, z: 9, scale: 2, animated: true },
    { key: 'rug', x: 70, y: 90, z: 5 },
    { key: 'trash_can', x: 160, y: 100, z: 8 },
    { key: 'chart_board', x: 100, y: 6, z: 7, animated: true },
  ],
};

const ZONE_ROOM_MAP: Record<OfficeZone, RoomId[]> = {
  desk: ['workspace'],
  bookshelf: ['library'],
  commons: ['conference', 'breakroom'],
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

const getSceneObjectFrame = (item: SceneObject, tick: number, deskActive: boolean, commonsActive: boolean) => {
  if (item.key === 'computer') {
    if (!deskActive) return { col: item.frameOffset ?? 0, row: 0 };
    const col = (tick + (item.frameOffset ?? 0)) % COMPUTER_COLS;
    const row = Math.floor(tick / COMPUTER_COLS) % 3;
    return { col, row };
  }
  if (item.key === 'watercooler') {
    return { col: commonsActive ? tick % COOLER_FRAMES : 0, row: 0 };
  }
  const base = item.frameOffset ?? 0;
  const col = item.animated ? (tick + base) % FURNITURE_FRAMES : base % FURNITURE_FRAMES;
  return { col, row: 0 };
};

const SceneFurnitureSprite: React.FC<{
  object: SceneObject;
  tick: number;
  deskActive: boolean;
  commonsActive: boolean;
}> = ({ object, tick, deskActive, commonsActive }) => {
  const frame = getSceneObjectFrame(object, tick, deskActive, commonsActive);
  const scale = object.scale ?? 1;

  if (object.key === 'computer') {
    return (
      <div style={{ position: 'absolute', left: object.x, top: object.y, zIndex: object.z }}>
        <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={frame.col} row={frame.row} frameSize={16} scale={scale} />
      </div>
    );
  }
  if (object.key === 'watercooler') {
    return (
      <div style={{ position: 'absolute', left: object.x, top: object.y, zIndex: object.z }}>
        <SpriteDiv src={watercoolerUrl} sheetW={COOLER_SHEET_W} sheetH={16} col={frame.col} row={0} frameSize={16} scale={scale} />
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: object.x, top: object.y, zIndex: object.z }}>
      <SpriteDiv src={FURNITURE_SPRITES[object.key as FurnitureKey]} sheetW={FURNITURE_SHEET_W} sheetH={FURNITURE_SHEET_H} col={frame.col} row={0} frameSize={FURNITURE_FRAME} scale={scale} />
    </div>
  );
};

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

  const roomHasActiveAgent = React.useCallback((roomId: RoomId) => {
    return cards.some((card) => ZONE_ROOM_MAP[card.zone].includes(roomId));
  }, [cards]);
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
          backgroundColor: 'color-mix(in oklab, var(--surface-muted) 45%, var(--surface-background))',
        }}
      />

      <div style={{ position: 'absolute', left: 0, top: CORRIDOR.horizontalY, width: SCENE_W, height: CORRIDOR.thickness, backgroundColor: CORRIDOR.color, zIndex: 0 }} />
      <div style={{ position: 'absolute', left: CORRIDOR.verticalX, top: 0, width: CORRIDOR.thickness, height: SCENE_H, backgroundColor: CORRIDOR.color, zIndex: 0 }} />

      <div style={{ position: 'absolute', left: 0, top: CORRIDOR.horizontalY, width: SCENE_W, height: 1, backgroundColor: CORRIDOR.borderColor, zIndex: 1 }} />
      <div style={{ position: 'absolute', left: 0, top: CORRIDOR.horizontalY + CORRIDOR.thickness - 1, width: SCENE_W, height: 1, backgroundColor: CORRIDOR.borderColor, zIndex: 1 }} />
      <div style={{ position: 'absolute', left: CORRIDOR.verticalX, top: 0, width: 1, height: SCENE_H, backgroundColor: CORRIDOR.borderColor, zIndex: 1 }} />
      <div style={{ position: 'absolute', left: CORRIDOR.verticalX + CORRIDOR.thickness - 1, top: 0, width: 1, height: SCENE_H, backgroundColor: CORRIDOR.borderColor, zIndex: 1 }} />

      {ROOMS.map((room) => (
        <React.Fragment key={room.id}>
          <div style={{
            position: 'absolute', left: room.x, top: room.y,
            width: room.w, height: room.wallHeight,
            backgroundColor: room.wallColor,
            backgroundImage: `linear-gradient(to right, color-mix(in oklab, var(--interactive-border) 15%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--interactive-border) 15%, transparent) 1px, transparent 1px)`,
            backgroundSize: '12px 10px',
            zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', left: room.x, top: room.y + room.wallHeight,
            width: room.w, height: 3,
            backgroundColor: room.baseboardColor,
            borderTop: '1px solid color-mix(in oklab, var(--interactive-border) 80%, transparent)',
            borderBottom: '1px solid color-mix(in oklab, var(--interactive-border) 60%, transparent)',
            zIndex: 3,
          }} />
          <div style={{
            position: 'absolute', left: room.x, top: room.y + room.wallHeight + 3,
            width: room.w, height: room.h - room.wallHeight - 3,
            backgroundColor: room.floorColor,
            backgroundImage: `linear-gradient(to right, color-mix(in oklab, var(--interactive-border) 20%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--interactive-border) 12%, transparent) 1px, transparent 1px)`,
            backgroundSize: `${TILE}px ${TILE}px`,
            zIndex: 1,
          }} />

          {ROOM_OBJECTS[room.id].map((obj, idx) => (
            <SceneFurnitureSprite
              key={`${room.id}-${obj.key}-${idx}`}
              object={{ ...obj, x: room.x + obj.x, y: room.y + obj.y }}
              tick={tick}
              deskActive={hasAgentInDesk}
              commonsActive={hasAgentInCommons && roomHasActiveAgent(room.id)}
            />
          ))}
        </React.Fragment>
      ))}

      {hasAgentInBookshelf && (
        <div style={{
          position: 'absolute',
          left: 50,
          top: 230,
          width: 18,
          height: 14,
          zIndex: 6,
          background: 'radial-gradient(circle, color-mix(in oklab, var(--status-warning) 24%, transparent), transparent 70%)',
          animation: 'pixelOfficePulse 2.4s ease-in-out infinite',
        }} />
      )}

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

        @keyframes pixelOfficePulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export const PixelOffice = PixelOfficePanel;
