import _ from "lodash";
import { Card, Deck } from "./types";

export interface CardOnBoard {
  card: Card;
  visible: boolean;
}

export class Board {
  private cards: CardOnBoard[][] = [];

  revealCard(row: number, col: number): boolean {
    const card = this.cardAt(row, col);
    if (card.visible) {
      return false;
    }
    this.cardAt(row, col).visible = true;
    this.removeColumnIfComplete(col);
    return true;
  }

  removeColumnIfComplete(col: number) {
    if (this.isColumnComplete(col)) {
      this.cards.splice(col, 1);
    }
  }

  private isColumnComplete(col: number) {
    console.log(JSON.stringify([0, 1, 2].map((row) => this.cardAt(row, col))));
    return [0, 1, 2]
      .map((row) => this.cardAt(row, col))
      .every(
        (cardOnBoard, i, cardsOnBoard) =>
          cardOnBoard.card.value === cardsOnBoard[0].card.value &&
          cardOnBoard.visible === true
      );
  }

  swapCard(card: Readonly<Card>, row: number, col: number): Card {
    console.log("swapcard", card, row, col);
    let cardOnBoard = this.cardAt(row, col);
    const cardToDiscard = cardOnBoard.card;

    cardOnBoard.card = card;
    cardOnBoard.visible = true;

    this.removeColumnIfComplete(col);

    return cardToDiscard;
  }

  private cardAt(row: number, col: number) {
    const card = this.cards[col][row];
    if (!card) {
      throw new Error(`cardAt(${row}, ${col}) empty`);
    }
    return card;
  }

  static generateBoardFromDeck(deck: Deck): Board {
    const board = new Board();
    for (let col = 0; col <= 3; col++) {
      board.cards[col] = [];
      for (let row = 0; row <= 2; row++) {
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
    for (let row = 0; row <= 2; row++) {
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
