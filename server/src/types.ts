export interface Card {
  readonly value: number;
}

export interface Deck {
  cards: Card[];
}

export interface JSONGameState {
  phase: "REVEAL" | "PLAY";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
}
