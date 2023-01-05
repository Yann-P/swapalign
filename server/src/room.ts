import { eventToText, GameEvent } from "./event";
import { Game } from "./game";

/*

const events: { name: GameEvent; data: any }[] = [];
function eventCollector<T>(name: GameEvent, data: T) {
  events.push({ name, data });
}

*/

export class Room {
  private readonly players: string[] = ["toto", "titi"];

  private game: Game;

  public readonly id = Math.random().toString().slice(-6);

  constructor() {
    this.game = new Game(function eventCollector<T>(name: GameEvent, data: T) {
      //console.log(name, data);
      console.log(eventToText(name, data));
    });
  }

  public getGame() {
    return this.game;
  }

  public startGame() {
    this.game.initWithPlayers(this.players);
  }
}
