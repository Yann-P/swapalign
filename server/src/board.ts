import _ from "lodash";
import { Card, Deck } from "./types";

export interface CardOnBoard {
  card: Card;
  visible: boolean;
}

export class Board {
  private cards: CardOnBoard[][] = [];

  revealCard(
    row: number,
    col: number
  ): { success: boolean; toDiscard: Card[]; revealedCardValue?: number } {
    const card = this.cardAt(row, col);
    if (card.visible) {
      return { success: false, toDiscard: [] };
    }
    const value = card.card.value;
    card.visible = true;

    const cardsFromColumnToDiscard = this.removeColumnIfComplete(col);

    return {
      success: true,
      revealedCardValue: value,
      toDiscard: cardsFromColumnToDiscard.map((cob) => cob.card),
    };
  }

  revealAllCards(): void {
    for (const [col, rows] of this.cards.entries()) {
      for (const [row, card] of rows.entries()) {
        const res = this.revealCard(row, col);
        if (res.toDiscard.length > 0) {
          return this.revealAllCards();
        }
      }
    }
  }

  hasRevealedAllCards(): boolean {
    return this.cards.every((col) => col.every((card) => card.visible));
  }

  removeColumnIfComplete(col: number): CardOnBoard[] {
    if (this.isColumnComplete(col)) {
      const discardedCards = this.cards.splice(col, 1);
      console.log("discardedCards", JSON.stringify(discardedCards, null, 2));

      return discardedCards[0];
    }
    return [];
  }

  private isColumnComplete(col: number): boolean {
    return [0, 1, 2]
      .map((row) => this.cardAt(row, col))
      .every(
        (cardOnBoard, i, cardsOnBoard) =>
          cardOnBoard.card.value === cardsOnBoard[0].card.value &&
          cardOnBoard.visible === true
      );
  }

  swapCard(
    card: Readonly<Card>,
    row: number,
    col: number
  ): { toDiscard: Card[] } {
    let cardOnBoard = this.cardAt(row, col);
    const cardToDiscard = cardOnBoard.card;

    cardOnBoard.card = card;
    cardOnBoard.visible = true;

    const cardsFromColumnToDiscard = this.removeColumnIfComplete(col);

    return {
      toDiscard: [
        cardToDiscard,
        ...cardsFromColumnToDiscard.map((cob) => cob.card), // cards from the column must be on top
      ],
    };
  }

  private cardAt(row: number, col: number) {
    const card = this.cards[col][row];
    if (!card) {
      throw new Error(`cardAt(${row}, ${col}) empty`);
    }
    return card;
  }

  static generateBoardFromDeck(deck: Deck): Board {
    const cols = 4;
    const rows = 3;
    if (deck.cards.length < cols * rows) {
      throw new Error("not enough cards!!");
    }
    const board = new Board();
    for (let col = 0; col < cols; col++) {
      board.cards[col] = [];
      for (let row = 0; row < rows; row++) {
        board.cards[col][row] = {
          card: deck.cards.shift()!,
          visible: false,
        };
      }
    }
    return board;
  }

  print(): string {
    let res = "";
    for (let row = 0; row <= 3; row++) {
      res += [0, 1, 2, 3]
        .map((col) => {
          const cardOnBoard = this.cards[col]?.[row];
          if (!cardOnBoard) {
            return;
          }
          const value = String(cardOnBoard.card.value).padStart(2);
          return cardOnBoard.visible ? `[${value}]` : ` ${value} `;
          //return cardOnBoard.visible ? `[${value}]` : `    `;
        })
        .join("  ");
      res += "\n";
    }
    return res;
  }

  toJSON(): (number | null)[][] {
    return this.cards.map((col) =>
      col.map((row) => (row.visible ? row.card.value : null))
    );
  }

  getSumOfRevealedCards(): number {
    return _.flatten(this.cards)
      .filter((cardOnBoard) => cardOnBoard.visible)
      .reduce((acc, cardOnBoard) => {
        return acc + cardOnBoard.card.value;
      }, 0);
  }
}
