export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type CellType =
  | 'red-home'
  | 'green-home'
  | 'yellow-home'
  | 'blue-home'
  | 'red-col'
  | 'green-col'
  | 'yellow-col'
  | 'blue-col'
  | 'path'
  | 'center';

// ── Board geometry ─────────────────────────────────────────────────────────────
export const CELL = 24; // px per cell
export const BOARD_SIZE = 15; // 15×15 grid
export const PIECE_R = 8; // piece circle radius (px)
export const BOARD_PX = CELL * BOARD_SIZE; // 360px

// ── 52-square outer path ([row, col], clockwise from Red safe start) ──────────
export const OUTER_PATH: [number, number][] = [
  // Red zone → up col 6
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5], // 0-4  (Red safe at 0)
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6], // 5-10
  // Top → Green zone down col 8
  [0, 7],
  [0, 8], // 11-12
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8], // 13-17 (Green safe at 13)
  // Right side → Yellow zone left on row 8
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14], // 18-23
  [7, 14],
  [8, 14], // 24-25
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9], // 26-30 (Yellow safe at 26)
  // Bottom → Blue zone up col 6
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8], // 31-36
  [14, 7],
  [14, 6], // 37-38
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6], // 39-43 (Blue safe at 39)
  // Left side
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0], // 44-49
  [7, 0],
  [6, 0], // 50-51
];

// ── Home columns (5 squares leading into center) ──────────────────────────────
export const HOME_COLS: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
  ], // row 7, left → center
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ], // col 7, top → center
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
  ], // row 7, right → center
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
  ], // col 7, bottom → center
};

// ── Center (winning position) ──────────────────────────────────────────────────
export const CENTER: [number, number] = [7, 7];

// ── Pieces' home-base starting positions (before entering track) ───────────────
export const HOME_BASE_POS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1, 1],
    [1, 4],
    [4, 1],
    [4, 4],
  ],
  green: [
    [1, 9],
    [1, 12],
    [4, 9],
    [4, 12],
  ],
  yellow: [
    [9, 9],
    [9, 12],
    [12, 9],
    [12, 12],
  ],
  blue: [
    [9, 1],
    [9, 4],
    [12, 1],
    [12, 4],
  ],
};

// ── Track entry offset (outer path index where each color enters) ──────────────
export const TRACK_ENTRY: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// ── Safe squares (absolute outer path indices) ────────────────────────────────
// Universal: protect ALL pieces regardless of color
export const UNIVERSAL_SAFE_SQUARES = new Set<number>([8, 21, 34, 47]);
// Combined (used for path-blocking logic — blockades still can't form on any safe sq)
export const SAFE_SQUARES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
// Starting squares (0,13,26,39) only protect their NATIVE color's pieces

// ── Phaser hex colors ──────────────────────────────────────────────────────────
export const COLOR_HEX: Record<PlayerColor, number> = {
  red: 0xef4444,
  green: 0x22c55e,
  yellow: 0xeab308,
  blue: 0x3b82f6,
};

// ── Cell type helper ───────────────────────────────────────────────────────────
export function getCellType(row: number, col: number): CellType {
  // Center 3×3 (checked first to prevent override by path checks)
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'center';

  // Home columns
  if (row === 7 && col >= 1 && col <= 5) return 'red-col';
  if (row === 7 && col >= 9 && col <= 13) return 'yellow-col';
  if (col === 7 && row >= 1 && row <= 5) return 'green-col';
  if (col === 7 && row >= 9 && row <= 13) return 'blue-col';

  // Home quadrants (corners)
  if (row <= 5 && col <= 5) return 'red-home';
  if (row <= 5 && col >= 9) return 'green-home';
  if (row >= 9 && col >= 9) return 'yellow-home';
  if (row >= 9 && col <= 5) return 'blue-home';

  // All remaining cells are outer path squares
  return 'path';
}

// ── Convert relative position + color to grid [row, col] ─────────────────────
export function getPieceGridPos(
  color: PlayerColor,
  pieceId: number,
  relPos: number
): [number, number] {
  if (relPos === -1) return HOME_BASE_POS[color][pieceId];
  if (relPos >= 57) return CENTER;
  if (relPos >= 52) return HOME_COLS[color][relPos - 52];
  const absIdx = (relPos + TRACK_ENTRY[color]) % 52;
  return OUTER_PATH[absIdx];
}

// ── Convert [row, col] to canvas pixel center ─────────────────────────────────
export function cellCenter(row: number, col: number): [number, number] {
  return [col * CELL + CELL / 2, row * CELL + CELL / 2];
}
