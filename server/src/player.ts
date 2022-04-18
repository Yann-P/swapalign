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

  discardCard(discardCard: (card: Card) => void) {
    if (!this.holdingCard) {
      throw new Error(`discardCard: must be holding a card`);
    }
    discardCard(this.holdingCard);
    this.mustReveal = true;
    this.holdingCard = undefined;
  }

  swapCard(row: number, col: number, discardCard: (card: Card) => void) {
    if (!this.holdingCard) {
      throw new Error("Cannot swap card as this player holds no card");
    }
    const cardToDiscard = this.board.swapCard(this.holdingCard, row, col);
    this.holdingCard = undefined;
    discardCard(cardToDiscard);
  }

  revealCard(row: number, col: number): boolean {
    const success = this.board.revealCard(row, col);
    if (!success) {
      return false;
    }
    if (this.mustReveal) {
      this.mustReveal = false;
    } else {
      this.revealedCards++;
    }
    return true;
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
