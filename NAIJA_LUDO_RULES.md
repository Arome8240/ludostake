# Naija Ludo — Official Rules

Nigerian Ludo (Naija Ludo) shares its roots with the international board game but has several distinct rules and conventions that differ from the standard version.

---

## Setup

| Item | Value |
|------|-------|
| Players | 2 (each controls two colours in 4-player boards, or one colour in head-to-head) |
| Pieces per player | **8** (two sets of 4 in digital variants; classic boards use 4) |
| Dice | **1 die** (physical boards); many digital/mobile Naija Ludo apps use **2 dice** where movement = sum |
| Board | 15×15 grid, 52-square outer track, 5-square home column per colour, center finishing zone |

All pieces start in their player's **yard** (home base). The player who rolls the highest number goes first.

---

## Objective

Be the first player to move **all your pieces** from the yard, around the entire track, through your home column, and into the finishing center.

---

## Dice & Turn Structure

### Single-die variant (classic physical boards)
- Roll one die. The number shown is how many squares a piece moves.

### Two-die variant (most Nigerian mobile/digital apps)
- Roll two dice. Movement = **sum of both dice**.
- This is the variant implemented in Ludo Stakes.

### Rolling a Six (single-die) or a Six on either die (two-die)
Rolling a six is the most important event in Naija Ludo:
1. You may bring **one new piece out of the yard** onto your starting square.
2. The piece already on the starting square (if any) moves 6 squares forward.
3. You get an **extra turn** — roll again immediately.

### Doubles (two-die variant)
- Rolling doubles (both dice show the same number) grants an **extra turn**.
- Doubles do **not** stack with the six bonus — only one extra turn is awarded per roll event.

### Three consecutive sixes
- If a player rolls three sixes in a row, their turn is **forfeited** as a penalty and no moves are made that turn.

---

## Bringing Pieces into Play

- A piece can **only leave the yard by rolling a six** (or rolling a six on at least one die in the two-die variant).
- On exit, the piece is placed on the player's **starting square** (the coloured square at the entry of the outer track).
- If all four pieces are still in the yard and no six is rolled, the player passes their turn.

---

## Movement

- All pieces move **clockwise** around the outer track.
- A player **must** move a piece if any legal move is possible; they cannot voluntarily skip.
- If no valid move exists (e.g. all pieces are blocked or in the yard and no six was rolled), the turn passes.
- In the two-die variant, the player **must use the combined sum** — they cannot split the two dice across two different pieces.

---

## Capturing

- If a piece lands on a square already occupied by an **opponent's piece**, the opponent's piece is **sent back to the yard** and must re-enter the board with a six.
- The **capturing player earns an extra turn** (roll again).
- A player **must complete at least one capture** before any of their pieces may enter the home column. This is a key Naija Ludo rule absent from international Ludo.

---

## Safe Squares

- Certain squares on the outer track are **safe zones** (marked with a star or circle on physical boards; green markers in digital versions).
- Pieces on safe squares **cannot be captured**.
- Standard safe square positions (absolute track index): **0, 8, 13, 21, 26, 34, 39, 47** — the entry square of each colour and the square before each colour's column entry.

### Blockades
- If **two pieces of the same colour** occupy the same square, that square becomes a **blockade**.
  - Opponent pieces **cannot land on or pass through** a blockade.
  - The two blocking pieces must move together as a unit.
- A blockade on a safe square is especially powerful — it is both uncapturable and impassable.
- A blockade also blocks **trailing pieces of the same player** (the pieces behind the blockade cannot pass it either) — this is the Nigerian-specific "doubled block" rule.

---

## Home Column

- After completing a full circuit of the outer track, a piece enters its **home column** — the coloured lane leading toward the center.
- Pieces in the home column are **safe from capture**.
- To advance within the home column, a player needs an **exact roll** for each step.
  - If the die shows a number higher than the remaining steps to the finish, the piece does **not** move that turn — there is no bouncing back.
- The final square (the center finishing triangle) also requires an **exact roll** to enter.

---

## Winning

- The first player to move **all their pieces** into the finishing center wins.
- In the standard Naija variant with 8 pieces, all 8 must reach the center.
- In the 4-piece variant (used in Ludo Stakes), all 4 pieces must reach the center.

---

## Key Differences from International Ludo

| Rule | International Ludo | Naija Ludo |
|------|--------------------|------------|
| Pieces per player | 4 | **8** (classic); 4 (digital) |
| Dice | 1 | 1 (classic) / **2** (digital apps) |
| Extra turn on capture | No | **Yes** |
| Capture required before home column | No | **Yes** |
| Blockade blocks own trailing pieces | No | **Yes** |
| Three sixes = forfeited turn | Varies | **Yes** |
| Doubles = extra turn (two-dice) | Varies | **Yes** |

---

## Ludo Stakes Variant (implemented rules)

Ludo Stakes follows the **two-dice digital Naija Ludo** ruleset:

- **2 dice** rolled per turn; each die is a **separate move** (e.g. rolling 6+3 exits a piece from yard, then moves it 3 steps).
- Exit yard: the die used must show **6**; the other die then advances the piece.
- **Doubles** = extra turn after both dice are played.
- **Capture** sends opponent back to yard, **grants an extra turn**, and the capturing piece **wins immediately** — it is moved straight to the centre (position 57) without completing the remaining circuit.
- **Must capture at least once** before any piece may enter the home column (positions 52–56).
- Safe squares enforced — no captures on positions 0, 8, 13, 21, 26, 34, 39, 47.
- **Three consecutive bonus turns** (doubles/captures) = turn forfeited.
- Exact roll required to reach the centre (position 57).
- First to land all 4 pieces at position 57 wins.
