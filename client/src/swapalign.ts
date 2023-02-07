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

import * as qr from "qrcode";
document.addEventListener("DOMContentLoaded", async () => {
  const qrdata = await qr.toDataURL(window.location.href);
  const img = document.createElement("img");
  img.src = qrdata;
  document.body.appendChild(img);
});

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
                          (state.permissions[name].reveal && val === null) ||
                          state.permissions[name].swap
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
        <div style='color: #888; font-size: .5em'>${
          state.events[state.events.length - 2]?.[0] ?? ""
        }</div>
      </div>

        <table>
        <tr style="font-variant:small-caps;color: #444"><td style="width: 100px;text-align:center;">Pioche</td><td style="width: 100px;text-align:center;">Défausse</td></tr>
        <tr style="height: 130px">
            <td style="width: 100px;">
                <div class="${
                  Object.values(state.permissions).some((p) => p.draw)
                    ? "highlight "
                    : ""
                }card megacard drawcard unknowncard" style="margin: 0 auto;">
                    ?
                </div>
            </td>
            <td style="width: 100px;">
                <div class="${
                  Object.values(state.permissions).some((p) => p.discard)
                    ? "highlight "
                    : ""
                }card megacard discard" style="margin: 0 auto;background: ${cardColor(
    state.discard
  )};">
                    ${state.discard ?? ""}
                </div>
            </td>
        </tr>
        </table>

        <div style="display: flex; flex-wrap: wrap; margin-bottom: 300px">

        ${Object.keys(state.boards)
          .map(
            (name) =>
              `
            <div style='border-radius: 20px; flex-grow: 1; padding: 15px; margin: 10px; background: ${
              !state.scores ||
              state.scores[name] !== Math.min(...Object.values(state.scores))
                ? `radial-gradient(circle, rgba(130,186,91,${
                    state.turn === name ? ".9" : "0.5"
                  }) 0%, rgba(37,134,150,${
                    state.turn === name ? ".9" : "0.5"
                  }) 100%)`
                : `radial-gradient(circle, rgba(255,248,0,1) 0%, rgba(255,162,0,1) 100%)`
            };'>
                    <div style="height:50px;font-size: 50px; color: white;">${name}${
                state.scores[name] ? ` (${state.scores[name]} points) ` : ""
              } 
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
          <!--<div id='events'>
          ${[...(state.events ?? [])]
            .reverse()
            .map(
              (e) =>
                `<div style='width: 300px; padding: 2px; background: rgb(255, 255, ${~~Math.min(
                  (Date.now() - e[1]) / 10,
                  255
                )})'>${e[0]}</div>`
            )
            .join("")}
          </div>-->
        `;
}

async function sendCardAction(name: string, row: string, col: string) {
  //header ${name}
  await fetch(BASEURL + `/action?action=card&row=${row}&col=${col}`, {
    headers: { roomid: roomId, userid: name },
  });
}

async function sendDrawAction() {
  await fetch(BASEURL + `/action?action=draw`, { headers: { roomid: roomId } });
}

async function sendDiscardAction() {
  await fetch(BASEURL + `/action?action=discard`, {
    headers: { roomid: roomId },
  });
}

async function newRoom(players: string) {
  const res = await fetch(
    BASEURL + `/createroom?players=${encodeURI(players)}`
  );
  return res.text();
}

(async () => {
  let state: JSONGameState;

  document
    .querySelector('#newroom input[type="button"]')!
    .addEventListener("click", () => {
      const players = (
        document.querySelector('#newroom input[type="text"]') as HTMLFormElement
      ).value;
      newRoom(players).then((name) => (window.location.href = "/?r=" + name));
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
