import _ from "lodash";
import { Card, Deck, JSONGameState } from "./types";
import { Board } from "./board";
import { Player } from "./player";

export class Game {
  private players: Map<string, Player> = new Map();

  private discardPile: Card[] = [];

  private deck: Deck;

  private turn: number = -1;

  private isLastRound = false;

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
    for (let i = 1; i <= 12; i++) {
      deck.cards.push(...Array(10).fill({ value: i }));
    }
    deck.cards.push(...Array(10).fill({ value: -1 }));
    deck.cards.push(...Array(15).fill({ value: 0 }));
    deck.cards.push(...Array(5).fill({ value: -2 }));

    deck.cards = _.shuffle(deck.cards);

    return deck;
  }

  private replenishDiscardPile() {
    this.discardPile.push(this.deck.cards.shift()!);
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
    if (this.currentPlayer !== undefined)
      res += "turn : " + this.currentPlayer.name;
    res += "\n";
    res += "discard pile : " + this.discardPile[0]?.value ?? "empty";
    res += "\n";

    res += Array.from(this.players)
      .map(([_, player]) => player.print())
      .join("\n");

    return res;
  }

  toJSON(): JSONGameState {
    return {
      discardSize: this.discardPile.length,
      discard: this.discardPile[0]?.value ?? null,
      turn: this.currentPlayer?.name,
      boards: _.mapValues(
        _.keyBy(
          Array.from(this.players).map(([_, player]) => ({
            name: player.name,
            board: player.getBoardJSON(),
          })),
          "name"
        ),
        (v) => v.board
      ),
      drawSize: this.deck.cards.length,
      phase: this.phase,
      hands: _.mapValues(
        _.keyBy(
          Array.from(this.players).map(([_, player]) => ({
            name: player.name,
            hand: player.getHoldedCard() ?? null,
          })),
          "name"
        ),
        (v) => v.hand
      ),
    };
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
    if (player.isHoldingCard()) {
      return;
    }
    const card = this.getCardForTurn(useDiscardPile);
    player.setHoldedCard(card);
  }

  currentPlayerDrawCard(useDiscardPile: boolean) {
    if (this.currentPlayer === undefined) return;
    this.playerDrawCard(this.currentPlayer, useDiscardPile);
  }

  playerDiscardCard(player: Player) {
    player.discardCard(this.cardDiscarder);
  }

  currentPlayerDiscardCard() {
    if (this.currentPlayer === undefined) return;
    this.playerDiscardCard(this.currentPlayer);
  }

  currentPlayerUseDiscard() {
    if (this.currentPlayer === undefined) return;
    if (this.currentPlayer.isHoldingCard()) {
      this.currentPlayer.discardCard(this.cardDiscarder);
    } else {
      this.currentPlayerDrawCard(true);
    }
  }

  playerSwapCard(player: Player, row: number, col: number) {
    player.swapCard(row, col, this.cardDiscarder);
    this.turn++;
  }

  currentPlayerSwapCard(row: number, col: number) {
    if (this.currentPlayer === undefined) return;
    this.playerSwapCard(this.currentPlayer, row, col);
  }

  playerRevealCard(name: string, row: number, col: number) {
    const player = this.players.get(name)!;
    const playerMustReveal = player.mustRevealCard();
    if (!player.canRevealCard() && !playerMustReveal) {
      return;
    }
    const success = player.revealCard(row, col);

    if (!success) {
      return;
    }

    if (playerMustReveal) {
      this.turn++;
    }

    if (this.phase === "REVEAL" && this.hasEveryPlayerRevealedCards()) {
      const startingPlayerName = this.getStartingPlayer();
      const indexOfStartingPlayer = this.playersAsArray.findIndex(
        (player) => player.name === startingPlayerName
      );
      this.phase = "PLAY";
      this.turn = indexOfStartingPlayer;
      console.log("set turn " + this.turn + startingPlayerName);
    }
  }

  playerClickCard(name: string, row: number, col: number) {
    const player = this.players.get(name)!;
    if (this.phase === "REVEAL") {
      this.playerRevealCard(name, row, col);
    } else if (player.mustRevealCard()) {
      console.log("must reveal, placing");
      this.playerRevealCard(name, row, col);
    } else if (player.isHoldingCard()) {
      console.log("holding, swapping");
      this.currentPlayerSwapCard(row, col);
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

  get currentPlayer(): Player | undefined {
    if (this.turn === -1) {
      return undefined;
    }
    return Array.from(this.players)[this.turn % this.players.size][1];
  }
}
