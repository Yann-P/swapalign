import inquirer from "inquirer";
import _ from "lodash";
import { Room } from "./room";

console.log("start");

export const rooms = new Map<string, Room>();
rooms.set("1", new Room());
rooms.get("1")!.startGame();

require("./server");

(async () => {
  while (true) {
    let { answ } = await inquirer.prompt([
      { type: "input", name: "answ", message: "action" },
    ]);

    const [roomid, action, ...params] = answ.split(" ");

    const room = rooms.get(roomid)!;
    room.startGame();
    if (!room) {
      console.error("no such room");
      continue;
    }
    const game = room.getGame();

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
    //console.log(events.map((e) => eventToText(e.name, e.data)));
    console.log(game.print());
    //console.log(JSON.stringify(game.toJSON(), null, 2));
  }
})().catch(console.error);
