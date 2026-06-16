// This file is dynamically imported (browser-only). SSR-safe.
import Phaser from 'phaser';
import {
  PlayerColor,
  CELL,
  BOARD_SIZE,
  PIECE_R,
  OUTER_PATH,
  HOME_BASE_POS,
  TRACK_ENTRY,
  SAFE_SQUARES,
  COLOR_HEX,
  getCellType,
  getPieceGridPos,
  cellCenter,
} from './constants';

// ── Public types ───────────────────────────────────────────────────────────────

export type GamePhase = 'rolling' | 'selecting' | 'moving' | 'gameover';

export interface GameUIState {
  phase: GamePhase;
  currentPlayer: PlayerColor;
  diceValue: number;
  selectablePieces: string[]; // `${color}-${id}`
  winner: PlayerColor | null;
  scores: Record<PlayerColor, number>;
}

export interface GameBridge {
  rollDice: () => void;
  onStateChange: (s: GameUIState) => void;
}

export interface GameConfig {
  mode: 'computer' | 'pvp';
  difficulty?: string;
  stake?: string;
  gameId?: string;
}

// ── Internal types ─────────────────────────────────────────────────────────────

interface Piece {
  color: PlayerColor;
  id: number;
  pos: number; // -1=base, 0-51=outer track, 52-56=home col, 57=won
  gfx: Phaser.GameObjects.Graphics;
  hl: Phaser.GameObjects.Graphics; // highlight ring
}

// ── Scene ──────────────────────────────────────────────────────────────────────

export class LudoScene extends Phaser.Scene {
  private bridge: GameBridge;
  private cfg: GameConfig;

  private pieces: Piece[] = [];
  private phase: GamePhase = 'rolling';
  private playerOrder: PlayerColor[] = ['red', 'green'];
  private currentIdx: number = 0;
  private diceVal: number = 0;
  private isHuman: Record<PlayerColor, boolean> = {
    red: true,
    green: false,
    yellow: false,
    blue: false,
  };
  private scores: Record<PlayerColor, number> = {
    red: 0,
    green: 0,
    yellow: 0,
    blue: 0,
  };

  constructor(bridge: GameBridge, cfg: GameConfig) {
    super({ key: 'LudoScene' });
    this.bridge = bridge;
    this.cfg = cfg;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  create() {
    this.drawBoard();
    this.initPieces();
    this.emitState();

    if (!this.isCurrentHuman()) {
      this.scheduleAiTurn();
    }
  }

  // ── Public API (called by React via bridge) ──────────────────────────────────

  rollDice() {
    if (this.phase !== 'rolling') return;

    const val = Phaser.Math.Between(1, 6);
    this.diceVal = val;

    const valid = this.getValidPieces(val);

    if (valid.length === 0) {
      this.phase = 'moving';
      this.emitState();
      this.time.delayedCall(400, () => {
        this.advanceTurn(false);
        this.startTurn();
      });
      return;
    }

    this.phase = 'selecting';
    this.applyHighlights(valid);
    this.emitState();
  }

  // ── Turn machinery ───────────────────────────────────────────────────────────

  private currentColor(): PlayerColor {
    return this.playerOrder[this.currentIdx];
  }

  private isCurrentHuman(): boolean {
    return this.isHuman[this.currentColor()];
  }

  private getValidPieces(dice: number): Piece[] {
    const color = this.currentColor();
    return this.pieces.filter((p) => {
      if (p.color !== color || p.pos === 57) return false;
      if (p.pos === -1) return dice === 6;
      return p.pos + dice <= 57;
    });
  }

  private advanceTurn(extraTurn: boolean) {
    if (!extraTurn) {
      this.currentIdx = (this.currentIdx + 1) % this.playerOrder.length;
    }
    this.diceVal = 0;
    this.phase = 'rolling';
  }

  private startTurn() {
    this.emitState();
    if (!this.isCurrentHuman()) this.scheduleAiTurn();
  }

  private scheduleAiTurn() {
    this.time.delayedCall(700, () => {
      this.rollDice();
      if (this.phase === 'selecting') {
        this.time.delayedCall(500, () => {
          const valid = this.getValidPieces(this.diceVal);
          if (valid.length > 0) {
            this.executeMove(valid[Phaser.Math.Between(0, valid.length - 1)]);
          }
        });
      }
    });
  }

  // ── Move execution ───────────────────────────────────────────────────────────

  private executeMove(piece: Piece) {
    this.clearHighlights();
    this.phase = 'moving';
    this.emitState();

    const newPos = piece.pos === -1 ? 0 : piece.pos + this.diceVal;
    const [tr, tc] = getPieceGridPos(piece.color, piece.id, newPos);
    const [tx, ty] = cellCenter(tr, tc);

    this.tweens.add({
      targets: [piece.gfx, piece.hl],
      x: tx,
      y: ty,
      duration: 350,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        piece.pos = newPos;
        this.handleCapture(piece);

        if (newPos === 57) {
          this.scores[piece.color]++;
          if (this.checkWin(piece.color)) {
            this.phase = 'gameover';
            this.emitState();
            return;
          }
        }

        const extraTurn = this.diceVal === 6;
        this.advanceTurn(extraTurn);
        this.startTurn();
      },
    });
  }

  // ── Capture logic ────────────────────────────────────────────────────────────

  private handleCapture(mover: Piece) {
    if (mover.pos < 0 || mover.pos >= 52) return; // base or home col — no capture zone

    const moverAbs = (mover.pos + TRACK_ENTRY[mover.color]) % 52;
    if (SAFE_SQUARES.has(moverAbs)) return;

    for (const p of this.pieces) {
      if (p.color === mover.color || p.pos < 0 || p.pos >= 52) continue;
      const pAbs = (p.pos + TRACK_ENTRY[p.color]) % 52;
      if (pAbs !== moverAbs) continue;

      // Captured — send back to base
      p.pos = -1;
      const [br, bc] = HOME_BASE_POS[p.color][p.id];
      const [bx, by] = cellCenter(br, bc);
      this.tweens.add({
        targets: [p.gfx, p.hl],
        x: bx,
        y: by,
        duration: 400,
        ease: 'Back.easeIn',
      });
    }
  }

  // ── Win condition ────────────────────────────────────────────────────────────

  private checkWin(color: PlayerColor): boolean {
    return this.pieces.filter((p) => p.color === color && p.pos === 57).length === 4;
  }

  // ── Highlights ───────────────────────────────────────────────────────────────

  private applyHighlights(pieces: Piece[]) {
    this.clearHighlights();
    for (const p of pieces) {
      p.hl.setVisible(true);
      this.tweens.add({
        targets: p.hl,
        alpha: { from: 0.3, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      // Enable click for this piece
      p.gfx.once('pointerdown', () => {
        if (this.phase === 'selecting') this.executeMove(p);
      });
    }
  }

  private clearHighlights() {
    for (const p of this.pieces) {
      this.tweens.killTweensOf(p.hl);
      p.hl.setVisible(false).setAlpha(1);
    }
  }

  // ── State emission ───────────────────────────────────────────────────────────

  private emitState() {
    const selectable =
      this.phase === 'selecting'
        ? this.getValidPieces(this.diceVal).map((p) => `${p.color}-${p.id}`)
        : [];

    this.bridge.onStateChange({
      phase: this.phase,
      currentPlayer: this.currentColor(),
      diceValue: this.diceVal,
      selectablePieces: selectable,
      winner: this.phase === 'gameover' ? this.currentColor() : null,
      scores: { ...this.scores },
    });
  }

  // ── Piece initialisation ─────────────────────────────────────────────────────

  private initPieces() {
    for (const color of this.playerOrder) {
      for (let id = 0; id < 4; id++) {
        const [row, col] = HOME_BASE_POS[color][id];
        const [px, py] = cellCenter(row, col);
        const hex = COLOR_HEX[color];

        // Main circle
        const gfx = this.add.graphics();
        gfx.setPosition(px, py);
        gfx.fillStyle(hex, 1);
        gfx.fillCircle(0, 0, PIECE_R);
        gfx.lineStyle(2, 0x000000, 0.5);
        gfx.strokeCircle(0, 0, PIECE_R);
        gfx.setInteractive(new Phaser.Geom.Circle(0, 0, PIECE_R), Phaser.Geom.Circle.Contains);

        // Highlight ring
        const hl = this.add.graphics();
        hl.setPosition(px, py);
        hl.lineStyle(3, 0xffffff, 1);
        hl.strokeCircle(0, 0, PIECE_R + 4);
        hl.setVisible(false);

        this.pieces.push({ color, id, pos: -1, gfx, hl });
      }
    }
  }

  // ── Board drawing ────────────────────────────────────────────────────────────

  private drawBoard() {
    const g = this.add.graphics();

    // Draw each cell
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const type = getCellType(row, col);
        switch (type) {
          case 'red-home':
            g.fillStyle(0xef4444, 0.18);
            break;
          case 'green-home':
            g.fillStyle(0x22c55e, 0.18);
            break;
          case 'yellow-home':
            g.fillStyle(0xeab308, 0.18);
            break;
          case 'blue-home':
            g.fillStyle(0x3b82f6, 0.18);
            break;
          case 'red-col':
            g.fillStyle(0xef4444, 0.45);
            break;
          case 'green-col':
            g.fillStyle(0x22c55e, 0.45);
            break;
          case 'yellow-col':
            g.fillStyle(0xeab308, 0.45);
            break;
          case 'blue-col':
            g.fillStyle(0x3b82f6, 0.45);
            break;
          case 'path':
            g.fillStyle(0xe2e8f0, 1.0);
            break;
          case 'center':
            g.fillStyle(0x1a1a1a, 1.0);
            break;
        }
        g.fillRect(col * CELL, row * CELL, CELL, CELL);
      }
    }

    // Home base inner rectangles
    this.drawHomeBase(g, 'red', 0, 0);
    this.drawHomeBase(g, 'green', 0, 9);
    this.drawHomeBase(g, 'yellow', 9, 9);
    this.drawHomeBase(g, 'blue', 9, 0);

    // Center triangles (4 colours meeting at centre point)
    const ox = 6 * CELL,
      oy = 6 * CELL,
      cs = 3 * CELL;
    const mx = ox + cs / 2,
      my = oy + cs / 2;
    g.fillStyle(0xef4444, 0.85);
    g.fillTriangle(ox, oy, ox, oy + cs, mx, my);
    g.fillStyle(0x22c55e, 0.85);
    g.fillTriangle(ox, oy, ox + cs, oy, mx, my);
    g.fillStyle(0xeab308, 0.85);
    g.fillTriangle(ox + cs, oy, ox + cs, oy + cs, mx, my);
    g.fillStyle(0x3b82f6, 0.85);
    g.fillTriangle(ox, oy + cs, ox + cs, oy + cs, mx, my);

    // Safe square markers (green circle)
    g.fillStyle(0x16a34a, 0.6);
    for (const idx of SAFE_SQUARES) {
      const [sr, sc] = OUTER_PATH[idx];
      const [sx, sy] = cellCenter(sr, sc);
      g.fillCircle(sx, sy, 4);
    }

    // Grid lines
    g.lineStyle(0.5, 0x000000, 0.25);
    for (let i = 0; i <= BOARD_SIZE; i++) {
      g.lineBetween(i * CELL, 0, i * CELL, BOARD_SIZE * CELL);
      g.lineBetween(0, i * CELL, BOARD_SIZE * CELL, i * CELL);
    }
  }

  private drawHomeBase(
    g: Phaser.GameObjects.Graphics,
    color: PlayerColor,
    baseRow: number,
    baseCol: number
  ) {
    const hex = COLOR_HEX[color];
    // Inner 4×4 box (cols 1–4 within the 6×6 quadrant)
    g.fillStyle(hex, 0.12);
    g.fillRect((baseCol + 1) * CELL, (baseRow + 1) * CELL, 4 * CELL, 4 * CELL);
    g.lineStyle(1.5, hex, 0.4);
    g.strokeRect((baseCol + 1) * CELL, (baseRow + 1) * CELL, 4 * CELL, 4 * CELL);

    // Four starting circles
    for (const [row, col] of HOME_BASE_POS[color]) {
      const [cx, cy] = cellCenter(row, col);
      g.fillStyle(hex, 0.25);
      g.fillCircle(cx, cy, PIECE_R + 4);
      g.lineStyle(1.5, hex, 0.6);
      g.strokeCircle(cx, cy, PIECE_R + 4);
    }
  }
}
