import _ from "lodash";
import { Card, Deck } from "./types";

export interface CardOnBoard {
  card: Card;
  visible: boolean;
  row: number;
  col: number;
}

export class Board {
  private cards: CardOnBoard[] = [];

  revealCard(row: number, col: number) {
    this.cardAt(row, col).visible = true;
    this.removeColumnIfComplete(col);
  }

  removeColumnIfComplete(col: number) {
    if (this.isColumnComplete(col)) {
      const removed = _.remove(
        this.cards,
        (cardOnBoard) => cardOnBoard.col === col
      );
      console.log("removed", removed);
    }
  }

  isColumnComplete(col: number) {
    console.log(JSON.stringify([0, 1, 2].map((row) => this.cardAt(row, col))));
    return [0, 1, 2]
      .map((row) => this.cardAt(row, col))
      .every(
        (cardOnBoard, i, cardsOnBoard) =>
          cardOnBoard.card.value === cardsOnBoard[0].card.value &&
          cardOnBoard.visible === true
      );
  }

  swapCard(card: Card, row: number, col: number): Card {
    let cardOnBoard = this.cardAt(row, col);
    const cardToDiscard = { ...cardOnBoard.card };

    cardOnBoard.card.value = card.value;
    cardOnBoard.visible = true;

    this.removeColumnIfComplete(col);

    return cardToDiscard;
  }

  private cardAt(row: number, col: number) {
    const card = this.cards.find(
      (card) => card.row === row && card.col === col
    );
    if (!card) {
      throw new Error(`cardAt(${row}, ${col}) empty`);
    }
    return card;
  }

  static generateBoardFromDeck(deck: Deck): Board {
    const board = new Board();
    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 3; col++) {
        board.cards.push({
          card: deck.cards.shift()!,
          col,
          row,
          visible: false,
        });
      }
    }
    return board;
  }

  print(): string {
    let res = "";
    for (let row = 0; row <= 2; row++) {
      res += [0, 1, 2, 3]
        .map((col) => {
          const cardOnBoard = this.cards.find(
            (card) => card.row === row && card.col === col
          );
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

  getSumOfRevealedCards(): number {
    return this.cards
      .filter((cardOnBoard) => cardOnBoard.visible)
      .reduce((acc, cardOnBoard) => {
        return acc + cardOnBoard.card.value;
      }, 0);
  }
}
