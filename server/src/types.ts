export interface Card {
  readonly id: number;
  readonly value: number;
}

export interface Deck {
  cards: Card[];
}

export interface JSONGameState {
  phase: "REVEAL" | "PLAY" | "END";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
  lastRoundTurn: number;
  scores: { [name: string]: number };
  events: [string, number][];
}
