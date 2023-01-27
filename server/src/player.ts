import { Board } from "./board";
import { Card } from "./types";

export class Player {
  private holdingCard: Card | undefined = undefined;

  private mustReveal = false;

  private revealedCards = 0;

  constructor(public readonly name: string, private board: Board) {}

  isHoldingCard(): boolean {
    return this.holdingCard !== undefined;
  }

  getHoldedCard(): number | undefined {
    return this.holdingCard?.value;
  }

  mustRevealCard(): boolean {
    return this.mustReveal;
  }

  setHoldedCard(card: Card) {
    this.holdingCard = card;
  }

  canRevealCard() {
    return this.revealedCards < 2;
  }

  hasRevealedAllCards(): boolean {
    return this.board.hasRevealedAllCards();
  }

  discardHoldedCard(discardCard: (card: Card) => void): number {
    if (!this.holdingCard) {
      throw new Error(`discardCard: must be holding a card`);
    }
    const value = this.holdingCard.value;
    discardCard(this.holdingCard);
    this.mustReveal = true;
    this.holdingCard = undefined;
    return value;
  }

  swapCard(
    row: number,
    col: number,
    discardCard: (card: Card) => void
  ): {
    newCardValue: number;
    discardedCardValue: number;
    hasTriggeredColumn: boolean;
  } {
    if (!this.holdingCard) {
      throw new Error("Cannot swap card as this player holds no card");
    }
    const newCardValue = this.holdingCard.value;
    const { toDiscard } = this.board.swapCard(this.holdingCard, row, col);
    this.holdingCard = undefined;
    toDiscard.forEach((card) => discardCard(card));
    return {
      newCardValue,
      discardedCardValue: toDiscard[0].value,
      hasTriggeredColumn: toDiscard.length > 1, // there is at least one card discarded, the swapped card
    };
  }

  revealCard(
    row: number,
    col: number
  ): { success: boolean; toDiscard: Card[]; revealedCardValue?: number } {
    const { success, toDiscard, revealedCardValue } = this.board.revealCard(
      row,
      col
    );
    if (!success) {
      return { success: false, toDiscard: [] };
    }
    if (this.mustReveal) {
      this.mustReveal = false;
    } else {
      this.revealedCards++;
    }
    return { success, revealedCardValue, toDiscard };
  }

  revealAllCards() {
    this.board.revealAllCards();
  }

  getSumOfRevealedCards() {
    return this.board.getSumOfRevealedCards();
  }

  print(): string {
    return `${this.name} (holding ${this.holdingCard?.value ?? "no card"})
${this.board.print()}
    `;
  }

  getBoardJSON() {
    return this.board.toJSON();
  }
}
