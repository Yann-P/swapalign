import _ from "lodash";
import { Card, Deck } from "./types";
import { Board } from "./board";
import { Player } from "./player";

export class Game {
  private players: Map<string, Player> = new Map();

  private discardPile: Card[] = [];

  private deck: Deck;

  private turn: number = 0;

  private phase: "REVEAL" | "PLAY" = "REVEAL";

  private readonly cardDiscarder = (discardedCard: Card) => {
    this.discardPile.unshift(discardedCard);
  };

  constructor() {
    this.deck = this.generateDeck();
    this.replenishDiscardPile();
  }

  private generateDeck(): Deck {
    const deck: Deck = { cards: [] };
    // for (let i = 1; i <= 12; i++) {
    //   deck.cards.push(...Array(10).fill({ value: i }));
    // }
    deck.cards.push(...Array(10).fill({ value: -1 }));
    deck.cards.push(...Array(15).fill({ value: 0 }));
    deck.cards.push(...Array(5).fill({ value: -2 }));

    deck.cards = _.shuffle(deck.cards);

    return deck;
  }

  private replenishDiscardPile() {
    console.log("replenishDiscardPile");
    const cardFromDeck = this.deck.cards.shift();
    if (cardFromDeck === undefined) {
      throw new Error(
        `Cannot replenish discard pile because the deck is empty`
      );
    }
    this.discardPile.push(cardFromDeck);
  }

  initWithPlayers(playerNames: string[]) {
    this.players = new Map(
      playerNames.map((name) => [
        name,
        new Player(name, Board.generateBoardFromDeck(this.deck)),
      ])
    );
  }

  print(): string {
    let res = "";
    res += "turn : " + this.currentPlayer.name;
    res += "\n";
    res += "discard pile : " + this.discardPile[0]?.value ?? "empty";
    res += "\n";

    res += Array.from(this.players)
      .map(([_, player]) => player.print())
      .join("\n");

    return res;
  }

  private getCardForTurn(useDiscardPile: boolean): Card {
    if (useDiscardPile) {
      return this.discardPile.shift()!;
    }
    const card = this.deck.cards.shift();
    if (card === undefined) {
      throw new Error("Deck is empty");
    }
    return card;
  }

  playerDrawCard(player: Player, useDiscardPile: boolean) {
    const card = this.getCardForTurn(useDiscardPile);
    player.drawCard(card);
  }

  currentPlayerDrawCard(useDiscardPile: boolean) {
    this.playerDrawCard(this.currentPlayer, useDiscardPile);
  }

  playerDiscardCardAndReveal(player: Player, row: number, col: number) {
    player.discardCardAndReveal(row, col, this.cardDiscarder);
    this.turn++;
  }

  currentPlayerDiscardCardAndReveal(row: number, col: number) {
    this.playerDiscardCardAndReveal(this.currentPlayer, row, col);
  }

  playerSwapCard(player: Player, row: number, col: number) {
    player.swapCard(row, col, this.cardDiscarder);
    this.turn++;
  }

  currentPlayerSwapCard(row: number, col: number) {
    this.playerSwapCard(this.currentPlayer, row, col);
  }

  playerRevealCard(name: string, row: number, col: number) {
    const player = this.players.get(name)!;
    if (!player.canRevealCard()) {
      return;
    }
    player.revealCard(row, col);
    if (this.hasEveryPlayerRevealedCards()) {
      this.phase = "PLAY";
      const startingPlayerName = this.getStartingPlayer();
      const indexOfStartingPlayer = this.playersAsArray.findIndex(
        (player) => player.name === startingPlayerName
      );
      this.turn = indexOfStartingPlayer;
      console.log("set turn " + this.turn + startingPlayerName);
    }
  }

  get playersAsArray() {
    return Array.from(this.players).map((entry) => entry[1]);
  }

  private getStartingPlayer() {
    const scores = _.sortBy(
      this.playersAsArray.map((player) => ({
        name: player.name,
        rank: player.getSumOfRevealedCards(),
      })),
      (o) => o.rank
    );

    console.log(scores);

    return _.last(scores)!.name;
  }

  private hasEveryPlayerRevealedCards() {
    const players = Array.from(this.players).map((entry) => entry[1]);
    return players.every((player) => !player.canRevealCard());
  }

  get currentPlayer(): Player {
    return Array.from(this.players)[this.turn % this.players.size][1];
  }
}
