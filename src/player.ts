import { Board } from "./board";
import { Card } from "./types";

export class Player {
  public holdingCard: Card | undefined = undefined;

  private revealedCards = 0;

  constructor(public readonly name: string, private board: Board) {}

  drawCard(card: Card) {
    this.holdingCard = card;
  }

  canRevealCard() {
    return this.revealedCards < 2;
  }

  discardCardAndReveal(
    row: number,
    col: number,
    discardCard: (card: Card) => void
  ) {
    if (!this.holdingCard) {
      throw new Error(`discardCardAndReveal: must be holding a card`);
    }
    discardCard(this.holdingCard);
    this.holdingCard = undefined;
    this.board.revealCard(row, col);
  }

  swapCard(row: number, col: number, discardCard: (card: Card) => void) {
    if (!this.holdingCard) {
      throw new Error("Cannot swap card as this player holds no card");
    }
    const cardToDiscard = this.board.swapCard(this.holdingCard, row, col);
    this.holdingCard = undefined;
    discardCard(cardToDiscard);
  }

  revealCard(row: number, col: number) {
    this.board.revealCard(row, col);
    this.revealedCards++;
  }

  getSumOfRevealedCards() {
    return this.board.getSumOfRevealedCards();
  }

  print(): string {
    return `${this.name} (holding ${this.holdingCard?.value ?? "no card"})
${this.board.print()}
    `;
  }
}
