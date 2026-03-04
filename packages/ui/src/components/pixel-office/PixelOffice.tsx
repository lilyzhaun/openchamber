import React from 'react';

import { useI18n } from '@/contexts/useI18n';
import type { RealAgentCard } from '@/hooks/usePixelOfficeState';
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
import gardenBenchUrl from '@/assets/stardew-office/garden_bench.png';
import arcSofaUrl from '@/assets/stardew-office/arc_sofa.png';
import blueOrbUrl from '@/assets/stardew-office/blue_orb.png';
import tallPlantUrl from '@/assets/stardew-office/tall_plant.png';
import receptionCounterUrl from '@/assets/stardew-office/reception_counter.png';
import fridgeUrl from '@/assets/stardew-office/fridge.png';
import wineSofaUrl from '@/assets/stardew-office/wine_sofa.png';
import retroMonitorUrl from '@/assets/stardew-office/retro_monitor.png';

const SCENE_W = 560;
const SCENE_H = 380;
const CORRIDOR_Y = 240;

const WORKER_SPRITES = [worker1Url, worker2Url, worker3Url, worker4Url] as const;
const WORKER_FRAME = 16;
const WORKER_SHEET_W = 64;
const WORKER_SHEET_H = 160;
const WORKER_SCALE = 1.5;
const FRAME_DISPLAY = WORKER_FRAME * WORKER_SCALE;

const COMPUTER_COLS = 5;
const COMPUTER_SHEET_W = 80;
const COMPUTER_SHEET_H = 160;

const COOLER_FRAMES = 7;
const COOLER_SHEET_W = 112;

const FURNITURE_FRAMES = 4;
const FURNITURE_FRAME = 32;
const FURNITURE_SHEET_W = 128;
const FURNITURE_SHEET_H = 32;

type Direction = 'up' | 'down' | 'left' | 'right';
type AgentAction = 'writing' | 'reading' | 'searching' | 'browsing' | 'running' | 'thinking' | 'composing' | 'delegating' | 'reviewing' | 'retrying' | 'arriving' | 'idle';
type Point = { x: number; y: number };
type SceneFurnitureKey =
  | 'desk_large'
  | 'chair_office'
  | 'bookshelf_tall'
  | 'sofa_modular'
  | 'whiteboard_wall'
  | 'plant_pot'
  | 'clock_wall'
  | 'chart_board'
  | 'printer'
  | 'filing_cabinet'
  | 'conference_table'
  | 'wall_frame'
  | 'wall_monitor'
  | 'coffee_machine'
  | 'rug'
  | 'small_table'
  | 'trash_can'
  | 'ceiling_lamp'
  | 'garden_bench'
  | 'arc_sofa'
  | 'blue_orb'
  | 'tall_plant'
  | 'reception_counter'
  | 'fridge'
  | 'wine_sofa'
  | 'retro_monitor'
  | 'computer'
  | 'watercooler';

type NewOfficeZone = 'main_office' | 'meeting_room' | 'corridor' | 'small_office' | 'reception' | 'garden';

interface RoomLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  wallHeight: number;
  wallColor: string;
  wallShade: string;
  floorColor: string;
  floorShade: string;
  borderColor: string;
}

interface SceneObject {
  key: SceneFurnitureKey;
  x: number;
  y: number;
  z: number;
  scale?: number;
  animated?: boolean;
  frameOffset?: number;
}

interface AgentMotion {
  card: RealAgentCard;
  position: Point;
  direction: Direction;
  isMoving: boolean;
  phase: number;
}

const ROOMS: Record<NewOfficeZone, RoomLayout> = {
  main_office: { x: 0, y: 0, w: 275, h: 220, wallHeight: 52, wallColor: '#d8ccb9', wallShade: '#c4b59f', floorColor: '#b99973', floorShade: '#8f6f4d', borderColor: '#5f4a33' },
  meeting_room: { x: 285, y: 0, w: 275, h: 220, wallHeight: 52, wallColor: '#c3d6de', wallShade: '#a8bec8', floorColor: '#8daac1', floorShade: '#67879f', borderColor: '#486176' },
  corridor: { x: 0, y: 228, w: 560, h: 24, wallHeight: 0, wallColor: '#8f8a7b', wallShade: '#7e7868', floorColor: '#7e7868', floorShade: '#615c4f', borderColor: '#4d493d' },
  small_office: { x: 0, y: 260, w: 135, h: 120, wallHeight: 40, wallColor: '#d6c8b0', wallShade: '#c0b195', floorColor: '#b49a79', floorShade: '#8b7255', borderColor: '#5f4f38' },
  reception: { x: 145, y: 260, w: 275, h: 120, wallHeight: 40, wallColor: '#d2c2a7', wallShade: '#baa88c', floorColor: '#b4875f', floorShade: '#8c6440', borderColor: '#66492b' },
  garden: { x: 430, y: 260, w: 130, h: 120, wallHeight: 40, wallColor: '#9abd86', wallShade: '#84a770', floorColor: '#6ea35b', floorShade: '#4d7e3d', borderColor: '#36562a' },
};

const DOORWAYS: Record<NewOfficeZone, Point> = {
  main_office: { x: 137, y: 220 },
  meeting_room: { x: 422, y: 220 },
  corridor: { x: 280, y: 240 },
  small_office: { x: 67, y: 260 },
  reception: { x: 282, y: 260 },
  garden: { x: 495, y: 260 },
};

const ZONE_ANCHORS: Record<NewOfficeZone, Point[]> = {
  main_office: [{ x: 42, y: 122 }, { x: 112, y: 122 }, { x: 182, y: 122 }, { x: 42, y: 192 }, { x: 112, y: 192 }, { x: 182, y: 192 }],
  meeting_room: [{ x: 380, y: 90 }, { x: 412, y: 90 }, { x: 444, y: 90 }, { x: 380, y: 152 }, { x: 412, y: 152 }, { x: 444, y: 152 }],
  corridor: [{ x: 200, y: 240 }, { x: 240, y: 240 }, { x: 280, y: 240 }, { x: 320, y: 240 }, { x: 360, y: 240 }, { x: 400, y: 240 }],
  small_office: [{ x: 36, y: 320 }, { x: 64, y: 330 }, { x: 92, y: 320 }, { x: 120, y: 334 }, { x: 56, y: 360 }, { x: 108, y: 358 }],
  reception: [{ x: 176, y: 320 }, { x: 220, y: 334 }, { x: 268, y: 322 }, { x: 316, y: 336 }, { x: 364, y: 324 }, { x: 240, y: 360 }],
  garden: [{ x: 446, y: 320 }, { x: 474, y: 334 }, { x: 502, y: 322 }, { x: 532, y: 336 }, { x: 452, y: 360 }, { x: 512, y: 360 }],
};

const FURNITURE_SPRITES: Record<Exclude<SceneFurnitureKey, 'computer' | 'watercooler'>, string> = {
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
  garden_bench: gardenBenchUrl,
  arc_sofa: arcSofaUrl,
  blue_orb: blueOrbUrl,
  tall_plant: tallPlantUrl,
  reception_counter: receptionCounterUrl,
  fridge: fridgeUrl,
  wine_sofa: wineSofaUrl,
  retro_monitor: retroMonitorUrl,
};

const ROOM_OBJECTS: Record<NewOfficeZone, SceneObject[]> = {
  main_office: [
    // 第一排工位（3个），使用desk帧1-3自带电脑
    { key: 'desk_large', x: 18, y: 72, z: 8, frameOffset: 1 },
    { key: 'chair_office', x: 18, y: 104, z: 10 },
    { key: 'desk_large', x: 88, y: 72, z: 8, frameOffset: 2 },
    { key: 'chair_office', x: 88, y: 104, z: 10, frameOffset: 1 },
    { key: 'desk_large', x: 158, y: 72, z: 8, frameOffset: 3 },
    { key: 'chair_office', x: 158, y: 104, z: 10, frameOffset: 2 },
    // 第二排工位（3个）
    { key: 'desk_large', x: 18, y: 142, z: 8, frameOffset: 2 },
    { key: 'chair_office', x: 18, y: 174, z: 10, frameOffset: 3 },
    { key: 'desk_large', x: 88, y: 142, z: 8, frameOffset: 3 },
    { key: 'chair_office', x: 88, y: 174, z: 10 },
    { key: 'desk_large', x: 158, y: 142, z: 8, frameOffset: 1 },
    { key: 'chair_office', x: 158, y: 174, z: 10, frameOffset: 1 },
    // 侧面家具
    { key: 'filing_cabinet', x: 236, y: 72, z: 8 },
    { key: 'printer', x: 236, y: 112, z: 9, animated: true },
    { key: 'retro_monitor', x: 236, y: 152, z: 8 },
    { key: 'clock_wall', x: 124, y: 14, z: 7, animated: true },
  ],
  meeting_room: [
    // 长桌（3个conference_table横向拼接，使用水平帧）
    { key: 'conference_table', x: 366, y: 110, z: 8, frameOffset: 1 },
    { key: 'conference_table', x: 398, y: 110, z: 8, frameOffset: 1 },
    { key: 'conference_table', x: 430, y: 110, z: 8, frameOffset: 1 },
    // 上侧椅子（面朝下，frameOffset=0）
    { key: 'chair_office', x: 370, y: 80, z: 9 },
    { key: 'chair_office', x: 402, y: 80, z: 9 },
    { key: 'chair_office', x: 434, y: 80, z: 9 },
    // 下侧椅子（面朝上，frameOffset=2）
    { key: 'chair_office', x: 370, y: 142, z: 9, frameOffset: 2 },
    { key: 'chair_office', x: 402, y: 142, z: 9, frameOffset: 2 },
    { key: 'chair_office', x: 434, y: 142, z: 9, frameOffset: 2 },
    // 左端椅子（面朝右，frameOffset=1）
    { key: 'chair_office', x: 338, y: 110, z: 9, frameOffset: 1 },
    // 右端椅子（面朝左，frameOffset=3）
    { key: 'chair_office', x: 462, y: 110, z: 9, frameOffset: 3 },
    // 墙面装饰
    { key: 'whiteboard_wall', x: 360, y: 18, z: 7 },
    { key: 'wall_monitor', x: 470, y: 18, z: 7, animated: true },
    { key: 'chart_board', x: 304, y: 18, z: 7, animated: true },
    // 角落装饰
    { key: 'plant_pot', x: 296, y: 186, z: 9, animated: true },
    { key: 'plant_pot', x: 530, y: 186, z: 9, frameOffset: 2, animated: true },
  ],
  corridor: [
    { key: 'plant_pot', x: 26, y: 214, z: 6, animated: true },
    { key: 'ceiling_lamp', x: 92, y: 196, z: 5, animated: true },
    { key: 'small_table', x: 160, y: 210, z: 6 },
    { key: 'watercooler', x: 228, y: 208, z: 6, animated: true, scale: 1.6 },
    { key: 'trash_can', x: 314, y: 216, z: 6 },
    { key: 'plant_pot', x: 376, y: 214, z: 6, frameOffset: 1, animated: true },
    { key: 'ceiling_lamp', x: 446, y: 196, z: 5, frameOffset: 2, animated: true },
    { key: 'wall_frame', x: 514, y: 198, z: 5 },
    { key: 'plant_pot', x: 540, y: 214, z: 6, animated: true },
  ],
  small_office: [
    { key: 'bookshelf_tall', x: 10, y: 286, z: 8 },
    { key: 'bookshelf_tall', x: 38, y: 286, z: 8, frameOffset: 2 },
    { key: 'small_table', x: 82, y: 312, z: 9 },
    { key: 'chair_office', x: 100, y: 338, z: 9 },
    { key: 'fridge', x: 8, y: 322, z: 8 },
    { key: 'coffee_machine', x: 64, y: 332, z: 9, animated: true },
    { key: 'plant_pot', x: 116, y: 334, z: 9, animated: true },
    { key: 'wall_frame', x: 82, y: 270, z: 7 },
  ],
  reception: [
    { key: 'reception_counter', x: 178, y: 284, z: 8 },
    { key: 'chair_office', x: 216, y: 336, z: 9 },
    { key: 'small_table', x: 292, y: 330, z: 9 },
    { key: 'wall_frame', x: 352, y: 272, z: 7 },
    { key: 'chart_board', x: 186, y: 270, z: 7, animated: true },
    { key: 'clock_wall', x: 320, y: 272, z: 7, animated: true },
    { key: 'plant_pot', x: 380, y: 334, z: 9, animated: true },
    { key: 'rug', x: 246, y: 330, z: 5 },
  ],
  garden: [
    { key: 'garden_bench', x: 438, y: 314, z: 8 },
    { key: 'tall_plant', x: 522, y: 264, z: 9, animated: true },
    { key: 'plant_pot', x: 440, y: 342, z: 9, animated: true },
    { key: 'plant_pot', x: 474, y: 340, z: 9, frameOffset: 1, animated: true },
    { key: 'small_table', x: 510, y: 336, z: 9 },
    { key: 'wine_sofa', x: 470, y: 282, z: 8 },
    { key: 'arc_sofa', x: 430, y: 272, z: 8 },
    { key: 'blue_orb', x: 532, y: 322, z: 9, animated: true },
  ],
};

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

const spriteIndexFromName = (name: string, isLead: boolean): number => {
  if (isLead) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 131 + name.charCodeAt(i)) | 0;
  return 1 + (Math.abs(hash) % (WORKER_SPRITES.length - 1));
};

const normalizeZone = (zone: RealAgentCard['zone']): NewOfficeZone => {
  switch (zone) {
    case 'main_office':
    case 'meeting_room':
    case 'corridor':
    case 'small_office':
    case 'reception':
    case 'garden':
      return zone;
    default:
      return 'garden';
  }
};

const roundPoint = (p: Point): Point => ({ x: Math.round(p.x), y: Math.round(p.y) });

const actionToSpriteRow = (action: AgentAction, direction: Direction, isMoving: boolean): { row: number; speed: number } => {
  const rowFromDirection = (dir: Direction): number => {
    if (dir === 'down') return 0;
    if (dir === 'left') return 1;
    if (dir === 'right') return 2;
    return 3;
  };
  if (isMoving) {
    return { row: rowFromDirection(direction), speed: 1.1 };
  }
  switch (action) {
    case 'writing': return { row: 3, speed: 0.35 };
    case 'reading': return { row: 3, speed: 0.3 };
    case 'searching': return { row: 3, speed: 0.45 };
    case 'reviewing': return { row: 3, speed: 0.28 };
    case 'running': return { row: rowFromDirection(direction), speed: 1.6 };
    case 'retrying': return { row: rowFromDirection(direction), speed: 1.8 };
    case 'thinking': return { row: 0, speed: 0.2 };
    case 'composing': return { row: 0, speed: 0.25 };
    case 'delegating': return { row: 0, speed: 0.35 };
    case 'browsing': return { row: 2, speed: 0.35 };
    case 'arriving': return { row: rowFromDirection(direction), speed: 0.5 };
    case 'idle':
    default:
      return { row: rowFromDirection(direction), speed: 0.18 };
  }
};

const FLOOR_TILE_SIZE = 16;
const DOOR_WIDTH = 26;
const DOOR_DEPTH = 8;

const isUpperRoom = (room: RoomLayout): boolean => room.y < CORRIDOR_Y;

const renderDoorway = (zone: Exclude<NewOfficeZone, 'corridor'>) => {
  const room = ROOMS[zone];
  const doorway = DOORWAYS[zone];
  const top = isUpperRoom(room) ? room.y + room.h - DOOR_DEPTH : room.y - 2;
  return (
    <React.Fragment key={`door-${zone}`}>
      <div
        style={{
          position: 'absolute',
          left: Math.round(doorway.x - DOOR_WIDTH / 2),
          top: Math.round(top),
          width: DOOR_WIDTH,
          height: DOOR_DEPTH,
          backgroundColor: '#4a3a2a',
          border: '1px solid #2d2218',
          boxSizing: 'border-box',
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: Math.round(doorway.x - DOOR_WIDTH / 2 + 2),
          top: Math.round(top + 2),
          width: DOOR_WIDTH - 4,
          height: DOOR_DEPTH - 4,
          backgroundColor: '#8a6848',
          zIndex: 5,
        }}
      />
    </React.Fragment>
  );
};

const getActionLabel = (card: RealAgentCard, action: AgentAction): string => {
  const st = card.activity.statusText?.trim();
  if (st && st.length > 0) return st.length > 14 ? `${st.slice(0, 12)}…` : st;
  switch (action) {
    case 'writing': return '写入文件';
    case 'reading': return '读取文件';
    case 'searching': return '搜索代码';
    case 'browsing': return '查阅资料';
    case 'running': return '运行命令';
    case 'thinking': return '思考中';
    case 'composing': return '编写回复';
    case 'delegating': return '分派任务';
    case 'reviewing': return '等待确认';
    case 'retrying': return '重试中';
    case 'arriving': return '准备中';
    case 'idle':
    default:
      return '休息中';
  }
};

const resolveAgentAction = (card: RealAgentCard): AgentAction => {
  const toolName = card.activity.toolName?.toLowerCase() ?? null;
  if (toolName && TOOL_ACTION_MAP[toolName]) return TOOL_ACTION_MAP[toolName];
  const status = `${card.activity.activity} ${card.activity.statusText ?? ''}`.toLowerCase();
  if (status.includes('retry')) return 'retrying';
  if (status.includes('permission') || status.includes('waiting')) return 'reviewing';
  if (status.includes('thinking') || status.includes('reasoning') || card.activity.activity === 'cooldown') return 'thinking';
  if (status.includes('streaming') || card.activity.activity === 'streaming') return 'composing';
  if (status.includes('writing') || status.includes('editing')) return 'writing';
  if (status.includes('reading')) return 'reading';
  if (status.includes('search') || status.includes('listing') || status.includes('finding')) return 'searching';
  if (status.includes('fetching') || status.includes('web')) return 'browsing';
  if (status.includes('running') || status.includes('command') || card.activity.activity === 'tooling') return 'running';
  if (status.includes('delegat') || status.includes('todo') || status.includes('planning')) return 'delegating';
  if (card.activity.activity === 'busy') return 'composing';
  return 'idle';
};

const getDirection = (from: Point, to: Point, fallback: Direction): Direction => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) return dx > 0 ? 'right' : 'left';
  if (Math.abs(dy) > 0) return dy > 0 ? 'down' : 'up';
  return fallback;
};

const buildRoute = (from: Point, fromZone: NewOfficeZone, to: Point, toZone: NewOfficeZone): Point[] => {
  if (fromZone === toZone) return [roundPoint(to)];
  const points: Point[] = [];
  
  if (fromZone !== 'corridor') {
    points.push(roundPoint(DOORWAYS[fromZone]));
    points.push(roundPoint({ x: DOORWAYS[fromZone].x, y: CORRIDOR_Y }));
  }
  
  if (toZone !== 'corridor') {
    points.push(roundPoint({ x: DOORWAYS[toZone].x, y: CORRIDOR_Y }));
    points.push(roundPoint(DOORWAYS[toZone]));
  } else {
    points.push(roundPoint({ x: to.x, y: CORRIDOR_Y }));
  }
  
  points.push(roundPoint(to));
  return points.filter((p, idx) => idx === 0 || p.x !== points[idx - 1].x || p.y !== points[idx - 1].y);
};

const useAnimationTick = (intervalMs = 240): number => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return tick;
};

const useMovementSystem = (cards: RealAgentCard[]): AgentMotion[] => {
  const [positions, setPositions] = React.useState<Record<string, Point>>({});
  const [directions, setDirections] = React.useState<Record<string, Direction>>({});
  const routesRef = React.useRef<Record<string, Point[]>>({});
  const zonesRef = React.useRef<Record<string, NewOfficeZone>>({});
  const phaseRef = React.useRef<Record<string, number>>({});
  const lastTsRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const usage: Record<NewOfficeZone, number> = { main_office: 0, meeting_room: 0, corridor: 0, small_office: 0, reception: 0, garden: 0 };
    setPositions((prev) => {
      const next = { ...prev };
      for (const card of cards) {
        const zone = normalizeZone(card.zone);
        const index = usage[zone];
        usage[zone] += 1;
        const target = roundPoint(ZONE_ANCHORS[zone][index % ZONE_ANCHORS[zone].length]);
        const current = next[card.sessionId] ?? target;
        const currentZone = zonesRef.current[card.sessionId] ?? zone;
        routesRef.current[card.sessionId] = buildRoute(current, currentZone, target, zone);
        zonesRef.current[card.sessionId] = zone;
        next[card.sessionId] = roundPoint(current);
        phaseRef.current[card.sessionId] = phaseRef.current[card.sessionId] ?? 0;
      }
      return next;
    });
  }, [cards]);

  React.useEffect(() => {
    let rafId = 0;
    const speed = 96;
    const loop = (ts: number) => {
      const prevTs = lastTsRef.current ?? ts;
      const delta = Math.min((ts - prevTs) / 1000, 0.05);
      lastTsRef.current = ts;

      setPositions((prev) => {
        const next = { ...prev };
        const nextDir: Record<string, Direction> = { ...directions };
        let changed = false;
        for (const card of cards) {
          const id = card.sessionId;
          const route = routesRef.current[id] ?? [];
          if (route.length === 0) continue;
          const current = next[id] ?? route[0];
          const target = route[0];
          const dx = target.x - current.x;
          const dy = target.y - current.y;
          const dist = Math.hypot(dx, dy);
          const step = speed * delta;
          const dir = getDirection(current, target, nextDir[id] ?? 'down');
          nextDir[id] = dir;
          if (dist <= step || dist === 0) {
            next[id] = roundPoint(target);
            route.shift();
          } else {
            next[id] = roundPoint({ x: current.x + (dx / dist) * step, y: current.y + (dy / dist) * step });
          }
          phaseRef.current[id] = (phaseRef.current[id] ?? 0) + 1;
          changed = true;
        }
        setDirections(nextDir);
        return changed ? next : prev;
      });

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastTsRef.current = null;
    };
  }, [cards, directions]);

  return React.useMemo(() => {
    const usage: Record<NewOfficeZone, number> = { main_office: 0, meeting_room: 0, corridor: 0, small_office: 0, reception: 0, garden: 0 };
    return cards.map((card) => {
      const zone = normalizeZone(card.zone);
      const idx = usage[zone];
      usage[zone] += 1;
      const fallback = roundPoint(ZONE_ANCHORS[zone][idx % ZONE_ANCHORS[zone].length]);
      const position = positions[card.sessionId] ?? fallback;
      const direction = directions[card.sessionId] ?? 'down';
      const isMoving = (routesRef.current[card.sessionId] ?? []).length > 0;
      return { card, position, direction, isMoving, phase: phaseRef.current[card.sessionId] ?? 0 };
    });
  }, [cards, positions, directions]);
};

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

const SpriteDiv: React.FC<SpriteDivProps> = ({ src, sheetW, sheetH, col, row, frameSize = 16, scale = WORKER_SCALE, style }) => {
  const displaySize = frameSize * scale;
  return (
    <div
      aria-hidden
      style={{
        width: Math.round(displaySize),
        height: Math.round(displaySize),
        backgroundImage: `url(${src})`,
        backgroundSize: `${Math.round(sheetW * scale)}px ${Math.round(sheetH * scale)}px`,
        backgroundPosition: `-${Math.round(col * displaySize)}px -${Math.round(row * displaySize)}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
};

const getSceneObjectFrame = (item: SceneObject, tick: number) => {
  if (item.key === 'computer') {
    const base = item.frameOffset ?? 0;
    const col = item.animated ? (tick + base) % COMPUTER_COLS : base;
    const row = item.animated ? Math.floor((tick + base) / COMPUTER_COLS) % 3 : 0;
    return { col, row };
  }
  if (item.key === 'watercooler') {
    return { col: item.animated ? tick % COOLER_FRAMES : 0, row: 0 };
  }
  const base = item.frameOffset ?? 0;
  return { col: item.animated ? (tick + base) % FURNITURE_FRAMES : base % FURNITURE_FRAMES, row: 0 };
};

const SceneFurnitureSprite: React.FC<{ object: SceneObject; tick: number }> = ({ object, tick }) => {
  const frame = getSceneObjectFrame(object, tick);
  const scale = object.scale ?? 1;
  const left = Math.round(object.x);
  const top = Math.round(object.y);
  if (object.key === 'computer') {
    return <div style={{ position: 'absolute', left, top, zIndex: object.z }}><SpriteDiv src={computerUrl} sheetW={COMPUTER_SHEET_W} sheetH={COMPUTER_SHEET_H} col={frame.col} row={frame.row} frameSize={16} scale={scale} /></div>;
  }
  if (object.key === 'watercooler') {
    return <div style={{ position: 'absolute', left, top, zIndex: object.z }}><SpriteDiv src={watercoolerUrl} sheetW={COOLER_SHEET_W} sheetH={16} col={frame.col} row={0} frameSize={16} scale={scale} /></div>;
  }
  if (object.key === 'blue_orb') {
    // Add a pulsing glow effect to the blue orb
    const glowScale = 1 + Math.sin(tick * 0.1) * 0.1;
    return (
      <div style={{ position: 'absolute', left, top, zIndex: object.z, filter: `drop-shadow(0 0 8px rgba(100, 200, 255, ${0.5 + Math.sin(tick * 0.1) * 0.3}))` }}>
        <SpriteDiv src={FURNITURE_SPRITES[object.key]} sheetW={FURNITURE_SHEET_W} sheetH={FURNITURE_SHEET_H} col={frame.col} row={0} frameSize={FURNITURE_FRAME} scale={scale * glowScale} />
      </div>
    );
  }
  return <div style={{ position: 'absolute', left, top, zIndex: object.z }}><SpriteDiv src={FURNITURE_SPRITES[object.key]} sheetW={FURNITURE_SHEET_W} sheetH={FURNITURE_SHEET_H} col={frame.col} row={0} frameSize={FURNITURE_FRAME} scale={scale} /></div>;
};

const AgentSprite: React.FC<{ motion: AgentMotion; tick: number }> = ({ motion }) => {
  const action = resolveAgentAction(motion.card);
  const { row } = actionToSpriteRow(action, motion.direction, motion.isMoving);
  const col = 0;
  const spriteUrl = WORKER_SPRITES[spriteIndexFromName(motion.card.agentName, motion.card.isLead)];
  const label = getActionLabel(motion.card, action);

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.round(motion.position.x),
        top: Math.round(motion.position.y),
        transform: 'translate(-50%, -100%)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: Math.round(FRAME_DISPLAY / 2 - 6),
          top: Math.round(FRAME_DISPLAY - 2),
          width: 12,
          height: 4,
          borderRadius: '50%',
          backgroundColor: '#00000044',
        }}
      />
      <SpriteDiv src={spriteUrl} sheetW={WORKER_SHEET_W} sheetH={WORKER_SHEET_H} col={col} row={row} frameSize={16} scale={WORKER_SCALE} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -14,
          transform: 'translateX(-50%)',
          fontSize: 7,
          lineHeight: 1,
          padding: '1px 4px',
          border: '1px solid #4a3f31',
          backgroundColor: '#f2e2bf',
          color: '#2f2518',
          borderRadius: 3,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const OfficeScene: React.FC<{ cards: RealAgentCard[] }> = ({ cards }) => {
  const motions = useMovementSystem(cards);
  const tick = useAnimationTick(220);

  return (
    <div style={{ position: 'relative', width: SCENE_W, height: SCENE_H, border: '2px solid #4a3f31', overflow: 'hidden', imageRendering: 'pixelated', backgroundColor: '#7b6a56' }}>
      {(['main_office', 'meeting_room', 'small_office', 'reception', 'garden'] as const).map((zone) => {
        const room = ROOMS[zone];
        const floorTop = room.y + room.wallHeight;
        const floorHeight = room.h - room.wallHeight;
        return (
          <React.Fragment key={zone}>
            <div
              style={{
                position: 'absolute',
                left: Math.round(room.x),
                top: Math.round(room.y),
                width: Math.round(room.w),
                height: Math.round(room.wallHeight),
                backgroundColor: room.wallColor,
                backgroundImage: `linear-gradient(180deg, ${room.wallShade} 0 1px, transparent 1px 100%)`,
                backgroundSize: `100% 8px`,
                border: `2px solid ${room.borderColor}`,
                boxSizing: 'border-box',
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: Math.round(room.x),
                top: Math.round(floorTop),
                width: Math.round(room.w),
                height: Math.round(floorHeight),
                backgroundColor: room.floorColor,
                backgroundImage: `linear-gradient(0deg, ${room.floorShade} 1px, transparent 1px), linear-gradient(90deg, ${room.floorShade} 1px, transparent 1px)`,
                backgroundSize: `${FLOOR_TILE_SIZE}px ${FLOOR_TILE_SIZE}px`,
                borderLeft: `2px solid ${room.borderColor}`,
                borderRight: `2px solid ${room.borderColor}`,
                borderBottom: `2px solid ${room.borderColor}`,
                boxSizing: 'border-box',
                zIndex: 1,
              }}
            />
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: Math.round(ROOMS.corridor.x),
          top: Math.round(ROOMS.corridor.y),
          width: Math.round(ROOMS.corridor.w),
          height: Math.round(ROOMS.corridor.h),
          backgroundColor: ROOMS.corridor.floorColor,
          backgroundImage: `linear-gradient(0deg, ${ROOMS.corridor.floorShade} 1px, transparent 1px), linear-gradient(90deg, ${ROOMS.corridor.floorShade} 1px, transparent 1px)`,
          backgroundSize: `${FLOOR_TILE_SIZE}px ${FLOOR_TILE_SIZE}px`,
          borderTop: `2px solid ${ROOMS.corridor.borderColor}`,
          borderBottom: `2px solid ${ROOMS.corridor.borderColor}`,
          zIndex: 2,
        }}
      />

      {(['main_office', 'meeting_room', 'small_office', 'reception', 'garden'] as const).map((zone) => renderDoorway(zone))}

      {(Object.keys(ROOM_OBJECTS) as NewOfficeZone[]).flatMap((zone) => ROOM_OBJECTS[zone]).map((obj, idx) => (
        <SceneFurnitureSprite key={`${obj.key}-${idx}`} object={obj} tick={tick} />
      ))}

      {motions.map((motion) => <AgentSprite key={motion.card.sessionId} motion={motion} tick={tick} />)}
    </div>
  );
};

const PixelOfficeRoot: React.FC = () => {
  const { t } = useI18n();
  const state = usePixelOfficeState();
  return (
    <div style={{ width: '100%' }}>
      <OfficeScene cards={state.cards} />
      {state.speechBubble && (
        <div style={{ marginTop: 6, border: '1px solid #6a583f', borderRadius: 4, backgroundColor: '#f2e2bf', color: '#2f2518', padding: '4px 8px', fontSize: 9, lineHeight: 1.2 }}>{state.speechBubble}</div>
      )}
      <div style={{ marginTop: 6, fontSize: 8, color: '#6a5438' }}>
        {t('pixelOffice.zoneLabel')}: {t(`pixelOffice.zone.${state.leadZone}`)}
      </div>
    </div>
  );
};

export const PixelOfficePanel: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [height, setHeight] = React.useState(SCENE_H);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const update = (w: number) => {
      const next = w > 0 ? Math.min(1, w / SCENE_W) : 1;
      setScale(next);
      setHeight(Math.round(SCENE_H * next));
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.contentRect.width);
    });
    observer.observe(wrapper);
    update(wrapper.clientWidth);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: SCENE_W, height: SCENE_H, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}>
          <PixelOfficeRoot />
        </div>
      </div>
    </div>
  );
};

export const PixelOffice = PixelOfficePanel;
