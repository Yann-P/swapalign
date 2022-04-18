import { cardColor } from "./util";

type JSONGameState = {
  phase: "REVEAL" | "PLAY";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
};

const BASEURL = "http://192.168.0.9:3000";

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

        <h1>${
          state.phase === "REVEAL"
            ? "Retournez 2 cartes !"
            : `À ${state.turn} de jouer`
        }</h1>

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
                    }">${name} ${
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

async function sendDiscardRevealAction(row: string, col: string) {
  await fetch(BASEURL + `/discard-reveal/${row}/${col}`);
}

(async () => {
  const cardClickListeners = [];
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

        console.log("click", row, col, name);

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
    //break;
  }
})().catch(console.error);
