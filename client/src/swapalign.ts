import { cardColor } from "./util";

type JSONGameState = {
  phase: "REVEAL" | "PLAY" | "END";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
  lastRoundTurn: number;
  scores: { [name: string]: number };
};

const BASEURL = "http://localhost:4000";

function transpose<T>(array: T[][]) {
  return array[0].map((_, colIndex) => array.map((row) => row[colIndex]));
}

async function fetchState() {
  const res = await fetch(BASEURL + "/state");
  return res.json();
}

function genBoard(board: (number | null)[][]): string {
  return `
        <table>
            ${transpose(board)
              .map(
                (rowData, row) => `
                <tr>
                    ${rowData
                      .map(
                        (val, col) => `
                        <td class="card boardcard" data-col="${col}" data-row="${row}" style="background: ${cardColor(
                          val
                        )}; ">${val ?? "-"}</td>
                    `
                      )
                      .join("")}
                </tr>
            `
              )
              .join("")}
        </table>
    `;
}

function renderState(state: JSONGameState) {
  document.getElementById("game").innerHTML = `

        <h1>${state.phase} - ${state.turn}/${state.lastRoundTurn}</h1>

        <table>
        <tr>
            <td>
                <div class="card drawcard" style="border-bottom: ${
                  state.drawSize
                }px solid lightgrey">
                    ?
                </div>
            </td>
            <td>
                <div class="card discard" style="background: ${cardColor(
                  state.discard
                )}; border-bottom: ${state.discardSize}px solid lightgrey">
                    ${state.discard ?? ""}
                </div>
            </td>
        </tr>
        </table>

        <div style="display: flex; flex-direction: row">

        ${Object.keys(state.boards)
          .map(
            (name) =>
              `
            <div>
                    <h2 style="height:50px;${
                      state.turn === name ? "color: red;" : ""
                    }">${name} (${state.scores[name] ?? "-"} pts) ${
                state.hands[name] !== null
                  ? `
                        <div class="card" style="display: inline-block;background: ${cardColor(
                          state.hands[name]
                        )}">
                            ${state.hands[name]}
                        </div>`
                  : ``
              }</h2>
                    <div class="board" data-name="${name}">
                        ${genBoard(state.boards[name])}
                    </div>
            </div>
            `
          )
          .join("")}

          </div>
        `;
}

async function sendCardAction(name: string, row: string, col: string) {
  await fetch(BASEURL + `/card/${name}/${row}/${col}`);
}

async function sendDrawAction() {
  await fetch(BASEURL + `/draw`);
}

async function sendDiscardAction() {
  await fetch(BASEURL + `/discard`);
}

(async () => {
  let state: JSONGameState;

  while (true) {
    state = await fetchState();
    renderState(state);

    [...document.querySelectorAll(".boardcard")].forEach((card) => {
      card.addEventListener("mouseup", (e) => {
        const [row, col, name] = [
          card.getAttribute("data-row"),
          card.getAttribute("data-col"),
          card.closest(".board").getAttribute("data-name"),
        ];
        sendCardAction(name, row, col).catch(console.error);
      });
    });

    document.querySelector(".drawcard").addEventListener("mouseup", () => {
      sendDrawAction().catch(console.error);
    });

    document.querySelector(".discard").addEventListener("mouseup", () => {
      sendDiscardAction().catch(console.error);
    });

    await new Promise((res) => setTimeout(res, 200));
  }
})().catch(console.error);
