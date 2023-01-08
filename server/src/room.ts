import { eventToText, GameEvent } from "./event";
import { Game } from "./game";

/*

const events: { name: GameEvent; data: any }[] = [];
function eventCollector<T>(name: GameEvent, data: T) {
  events.push({ name, data });
}

*/

export class Room {
  private players: Set<string> = new Set();

  private game: Game;

  constructor() {
    this.game = new Game(function eventCollector<T>(name: GameEvent, data: T) {
      //console.log(name, data);
      console.log(eventToText(name, data));
    });
  }

  public getGame() {
    return this.game;
  }

  public addPlayer(name: string) {
    this.players.add(name);
  }

  public startGame() {
    this.game.initWithPlayers([...this.players]);
  }
}
