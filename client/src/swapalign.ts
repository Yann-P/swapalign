import { cardColor } from "./util";

export interface JSONGameState {
  phase: "REVEAL" | "PLAY" | "END";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
  lastRoundTurn: number;
  scores: { [name: string]: number };
  events: [string, number][];
  permissions: {
    [name: string]: {
      reveal: boolean;
      draw: boolean;
      swap: boolean;
      discard: boolean;
    };
  };
}

const BASEURL = process.env.BASEURL;

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const roomId = params.r;
const token = JSON.parse(localStorage.getItem(roomId) ?? "{}").token;
const currentName = JSON.parse(localStorage.getItem(roomId) ?? "{}").name;

function transpose<T>(array: T[][]) {
  return array[0].map((_, colIndex) => array.map((row) => row[colIndex]));
}

async function fetchState() {
  const res = await fetch(BASEURL + "/state", {
    headers: { roomid: roomId },
  });
  return res.json();
}

function genBoard(
  name: string,
  state: JSONGameState,
  board: (number | null)[][]
): string {
  return `
        <table style="margin: 0 auto">
            ${transpose(board)
              .map(
                (rowData, row) => `
                <tr>
                    ${rowData
                      .map(
                        (val, col) => `
                        <td><div class="${
                          (state.permissions[name].reveal &&
                            name === currentName &&
                            val === null) ||
                          (state.permissions[name].swap && name === currentName)
                            ? "highlight "
                            : ""
                        }card boardcard${
                          val === null ? " unknowncard" : ""
                        }" data-col="${col}" data-row="${row}" style="background: ${cardColor(
                          val
                        )}; ">${val ?? ""}</div></td>
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
        <div id="gameinfo">${
          state.phase === "REVEAL"
            ? "Révélez 2 cartes"
            : state.phase === "END"
            ? "Partie terminée"
            : state.events[state.events.length - 1][0]
        }
        <div style='color: #8b9bb4 ; font-size: .5em; font-weight: 200;'>${
          state.events[state.events.length - 2]?.[0] ?? ""
        }</div>
      </div>

        <table>
        <tr style="height: 130px">
            <td style="width: 100px;">
                <div class="${
                  state.permissions[currentName].draw ? "highlight " : ""
                }card megacard drawcard unknowncard" style="margin: 0 auto;">
                    ?
                </div>
            </td>
            <td style="width: 100px;">
                <div class="${
                  state.permissions[currentName].discard ? "highlight " : ""
                }card megacard discard" style="margin: 0 auto;background: ${cardColor(
    state.discard
  )};">
                    ${state.discard ?? ""}
                </div>
            </td>
        </tr>
        <tr class="megacardlabel"><td style="width: 100px;text-align:center;">Pioche</td><td style="width: 100px;text-align:center;">Défausse</td></tr>

        </table>

        <div style="display: flex; flex-wrap: wrap;">

        ${Object.keys(state.boards)
          .map(
            (name) =>
              `
            <div class='${
              !state.scores ||
              state.scores[name] !== Math.min(...Object.values(state.scores))
                ? `playerboard${state.turn === name ? " currentturn" : ""}`
                : `playerboard won`
            }'>
                    <div class='playername'>${name}${
                state.scores[name] ? ` (${state.scores[name]} points) ` : ""
              } 
              ${currentName === name ? "(You)" : ""}
                <div class="card" style="display: inline-block;opacity:${
                  state.hands[name] !== null ? "1" : "0"
                };background: ${cardColor(state.hands[name])}">
                    ${state.hands[name]}
                </div>
              </div>
                    <div class="board" data-name="${name}">
                        ${genBoard(name, state, state.boards[name])}
                    </div>
            </div>
            `
          )
          .join("")}

          </div>
        `;
}

async function sendCardAction(name: string, row: string, col: string) {
  //header ${name}
  if (name !== JSON.parse(localStorage.getItem(roomId) ?? "{}").name) return;
  await fetch(BASEURL + `/action?action=card&row=${row}&col=${col}`, {
    headers: { roomid: roomId, token: token },
  });
}

async function sendDrawAction() {
  await fetch(BASEURL + `/action?action=draw`, {
    headers: { roomid: roomId, token },
  });
}

async function sendDiscardAction() {
  await fetch(BASEURL + `/action?action=discard`, {
    headers: { roomid: roomId, token },
  });
}

async function newRoom() {
  const res = await fetch(BASEURL + `/createroom`);
  return res.text();
}

(async () => {
  let state: JSONGameState;

  document
    .querySelector('#newroom input[type="button"]')!
    .addEventListener("click", async () => {
      const roomid = await newRoom();
      window.location.href = "lobby.html?r=" + roomid;
    });

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

    await new Promise((res) => setTimeout(res, 300));
  }
})().catch(console.error);
