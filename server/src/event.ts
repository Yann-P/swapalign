export enum GameEvent {
  START = "START",
  DRAW_CARD = "DRAW_CARD",
  SWAP_CARD = "SWAP_CARD",
  NEXT_TURN = "NEXT_TURN",
  END = "GAME_END",
  PLAYER_REVEAL = "PLAYER_REVEAL",
  DISCARD_HOLDED_CARD = "DISCARD_HOLDED_CARD",
}

export interface GameStartedEvent {}
export interface DrawCardEvent {
  name: string;
  value: number;
  useDiscardPile: boolean;
}
export interface SwapCardEvent {
  name: string;
  row: number;
  col: number;
  newCardValue: number;
  discardedCardValue: number;
  hasTriggeredColumn: boolean;
}
export interface NextTurnEvent {
  isLastRound: boolean;
  name: string;
}
export interface GameEndEvent {}
export interface PlayerRevealEvent {
  name: string;
  isRevealPhase: boolean;
  value: number;
  row: number;
  col: number;
  hasTriggeredColumn: boolean;
}
export interface DiscardHoldedCardEvent {
  name: string;
  value: number;
}

export function eventToText(event: GameEvent, data: any) {
  let d;
  switch (event) {
    case GameEvent.START:
      d = data as GameStartedEvent;
      return `Le jeu commence!`;
    case GameEvent.END:
      d = data as GameEndEvent;
      return `FINI, on compte les points`;
    case GameEvent.DRAW_CARD:
      d = data as DrawCardEvent;
      return `${d.name} tire un ${d.value} depuis la ${
        d.useDiscardPile ? "défausse" : "pioche"
      }`;
    case GameEvent.NEXT_TURN:
      d = data as NextTurnEvent;
      return `À ${d.name} de jouer !${
        d.isLastRound ? " C'est le dernier tour" : ""
      }`;
    case GameEvent.DISCARD_HOLDED_CARD:
      d = data as DiscardHoldedCardEvent;
      return `${d.name} défausse le ${d.value} pioché, et doit maintenant révéler une carte...`;
    case GameEvent.PLAYER_REVEAL:
      d = data as PlayerRevealEvent;
      return `${d.name} révèle un ${d.value} sur la colonne n°${d.col + 1}.${
        d.hasTriggeredColumn ? ` Une colonne de ${d.value} est éliminée !` : ""
      }`;
    case GameEvent.SWAP_CARD:
      d = data as SwapCardEvent;
      return `${d.name} pose le ${
        d.newCardValue
      } de sa main et en remplaçant le ${d.discardedCardValue} de la colonne ${
        d.col + 1
      }.${
        d.hasTriggeredColumn
          ? ` Une colonne de ${d.newCardValue} est éliminée !`
          : ""
      }`;
  }
}
