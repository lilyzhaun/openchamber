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
const SCENE_W = 400;
const SCENE_H = 220;

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
/** Translate raw English status text to Chinese for speech bubbles */
const translateBubble = (raw: string): string => {
  const toolMap: Record<string, string> = {
    read: '读取文件', write: '写入文件', edit: '编辑文件', multiedit: '批量编辑',
    grep: '搜索内容', glob: '查找文件', list: '列出文件', bash: '执行命令',
    webfetch: '获取网页', websearch: '搜索网络', codesearch: '搜索代码',
    apply_patch: '应用补丁',
  };
  const lower = raw.toLowerCase();
  for (const [eng, zh] of Object.entries(toolMap)) {
    if (lower.includes(eng)) return zh;
  }
  const statusMap: [RegExp, string][] = [
    [/thinking/i, '思考中'],
    [/generating/i, '生成中'],
    [/waiting/i, '等待中'],
    [/running/i, '运行中'],
    [/complet/i, '已完成'],
    [/reading/i, '读取中'],
    [/writing/i, '写入中'],
    [/search/i, '搜索中'],
    [/analyz/i, '分析中'],
    [/process/i, '处理中'],
    [/install/i, '安装中'],
    [/build/i, '构建中'],
    [/test/i, '测试中'],
    [/debug/i, '调试中'],
    [/fix/i, '修复中'],
    [/creat/i, '创建中'],
    [/updat/i, '更新中'],
    [/delet/i, '删除中'],
    [/refactor/i, '重构中'],
    [/review/i, '审查中'],
    [/deploy/i, '部署中'],
    [/commit/i, '提交中'],
    [/push/i, '推送中'],
    [/pull/i, '拉取中'],
    [/fetch/i, '获取中'],
    [/compil/i, '编译中'],
    [/format/i, '格式化'],
    [/lint/i, '代码检查'],
  ];
  for (const [re, zh] of statusMap) {
    if (re.test(raw)) return zh;
  }
  // Truncate if still English
  if (raw.length > 20) return raw.slice(0, 18) + '…';
  return raw;
};


// ---------------------------------------------------------------------------
// Zone layout
// ---------------------------------------------------------------------------

interface ZoneLayout {
  anchors: Array<{ x: number; y: number }>;
}

const ZONES: Record<OfficeZone, ZoneLayout> = {
  desk: { anchors: [{ x: 48, y: 56 }, { x: 110, y: 56 }, { x: 48, y: 80 }, { x: 110, y: 80 }, { x: 172, y: 56 }, { x: 172, y: 80 }] },
  bookshelf: { anchors: [{ x: 40, y: 170 }, { x: 80, y: 170 }, { x: 120, y: 170 }, { x: 60, y: 190 }, { x: 100, y: 190 }, { x: 140, y: 190 }] },
  commons: { anchors: [{ x: 290, y: 60 }, { x: 330, y: 60 }, { x: 290, y: 130 }, { x: 330, y: 130 }, { x: 310, y: 170 }, { x: 350, y: 170 }] },
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

      {/* Window 1 */}
      <Furn left={20} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>
      {/* Window 2 */}
      <Furn left={80} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: -3, top: -1, width: 3, height: 18, backgroundColor: 'color-mix(in oklab, var(--status-error-background) 50%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>
      {/* Window 3 */}
      <Furn left={140} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>
      {/* Window 4 (commons) */}
      <Furn left={290} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>
      {/* Window 5 (commons) */}
      <Furn left={340} top={4} w={24} h={16} bg="color-mix(in oklab, var(--status-info-background) 80%, var(--surface-background))" z={3} radius={1}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>

      {/* === ZONE SEPARATOR: vertical divider === */}
      <div style={{ position: 'absolute', left: 210, top: 24, width: 2, height: SCENE_H - 24, backgroundColor: 'var(--interactive-border)', zIndex: 4, opacity: 0.5 }} />
      {/* Horizontal separator between desk and bookshelf zones */}
      <div style={{ position: 'absolute', left: 0, top: 110, width: 210, height: 2, backgroundColor: 'var(--interactive-border)', zIndex: 4, opacity: 0.4 }} />

      {/* === DESK ZONE (top-left, 3x2 grid of 6 workstations) === */}
      <Furn left={8} top={28} w={194} h={78} bg="color-mix(in oklab, var(--primary-base) 6%, transparent)" border={false} z={1} radius={2} />

      {/* Row 1: Desks 1-3 */}
      <Furn left={16} top={34} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={computerCol} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={30} top={52} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      <Furn left={78} top={34} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 1) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={92} top={52} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      <Furn left={140} top={34} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 2) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={154} top={52} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* Row 2: Desks 4-6 */}
      <Furn left={16} top={64} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 3) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={30} top={80} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      <Furn left={78} top={64} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={(computerCol + 4) % COMPUTER_COLS} row={computerRow} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={92} top={80} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      <Furn left={140} top={64} w={28} h={14} bg="color-mix(in oklab, var(--status-warning) 35%, var(--surface-elevated))" z={8}>
        <div style={{ position: 'absolute', left: 6, top: -10, width: 16, height: 10, overflow: 'hidden', zIndex: 9 }}>
          <SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={computerCol} row={(computerRow + 1) % 3} scale={1} style={{ position: 'absolute', left: 0, top: 0 }} />
        </div>
      </Furn>
      <Furn left={154} top={80} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* === BOOKSHELF ZONE (bottom-left) === */}
      <Furn left={8} top={114} w={194} h={100} bg="color-mix(in oklab, var(--status-info) 5%, transparent)" border={false} z={1} radius={2} />

      {/* Bookshelves along left wall */}
      <Furn left={8} top={116} w={14} h={40} bg="var(--surface-elevated)" z={8}>
        <div style={{ position: 'absolute', left: 2, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 6, top: 4, width: 2, height: 10, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 9, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-success)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 16, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 2, top: 19, width: 4, height: 8, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 7, top: 19, width: 3, height: 8, backgroundColor: 'var(--primary-base)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 29, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 3, top: 31, width: 8, height: 6, backgroundColor: 'color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))', borderRadius: 1 }} />
      </Furn>
      <Furn left={26} top={116} w={14} h={40} bg="var(--surface-elevated)" z={8}>
        <div style={{ position: 'absolute', left: 2, top: 4, width: 2, height: 10, backgroundColor: 'var(--primary-base)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 5, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-success)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 9, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 16, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
        <div style={{ position: 'absolute', left: 2, top: 19, width: 5, height: 8, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 8, top: 19, width: 4, height: 8, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 29, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>
      <Furn left={44} top={116} w={14} h={40} bg="var(--surface-elevated)" z={8}>
        <div style={{ position: 'absolute', left: 2, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 6, top: 4, width: 3, height: 10, backgroundColor: 'var(--status-info)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 10, top: 4, width: 2, height: 10, backgroundColor: 'var(--primary-base)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 1, top: 16, right: 1, height: 1, backgroundColor: 'var(--interactive-border)' }} />
      </Furn>

      {/* Reading tables */}
      <Furn left={80} top={140} w={44} h={16} bg="color-mix(in oklab, var(--status-warning) 28%, var(--surface-elevated))" z={7} radius={2}>
        <div style={{ position: 'absolute', left: 4, top: 3, width: 8, height: 5, backgroundColor: 'var(--status-info)', borderRadius: 1, transform: 'rotate(-5deg)' }} />
        <div style={{ position: 'absolute', left: 16, top: 4, width: 6, height: 4, backgroundColor: 'var(--status-success)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: 4, top: 3, width: 7, height: 5, backgroundColor: 'var(--status-warning)', borderRadius: 1 }} />
      </Furn>
      <Furn left={96} top={158} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />
      <Furn left={116} top={158} w={10} h={8} bg="color-mix(in oklab, var(--surface-foreground) 20%, var(--surface-elevated))" z={6} radius={2} />

      {/* === COMMONS ZONE (right side) === */}
      <Furn left={216} top={28} w={180} h={186} bg="color-mix(in oklab, var(--status-success) 5%, transparent)" border={false} z={1} radius={2} />

      {/* Watercooler */}
      <div style={{ position: 'absolute', left: 370, top: 28, zIndex: 9, overflow: 'hidden', width: 16 * SCALE, height: 16 * SCALE }}>
        <SpriteDiv src={watercoolerUrl} sheetW={COOLER_SHEET_W} sheetH={16} col={coolerFrame} row={0} />
      </div>

      {/* Coffee machine */}
      <Furn left={360} top={32} w={8} h={12} bg="color-mix(in oklab, var(--surface-foreground) 30%, var(--surface-elevated))" z={8} radius={1}>
        {hasAgentInCommons && (
          <>
            <div style={{ position: 'absolute', left: 2, top: -4, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.4, borderRadius: 1, animation: 'pixelOfficeFloat 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: 5, top: -6, width: 2, height: 3, backgroundColor: 'var(--surface-muted-foreground)', opacity: 0.3, borderRadius: 1, animation: 'pixelOfficeFloat 2s ease-in-out infinite 0.3s' }} />
          </>
        )}
      </Furn>

      {/* Sofa (top-right) */}
      <Furn left={240} top={34} w={50} h={16} bg="color-mix(in oklab, var(--status-success-background) 60%, var(--surface-elevated))" z={7} radius={3}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 5, backgroundColor: 'color-mix(in oklab, var(--status-success) 25%, var(--surface-elevated))', borderRadius: '3px 3px 0 0' }} />
        <div style={{ position: 'absolute', left: '33%', top: 5, width: 1, height: 9, backgroundColor: 'var(--interactive-border)', opacity: 0.4 }} />
        <div style={{ position: 'absolute', left: '66%', top: 5, width: 1, height: 9, backgroundColor: 'var(--interactive-border)', opacity: 0.4 }} />
      </Furn>

      {/* Coffee table */}
      <Furn left={250} top={58} w={30} h={12} bg="color-mix(in oklab, var(--status-warning) 30%, var(--surface-elevated))" z={7} radius={2}>
        <div style={{ position: 'absolute', left: 4, top: 3, width: 5, height: 5, backgroundColor: 'var(--surface-background)', border: '1px solid var(--interactive-border)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: 5, top: 4, width: 3, height: 3, backgroundColor: 'color-mix(in oklab, var(--status-warning) 60%, var(--surface-background))', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 4, top: 3, width: 5, height: 5, backgroundColor: 'var(--surface-background)', border: '1px solid var(--interactive-border)', borderRadius: '50%' }} />
      </Furn>

      {/* Plants */}
      <Furn left={222} top={100} w={10} h={6} bg="color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))" z={8} radius={1}>
        <div style={{ position: 'absolute', left: 1, top: -8, width: 8, height: 8, backgroundColor: 'var(--status-success)', borderRadius: '50% 50% 20% 20%' }} />
        <div style={{ position: 'absolute', left: -2, top: -6, width: 6, height: 6, backgroundColor: 'color-mix(in oklab, var(--status-success) 80%, var(--surface-background))', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: -2, top: -5, width: 5, height: 5, backgroundColor: 'color-mix(in oklab, var(--status-success) 70%, var(--surface-background))', borderRadius: '50%' }} />
      </Furn>
      <Furn left={380} top={190} w={8} h={5} bg="color-mix(in oklab, var(--status-warning) 40%, var(--surface-elevated))" z={8} radius={1}>
        <div style={{ position: 'absolute', left: 1, top: -5, width: 6, height: 5, backgroundColor: 'var(--status-success)', borderRadius: '40%' }} />
      </Furn>

      {/* Bean bag chairs */}
      <Furn left={250} top={120} w={18} h={14} bg="color-mix(in oklab, var(--status-info-background) 60%, var(--surface-elevated))" z={7} radius={6} />
      <Furn left={280} top={124} w={16} h={12} bg="color-mix(in oklab, var(--status-warning-background) 60%, var(--surface-elevated))" z={7} radius={6} />
      <Furn left={310} top={120} w={16} h={14} bg="color-mix(in oklab, var(--status-success-background) 50%, var(--surface-elevated))" z={7} radius={6} />

      {/* Side table */}
      <Furn left={270} top={114} w={8} h={8} bg="color-mix(in oklab, var(--status-warning) 25%, var(--surface-elevated))" z={8} radius={1} />

      {/* Whiteboard */}
      <Furn left={340} top={70} w={40} h={26} bg="var(--surface-background)" z={8} radius={1}>
        <div style={{ position: 'absolute', left: 3, top: 4, width: 28, height: 2, backgroundColor: 'var(--status-info)', opacity: 0.5, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 3, top: 9, width: 20, height: 2, backgroundColor: 'var(--status-success)', opacity: 0.5, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 3, top: 14, width: 32, height: 2, backgroundColor: 'var(--status-warning)', opacity: 0.4, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: 3, top: 19, width: 16, height: 2, backgroundColor: 'var(--status-error)', opacity: 0.3, borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: 3, bottom: 2, width: 2, height: 6, backgroundColor: 'var(--status-error)', borderRadius: 1 }} />
      </Furn>

      {/* === FLOOR DETAILS === */}
      <Furn left={190} top={206} w={24} h={8} bg="color-mix(in oklab, var(--status-warning) 20%, var(--surface-elevated))" border={false} z={1} radius={2} />

      {/* Window light overlays */}
      <div style={{ position: 'absolute', left: 20, top: 24, width: 120, height: 40, background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 8%, transparent), transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: 290, top: 24, width: 80, height: 30, background: 'linear-gradient(to bottom, color-mix(in oklab, var(--status-warning) 6%, transparent), transparent)', pointerEvents: 'none', zIndex: 2 }} />

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 72, overflowY: 'auto' }}>
      {cards.slice(0, 6).map((card) => (
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
    <div style={{ width: '100%' }}>
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
              💬 {translateBubble(state.speechBubble)}
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
