import inquirer from "inquirer";
import _ from "lodash";
import { Game } from "./game";

console.log("start");

(async () => {
  const game = new Game();
  game.initWithPlayers(["a"]); //, "b"]);
  console.log(game.print());

  while (true) {
    let { answ } = await inquirer.prompt([
      { type: "input", name: "answ", message: "action" },
    ]);

    const [action, ...params] = answ.split(" ");

    switch (action) {
      case "r":
        game.playerRevealCard(params[0], +params[1], +params[2]);
        break;
      case "dr":
        game.currentPlayerDrawCard(false);
        break;
      case "di":
        game.currentPlayerDrawCard(true);
        break;
      case "th":
        game.currentPlayerDiscardCardAndReveal(+params[0], +params[1]);
        break;
      case "sw":
        game.currentPlayerSwapCard(+params[0], +params[1]);
        break;
      case "q":
        return;
      default:
    }
    console.log(game.print());
  }
})().catch(console.error);
