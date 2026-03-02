#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, '..');

const TARGET_FILES = [
  'desk_large.png',
  'chair_office.png',
  'bookshelf_tall.png',
  'sofa_modular.png',
  'whiteboard_wall.png',
  'plant_pot.png',
  'clock_wall.png',
  'chart_board.png',
  'printer.png',
  'filing_cabinet.png',
  'conference_table.png',
  'wall_frame.png',
  'wall_monitor.png',
  'coffee_machine.png',
  'rug.png',
  'small_table.png',
  'trash_can.png',
  'ceiling_lamp.png',
  'garden_bench.png',
  'arc_sofa.png',
  'blue_orb.png',
  'tall_plant.png',
  'reception_counter.png',
  'fridge.png',
  'wine_sofa.png',
  'retro_monitor.png'
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const paletteArg = args.find((arg) => arg.startsWith('--palette='));
const paletteName = paletteArg ? paletteArg.split('=')[1] : 'default';

if (args.includes('--help')) {
  console.log('Usage: node generate-furniture-sprites.mjs [--dry-run] [--palette=default]');
  process.exit(0);
}

if (paletteName !== 'default') {
  console.error(`invalid palette: ${paletteName}`);
  process.exit(1);
}

if (isDryRun) {
  console.log('Dry run. Will generate furniture sprites:');
  TARGET_FILES.forEach((name) => console.log(`- ${name}`));
  process.exit(0);
}

const pythonCode = String.raw`
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(r'''${outputDir}''')
OUT.mkdir(parents=True, exist_ok=True)

TRANSPARENT = (0, 0, 0, 0)

# Expand color palette (max 35 named colors)
C = {
    'outline': (36, 28, 18, 255),
    'wood_dark': (88, 58, 38, 255),
    'wood_mid': (128, 86, 52, 255),
    'wood_light': (176, 124, 72, 255),
    'metal_dark': (74, 84, 96, 255),
    'metal_mid': (112, 126, 142, 255),
    'metal_light': (164, 178, 196, 255),
    'screen_bg': (30, 66, 98, 255),
    'screen_hi': (78, 168, 222, 255),
    'paper': (226, 220, 198, 255),
    'fabric_dark': (66, 90, 128, 255),
    'fabric_mid': (94, 130, 170, 255),
    'fabric_light': (136, 176, 210, 255),
    'leaf_dark': (38, 102, 56, 255),
    'leaf_mid': (56, 146, 78, 255),
    'leaf_light': (110, 194, 118, 255),
    'clock_red': (190, 58, 52, 255),
    'accent_gold': (208, 168, 68, 255),
    'board_blue': (58, 116, 168, 255),
    'board_orange': (210, 132, 72, 255),
    
    # New colors for new furniture types (Total named colors: 34)
    'printer_white': (240, 240, 240, 255),
    'printer_gray': (200, 200, 205, 255),
    'printer_dark': (150, 150, 155, 255),
    'rug_primary': (180, 70, 70, 255),
    'rug_secondary': (220, 180, 110, 255),
    'rug_fringe': (230, 220, 200, 255),
    'coffee_body': (40, 40, 45, 255),
    'coffee_cup': (245, 240, 230, 255),
    'monitor_glow': (100, 200, 255, 255),
    'monitor_text': (200, 240, 255, 255),
    'lamp_body': (60, 60, 65, 255),
    'lamp_glow': (255, 230, 100, 255),
    'trash_bag': (210, 230, 240, 255),
    'shadow': (36, 28, 18, 255), # Ensure shadow uses an existing color so we don't use alpha. The prompt says NO semi-transparent alpha, only 0 or 255
    'bench_red': (139, 34, 82, 255),
    'arc_brown': (122, 80, 48, 255),
    'orb_blue': (64, 192, 255, 255),
    'fridge_gray': (160, 160, 176, 255),
    'monitor_cyan': (64, 224, 208, 255),
}

def frame_sheet(draw_fn):
    img = Image.new('RGBA', (128, 32), TRANSPARENT)
    for i in range(4):
        frame = Image.new('RGBA', (32, 32), TRANSPARENT)
        d = ImageDraw.Draw(frame)
        draw_fn(d, i)
        img.paste(frame, (i * 32, 0))
    return img

def draw_outline(d, x0, y0, x1, y1):
    d.rectangle([x0, y0, x1, y1], outline=C['outline'])

def desk(d, i):
    wobble = i % 2
    
    # Base/Structure (Midtone)
    d.rectangle([3, 9, 28, 12], fill=C['wood_light']) # Highlight top
    d.rectangle([3, 13, 28, 16], fill=C['wood_mid'])
    d.rectangle([4, 17, 10, 27], fill=C['wood_mid'])
    d.rectangle([21, 17, 27, 27], fill=C['wood_mid'])
    
    # Shading (Shadow)
    d.rectangle([8, 17, 10, 27], fill=C['wood_dark'])
    d.rectangle([25, 17, 27, 27], fill=C['wood_dark'])
    d.rectangle([3, 15, 28, 16], fill=C['wood_dark'])
    
    # Screen
    d.rectangle([11, 8, 21, 14], fill=C['screen_bg'])
    d.rectangle([12, 9, 20, 11], fill=C['screen_hi'])
    d.rectangle([13, 12, 19, 13], fill=C['monitor_glow'])
    
    # Stand
    d.rectangle([14, 15, 18, 15], fill=C['metal_mid'])
    d.rectangle([14, 16, 18, 17], fill=C['metal_dark'])
    d.rectangle([16, 15, 18, 17], fill=C['metal_dark']) # Shading on stand
    
    # Paper/Details
    d.rectangle([7 + wobble, 10, 10 + wobble, 10], fill=C['paper'])
    d.rectangle([7 + wobble, 11, 9 + wobble, 11], fill=C['printer_gray']) # text on paper
    
    # Keyboard
    d.rectangle([12, 14, 19, 14], fill=C['metal_dark'])
    d.point([13, 14], fill=C['metal_light'])
    d.point([15, 14], fill=C['metal_light'])
    d.point([17, 14], fill=C['metal_light'])
    
    # Detail pixels (Texture lines, specular highlights)
    d.point([4, 10], fill=C['accent_gold']) # Desk detail
    d.point([27, 10], fill=C['accent_gold'])
    
    draw_outline(d, 3, 8, 28, 27)

def chair(d, i):
    bob = 1 if i in (1, 2) else 0
    
    # Seat Back
    d.rectangle([9, 7 + bob, 22, 13 + bob], fill=C['fabric_mid'])
    d.rectangle([10, 8 + bob, 21, 10 + bob], fill=C['fabric_light']) # Highlight
    d.rectangle([9, 12 + bob, 22, 13 + bob], fill=C['fabric_dark']) # Shadow
    
    # Seat Bottom
    d.rectangle([10, 14 + bob, 21, 19 + bob], fill=C['fabric_mid'])
    d.rectangle([11, 14 + bob, 20, 15 + bob], fill=C['fabric_light']) # Highlight
    d.rectangle([10, 18 + bob, 21, 19 + bob], fill=C['fabric_dark']) # Shadow
    
    # Frame/Wheels
    d.rectangle([11, 20 + bob, 13, 27], fill=C['metal_mid'])
    d.rectangle([12, 20 + bob, 13, 27], fill=C['metal_dark']) # Shadow
    d.rectangle([18, 20 + bob, 20, 27], fill=C['metal_mid'])
    d.rectangle([19, 20 + bob, 20, 27], fill=C['metal_dark']) # Shadow
    
    # Wheels
    d.rectangle([10, 28, 13, 29], fill=C['metal_light'])
    d.rectangle([12, 28, 13, 29], fill=C['metal_mid'])
    d.rectangle([18, 28, 21, 29], fill=C['metal_light'])
    d.rectangle([20, 28, 21, 29], fill=C['metal_mid'])
    
    # Details
    d.rectangle([9, 11 + bob, 10, 12 + bob], fill=C['accent_gold'])
    d.rectangle([21, 11 + bob, 22, 12 + bob], fill=C['accent_gold'])
    
    # Arm Rests
    d.rectangle([8, 15 + bob, 9, 17 + bob], fill=C['metal_dark'])
    d.rectangle([22, 15 + bob, 23, 17 + bob], fill=C['metal_dark'])
    
    # Papers on back
    d.rectangle([14, 10 + bob, 17, 10 + bob], fill=C['paper'])
    d.rectangle([14, 17 + bob, 17, 17 + bob], fill=C['board_blue'])
    
    draw_outline(d, 9, 7 + bob, 22, 29)

def bookshelf(d, i):
    shift = i % 2
    
    # Main Frame
    d.rectangle([4, 3, 27, 28], fill=C['wood_mid'])
    d.rectangle([5, 4, 26, 6], fill=C['wood_light']) # Top highlight
    d.rectangle([25, 4, 26, 28], fill=C['wood_dark']) # Right shadow
    
    # Shelves
    d.rectangle([5, 11, 26, 12], fill=C['wood_dark'])
    d.rectangle([5, 11, 26, 11], fill=C['wood_mid']) # Shelf highlight
    d.rectangle([5, 18, 26, 19], fill=C['wood_dark'])
    d.rectangle([5, 18, 26, 18], fill=C['wood_mid']) # Shelf highlight
    
    # Top Shelf Items
    d.rectangle([6, 7, 8, 10], fill=C['board_blue'])
    d.point([6, 7], fill=C['monitor_glow'])
    d.rectangle([9, 8, 11, 10], fill=C['board_orange'])
    d.rectangle([12, 7 + shift, 14, 10 + shift], fill=C['fabric_mid'])
    d.rectangle([13, 7 + shift, 14, 10 + shift], fill=C['fabric_dark'])
    d.rectangle([16, 8, 18, 10], fill=C['leaf_mid'])
    d.rectangle([20, 7, 23, 10], fill=C['paper'])
    d.rectangle([22, 7, 23, 10], fill=C['printer_gray'])
    
    # Middle Shelf Items
    d.rectangle([7, 13, 10, 17], fill=C['fabric_light'])
    d.rectangle([9, 13, 10, 17], fill=C['fabric_mid'])
    d.rectangle([12, 14, 15, 17], fill=C['leaf_dark'])
    d.point([13, 14], fill=C['leaf_mid'])
    d.rectangle([17, 13, 19, 17], fill=C['board_blue'])
    d.rectangle([21, 14, 24, 17], fill=C['board_orange'])
    d.point([22, 14], fill=C['accent_gold'])
    
    # Bottom Shelf Items
    d.rectangle([6, 20, 9, 27], fill=C['paper'])
    d.rectangle([11, 21, 13, 27], fill=C['fabric_dark'])
    d.rectangle([15, 20, 18, 27], fill=C['leaf_mid'])
    d.rectangle([17, 20, 18, 27], fill=C['leaf_dark'])
    d.rectangle([20, 21, 24, 27], fill=C['fabric_mid'])
    
    draw_outline(d, 4, 3, 27, 28)

def sofa(d, i):
    pulse = 1 if i in (1, 3) else 0
    
    # Back
    d.rectangle([3, 8, 28, 16], fill=C['fabric_mid'])
    d.rectangle([3, 8, 10, 16], fill=C['fabric_dark']) # Left corner
    d.rectangle([21, 8, 28, 16], fill=C['fabric_dark']) # Right corner
    d.rectangle([11, 8, 20, 13], fill=C['fabric_light']) # Highlight
    d.rectangle([12, 14, 19, 16], fill=C['fabric_mid'])
    
    # Seat
    d.rectangle([3, 16, 28, 27], fill=C['fabric_mid'])
    d.rectangle([5, 17, 26, 22], fill=C['fabric_light']) # Seat highlight
    d.rectangle([3, 24, 28, 27], fill=C['fabric_dark']) # Seat shadow
    
    # Cushions
    d.rectangle([12, 18 + pulse, 19, 21 + pulse], fill=C['fabric_dark'])
    d.rectangle([13, 18 + pulse, 18, 19 + pulse], fill=C['fabric_mid'])
    
    d.rectangle([6, 18, 10, 20], fill=C['paper'])
    d.rectangle([21, 18, 25, 20], fill=C['paper'])
    
    # Base/Legs
    d.rectangle([8, 23, 23, 24], fill=C['wood_light'])
    d.rectangle([12, 25, 19, 26], fill=C['wood_mid'])
    d.rectangle([13, 26, 19, 26], fill=C['wood_dark'])
    
    d.rectangle([6, 28, 9, 29], fill=C['wood_mid'])
    d.rectangle([8, 28, 9, 29], fill=C['wood_dark'])
    d.rectangle([22, 28, 25, 29], fill=C['wood_mid'])
    d.rectangle([24, 28, 25, 29], fill=C['wood_dark'])
    
    # Details
    d.rectangle([4, 9, 5, 10], fill=C['accent_gold'])
    d.rectangle([26, 9, 27, 10], fill=C['accent_gold'])
    
    draw_outline(d, 3, 8, 28, 29)

def whiteboard(d, i):
    marker = (i % 4)
    
    # Board
    d.rectangle([4, 4, 27, 25], fill=C['paper'])
    d.rectangle([25, 4, 27, 25], fill=C['printer_gray']) # Right shadow
    d.rectangle([4, 23, 27, 25], fill=C['printer_gray']) # Bottom shadow
    
    # Tray
    d.rectangle([4, 26, 27, 28], fill=C['metal_mid'])
    d.rectangle([4, 26, 27, 26], fill=C['metal_light']) # Tray highlight
    d.rectangle([4, 28, 27, 28], fill=C['metal_dark']) # Tray shadow
    
    # Content
    d.rectangle([6, 8, 24, 8], fill=C['metal_light'])
    d.rectangle([6, 12, 22, 12], fill=C['board_blue'])
    d.rectangle([6, 16, 20, 16], fill=C['board_orange'])
    d.rectangle([6, 20, 24, 20], fill=C['leaf_mid'])
    
    # Highlight dots
    d.point([5, 5], fill=C['printer_white'])
    d.point([26, 5], fill=C['printer_white'])
    
    # Markers
    d.rectangle([8 + marker, 26, 10 + marker, 27], fill=C['clock_red'])
    d.rectangle([20, 26, 23, 27], fill=C['screen_bg'])
    d.point([21, 26], fill=C['monitor_glow'])
    
    draw_outline(d, 4, 4, 27, 28)

def plant(d, i):
    sway = (i % 3) - 1
    
    # Pot
    d.rectangle([11, 20, 20, 27], fill=C['wood_mid'])
    d.rectangle([11, 20, 14, 27], fill=C['wood_light']) # Left highlight
    d.rectangle([18, 20, 20, 27], fill=C['wood_dark']) # Right shadow
    
    # Rim
    d.rectangle([10, 18, 21, 20], fill=C['wood_light'])
    d.rectangle([18, 18, 21, 20], fill=C['wood_mid']) # Rim shadow
    
    # Base
    d.rectangle([11, 27, 20, 28], fill=C['wood_dark'])
    
    # Soil
    d.rectangle([12, 19, 19, 19], fill=C['paper'])
    
    # Leaves (with cell shading)
    d.rectangle([12, 15, 14, 19], fill=C['leaf_dark'])
    d.point([12, 15], fill=C['leaf_mid'])
    
    d.rectangle([15, 12 + sway, 17, 19 + sway], fill=C['leaf_mid'])
    d.rectangle([16, 12 + sway, 17, 19 + sway], fill=C['leaf_dark'])
    
    d.rectangle([18, 14 - sway, 20, 19 - sway], fill=C['leaf_dark'])
    
    d.rectangle([13, 10, 15, 14], fill=C['leaf_light'])
    d.rectangle([14, 10, 15, 14], fill=C['leaf_mid'])
    
    d.rectangle([16, 8 + sway, 18, 13 + sway], fill=C['leaf_light'])
    d.rectangle([17, 8 + sway, 18, 13 + sway], fill=C['leaf_mid'])
    
    d.rectangle([19, 10 - sway, 21, 14 - sway], fill=C['leaf_mid'])
    d.rectangle([20, 10 - sway, 21, 14 - sway], fill=C['leaf_dark'])
    
    # Decor
    d.rectangle([14, 16, 15, 17], fill=C['accent_gold'])
    d.rectangle([17, 15, 18, 16], fill=C['board_blue'])
    
    draw_outline(d, 10, 8, 21, 27)

def clock(d, i):
    hand = i % 4
    
    # Outer Frame
    d.ellipse([8, 6, 23, 21], fill=C['paper'], outline=C['outline'])
    
    # Bezel
    d.ellipse([10, 8, 21, 19], fill=C['metal_mid'])
    d.ellipse([10, 8, 15, 13], fill=C['metal_light']) # Highlight
    d.ellipse([16, 14, 21, 19], fill=C['metal_dark']) # Shadow
    
    # Face
    d.ellipse([11, 9, 20, 18], fill=C['printer_white'])
    d.ellipse([16, 14, 20, 18], fill=C['paper']) # Inner shadow
    
    # Center
    d.rectangle([14, 12, 16, 13], fill=C['outline'])
    
    # Hands
    if hand == 0:
        d.rectangle([16, 10, 16, 12], fill=C['clock_red'])
    elif hand == 1:
        d.rectangle([16, 12, 18, 12], fill=C['clock_red'])
    elif hand == 2:
        d.rectangle([16, 12, 16, 14], fill=C['clock_red'])
    else:
        d.rectangle([14, 12, 16, 12], fill=C['clock_red'])
        
    # Top/Bottom decor
    d.rectangle([9, 6, 22, 7], fill=C['metal_light'])
    d.rectangle([14, 6, 17, 7], fill=C['accent_gold'])
    d.rectangle([15, 4, 16, 5], fill=C['wood_mid'])
    d.rectangle([15, 22, 16, 23], fill=C['wood_dark'])
    
    # Side decor
    d.rectangle([7, 12, 8, 13], fill=C['board_blue'])
    d.rectangle([23, 12, 24, 13], fill=C['board_orange'])

def chart_board(d, i):
    wave = i % 4
    
    # Board
    d.rectangle([4, 4, 27, 26], fill=C['paper'])
    d.rectangle([25, 4, 27, 26], fill=C['printer_gray']) # Shadow right
    
    # Chart bars
    d.rectangle([7, 20, 10, 24], fill=C['board_blue'])
    d.rectangle([9, 20, 10, 24], fill=C['screen_bg']) # Bar shadow
    
    d.rectangle([12, 17, 15, 24], fill=C['board_orange'])
    d.rectangle([14, 17, 15, 24], fill=C['wood_dark']) # Bar shadow
    
    d.rectangle([17, 14, 20, 24], fill=C['leaf_mid'])
    d.rectangle([19, 14, 20, 24], fill=C['leaf_dark']) # Bar shadow
    
    d.rectangle([22, 12, 25, 24], fill=C['clock_red'])
    d.rectangle([24, 12, 25, 24], fill=C['wood_dark']) # Bar shadow
    
    # Line graph
    d.line([(7, 10), (11, 9 + wave), (15, 11), (19, 8 + wave), (24, 10)], fill=C['screen_bg'], width=1)
    
    # Frame/Tray
    d.rectangle([5, 26, 26, 28], fill=C['wood_mid'])
    d.rectangle([5, 26, 26, 26], fill=C['wood_light']) # Highlight
    d.rectangle([5, 28, 26, 28], fill=C['wood_dark']) # Shadow
    
    draw_outline(d, 4, 4, 27, 28)

# --- NEW FURNITURE FUNCTIONS ---

def printer(d, i):
    feed = i % 2
    
    # Main Body
    d.rectangle([5, 14, 27, 28], fill=C['printer_white'])
    d.rectangle([5, 14, 27, 16], fill=C['printer_white']) # Top highlight
    d.rectangle([24, 14, 27, 28], fill=C['printer_gray']) # Right shadow
    d.rectangle([5, 25, 27, 28], fill=C['printer_gray']) # Bottom shadow
    
    # Paper Tray (Top)
    d.rectangle([8, 8, 24, 14], fill=C['metal_dark'])
    d.rectangle([9, 9 - feed, 23, 14], fill=C['paper']) # Paper moving
    d.rectangle([20, 9 - feed, 23, 14], fill=C['printer_gray']) # Paper shadow
    
    # Output Tray (Bottom)
    d.rectangle([8, 24, 24, 26], fill=C['metal_dark'])
    d.rectangle([10, 25, 22, 27], fill=C['paper']) # Output paper
    
    # Control Panel
    d.rectangle([6, 17, 10, 23], fill=C['printer_dark'])
    d.rectangle([7, 18, 9, 19], fill=C['screen_bg'])
    
    # LED blink
    led_color = C['leaf_mid'] if i % 4 < 2 else C['leaf_light']
    d.point([7, 21], fill=led_color)
    d.point([9, 21], fill=C['clock_red'])
    
    # Details/Vents
    d.rectangle([20, 17, 25, 17], fill=C['printer_dark'])
    d.rectangle([20, 19, 25, 19], fill=C['printer_dark'])
    d.rectangle([20, 21, 25, 21], fill=C['printer_dark'])
    
    draw_outline(d, 5, 8, 27, 28)

def filing_cabinet(d, i):
    open_drawer = 1 if i == 0 else (2 if i == 1 else (1 if i == 2 else 0))
    
    # Main Body
    d.rectangle([8, 5, 25, 29], fill=C['metal_mid'])
    d.rectangle([8, 5, 12, 29], fill=C['metal_light']) # Left highlight
    d.rectangle([22, 5, 25, 29], fill=C['metal_dark']) # Right shadow
    
    # Top Drawer
    dy1 = open_drawer if i % 2 == 0 else 0
    d.rectangle([9, 6 + dy1, 24, 13 + dy1], fill=C['metal_light'])
    d.rectangle([22, 6 + dy1, 24, 13 + dy1], fill=C['metal_mid']) # Drawer shadow
    d.rectangle([14, 9 + dy1, 19, 10 + dy1], fill=C['metal_dark']) # Handle
    d.rectangle([16, 7 + dy1, 17, 8 + dy1], fill=C['paper']) # Label
    
    # Middle Drawer
    dy2 = open_drawer if i % 2 == 1 else 0
    d.rectangle([9, 14 + dy2, 24, 21 + dy2], fill=C['metal_light'])
    d.rectangle([22, 14 + dy2, 24, 21 + dy2], fill=C['metal_mid']) # Drawer shadow
    d.rectangle([14, 17 + dy2, 19, 18 + dy2], fill=C['metal_dark']) # Handle
    d.rectangle([16, 15 + dy2, 17, 16 + dy2], fill=C['paper']) # Label
    
    # Bottom Drawer
    d.rectangle([9, 22, 24, 28], fill=C['metal_light'])
    d.rectangle([22, 22, 24, 28], fill=C['metal_mid']) # Drawer shadow
    d.rectangle([14, 25, 19, 26], fill=C['metal_dark']) # Handle
    d.rectangle([16, 23, 17, 24], fill=C['paper']) # Label
    
    draw_outline(d, 8, 5, 25, 29)

def conference_table(d, i):
    gleam = i % 4
    
    # Table Top
    d.rectangle([2, 12, 30, 16], fill=C['wood_mid'])
    d.rectangle([2, 12, 30, 13], fill=C['wood_light']) # Top highlight
    d.rectangle([2, 15, 30, 16], fill=C['wood_dark']) # Bottom shadow
    
    # Reflection/Gleam
    gx = 6 + (gleam * 5)
    d.rectangle([gx, 12, gx + 2, 13], fill=C['wood_light'])
    d.point([gx + 1, 12], fill=C['accent_gold'])
    
    # Legs
    d.rectangle([5, 17, 8, 25], fill=C['metal_dark'])
    d.rectangle([5, 17, 6, 25], fill=C['metal_mid']) # Leg highlight
    d.rectangle([24, 17, 27, 25], fill=C['metal_dark'])
    d.rectangle([24, 17, 25, 25], fill=C['metal_mid']) # Leg highlight
    
    # Base/Feet
    d.rectangle([3, 24, 10, 25], fill=C['metal_dark'])
    d.rectangle([22, 24, 29, 25], fill=C['metal_dark'])
    
    # Center Console (Power/Data)
    d.rectangle([14, 13, 18, 14], fill=C['metal_dark'])
    d.point([15, 13], fill=C['monitor_glow'])
    
    draw_outline(d, 2, 12, 30, 25)

def wall_frame(d, i):
    shimmer = i % 3
    
    # Frame
    d.rectangle([7, 6, 25, 21], fill=C['wood_dark'])
    d.rectangle([7, 6, 25, 7], fill=C['wood_light']) # Top highlight
    d.rectangle([7, 6, 8, 21], fill=C['wood_mid']) # Left highlight
    
    # Mat/Inner
    d.rectangle([9, 8, 23, 19], fill=C['paper'])
    d.rectangle([22, 8, 23, 19], fill=C['printer_gray']) # Mat shadow
    
    # Painting
    d.rectangle([10, 9, 22, 18], fill=C['screen_bg'])
    
    # Mountains/Scenery
    d.rectangle([10, 14, 16, 18], fill=C['leaf_dark'])
    d.rectangle([14, 12, 22, 18], fill=C['leaf_mid'])
    d.rectangle([16, 10, 18, 12], fill=C['printer_white']) # Mountain peak
    
    # Sun
    d.rectangle([12, 10, 13, 11], fill=C['accent_gold'])
    if shimmer == 0:
        d.point([12, 10], fill=C['lamp_glow'])
        
    draw_outline(d, 7, 6, 25, 21)

def wall_monitor(d, i):
    flicker = i % 2
    
    # Bezel
    d.rectangle([4, 6, 28, 19], fill=C['metal_dark'])
    d.rectangle([4, 6, 28, 7], fill=C['metal_mid']) # Top highlight
    d.rectangle([4, 6, 5, 19], fill=C['metal_mid']) # Left highlight
    
    # Screen
    d.rectangle([5, 7, 27, 18], fill=C['screen_bg'])
    
    # Screen Content
    if flicker == 0:
        d.rectangle([7, 9, 25, 10], fill=C['screen_hi'])
        d.rectangle([7, 12, 15, 13], fill=C['monitor_glow'])
        d.rectangle([17, 12, 25, 13], fill=C['board_orange'])
        d.rectangle([7, 15, 20, 16], fill=C['monitor_text'])
    else:
        d.rectangle([7, 9, 25, 10], fill=C['monitor_glow'])
        d.rectangle([7, 12, 15, 13], fill=C['screen_hi'])
        d.rectangle([17, 12, 25, 13], fill=C['accent_gold'])
        d.rectangle([7, 15, 22, 16], fill=C['monitor_text'])
        
    # Power LED
    d.point([26, 18], fill=C['leaf_light'])
    
    draw_outline(d, 4, 6, 28, 19)

def coffee_machine(d, i):
    steam = i % 4
    
    # Machine Body
    d.rectangle([8, 13, 23, 28], fill=C['coffee_body'])
    d.rectangle([8, 13, 12, 28], fill=C['metal_dark']) # Left highlight
    d.rectangle([20, 13, 23, 28], fill=C['outline']) # Right shadow
    
    # Top/Water Res
    d.rectangle([18, 10, 23, 16], fill=C['monitor_text']) # Glass
    d.rectangle([19, 11, 22, 15], fill=C['screen_hi']) # Water
    
    # Dispenser Area
    d.rectangle([10, 18, 18, 25], fill=C['metal_mid'])
    d.rectangle([10, 18, 18, 20], fill=C['metal_dark']) # Shadow under overhang
    d.rectangle([13, 18, 15, 21], fill=C['metal_light']) # Nozzle
    
    # Cup
    d.rectangle([12, 24, 16, 27], fill=C['coffee_cup'])
    d.rectangle([15, 24, 16, 27], fill=C['printer_gray']) # Cup shadow
    
    # Steam
    sx = 14
    if steam == 0:
        d.point([sx, 22], fill=C['printer_white'])
        d.point([sx + 1, 20], fill=C['printer_white'])
    elif steam == 1:
        d.point([sx - 1, 21], fill=C['printer_white'])
        d.point([sx, 19], fill=C['printer_white'])
    elif steam == 2:
        d.point([sx, 20], fill=C['printer_white'])
        d.point([sx - 1, 18], fill=C['printer_white'])
    else:
        d.point([sx + 1, 21], fill=C['printer_white'])
        d.point([sx, 19], fill=C['printer_white'])
        
    # Buttons/LEDs
    d.point([10, 14], fill=C['leaf_light'])
    d.point([12, 14], fill=C['clock_red'])
    d.point([14, 14], fill=C['board_orange'])
    
    # Base
    d.rectangle([7, 28, 24, 29], fill=C['metal_dark'])
    
    draw_outline(d, 8, 10, 24, 29)

def rug(d, i):
    weave = i % 2
    
    # Main Rug
    d.ellipse([2, 21, 30, 30], fill=C['rug_primary'])
    
    # Inner Pattern
    d.ellipse([6, 23, 26, 28], fill=C['rug_secondary'])
    d.ellipse([10, 24, 22, 27], fill=C['rug_primary'])
    
    # Weave detail (texture animation)
    for x in range(12, 20, 2):
        d.point([x, 25 + weave], fill=C['accent_gold'])
        
    # Fringe
    d.line([(2, 25), (4, 25)], fill=C['rug_fringe'], width=1)
    d.line([(3, 26), (5, 26)], fill=C['rug_fringe'], width=1)
    d.line([(28, 25), (30, 25)], fill=C['rug_fringe'], width=1)
    d.line([(27, 26), (29, 26)], fill=C['rug_fringe'], width=1)

def small_table(d, i):
    shine = i % 3
    
    # Top
    d.rectangle([9, 16, 23, 19], fill=C['wood_mid'])
    d.rectangle([9, 16, 23, 17], fill=C['wood_light']) # Highlight
    d.rectangle([9, 19, 23, 20], fill=C['wood_dark']) # Shadow
    
    # Shine
    if shine == 0:
        d.rectangle([12, 16, 14, 17], fill=C['wood_light'])
        d.point([13, 16], fill=C['accent_gold'])
    
    # Legs
    d.rectangle([11, 20, 13, 28], fill=C['wood_dark'])
    d.rectangle([11, 20, 12, 28], fill=C['wood_mid']) # Leg highlight
    d.rectangle([19, 20, 21, 28], fill=C['wood_dark'])
    d.rectangle([19, 20, 20, 28], fill=C['wood_mid']) # Leg highlight
    
    # Details/Decor on table
    d.rectangle([15, 13, 17, 15], fill=C['leaf_dark']) # Small plant/decor
    d.point([16, 12], fill=C['leaf_light'])
    d.rectangle([14, 15, 18, 16], fill=C['board_orange']) # Pot
    
    draw_outline(d, 9, 16, 23, 28)

def trash_can(d, i):
    wobble = 1 if i == 1 else (-1 if i == 3 else 0)
    
    # Trash inside (visible at top)
    d.rectangle([11, 14, 21, 16], fill=C['trash_bag'])
    d.point([12, 13], fill=C['paper'])
    d.point([18, 13], fill=C['board_blue'])
    d.point([15, 12], fill=C['clock_red'])
    
    # Main Body (Cylinder)
    d.rectangle([10, 15, 22, 28], fill=C['metal_mid'])
    d.rectangle([10, 15, 13, 28], fill=C['metal_light']) # Left highlight
    d.rectangle([19, 15, 22, 28], fill=C['metal_dark']) # Right shadow
    
    # Rim
    d.rectangle([9 + wobble, 14, 23 + wobble, 15], fill=C['metal_light'])
    d.rectangle([9 + wobble, 15, 23 + wobble, 16], fill=C['metal_dark']) # Rim shadow
    
    # Base
    d.rectangle([10, 27, 22, 29], fill=C['metal_dark'])
    
    # Vertical Ridges (Texture)
    d.line([(14, 17), (14, 26)], fill=C['metal_dark'], width=1)
    d.line([(18, 17), (18, 26)], fill=C['metal_dark'], width=1)
    
    draw_outline(d, 9, 14, 23, 29)

def ceiling_lamp(d, i):
    glow = i % 2
    
    # Wire/Chain
    d.rectangle([15, 0, 16, 8], fill=C['metal_dark'])
    
    # Base fixture
    d.rectangle([13, 8, 18, 10], fill=C['lamp_body'])
    d.rectangle([13, 8, 15, 10], fill=C['metal_mid']) # Highlight
    
    # Shade
    d.rectangle([10, 10, 21, 15], fill=C['lamp_body'])
    d.rectangle([10, 10, 14, 15], fill=C['metal_mid']) # Left highlight
    d.rectangle([18, 10, 21, 15], fill=C['outline']) # Right shadow
    d.rectangle([9, 14, 22, 16], fill=C['lamp_body']) # Rim
    d.rectangle([9, 14, 13, 16], fill=C['metal_mid']) # Rim highlight
    
    # Bulb
    d.rectangle([14, 16, 17, 18], fill=C['lamp_glow'])
    
    # Glow effect (SOLID yellow, no alpha)
    if glow == 0:
        # Inner bright
        d.rectangle([13, 18, 18, 19], fill=C['lamp_glow'])
        d.rectangle([12, 19, 19, 20], fill=C['lamp_glow'])
        d.rectangle([14, 20, 17, 21], fill=C['lamp_glow'])
    else:
        # Slightly larger bright
        d.rectangle([13, 18, 18, 19], fill=C['lamp_glow'])
        d.rectangle([11, 19, 20, 20], fill=C['lamp_glow'])
        d.rectangle([13, 20, 18, 21], fill=C['lamp_glow'])
        d.rectangle([15, 21, 16, 22], fill=C['lamp_glow'])
        
    draw_outline(d, 9, 8, 22, 18)

def garden_bench(d, i):
    # Backrest
    d.rectangle([4, 10, 27, 15], fill=C['bench_red'])
    d.rectangle([4, 10, 27, 11], fill=C['wood_light']) # highlight
    d.rectangle([4, 14, 27, 15], fill=C['wood_dark']) # shadow
    # Seat
    d.rectangle([4, 16, 27, 19], fill=C['bench_red'])
    d.rectangle([4, 16, 27, 16], fill=C['wood_light']) # highlight
    # Legs
    d.rectangle([6, 19, 8, 25], fill=C['metal_dark'])
    d.rectangle([23, 19, 25, 25], fill=C['metal_dark'])
    draw_outline(d, 4, 10, 27, 25)

def arc_sofa(d, i):
    pulse = 1 if i in (1, 3) else 0
    # Main Body
    d.rectangle([4, 10, 27, 24], fill=C['arc_brown'])
    # Left and Right Arms
    d.rectangle([4, 10, 8, 24], fill=C['wood_dark']) 
    d.rectangle([23, 10, 27, 24], fill=C['wood_dark'])
    # Seat highlight
    d.rectangle([8, 16, 23, 18], fill=C['wood_light'])
    draw_outline(d, 4, 10, 27, 24)

def blue_orb(d, i):
    float_y = i % 2
    oy = 10 + float_y
    # Base
    d.rectangle([12, 25, 19, 28], fill=C['metal_dark'])
    # Orb
    d.ellipse([9, oy, 22, oy + 13], fill=C['orb_blue'])
    d.ellipse([11, oy + 2, 15, oy + 6], fill=C['monitor_glow'])
    draw_outline(d, 12, 25, 19, 28)

def tall_plant(d, i):
    sway = (i % 3) - 1
    # White Pot
    d.rectangle([10, 18, 21, 28], fill=C['printer_white'])
    d.rectangle([18, 18, 21, 28], fill=C['printer_gray']) # shadow
    # Plant stems & leaves
    d.rectangle([14, 6 + sway, 17, 18], fill=C['leaf_dark'])
    d.rectangle([11, 8 + sway, 14, 15], fill=C['leaf_mid'])
    d.rectangle([17, 9 - sway, 20, 16], fill=C['leaf_light'])
    d.rectangle([13, 4 + sway, 18, 9 + sway], fill=C['leaf_mid'])
    draw_outline(d, 10, 18, 21, 28)

def reception_counter(d, i):
    # Front counter
    d.rectangle([3, 14, 28, 28], fill=C['wood_mid'])
    d.rectangle([3, 14, 28, 16], fill=C['wood_light'])
    d.rectangle([3, 26, 28, 28], fill=C['wood_dark'])
    # Top tier
    d.rectangle([3, 10, 28, 13], fill=C['wood_light'])
    d.rectangle([3, 13, 28, 14], fill=C['wood_dark'])
    # Counter detail
    d.rectangle([8, 18, 23, 24], fill=C['wood_dark'])
    draw_outline(d, 3, 10, 28, 28)

def fridge(d, i):
    # Main body
    d.rectangle([7, 4, 24, 28], fill=C['fridge_gray'])
    d.rectangle([7, 4, 10, 28], fill=C['printer_white']) # highlight
    d.rectangle([22, 4, 24, 28], fill=C['printer_gray']) # shadow
    # Top door
    d.rectangle([8, 5, 23, 14], fill=C['fridge_gray'])
    d.rectangle([9, 6, 12, 13], fill=C['printer_white']) # reflection
    # Bottom door
    d.rectangle([8, 16, 23, 27], fill=C['fridge_gray'])
    d.rectangle([9, 17, 12, 26], fill=C['printer_white']) # reflection
    # Handles
    d.rectangle([20, 9, 21, 13], fill=C['metal_dark'])
    d.rectangle([20, 17, 21, 22], fill=C['metal_dark'])
    draw_outline(d, 7, 4, 24, 28)

def wine_sofa(d, i):
    pulse = 1 if i in (1, 3) else 0
    # Back
    d.rectangle([4, 8, 27, 16], fill=C['bench_red'])
    # Seat
    d.rectangle([4, 16, 27, 24], fill=C['bench_red'])
    # Cushions
    d.rectangle([11, 18 + pulse, 20, 21 + pulse], fill=C['fabric_dark'])
    # Armrests
    d.rectangle([3, 14, 7, 25], fill=C['bench_red'])
    d.rectangle([24, 14, 28, 25], fill=C['bench_red'])
    # Base/Legs
    d.rectangle([6, 25, 9, 28], fill=C['wood_dark'])
    d.rectangle([22, 25, 25, 28], fill=C['wood_dark'])
    draw_outline(d, 3, 8, 28, 28)

def retro_monitor(d, i):
    flicker = i % 2
    # Monitor shell
    d.rectangle([5, 6, 26, 22], fill=C['paper'])
    d.rectangle([5, 6, 26, 8], fill=C['printer_white'])
    d.rectangle([24, 6, 26, 22], fill=C['printer_gray'])
    # Screen
    d.rectangle([7, 8, 24, 19], fill=C['monitor_cyan'])
    # Screen content
    if flicker == 0:
        d.rectangle([9, 10, 20, 11], fill=C['printer_white'])
        d.rectangle([9, 13, 16, 14], fill=C['printer_white'])
    else:
        d.rectangle([9, 10, 18, 11], fill=C['printer_white'])
        d.rectangle([9, 13, 21, 14], fill=C['printer_white'])
    # Base
    d.rectangle([11, 22, 20, 27], fill=C['metal_mid'])
    d.rectangle([13, 27, 18, 28], fill=C['metal_dark'])
    draw_outline(d, 5, 6, 26, 28)

SPRITES = {
    'desk_large.png': desk,
    'chair_office.png': chair,
    'bookshelf_tall.png': bookshelf,
    'sofa_modular.png': sofa,
    'whiteboard_wall.png': whiteboard,
    'plant_pot.png': plant,
    'clock_wall.png': clock,
    'chart_board.png': chart_board,
    'printer.png': printer,
    'filing_cabinet.png': filing_cabinet,
    'conference_table.png': conference_table,
    'wall_frame.png': wall_frame,
    'wall_monitor.png': wall_monitor,
    'coffee_machine.png': coffee_machine,
    'rug.png': rug,
    'small_table.png': small_table,
    'trash_can.png': trash_can,
    'ceiling_lamp.png': ceiling_lamp,
    'garden_bench.png': garden_bench,
    'arc_sofa.png': arc_sofa,
    'blue_orb.png': blue_orb,
    'tall_plant.png': tall_plant,
    'reception_counter.png': reception_counter,
    'fridge.png': fridge,
    'wine_sofa.png': wine_sofa,
    'retro_monitor.png': retro_monitor,
}

for name, painter in SPRITES.items():
    img = frame_sheet(painter)
    img.save(OUT / name, 'PNG')
    print(name)
`

const result = spawnSync('python3', ['-c', pythonCode], {
  cwd: outputDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
