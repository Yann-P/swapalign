import { randomUUID } from "crypto";
import { eventToText, GameEvent } from "./event";
import { Game } from "./game";

/*

const events: { name: GameEvent; data: any }[] = [];
function eventCollector<T>(name: GameEvent, data: T) {
  events.push({ name, data });
}

*/

type Token = string;

export class Room {
  private players: Map<Token, string> = new Map();

  private hasStarted = false;

  private game: Game;

  constructor() {
    this.game = new Game(function eventCollector<T>(name: GameEvent, data: T) {
      //console.log(name, data);
      //console.log(eventToText(name, data));
    });
  }

  public getGame() {
    return this.game;
  }

  public addPlayer(name: string): Token {
    const token = Room.generateToken();
    this.players.set(token, name);
    return token;
  }

  getPlayerNameFromToken(token: string) {
    return this.players.get(token);
  }

  public startGame() {
    if (this.hasStarted) {
      return;
    }
    this.game.initWithPlayers([...this.players.values()]);
    this.hasStarted = true;
  }

  private static generateToken() {
    return randomUUID();
  }

  public toJSON() {
    return {
      players: [...this.players.values()],
      started: this.hasStarted,
    };
  }
}
