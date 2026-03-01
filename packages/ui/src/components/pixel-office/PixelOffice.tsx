import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import { usePixelOfficeState } from '@/stores/pixelOffice';

import worker1Url from '@/assets/stardew-office/worker_1.png';
import worker2Url from '@/assets/stardew-office/worker_2.png';
import worker3Url from '@/assets/stardew-office/worker_3.png';
import worker4Url from '@/assets/stardew-office/worker_4.png';
import computerUrl from '@/assets/stardew-office/computer.png';
import watercoolerUrl from '@/assets/stardew-office/watercooler.png';

// 定义方块类型
type BlockType = 'grass' | 'dirt' | 'wood' | 'leaf' | 'bookshelf' | 'workbench' | 'empty';

// 方块数据结构
interface Block {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

// 卡片数据结构
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Card {
  id: string;
  x: number;
  y: number;
  z: number;
  badge?: string;
  label?: string;
  animationFrame?: number;
  bounceOffset?: number;
}

// 常量定义
const TILE_W = 16;
const TILE_H = 8;
const TILE_Z = 16;
const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT = 200;
const ORIGIN_X = 140;
const ORIGIN_Y = 28;

// 静态地图数据 - 岛屿状布局
const MAP_BLOCKS: Block[] = [
  // 草地基础层
  ...Array.from({ length: 8 }, (_, i) => 
    Array.from({ length: 8 }, (_, j) => {
      const type: BlockType = i >= 2 && i <= 5 && j >= 2 && j <= 5 ? 'grass' : 'dirt';
      return {
        x: i,
        y: j,
        z: 0,
        type
      };
    })
  ).flat(),
  
  // 中央区域的树木
  { x: 3, y: 3, z: 1, type: 'wood' },
  { x: 3, y: 3, z: 2, type: 'leaf' },
  { x: 3, y: 3, z: 3, type: 'leaf' },
  { x: 2, y: 3, z: 2, type: 'leaf' },
  { x: 4, y: 3, z: 2, type: 'leaf' },
  { x: 3, y: 2, z: 2, type: 'leaf' },
  { x: 3, y: 4, z: 2, type: 'leaf' },
  
  // 书架
  { x: 1, y: 1, z: 0, type: 'bookshelf' },
  { x: 1, y: 6, z: 0, type: 'bookshelf' },
  { x: 6, y: 1, z: 0, type: 'bookshelf' },
  { x: 6, y: 6, z: 0, type: 'bookshelf' },
  
  // 工作台
  { x: 6, y: 3, z: 0, type: 'workbench' },
  { x: 1, y: 4, z: 0, type: 'workbench' },
];

// roundRect polyfill
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const PixelOffice: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [textures, setTextures] = useState<{[key: string]: {top: HTMLCanvasElement, left: HTMLCanvasElement, right: HTMLCanvasElement}}>({});
  const theme = useThemeSystem();
  const { cards } = usePixelOfficeState();
  const [cardPositions, setCardPositions] = useState<{[id: string]: {x: number, y: number}}>({});
  // Images for sprites
  const [sprites, setSprites] = useState<{[key: string]: HTMLImageElement}>({});

  useEffect(() => {
    const loadSprite = (src: string) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };
    
    Promise.all([
      loadSprite(worker1Url).then(img => ['worker1', img] as [string, HTMLImageElement]),
      loadSprite(worker2Url).then(img => ['worker2', img] as [string, HTMLImageElement]),
      loadSprite(worker3Url).then(img => ['worker3', img] as [string, HTMLImageElement]),
      loadSprite(worker4Url).then(img => ['worker4', img] as [string, HTMLImageElement]),
      loadSprite(computerUrl).then(img => ['computer', img] as [string, HTMLImageElement]),
      loadSprite(watercoolerUrl).then(img => ['watercooler', img] as [string, HTMLImageElement])
    ]).then(results => {
      setSprites(Object.fromEntries(results));
    });
  }, []);

  // 根据主题颜色生成贴图
  useEffect(() => {
    if (!theme) return;

    const generateTextures = (color: string) => {
      const createSide = (baseColor: string, isTop: boolean = false) => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = baseColor;
          ctx.fillRect(0, 0, 16, 16);
          
          // Add texture noise/border
          ctx.strokeStyle = theme.currentTheme.colors.interactive.border;
          ctx.lineWidth = 1;
          // ctx.strokeRect(0, 0, 16, 16);
          
          if (isTop) {
             ctx.fillStyle = theme.currentTheme.colors.surface.muted;
             ctx.fillRect(2, 2, 2, 2);
             ctx.fillRect(12, 12, 2, 2);
             ctx.fillRect(8, 4, 2, 2);
          }
        }
        return canvas;
      };

      return {
        top: createSide(color, true),
        left: createSide(color),
        right: createSide(color)
      };
    };

    const newTextures: {[key: string]: {top: HTMLCanvasElement, left: HTMLCanvasElement, right: HTMLCanvasElement}} = {};
    
    // 为不同类型的方块生成不同的颜色贴图
    newTextures.grass = generateTextures(theme.currentTheme.colors.status.success);
    newTextures.dirt = generateTextures(theme.currentTheme.colors.status.warning);
    newTextures.wood = generateTextures(theme.currentTheme.colors.primary.base);
    newTextures.leaf = generateTextures(theme.currentTheme.colors.surface.subtle);
    newTextures.bookshelf = generateTextures(theme.currentTheme.colors.surface.muted);
    newTextures.workbench = generateTextures(theme.currentTheme.colors.status.error);
    
    setTextures(newTextures);
  }, [theme]);

  // 将3D坐标转换为2D等轴测坐标
  // 将3D坐标转换为2D等轴测坐标
  const isoProject = useCallback((x: number, y: number, z: number) => {
    const cx = ORIGIN_X + (x - y) * TILE_W;
    const cy = ORIGIN_Y + (x + y) * TILE_H - z * TILE_Z;
    return { x: cx, y: cy };
  }, []);

  // 绘制立方体的三个可见面
  const drawCube = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, z: number, texture: {top: HTMLCanvasElement, left: HTMLCanvasElement, right: HTMLCanvasElement}) => {
    const cx = ORIGIN_X + (x - y) * TILE_W;
    const cy = ORIGIN_Y + (x + y) * TILE_H - z * TILE_Z;

    // 画顶面
    ctx.save();
    ctx.setTransform(1, 0.5, -1, 0.5, cx, cy);
    ctx.drawImage(texture.top, 0, 0);
    ctx.restore();

    // 画左面
    ctx.save();
    ctx.setTransform(1, 0.5, 0, 1, cx - 16, cy + 8);
    ctx.drawImage(texture.left, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; // 阴影
    ctx.fillRect(0, 0, 16, 16);
    ctx.restore();

    // 画右面
    ctx.save();
    ctx.setTransform(1, -0.5, 0, 1, cx, cy + 16);
    ctx.drawImage(texture.right, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; // 阴影
    ctx.fillRect(0, 0, 16, 16);
    ctx.restore();
  }, []);
  // 渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(textures).length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 按深度排序方块 (x + y + z)，从远到近绘制
    const sortedBlocks = [...MAP_BLOCKS].sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
    
    // 绘制方块
    for (const block of sortedBlocks) {
      const texture = textures[block.type];
      if (texture) {
        drawCube(ctx, block.x, block.y, block.z, texture);
      }
    }
    // 计算卡片位置并更新状态
    const newCardPositions: {[id: string]: {x: number, y: number}} = {};
    
    // 绘制卡片
    cards.forEach(card => {
      const cardProjected = isoProject(card.x, card.y, card.z + 1);
      const screenX = cardProjected.x;
      const screenY = cardProjected.y - (card.bounceOffset || 0);
      
      // 存储卡片的实际屏幕位置
      newCardPositions[card.id] = { x: screenX, y: screenY };
      
      const spriteKey = card.id.includes('worker') ? card.id.replace(/[^a-zA-Z0-9]/g, '') : 
        (card.label?.toLowerCase().includes('computer') ? 'computer' : 
        (card.label?.toLowerCase().includes('watercooler') ? 'watercooler' : 'worker1'));

      const sprite = sprites[spriteKey] || sprites['worker1'];
      
      if (sprite) {
        // 根据动画帧实现简单的跳动/呼吸效果
        const bounce = Math.sin((card.animationFrame || 0) * 0.1) * 2;
        const yOffset = -24 + bounce;
        
        ctx.drawImage(
          sprite,
          screenX - sprite.width / 2,
          screenY + yOffset - sprite.height
        );
      } else {
        // Fallback: draw placeholder
        ctx.save();
        ctx.fillStyle = theme?.currentTheme.colors.surface.elevated || '#ffffff';
        ctx.strokeStyle = theme?.currentTheme.colors.interactive.border || '#cccccc';
        ctx.lineWidth = 1;
        roundRect(ctx, screenX - 20, screenY - 28, 40, 24, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });
    
    setCardPositions(newCardPositions);
    
    // 请求下一帧
    animationRef.current = requestAnimationFrame(render);
  }, [textures, cards, theme, drawCube, isoProject, sprites]);

  // 启动渲染循环
  useEffect(() => {
    if (Object.keys(textures).length > 0) {
      animationRef.current = requestAnimationFrame(render);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [textures, render]);

  // 更新卡片动画
  useEffect(() => {
    let interval: number;
    
    const updateAnimations = () => {
      usePixelOfficeState.setState(prev => ({
        cards: prev.cards.map(card => ({
          ...card,
          animationFrame: (card.animationFrame || 0) + 1,
          bounceOffset: Math.sin(Date.now() / 200 + card.id.length) * 2
        }))
      }));
      
      interval = requestAnimationFrame(updateAnimations);
    };
    
    interval = requestAnimationFrame(updateAnimations);
    
    return () => {
      if (interval) {
        cancelAnimationFrame(interval);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col items-center justify-center"
      style={{ maxWidth: '280px' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg border shadow-sm"
        style={{ 
          width: '100%',
          maxWidth: CANVAS_WIDTH,
          height: 'auto',
          imageRendering: 'pixelated',
          backgroundColor: theme?.currentTheme.colors.surface.background || '#f0f0f0',
          borderColor: theme?.currentTheme.colors.interactive.border || '#ddd'
        }}
      />
      {/* 绝对定位的卡片信息层 */}
      <div className="absolute inset-0 pointer-events-none">
        {cards.map(card => {
          const position = cardPositions[card.id];
          if (!position) return null;
          
          return (
            <div 
              key={card.id}
              className="absolute pointer-events-auto bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs shadow-sm border"
              style={{
                left: `${position.x - 20}px`,
                top: `${position.y - 40}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              {card.label && <div className="font-medium">{card.label}</div>}
              {card.badge && <div className="text-[10px] text-muted-foreground">{card.badge}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 创建面板包装组件
export const PixelOfficePanel: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto p-2">
      <PixelOffice />
    </div>
  );
};

export default PixelOffice;