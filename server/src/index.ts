import inquirer from "inquirer";
import _ from "lodash";
import { eventToText, GameEvent } from "./event";
import { Game } from "./game";
require("./server");

console.log("start");

const events: { name: GameEvent; data: any }[] = [];
function eventCollector<T>(name: GameEvent, data: T) {
  events.push({ name, data });
}
export const game = new Game(eventCollector);

(async () => {
  game.initWithPlayers(["a", "b"]);
  console.log(game.print());

  while (true) {
    let { answ } = await inquirer.prompt([
      { type: "input", name: "answ", message: "action" },
    ]);

    const [action, ...params] = answ.split(" ");

    switch (action) {
      case "r":
        game.playerClickCard(params[0], +params[1], +params[2]);
        break;
      case "dr":
        game.currentPlayerDrawCard(false);
        break;
      case "di":
        game.currentPlayerUseDiscard();
        break;
      case "q":
        return;
      default:
    }
    console.log(events.map((e) => eventToText(e.name, e.data)));
    console.log(game.print());
    //console.log(JSON.stringify(game.toJSON(), null, 2));
  }
})().catch(console.error);
