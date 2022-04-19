import _ from "lodash";
import { Card, Deck, JSONGameState } from "./types";
import { Board } from "./board";
import { Player } from "./player";
import {
  DiscardHoldedCardEvent,
  DrawCardEvent,
  GameEndEvent,
  GameEvent,
  GameStartedEvent,
  NextTurnEvent,
  PlayerRevealEvent,
  SwapCardEvent,
} from "./event";

export class Game {
  private players: Map<string, Player> = new Map();

  private discardPile: Card[] = [];

  private deck: Deck;

  private turn: number = -1;

  private lastRoundTurn: number = -1;

  private scores: Record<string, number> = {};

  private phase: "REVEAL" | "PLAY" | "END" = "REVEAL";

  private readonly cardDiscarder = (discardedCard: Card) => {
    this.discardPile.unshift(discardedCard);
  };

  constructor(
    private readonly pushEvent: <T>(type: GameEvent, data: T) => void
  ) {
    this.deck = this.generateDeck();
    this.replenishDiscardPile();
  }

  private generateDeck(): Deck {
    const deck: Deck = { cards: [] };
    [-1, ..._.range(1, 13)].forEach((i) =>
      deck.cards.push(...Array(10).fill({ value: i }))
    );
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
    this.pushEvent<GameStartedEvent>(GameEvent.START, {});
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
      lastRoundTurn: this.lastRoundTurn,
      hands: _.mapValues(
        _.keyBy(
          this.playersAsArray.map((player) => ({
            name: player.name,
            hand: player.getHoldedCard() ?? null,
          })),
          "name"
        ),
        "hand"
      ),
      scores: this.scores,
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

  private playerDrawCard(player: Player, useDiscardPile: boolean) {
    if (player.isHoldingCard()) {
      return;
    }
    const card = this.getCardForTurn(useDiscardPile);
    player.setHoldedCard(card);
    this.pushEvent<DrawCardEvent>(GameEvent.DRAW_CARD, {
      name: player.name,
      value: card.value,
      useDiscardPile,
    });
  }

  currentPlayerDrawCard(useDiscardPile: boolean) {
    if (this.currentPlayer === undefined) return;
    if (this.phase === "END") {
      return;
    }
    if (this.currentPlayer.mustRevealCard()) {
      return;
    }
    this.playerDrawCard(this.currentPlayer, useDiscardPile);
  }

  currentPlayerUseDiscard() {
    if (this.currentPlayer === undefined) return;
    if (this.phase === "END") {
      return;
    }
    if (
      this.currentPlayer.isHoldingCard() &&
      !this.currentPlayer.mustRevealCard()
    ) {
      this.currentPlayerDiscardHoldedCard();
    } else if (
      !this.currentPlayer.isHoldingCard() &&
      !this.currentPlayer.mustRevealCard()
    ) {
      this.currentPlayerDrawCard(true);
    }
  }

  private currentPlayerDiscardHoldedCard() {
    const player = this.currentPlayer!;
    const value = player.discardHoldedCard(this.cardDiscarder);
    this.pushEvent<DiscardHoldedCardEvent>(GameEvent.DISCARD_HOLDED_CARD, {
      name: player.name,
      value,
    });
  }

  private playerSwapCard(player: Player, row: number, col: number) {
    const res = player.swapCard(row, col, this.cardDiscarder);
    this.checkBoardCompletion(player);
    this.pushEvent<SwapCardEvent>(GameEvent.SWAP_CARD, {
      ...res,
      row,
      col,
      name: player.name,
    });
    this.nextTurn();
  }

  private setTurn(turn: number) {
    this.turn = turn;
    this.pushEvent<NextTurnEvent>(GameEvent.NEXT_TURN, {
      name: this.currentPlayer!.name,
      isLastRound: this.isLastRound(),
    });
  }

  private nextTurn() {
    if (this.isLastRound()) {
      this.currentPlayer!.revealAllCards();
      if (this.turn >= this.lastRoundTurn) {
        this.endGame();
        return;
      }
    }
    this.turn++;
    this.pushEvent<NextTurnEvent>(GameEvent.NEXT_TURN, {
      name: this.currentPlayer!.name,
      isLastRound: this.isLastRound(),
    });
  }

  private endGame() {
    this.phase = "END";
    this.scores = this.computeScores();
    this.pushEvent<GameEndEvent>(GameEvent.END, {});
  }

  private computeScores(): Record<string, number> {
    const scores = this.playersAsArray.map((player) => ({
      name: player.name,
      score: player.getSumOfRevealedCards(),
    }));
    //const sortedScores = _.sortBy(scores, (score) => score[1]);
    // const playerThatCompletedBoardFirstIndex = this.turn - this.lastRoundTurn;
    // const playerThatCompletedBoardFirst =
    //   this.playersAsArray[playerThatCompletedBoardFirstIndex];
    return _.mapValues(_.keyBy(scores, "name"), "score");
  }

  private isLastRound() {
    return this.lastRoundTurn !== -1;
  }

  private checkBoardCompletion(player: Player) {
    if (player.hasRevealedAllCards() && !this.isLastRound()) {
      this.lastRoundTurn = this.turn + this.players.size - 1;
    }
  }

  private currentPlayerSwapCard(row: number, col: number) {
    if (this.currentPlayer === undefined) return;
    if (this.phase === "END") {
      return;
    }
    this.playerSwapCard(this.currentPlayer, row, col);
  }

  private playerRevealCard(name: string, row: number, col: number) {
    const player = this.players.get(name)!;
    const playerMustReveal = player.mustRevealCard();
    if (!player.canRevealCard() && !playerMustReveal) {
      return;
    }
    const { success, value } = player.revealCard(row, col);

    if (!success) {
      return;
    }

    this.pushEvent<PlayerRevealEvent>(GameEvent.PLAYER_REVEAL, {
      row,
      col,
      name: player.name,
      value: value!,
      isRevealPhase: this.phase === "REVEAL",
    });

    this.checkBoardCompletion(player);

    if (playerMustReveal) {
      this.nextTurn();
    }

    if (this.phase === "REVEAL" && this.hasEveryPlayerRevealedCards()) {
      this.startPlayPhase();
    }
  }

  private startPlayPhase() {
    const startingPlayerName = this.getStartingPlayer();
    const indexOfStartingPlayer = this.playersAsArray.findIndex(
      (player) => player.name === startingPlayerName
    );
    this.phase = "PLAY";
    this.setTurn(indexOfStartingPlayer);
  }

  playerClickCard(name: string, row: number, col: number) {
    const player = this.players.get(name)!;
    if (this.phase === "REVEAL") {
      this.playerRevealCard(name, row, col);
    } else if (player.mustRevealCard()) {
      this.playerRevealCard(name, row, col);
    } else if (player.isHoldingCard()) {
      this.currentPlayerSwapCard(row, col);
    }
  }

  private get playersAsArray() {
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
    return _.last(scores)!.name;
  }

  private hasEveryPlayerRevealedCards() {
    const players = Array.from(this.players).map((entry) => entry[1]);
    return players.every((player) => !player.canRevealCard());
  }

  private get currentPlayer(): Player | undefined {
    if (this.turn === -1) {
      return undefined;
    }
    return Array.from(this.players)[this.turn % this.players.size][1];
  }
}
