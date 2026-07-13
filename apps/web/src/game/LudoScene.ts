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
  UNIVERSAL_SAFE_SQUARES,
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
  diceValues: [number, number]; // two dice
  activeDie?: number; // which die value is currently being used for piece selection
  movesLeft: number; // 0, 1, or 2 — how many die-moves remain this turn
  selectablePieces: string[]; // `${color}-${id}`
  winner: PlayerColor | null;
  scores: Record<PlayerColor, number>;
  humanColors: PlayerColor[]; // which colors the human player controls
  forfeited?: boolean; // true for one emit when 3 consecutive bonus turns are used up
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
  private playerOrder: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  private currentIdx: number = 0;
  private diceVals: [number, number] = [0, 0];
  private remainingMoves: number[] = []; // die values still to be played this turn
  private capturedThisTurn: boolean = false; // any capture this full turn → extra turn
  private consecutiveBonusCount: number = 0; // doubles + captures; 3 in a row = forfeit
  private capturesMade: Record<PlayerColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };
  private isHuman: Record<PlayerColor, boolean> = {
    red: true,
    green: false,
    yellow: true,
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
    // Randomly assign diagonal pairs: human gets red+yellow OR blue+green
    const humanPairA = Math.random() < 0.5;
    this.isHuman = {
      red: humanPairA,
      yellow: humanPairA,
      green: !humanPairA,
      blue: !humanPairA,
    };

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

    const d1 = Phaser.Math.Between(1, 6);
    const d2 = Phaser.Math.Between(1, 6);
    this.diceVals = [d1, d2];

    // Three consecutive bonus turns = forfeited (naija rule)
    if (this.consecutiveBonusCount >= 2) {
      this.consecutiveBonusCount = 0;
      this.phase = 'moving';
      this.emitState(true);
      this.time.delayedCall(500, () => {
        this.advanceTurn(false);
        this.startTurn();
      });
      return;
    }

    // Sort descending so 6s are played first (yard exit before forward move)
    this.remainingMoves = [d1, d2].sort((a, b) => b - a);
    this.startNextMove();
  }

  // ── Turn machinery ───────────────────────────────────────────────────────────

  private currentColor(): PlayerColor {
    return this.playerOrder[this.currentIdx];
  }

  private isCurrentHuman(): boolean {
    return this.isHuman[this.currentColor()];
  }

  // Returns pieces that can legally move using a single die value
  private getValidPiecesForDie(die: number): Piece[] {
    const color = this.currentColor();
    return this.pieces.filter((p) => {
      if (p.color !== color || p.pos === 57) return false;
      // Yard exit requires exactly a 6
      if (p.pos === -1) return die === 6 && !this.isPathBlocked(p, die);
      if (p.pos + die > 57) return false;
      // Must make at least one capture before entering home column (naija rule)
      if (this.capturesMade[color] === 0 && p.pos + die >= 52) return false;
      return !this.isPathBlocked(p, die);
    });
  }

  // Progress through the remaining dice, one at a time
  private startNextMove() {
    if (this.remainingMoves.length === 0) {
      this.finishTurn();
      return;
    }

    const die = this.remainingMoves[0];
    const valid = this.getValidPiecesForDie(die);

    if (valid.length === 0) {
      // No piece can use this die — skip it
      this.remainingMoves.shift();
      this.phase = 'moving';
      this.emitState();
      this.time.delayedCall(300, () => this.startNextMove());
      return;
    }

    this.phase = 'selecting';
    this.applyHighlights(valid);
    this.emitState();

    // AI auto-selects for non-human players
    if (!this.isCurrentHuman()) {
      this.time.delayedCall(500, () => {
        if (this.phase !== 'selecting') return;
        const currentValid = this.getValidPiecesForDie(this.remainingMoves[0] ?? 0);
        if (currentValid.length > 0) {
          this.executeMove(currentValid[Phaser.Math.Between(0, currentValid.length - 1)]);
        }
      });
    }
  }

  // Called after all dice have been played; decides extra turn vs advance
  private finishTurn() {
    const isDoubles = this.diceVals[0] === this.diceVals[1];
    if (isDoubles || this.capturedThisTurn) {
      this.grantBonus();
    } else {
      this.endTurn();
    }
    this.startTurn();
  }

  private advanceTurn(extraTurn: boolean) {
    if (!extraTurn) {
      this.currentIdx = (this.currentIdx + 1) % this.playerOrder.length;
    }
    this.diceVals = [0, 0];
    this.remainingMoves = [];
    this.capturedThisTurn = false;
    this.phase = 'rolling';
  }

  private grantBonus() {
    this.consecutiveBonusCount++;
    this.advanceTurn(true);
  }

  private endTurn() {
    this.consecutiveBonusCount = 0;
    this.advanceTurn(false);
  }

  private startTurn() {
    this.emitState();
    if (!this.isCurrentHuman()) this.scheduleAiTurn();
  }

  private scheduleAiTurn() {
    // AI rolls; startNextMove handles piece selection
    this.time.delayedCall(700, () => this.rollDice());
  }

  // ── Move execution ───────────────────────────────────────────────────────────

  private executeMove(piece: Piece) {
    this.clearHighlights();
    this.phase = 'moving';
    this.emitState();

    // Consume the active die (6 exits yard, other die values advance the piece)
    const die = this.remainingMoves.shift()!;
    // yard exit lands on relPos 0 (entry square); all others advance by die value
    const newPos = piece.pos === -1 ? 0 : piece.pos + die;
    const [tr, tc] = getPieceGridPos(piece.color, piece.id, newPos);
    const [tx, ty] = cellCenter(tr, tc);

    // Blockade partner: if this piece shares a square with a same-color piece, move both
    const partner = this.getBlockadePartner(piece);
    const tweenTargets: Phaser.GameObjects.Graphics[] = [piece.gfx, piece.hl];
    if (partner) tweenTargets.push(partner.gfx, partner.hl);

    this.tweens.add({
      targets: tweenTargets,
      x: tx,
      y: ty,
      duration: 350,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        piece.pos = newPos;
        if (partner) partner.pos = newPos;

        const didCapture = this.handleCapture(piece);
        if (didCapture) {
          this.capturedThisTurn = true;
          // Naija rule: capturing piece goes home immediately — no need to complete the circuit
          if (newPos < 52) {
            this.snapPieceToHome(piece, partner);
            return;
          }
        }

        if (newPos === 57) {
          this.scores[piece.color]++;
          if (partner) this.scores[piece.color]++;
          if (this.checkWin(piece.color)) {
            this.phase = 'gameover';
            this.emitState();
            return;
          }
        }

        this.repositionSharedSquares();
        this.startNextMove();
      },
    });
  }

  // Naija rule: send a piece straight to the winning center after a capture
  private snapPieceToHome(piece: Piece, partner: Piece | null) {
    piece.pos = 57;
    if (partner) partner.pos = 57;

    const [hr, hc] = getPieceGridPos(piece.color, piece.id, 57);
    const [hx, hy] = cellCenter(hr, hc);
    const tweenTargets: Phaser.GameObjects.Graphics[] = [piece.gfx, piece.hl];
    if (partner) tweenTargets.push(partner.gfx, partner.hl);

    this.tweens.add({
      targets: tweenTargets,
      x: hx,
      y: hy,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scores[piece.color]++;
        if (partner) this.scores[piece.color]++;
        if (this.checkWin(piece.color)) {
          this.phase = 'gameover';
          this.emitState();
          return;
        }
        this.repositionSharedSquares();
        this.startNextMove();
      },
    });
  }

  // ── Capture logic ────────────────────────────────────────────────────────────

  // Returns true if at least one piece was captured (triggers extra turn)
  private handleCapture(mover: Piece): boolean {
    if (mover.pos < 0 || mover.pos >= 52) return false;

    const moverAbs = (mover.pos + TRACK_ENTRY[mover.color]) % 52;

    // Universal safe squares protect ALL pieces — no captures here
    if (UNIVERSAL_SAFE_SQUARES.has(moverAbs)) return false;

    let captured = false;

    for (const p of this.pieces) {
      if (p.color === mover.color || p.pos < 0 || p.pos >= 52) continue;
      const pAbs = (p.pos + TRACK_ENTRY[p.color]) % 52;
      if (pAbs !== moverAbs) continue;

      // Starting squares (0,13,26,39) only protect the NATIVE color.
      // A foreign piece parked on another color's starting square CAN be captured.
      if (SAFE_SQUARES.has(pAbs) && TRACK_ENTRY[p.color] === pAbs) continue;

      // A blockade (2+ same-color pieces) cannot be captured
      const siblings = this.pieces.filter(
        (q) =>
          q !== p &&
          q.color === p.color &&
          q.pos >= 0 &&
          q.pos < 52 &&
          (q.pos + TRACK_ENTRY[q.color]) % 52 === pAbs
      );
      if (siblings.length >= 1) continue;

      // Captured — send back to yard
      p.pos = -1;
      const [br, bc] = HOME_BASE_POS[p.color][p.id];
      const [bx, by] = cellCenter(br, bc);
      this.tweens.add({
        targets: [p.gfx, p.hl],
        x: bx,
        y: by,
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => this.repositionSharedSquares(),
      });
      this.capturesMade[mover.color]++;
      captured = true;
    }

    return captured;
  }

  // Offset pieces that share the same cell so neither is hidden behind the other
  private repositionSharedSquares() {
    const byCell = new Map<string, Piece[]>();

    for (const p of this.pieces) {
      if (p.pos < 0) continue; // base pieces have fixed yard positions
      const [r, c] = getPieceGridPos(p.color, p.id, p.pos);
      const key = `${r},${c}`;
      if (!byCell.has(key)) byCell.set(key, []);
      byCell.get(key)!.push(p);
    }

    for (const shared of byCell.values()) {
      const p0 = shared[0];
      const [r, c] = getPieceGridPos(p0.color, p0.id, p0.pos);
      const [cx, cy] = cellCenter(r, c);

      if (shared.length === 1) {
        p0.gfx.setPosition(cx, cy);
        p0.hl.setPosition(cx, cy);
      } else {
        // Sort consistently (color then id) so the same piece always gets the same slot
        shared.sort((a, b) => a.color.localeCompare(b.color) || a.id - b.id);
        shared.forEach((p, i) => {
          const dx = i === 0 ? -5 : 5;
          p.gfx.setPosition(cx + dx, cy);
          p.hl.setPosition(cx + dx, cy);
        });
      }
    }
  }

  // ── Win condition ────────────────────────────────────────────────────────────

  private checkWin(color: PlayerColor): boolean {
    return this.pieces.filter((p) => p.color === color && p.pos === 57).length === 4;
  }

  // ── Blockade & path helpers ──────────────────────────────────────────────────

  // If piece is in a blockade (same-color same-pos partner), return the partner
  private getBlockadePartner(piece: Piece): Piece | null {
    if (piece.pos < 0 || piece.pos >= 52) return null;
    return (
      this.pieces.find((p) => p !== piece && p.color === piece.color && p.pos === piece.pos) ?? null
    );
  }

  // True if any square along the outer-track portion of the path is blocked by a blockade
  private isPathBlocked(piece: Piece, sum: number): boolean {
    const startPos = piece.pos === -1 ? -1 : piece.pos;

    if (startPos === -1) {
      // Exiting yard: piece lands on TRACK_ENTRY absolute index (relPos 0)
      return this.isBlockadeAt(TRACK_ENTRY[piece.color], piece.color, false);
    }

    // How many steps remain on the outer track (0-51)?
    const outerSteps = Math.min(sum, 51 - startPos);
    const finalRelPos = startPos + sum;

    for (let step = 1; step <= outerSteps; step++) {
      const absIdx = (startPos + step + TRACK_ENTRY[piece.color]) % 52;
      // Landing on this square if it's the last outer step AND piece doesn't continue into home col
      const isLanding = step === sum && finalRelPos <= 51;
      if (this.isBlockadeAt(absIdx, piece.color, !isLanding)) return true;
    }

    return false;
  }

  // True if the square at absIdx is a blockade that blocks a mover of `moverColor`
  private isBlockadeAt(absIdx: number, moverColor: PlayerColor, passingThrough: boolean): boolean {
    const colorCount = new Map<PlayerColor, number>();

    for (const p of this.pieces) {
      if (p.pos < 0 || p.pos >= 52) continue;
      const pAbs = (p.pos + TRACK_ENTRY[p.color]) % 52;
      if (pAbs !== absIdx) continue;
      colorCount.set(p.color, (colorCount.get(p.color) ?? 0) + 1);
    }

    for (const [blockColor, count] of colorCount) {
      if (count < 2) continue; // single piece — capturable, not a blockade
      if (blockColor === moverColor) {
        // Own blockade: blocks passing through but not landing (can join it)
        if (passingThrough) return true;
      } else {
        // Opponent blockade: blocks both passing through and landing
        return true;
      }
    }

    return false;
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
      p.gfx.removeAllListeners('pointerdown');
    }
  }

  // ── State emission ───────────────────────────────────────────────────────────

  private emitState(forfeited = false) {
    const activeDie = this.remainingMoves[0];
    const selectable =
      this.phase === 'selecting' && activeDie != null
        ? this.getValidPiecesForDie(activeDie).map((p) => `${p.color}-${p.id}`)
        : [];

    this.bridge.onStateChange({
      phase: this.phase,
      currentPlayer: this.currentColor(),
      diceValues: [this.diceVals[0], this.diceVals[1]],
      activeDie,
      movesLeft: this.remainingMoves.length,
      selectablePieces: selectable,
      winner: this.phase === 'gameover' ? this.currentColor() : null,
      scores: { ...this.scores },
      humanColors: (Object.keys(this.isHuman) as PlayerColor[]).filter((c) => this.isHuman[c]),
      forfeited,
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
